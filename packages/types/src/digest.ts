export interface DigestStats {
  totalInquiries: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  escalations: number;
  viewingRequests: number;
}

export interface LeadSummary {
  tenantPhone: string;
  tenantName: string;
  keyFacts: string;
}

export interface DailyDigest {
  _id: string;
  propertyId: string;
  date: string;
  stats: DigestStats;
  hotLeadSummaries: LeadSummary[];
  escalationSummaries: LeadSummary[];
  aiSummaryText: string;
  sentToPhone: string;
  waMessageId: string;
  sentAt: string;
  createdAt: string;
}
