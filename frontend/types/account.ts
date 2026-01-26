export interface Account {
  id: string;
  accountId: string;

  // Basic Information
  accountName: string;
  parentAccountId?: string;
  parentAccountName?: string;
  accountType?: string;
  industry?: string;
  companySize?: string;
  annualRevenue?: number;
  numberOfEmployees?: number;
  ownership?: string;

  // Contact Information
  phone?: string;
  fax?: string;
  website?: string;
  email?: string;

  // Billing Address
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Shipping Address
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  // Business Information
  tickerSymbol?: string;
  sicCode?: string;
  naicsCode?: string;
  dunsNumber?: string;
  taxId?: string;

  // Social Media
  linkedInPage?: string;
  twitterHandle?: string;
  facebookPage?: string;

  // Relationship Information
  primaryContactId?: string;
  primaryContactName?: string;
  convertedFromLeadId?: string;
  convertedDate?: string;

  // Financial Information
  paymentTerms?: string;
  creditStatus?: string;
  creditLimit?: number;
  currency?: string;

  // Metrics
  totalOpportunities?: number;
  wonOpportunities?: number;
  lostOpportunities?: number;
  totalRevenue?: number;
  lifetimeValue?: number;
  totalContacts?: number;

  // Owner Information
  ownerId: string;
  ownerName: string;

  // Activity Dates
  lastActivityDate?: string;
  lastPurchaseDate?: string;
  lastContactDate?: string;

  // Additional Information
  accountStatus: string;
  description?: string;
  rating?: string;
  tags?: string[];
  notes?: string;

  // System Fields
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  lastModifiedByName: string;
}

export interface CreateAccountRequest {
  // Required field
  accountName: string;

  // Basic Information
  parentAccountId?: string;
  accountType?: string;
  industry?: string;
  companySize?: string;
  annualRevenue?: number;
  numberOfEmployees?: number;
  ownership?: string;

  // Contact Information
  phone?: string;
  fax?: string;
  website?: string;
  email?: string;

  // Billing Address
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Shipping Address
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  // Business Information
  tickerSymbol?: string;
  sicCode?: string;
  naicsCode?: string;
  dunsNumber?: string;
  taxId?: string;

  // Social Media
  linkedInPage?: string;
  twitterHandle?: string;
  facebookPage?: string;

  // Financial Information
  paymentTerms?: string;
  creditStatus?: string;
  creditLimit?: number;
  currency?: string;

  // Additional Information
  description?: string;
  rating?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateAccountRequest {
  // All fields optional for partial updates
  accountName?: string;
  parentAccountId?: string;
  accountType?: string;
  industry?: string;
  companySize?: string;
  annualRevenue?: number;
  numberOfEmployees?: number;
  ownership?: string;

  // Contact Information
  phone?: string;
  fax?: string;
  website?: string;
  email?: string;

  // Billing Address
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Shipping Address
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  // Business Information
  tickerSymbol?: string;
  sicCode?: string;
  naicsCode?: string;
  dunsNumber?: string;
  taxId?: string;

  // Social Media
  linkedInPage?: string;
  twitterHandle?: string;
  facebookPage?: string;

  // Financial Information
  paymentTerms?: string;
  creditStatus?: string;
  creditLimit?: number;
  currency?: string;

  // Additional Information
  accountStatus?: string;
  description?: string;
  rating?: string;
  tags?: string[];
  notes?: string;
}
