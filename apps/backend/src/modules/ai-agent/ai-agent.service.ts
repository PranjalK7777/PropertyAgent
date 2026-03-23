import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { conversationService, LeadScoreData } from './conversation.service';
import { buildSystemPrompt, buildConversationMessages, buildEscalationMessage } from './ai-agent.prompt';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { pushService } from '../push/push.service';
import PropertyConfig, { IPropertyConfig } from '../property/property.model';
import { Conversation } from './conversation.model';
import { Types } from 'mongoose';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const IMAGE_REQUEST_PATTERN =
  /\b(photo|photos|picture|pictures|pic|pics|image|images|gallery|show.*(flat|room|house|apartment)|send.*(photo|image|pics))\b/i;
const IMAGE_LIMITATION_PATTERN =
  /\b(can(?:not|'t)|unable|don't have|do not have)\b[\s\S]{0,80}\b(send|share|show)\b[\s\S]{0,80}\b(photo|image|picture|pics?)\b/i;
const MAX_IMAGES_PER_REPLY = 4;

function isImageRequest(message: string): boolean {
  return IMAGE_REQUEST_PATTERN.test(message);
}

function normalizeImageRequestReply(replyText: string): string {
  if (IMAGE_LIMITATION_PATTERN.test(replyText)) {
    return 'Perfect, sharing room photos now 👇';
  }
  return replyText;
}

function extractLeadJsonBlock(rawResponse: string): { json: string; start: number; end: number } | null {
  for (let i = 0; i < rawResponse.length; i += 1) {
    if (rawResponse[i] !== '{') continue;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let j = i; j < rawResponse.length; j += 1) {
      const ch = rawResponse[j];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === '{') depth += 1;
      if (ch === '}') depth -= 1;

      if (depth === 0) {
        const candidate = rawResponse.slice(i, j + 1);
        if (!candidate.includes('"leadScore"')) break;

        try {
          JSON.parse(candidate);
          return { json: candidate, start: i, end: j };
        } catch {
          break;
        }
      }
    }
  }

  return null;
}

export function parseGeminiResponse(rawResponse: string): { replyText: string; leadData: LeadScoreData } {
  const jsonBlock = extractLeadJsonBlock(rawResponse);
  const withoutJson = jsonBlock
    ? `${rawResponse.slice(0, jsonBlock.start)}${rawResponse.slice(jsonBlock.end + 1)}`
    : rawResponse;
  const replyText = withoutJson.replace(/```json|```/gi, '').trim();

  let leadData: LeadScoreData = { leadScore: 'cold', escalate: false };
  if (jsonBlock) {
    try {
      leadData = JSON.parse(jsonBlock.json);
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
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  });

  // Gemini requires chat history to start with `user`.
  // Existing stored conversations can start with outbound messages (role `model`),
  // so we trim those leading model turns before sending history.
  const firstUserIndex = messages.findIndex((m) => m.role === 'user');
  const normalized = firstUserIndex >= 0 ? messages.slice(firstUserIndex) : messages;
  const history = normalized.slice(0, -1);
  const lastMessage = normalized[normalized.length - 1];

  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('Invalid Gemini input: last message must be user');
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.parts[0].text);
  return result.response.text();
}

class AiAgentService {
  async handleInboundMessage(input: {
    propertyId: string;
    tenantPhone: string;
    profileName?: string;
    message: string;
    waMessageId: string;
  }): Promise<void> {
    const { propertyId, tenantPhone, profileName, message, waMessageId } = input;

    const property = await PropertyConfig.findById(propertyId);
    if (!property || !property.isActive || property.isRented) return;

    const conversation = await conversationService.getOrCreate(propertyId, tenantPhone, profileName);
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
    const finalReplyText = isImageRequest(message) ? normalizeImageRequestReply(replyText) : replyText;

    // show typing indicator + mark as read before sending
    await whatsappService.sendTypingIndicator(tenantPhone, waMessageId);

    const outboundMsgId = await whatsappService.sendText(tenantPhone, finalReplyText);

    await conversationService.saveMessage({
      conversationId: conversation._id,
      propertyId,
      tenantPhone,
      direction: 'outbound',
      content: finalReplyText,
      messageType: 'text',
      waMessageId: outboundMsgId,
    });

    if (isImageRequest(message)) {
      await this.sendRequestedImages({
        property,
        conversationId: conversation._id,
        tenantPhone,
      });
    }

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

  private async sendRequestedImages(input: {
    property: IPropertyConfig;
    conversationId: Types.ObjectId;
    tenantPhone: string;
  }): Promise<void> {
    const { property, conversationId, tenantPhone } = input;
    if (!property?.images?.length) return;

    const images = [...property.images]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, MAX_IMAGES_PER_REPLY);

    for (const image of images) {
      if (!image.url) continue;

      try {
        const waMessageId = await whatsappService.sendImage(tenantPhone, image.url, image.label || undefined);
        await conversationService.saveMessage({
          conversationId,
          propertyId: property._id.toString(),
          tenantPhone,
          direction: 'outbound',
          content: image.url,
          messageType: 'image',
          waMessageId,
        });
      } catch {
        // Continue sending remaining images if one fails
      }
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
