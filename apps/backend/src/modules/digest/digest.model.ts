import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDailyDigestStats {
  totalInquiries: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  escalations: number;
  viewingRequests: number;
}

export interface ILeadSummary {
  tenantPhone: string;
  tenantName: string;
  keyFacts: string;
}

export interface IDailyDigest extends Document {
  propertyId: Types.ObjectId;
  date: string;
  stats: IDailyDigestStats;
  hotLeadSummaries: ILeadSummary[];
  escalationSummaries: ILeadSummary[];
  aiSummaryText: string;
  sentToPhone: string;
  waMessageId: string;
  sentAt: Date;
  createdAt: Date;
}

const statsSchema = new Schema<IDailyDigestStats>(
  {
    totalInquiries: { type: Number, default: 0 },
    hotLeads: { type: Number, default: 0 },
    warmLeads: { type: Number, default: 0 },
    coldLeads: { type: Number, default: 0 },
    escalations: { type: Number, default: 0 },
    viewingRequests: { type: Number, default: 0 },
  },
  { _id: false }
);

const leadSummarySchema = new Schema<ILeadSummary>(
  {
    tenantPhone: String,
    tenantName: String,
    keyFacts: String,
  },
  { _id: false }
);

const dailyDigestSchema = new Schema<IDailyDigest>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'PropertyConfig', required: true },
    date: { type: String, required: true },
    stats: { type: statsSchema, required: true },
    hotLeadSummaries: [leadSummarySchema],
    escalationSummaries: [leadSummarySchema],
    aiSummaryText: { type: String, default: '' },
    sentToPhone: { type: String, default: '' },
    waMessageId: { type: String, default: '' },
    sentAt: { type: Date },
  },
  { timestamps: true, collection: 'property_daily_digests' }
);

export default mongoose.model<IDailyDigest>('DailyDigest', dailyDigestSchema);
