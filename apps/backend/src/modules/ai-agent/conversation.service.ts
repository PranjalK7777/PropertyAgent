import { Conversation, Message, IConversation, IMessage, LeadScore, IQualification } from './conversation.model';
import { Types } from 'mongoose';

export interface LeadScoreData {
  leadScore: LeadScore;
  escalate: boolean;
  escalationReason?: string;
  extracted?: {
    name?: string;
    moveInDate?: string;
    occupants?: number;
    employed?: boolean | null;
    hasPets?: boolean | null;
    priceOffered?: number;
    viewingRequested?: boolean;
  };
}

export interface SaveMessageInput {
  conversationId: Types.ObjectId;
  propertyId: string;
  tenantPhone: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType?: 'text' | 'image' | 'template';
  waMessageId?: string;
  rawPayload?: object;
}

export const conversationService = {
  async getOrCreate(propertyId: string, tenantPhone: string, tenantName?: string): Promise<IConversation> {
    const normalizedTenantName = tenantName?.trim();
    const existing = await Conversation.findOne({ propertyId, tenantPhone });

    if (existing) {
      if (!existing.tenantName && normalizedTenantName) {
        existing.tenantName = normalizedTenantName;
        await existing.save();
      }
      return existing;
    }

    return Conversation.create({
      propertyId,
      tenantPhone,
      tenantName: normalizedTenantName ?? '',
    });
  },

  async getRecentMessages(conversationId: Types.ObjectId, limit = 10): Promise<IMessage[]> {
    return Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .then((msgs) => msgs.reverse());
  },

  async saveMessage(input: SaveMessageInput): Promise<IMessage> {
    const msg = await Message.create({
      ...input,
      propertyId: input.propertyId,
      sentAt: new Date(),
    });

    await Conversation.findByIdAndUpdate(input.conversationId, {
      $inc: { messageCount: 1 },
      $set: { lastMessageAt: new Date() },
    });

    return msg;
  },

  async updateLeadData(conversationId: Types.ObjectId, leadData: LeadScoreData): Promise<void> {
    const qualification: Partial<IQualification> = {};

    if (leadData.extracted) {
      const e = leadData.extracted;
      if (e.moveInDate) qualification.moveInDate = new Date(e.moveInDate);
      if (e.occupants != null) qualification.occupants = e.occupants;
      if (e.employed != null) qualification.employed = e.employed ?? undefined;
      if (e.hasPets != null) qualification.hasPets = e.hasPets ?? undefined;
      if (e.priceOffered) qualification.priceOffered = e.priceOffered;
      if (e.viewingRequested) qualification.viewingRequested = e.viewingRequested;
      if (e.name) {
        await Conversation.findByIdAndUpdate(conversationId, { tenantName: e.name });
      }
    }

    const update: Record<string, unknown> = {
      leadScore: leadData.leadScore,
    };

    if (Object.keys(qualification).length > 0) {
      Object.entries(qualification).forEach(([k, v]) => {
        update[`qualification.${k}`] = v;
      });
    }

    if (leadData.escalate) {
      update.needsHumanReview = true;
      update.humanReviewReason = leadData.escalationReason ?? '';
    }

    await Conversation.findByIdAndUpdate(conversationId, { $set: update });
  },

  async listConversations(propertyId: string, filter?: { leadScore?: LeadScore; needsHumanReview?: boolean }) {
    const query: Record<string, unknown> = { propertyId };
    if (filter?.leadScore) query.leadScore = filter.leadScore;
    if (filter?.needsHumanReview != null) query.needsHumanReview = filter.needsHumanReview;
    return Conversation.find(query).sort({ lastMessageAt: -1 });
  },

  async getTodayStats(propertyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conversations = await Conversation.find({
      propertyId,
      lastMessageAt: { $gte: today },
    });

    return {
      total: conversations.length,
      hot: conversations.filter((c) => c.leadScore === 'hot').length,
      warm: conversations.filter((c) => c.leadScore === 'warm').length,
      cold: conversations.filter((c) => c.leadScore === 'cold').length,
      escalations: conversations.filter((c) => c.needsHumanReview).length,
      viewingRequests: conversations.filter((c) => c.qualification?.viewingRequested).length,
    };
  },
};
