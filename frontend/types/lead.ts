export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  PROPOSAL_SENT = "PROPOSAL_SENT",
  NEGOTIATION = "NEGOTIATION",
  UNQUALIFIED = "UNQUALIFIED",
  LOST = "LOST",
  CONVERTED = "CONVERTED",
}

export enum LeadSource {
  WEBSITE = "WEBSITE",
  REFERRAL = "REFERRAL",
  COLD_CALL = "COLD_CALL",
  LINKEDIN = "LINKEDIN",
  TRADE_SHOW = "TRADE_SHOW",
  PARTNER = "PARTNER",
  ADVERTISING = "ADVERTISING",
  EMAIL_CAMPAIGN = "EMAIL_CAMPAIGN",
  IMPORT = "IMPORT",
  OTHER = "OTHER",
}

export enum Industry {
  RENEWABLE_ENERGY = "RENEWABLE_ENERGY",
  SOLAR = "SOLAR",
  WIND = "WIND",
  HYDRO = "HYDRO",
  GEOTHERMAL = "GEOTHERMAL",
  BIOMASS = "BIOMASS",
  TECHNOLOGY = "TECHNOLOGY",
  MANUFACTURING = "MANUFACTURING",
  HEALTHCARE = "HEALTHCARE",
  FINANCE = "FINANCE",
  RETAIL = "RETAIL",
  EDUCATION = "EDUCATION",
  REAL_ESTATE = "REAL_ESTATE",
  E_COMMERCE = "E_COMMERCE",
  CONSULTING = "CONSULTING",
  PROFESSIONAL_SERVICES = "PROFESSIONAL_SERVICES",
  TELECOMMUNICATIONS = "TELECOMMUNICATIONS",
  TRANSPORTATION = "TRANSPORTATION",
  HOSPITALITY = "HOSPITALITY",
  AGRICULTURE = "AGRICULTURE",
  ENERGY = "ENERGY",
  GOVERNMENT = "GOVERNMENT",
  NON_PROFIT = "NON_PROFIT",
  OTHER = "OTHER",
}

export enum CompanySize {
  MICRO = "MICRO", // 1-10
  SMALL = "SMALL", // 11-50
  MEDIUM = "MEDIUM", // 51-200
  LARGE = "LARGE", // 201-500
  ENTERPRISE = "ENTERPRISE", // 500+
}

export interface Lead {
  id: string;
  leadId: string; // LEAD-YYYY-MM-XXXXX

  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;

  // Contact Details
  jobTitle?: string;
  department?: string;
  mobilePhone?: string;
  workPhone?: string;
  linkedInProfile?: string;
  website?: string;

  // Company Information
  industry?: Industry;
  companySize?: CompanySize;
  annualRevenue?: number;
  numberOfEmployees?: number;

  // Address
  country?: string;
  state?: string;
  city?: string;
  streetAddress?: string;
  postalCode?: string;

  // Classification
  leadSource?: LeadSource;
  leadStatus: LeadStatus;
  leadOwnerId?: string;
  leadOwnerName?: string;
  expectedRevenue?: number;
  expectedCloseDate?: string;

  // Additional Information
  description?: string;
  tags?: string[];

  // Scoring
  leadScore?: number;
  leadGrade?: "A" | "B" | "C" | "D";
  demographicScore?: number;
  behavioralScore?: number;
  qualificationScore?: number;

  // Conversion
  convertedDate?: string;
  convertedToOpportunityId?: string;

  // Assignment
  assignedUserId?: string;
  assignedUserName?: string;
  assignedAt?: string;

  // System Fields
  createdAt: string;
  createdBy?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  lastActivityDate?: string;
}

export interface CreateLeadRequest {
  // Required fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;

  // Optional fields
  jobTitle?: string;
  department?: string;
  mobilePhone?: string;
  workPhone?: string;
  linkedInProfile?: string;
  website?: string;

  industry?: Industry;
  companySize?: CompanySize;
  annualRevenue?: number;
  numberOfEmployees?: number;

  country?: string;
  state?: string;
  city?: string;
  streetAddress?: string;
  postalCode?: string;

  leadSource?: LeadSource;
  leadOwnerId?: string;
  expectedRevenue?: number;
  expectedCloseDate?: string;

  description?: string;
  tags?: string[];
}

export interface UpdateLeadRequest {
  // All fields optional - only provided fields will be updated
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;

  jobTitle?: string;
  department?: string;
  mobilePhone?: string;
  workPhone?: string;
  linkedInProfile?: string;
  website?: string;

  industry?: Industry;
  companySize?: CompanySize;
  annualRevenue?: number;
  numberOfEmployees?: number;

  country?: string;
  state?: string;
  city?: string;
  streetAddress?: string;
  postalCode?: string;

  leadSource?: LeadSource;
  leadStatus?: LeadStatus;
  leadOwnerId?: string;
  expectedRevenue?: number;
  expectedCloseDate?: string;

  // BANT Qualification
  hasBudget?: boolean;
  budgetAmount?: number;
  budgetTimeframe?: string;
  isDecisionMaker?: boolean;
  decisionMakerName?: string;
  businessProblem?: string;
  painPoints?: string;
  expectedPurchaseDate?: string;
  urgencyLevel?: string;

  description?: string;
  tags?: string[];
}

export interface LeadStatistics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
}

// Helper functions
export const getLeadStatusColor = (status: LeadStatus): string => {
  switch (status) {
    case LeadStatus.NEW:
      return "bg-blue-100 text-blue-800";
    case LeadStatus.CONTACTED:
      return "bg-yellow-100 text-yellow-800";
    case LeadStatus.QUALIFIED:
      return "bg-green-100 text-green-800";
    case LeadStatus.PROPOSAL_SENT:
      return "bg-purple-100 text-purple-800";
    case LeadStatus.NEGOTIATION:
      return "bg-indigo-100 text-indigo-800";
    case LeadStatus.UNQUALIFIED:
      return "bg-gray-100 text-gray-800";
    case LeadStatus.LOST:
      return "bg-red-100 text-red-800";
    case LeadStatus.CONVERTED:
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getLeadGradeColor = (grade: string): string => {
  switch (grade) {
    case "A":
      return "bg-green-500 text-white";
    case "B":
      return "bg-blue-500 text-white";
    case "C":
      return "bg-yellow-500 text-white";
    case "D":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-300 text-gray-800";
  }
};

export const formatLeadName = (lead: Lead): string => {
  return `${lead.firstName} ${lead.lastName}`;
};

export const formatCompanySize = (size: CompanySize): string => {
  switch (size) {
    case CompanySize.MICRO:
      return "1-10 employees";
    case CompanySize.SMALL:
      return "11-50 employees";
    case CompanySize.MEDIUM:
      return "51-200 employees";
    case CompanySize.LARGE:
      return "201-500 employees";
    case CompanySize.ENTERPRISE:
      return "500+ employees";
    default:
      return "Unknown";
  }
};
