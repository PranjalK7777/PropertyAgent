import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { conversationService, LeadScoreData } from './conversation.service';
import { buildSystemPrompt, buildConversationMessages, buildEscalationMessage } from './ai-agent.prompt';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { pushService } from '../push/push.service';
import PropertyConfig from '../property/property.model';
import { Conversation } from './conversation.model';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export function parseGeminiResponse(rawResponse: string): { replyText: string; leadData: LeadScoreData } {
  const jsonMatch = rawResponse.match(/\{[\s\S]*?"leadScore"[\s\S]*?\}/);
  const replyText = rawResponse.replace(/\{[\s\S]*?"leadScore"[\s\S]*?\}/, '').trim();

  let leadData: LeadScoreData = { leadScore: 'cold', escalate: false };
  if (jsonMatch) {
    try {
      leadData = JSON.parse(jsonMatch[0]);
    } catch {
      // AI response malformed JSON — default to cold
    }
  }

  return { replyText, leadData };
}

async function callGemini(
  systemPrompt: string,
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.0-flash',
    systemInstruction: systemPrompt,
  });

  // Split history (all but last) from the new message
  const history = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.parts[0].text);
  return result.response.text();
}

class AiAgentService {
  async handleInboundMessage(input: {
    propertyId: string;
    tenantPhone: string;
    message: string;
    waMessageId: string;
  }): Promise<void> {
    const { propertyId, tenantPhone, message, waMessageId } = input;

    const property = await PropertyConfig.findById(propertyId);
    if (!property || !property.isActive || property.isRented) return;

    const conversation = await conversationService.getOrCreate(propertyId, tenantPhone);
    const history = await conversationService.getRecentMessages(conversation._id, 10);

    await conversationService.saveMessage({
      conversationId: conversation._id,
      propertyId,
      tenantPhone,
      direction: 'inbound',
      content: message,
      waMessageId,
    });

    const systemPrompt = buildSystemPrompt(property);
    const messages_history = buildConversationMessages(history, message);

    const rawResponse = await callGemini(systemPrompt, messages_history);
    const { replyText, leadData } = parseGeminiResponse(rawResponse);

    const outboundMsgId = await whatsappService.sendText(tenantPhone, replyText);

    await conversationService.saveMessage({
      conversationId: conversation._id,
      propertyId,
      tenantPhone,
      direction: 'outbound',
      content: replyText,
      waMessageId: outboundMsgId,
    });

    await conversationService.updateLeadData(conversation._id, leadData);

    if (leadData.escalate) {
      await this.handleEscalation(
        conversation._id.toString(),
        conversation.tenantName || leadData.extracted?.name || 'Unknown',
        tenantPhone,
        property.ownerPhone,
        property.ownerPushToken,
        leadData,
        message
      );
    }
  }

  private async handleEscalation(
    conversationId: string,
    tenantName: string,
    tenantPhone: string,
    ownerPhone: string,
    ownerPushToken: string,
    leadData: LeadScoreData,
    lastMessage: string
  ): Promise<void> {
    await Conversation.findByIdAndUpdate(conversationId, {
      needsHumanReview: true,
      humanReviewReason: leadData.escalationReason ?? '',
    });

    const dashboardLink = `https://property-agent.app/conversations/${conversationId}`;
    const escalationMsg = buildEscalationMessage(
      tenantName,
      tenantPhone,
      leadData.escalationReason ?? '',
      lastMessage,
      dashboardLink
    );

    await whatsappService.sendText(ownerPhone, escalationMsg);

    if (ownerPushToken) {
      await pushService.sendEscalationNotification(
        ownerPushToken,
        conversationId,
        tenantName,
        leadData.escalationReason ?? ''
      );
    }
  }
}

export const aiAgentService = new AiAgentService();
