export enum OpportunityStage {
  PROSPECTING = "PROSPECTING",
  QUALIFICATION = "QUALIFICATION",
  NEEDS_ANALYSIS = "NEEDS_ANALYSIS",
  PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION",
  CLOSED_WON = "CLOSED_WON",
  CLOSED_LOST = "CLOSED_LOST",
}

export interface Opportunity {
  id: string;
  opportunityId: string;

  // Basic Information
  opportunityName: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  actualCloseDate?: string;

  // Relationships
  accountId: string;
  accountName: string;
  primaryContactId?: string;
  primaryContactName?: string;
  convertedFromLeadId?: string;
  convertedDate?: string;

  // Sales Information
  type?: string;
  leadSource?: string;
  campaignSource?: string;
  nextStep?: string;
  description?: string;

  // Financial Details
  forecastAmount?: number;
  currency?: string;
  discountAmount?: number;
  totalAmount?: number;

  // Product/Service Information
  products?: string[];
  services?: string[];
  solutionOffered?: string;

  // Competition
  competitors?: string[];
  competitiveAdvantage?: string;
  lossReason?: string;

  // Engagement
  daysInStage: number;
  lastActivityDate?: string;
  totalActivities: number;
  emailsSent: number;
  callsMade: number;
  meetingsHeld: number;

  // Decision Process
  decisionMaker?: string;
  decisionCriteria?: string;
  budgetConfirmed?: string;
  decisionTimeframe?: string;

  // Team
  ownerId: string;
  ownerName: string;
  teamMembers?: string[];

  // Additional Information
  deliveryStatus?: string;
  paymentTerms?: string;
  tags?: string[];
  notes?: string;

  // System Fields
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  lastModifiedByName: string;

  // Stage History
  prospectingDate?: string;
  qualificationDate?: string;
  needsAnalysisDate?: string;
  proposalDate?: string;
  negotiationDate?: string;
  closedDate?: string;
}

export interface CreateOpportunityRequest {
  // Required fields
  opportunityName: string;
  stage: OpportunityStage;
  accountId: string;
  amount: number;
  probability: number;
  expectedCloseDate: string;

  // Optional fields
  primaryContactId?: string;
  type?: string;
  leadSource?: string;
  campaignSource?: string;
  nextStep?: string;
  description?: string;

  forecastAmount?: number;
  currency?: string;
  discountAmount?: number;
  totalAmount?: number;

  products?: string[];
  services?: string[];
  solutionOffered?: string;

  competitors?: string[];
  competitiveAdvantage?: string;

  decisionMaker?: string;
  decisionCriteria?: string;
  budgetConfirmed?: string;
  decisionTimeframe?: string;

  deliveryStatus?: string;
  paymentTerms?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateOpportunityRequest {
  // All fields optional
  opportunityName?: string;
  stage?: OpportunityStage;
  accountId?: string;
  primaryContactId?: string;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;

  type?: string;
  leadSource?: string;
  campaignSource?: string;
  nextStep?: string;
  description?: string;

  forecastAmount?: number;
  currency?: string;
  discountAmount?: number;
  totalAmount?: number;

  products?: string[];
  services?: string[];
  solutionOffered?: string;

  competitors?: string[];
  competitiveAdvantage?: string;
  lossReason?: string;

  decisionMaker?: string;
  decisionCriteria?: string;
  budgetConfirmed?: string;
  decisionTimeframe?: string;

  deliveryStatus?: string;
  paymentTerms?: string;
  tags?: string[];
  notes?: string;
}

export interface OpportunityStatistics {
  // Total counts
  totalOpportunities: number;
  openOpportunities: number;
  closedOpportunities: number;

  // By stage
  prospectingCount: number;
  qualificationCount: number;
  needsAnalysisCount: number;
  proposalCount: number;
  negotiationCount: number;
  wonCount: number;
  lostCount: number;

  // Financial metrics
  totalValue: number;
  wonValue: number;
  lostValue: number;
  pipelineValue: number;
  weightedValue: number;

  // Performance metrics
  winRate: number;
  averageDealSize: number;
  averageCloseDays: number;
}
