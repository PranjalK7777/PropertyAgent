export type LeadScore = 'hot' | 'warm' | 'cold' | 'rejected' | 'needs_human';

export interface Qualification {
  moveInDate?: string;
  occupants?: number;
  employed?: boolean;
  hasPets?: boolean;
  priceOffered?: number;
  viewingRequested?: boolean;
  preferredViewingTimes?: string[];
}

export interface Conversation {
  _id: string;
  propertyId: string;
  tenantPhone: string;
  tenantName: string;
  messageCount: number;
  lastMessageAt: string;
  leadScore: LeadScore;
  needsHumanReview: boolean;
  humanReviewReason: string;
  isHandedOff: boolean;
  qualification: Qualification;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: 'text' | 'image' | 'template';
  waMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  createdAt: string;
}

export interface TodayStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  escalations: number;
  viewingRequests: number;
}
