import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { buildDigestPrompt } from '../ai-agent/ai-agent.prompt';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { Conversation } from '../ai-agent/conversation.model';
import DailyDigest from './digest.model';
import PropertyConfig from '../property/property.model';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export async function generateAndSendDailyDigest(propertyId: string): Promise<void> {
  const property = await PropertyConfig.findById(propertyId);
  if (!property) throw new Error(`Property not found: ${propertyId}`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = today.toISOString().split('T')[0];

  const conversations = await Conversation.find({
    propertyId,
    lastMessageAt: { $gte: today },
  });

  const stats = {
    totalInquiries: conversations.length,
    hotLeads: conversations.filter((c) => c.leadScore === 'hot').length,
    warmLeads: conversations.filter((c) => c.leadScore === 'warm').length,
    coldLeads: conversations.filter((c) => c.leadScore === 'cold').length,
    escalations: conversations.filter((c) => c.needsHumanReview).length,
    viewingRequests: conversations.filter((c) => c.qualification?.viewingRequested).length,
  };

  const hotLeadSummaries = conversations
    .filter((c) => c.leadScore === 'hot')
    .map((c) => ({
      tenantPhone: c.tenantPhone,
      tenantName: c.tenantName || 'Unknown',
      keyFacts: formatQualification(c.qualification),
    }));

  const escalationSummaries = conversations
    .filter((c) => c.needsHumanReview)
    .map((c) => ({
      tenantPhone: c.tenantPhone,
      tenantName: c.tenantName || 'Unknown',
      keyFacts: c.humanReviewReason || 'Needs attention',
    }));

  // Get AI summary
  const digestConversationData = conversations.map((c) => ({
    name: c.tenantName || 'Unknown',
    phone: c.tenantPhone,
    leadScore: c.leadScore,
    needsHumanReview: c.needsHumanReview,
    humanReviewReason: c.humanReviewReason,
    qualification: c.qualification,
  }));

  const prompt = buildDigestPrompt(property.name, property.address, dateStr, stats, digestConversationData);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  const aiSummaryText = result.response.text();

  const waMessageId = await whatsappService.sendText(property.ownerPhone, aiSummaryText);

  await DailyDigest.create({
    propertyId,
    date: dateStr,
    stats,
    hotLeadSummaries,
    escalationSummaries,
    aiSummaryText,
    sentToPhone: property.ownerPhone,
    waMessageId,
    sentAt: new Date(),
  });
}

function formatQualification(q: any): string {
  if (!q) return '';
  const parts: string[] = [];
  if (q.moveInDate) parts.push(`Moving: ${new Date(q.moveInDate).toLocaleDateString()}`);
  if (q.occupants) parts.push(`${q.occupants} person(s)`);
  if (q.employed === true) parts.push('Employed');
  if (q.hasPets === false) parts.push('No pets');
  if (q.viewingRequested) parts.push('Viewing requested');
  return parts.join(' · ');
}
