export interface Contact {
  id: string;
  contactId: string;

  // Basic Information
  firstName: string;
  lastName: string;
  salutation?: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  homePhone?: string;
  fax?: string;

  // Professional Information
  jobTitle?: string;
  department?: string;
  reportsTo?: string;
  birthdate?: string;
  emailOptOut?: boolean;

  // Social & Web
  linkedInProfile?: string;
  twitterHandle?: string;
  facebookProfile?: string;
  website?: string;
  skypeId?: string;

  // Account Relationship
  accountId?: string;
  accountName?: string;
  isPrimaryContact?: boolean;
  convertedFromLeadId?: string;
  convertedDate?: string;

  // Mailing Address
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  mailingCountry?: string;

  // Other Address
  otherStreet?: string;
  otherCity?: string;
  otherState?: string;
  otherPostalCode?: string;
  otherCountry?: string;

  // Additional Information
  description?: string;
  assistantName?: string;
  assistantPhone?: string;
  tags?: string[];

  // Owner & Activity
  ownerId: string;
  ownerName: string;
  lastActivityDate?: string;
  lastEmailDate?: string;
  lastCallDate?: string;
  lastMeetingDate?: string;

  // Engagement Metrics
  emailsSent: number;
  emailsReceived: number;
  callsMade: number;
  callsReceived: number;
  meetingsHeld: number;

  // System Fields
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  lastModifiedByName: string;
}

export interface CreateContactRequest {
  // Required fields
  firstName: string;
  lastName: string;
  email: string;

  // Optional basic fields
  salutation?: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  homePhone?: string;

  // Professional information
  jobTitle?: string;
  department?: string;
  reportsTo?: string;
  birthdate?: string;
  emailOptOut?: boolean;

  // Social & web
  linkedInProfile?: string;
  twitterHandle?: string;
  facebookProfile?: string;
  website?: string;
  skypeId?: string;

  // Account relationship
  accountId?: string;
  isPrimaryContact?: boolean;

  // Mailing Address
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  mailingCountry?: string;

  // Other Address
  otherStreet?: string;
  otherCity?: string;
  otherState?: string;
  otherPostalCode?: string;
  otherCountry?: string;

  // Additional
  description?: string;
  assistantName?: string;
  assistantPhone?: string;
  tags?: string[];
}

export interface UpdateContactRequest {
  // All fields optional for partial updates
  firstName?: string;
  lastName?: string;
  salutation?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  homePhone?: string;

  // Professional information
  jobTitle?: string;
  department?: string;
  reportsTo?: string;
  birthdate?: string;
  emailOptOut?: boolean;

  // Social & web
  linkedInProfile?: string;
  twitterHandle?: string;
  facebookProfile?: string;
  website?: string;
  skypeId?: string;

  // Account relationship
  accountId?: string;
  isPrimaryContact?: boolean;

  // Mailing Address
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  mailingCountry?: string;

  // Other Address
  otherStreet?: string;
  otherCity?: string;
  otherState?: string;
  otherPostalCode?: string;
  otherCountry?: string;

  // Additional
  description?: string;
  assistantName?: string;
  assistantPhone?: string;
  tags?: string[];
}
