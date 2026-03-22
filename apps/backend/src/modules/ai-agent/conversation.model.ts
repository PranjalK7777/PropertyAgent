import mongoose, { Schema, Document, Types } from 'mongoose';

export type LeadScore = 'hot' | 'warm' | 'cold' | 'rejected' | 'needs_human';

export interface IQualification {
  moveInDate?: Date;
  occupants?: number;
  employed?: boolean;
  hasPets?: boolean;
  priceOffered?: number;
  viewingRequested?: boolean;
  preferredViewingTimes?: string[];
}

export interface IConversation extends Document {
  propertyId: Types.ObjectId;
  tenantPhone: string;
  tenantName: string;
  messageCount: number;
  lastMessageAt: Date;
  leadScore: LeadScore;
  needsHumanReview: boolean;
  humanReviewReason: string;
  isHandedOff: boolean;
  qualification: IQualification;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  propertyId: Types.ObjectId;
  tenantPhone: string;
  direction: 'inbound' | 'outbound';
  content: string;
  messageType: 'text' | 'image' | 'template';
  waMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  rawPayload?: object;
  sentAt: Date;
  createdAt: Date;
}

const qualificationSchema = new Schema<IQualification>(
  {
    moveInDate: { type: Date },
    occupants: { type: Number },
    employed: { type: Boolean },
    hasPets: { type: Boolean },
    priceOffered: { type: Number },
    viewingRequested: { type: Boolean, default: false },
    preferredViewingTimes: [{ type: String }],
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'PropertyConfig', required: true, index: true },
    tenantPhone: { type: String, required: true, index: true },
    tenantName: { type: String, default: '' },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now },
    leadScore: {
      type: String,
      enum: ['hot', 'warm', 'cold', 'rejected', 'needs_human'],
      default: 'cold',
    },
    needsHumanReview: { type: Boolean, default: false },
    humanReviewReason: { type: String, default: '' },
    isHandedOff: { type: Boolean, default: false },
    qualification: { type: qualificationSchema, default: () => ({}) },
    notes: { type: String, default: '' },
  },
  { timestamps: true, collection: 'property_conversations' }
);

conversationSchema.index({ propertyId: 1, tenantPhone: 1 }, { unique: true });

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'PropertyConfig', required: true },
    tenantPhone: { type: String, required: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'template'], default: 'text' },
    waMessageId: { type: String, default: '' },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
    rawPayload: { type: Schema.Types.Mixed },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'property_messages' }
);

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
export const Message = mongoose.model<IMessage>('Message', messageSchema);
