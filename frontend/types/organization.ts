export interface Organization {
    organizationId: string;
    organizationName: string;
    displayName?: string;
    subdomain: string;
    industry?: string;
    companySize?: string;
    primaryEmail: string;
    primaryPhone?: string;
    status: OrganizationStatus;
    subscription?: SubscriptionInfo;
    limits?: UsageLimits;
    usage?: UsageMetrics;
    settings?: OrganizationSettings;
    security?: SecuritySettings;
    invoiceConfig?: InvoiceConfig;
    createdAt: string;
}

export interface InvoiceConfig {
    logoUrl?: string;
    companyName?: string;
    companyAddress?: string;
    gstNumber?: string;
    cinNumber?: string;

    // Bank Details
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    micrCode?: string;

    // PDF Options
    authorizedSignatoryLabel?: string;
    authorizedSignatorySealUrl?: string;
    termsAndConditions?: string;
    footerText?: string;
}

export type OrganizationStatus =
    | "TRIAL"
    | "ACTIVE"
    | "SUSPENDED"
    | "EXPIRED"
    | "CANCELLED";

export interface SubscriptionInfo {
    planType: string;
    startDate: string;
    endDate?: string;
    trialEndDate?: string;
    monthlyPrice?: number;
    billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUAL";
    paymentStatus: "ACTIVE" | "PAST_DUE" | "CANCELLED";
}

export interface UsageLimits {
    maxUsers: number;
    maxLeads: number;
    maxContacts: number;
    maxAccounts: number;
    maxOpportunities: number;
    maxProducts: number;
    maxStorageMB: number;
    maxApiCallsPerDay: number;
    customFieldsEnabled: boolean;
    apiAccessEnabled: boolean;
    advancedReportsEnabled: boolean;
}

export interface UsageMetrics {
    currentUsers: number;
    currentLeads: number;
    currentContacts: number;
    currentAccounts: number;
    currentOpportunities: number;
    currentProducts: number;
    currentStorageMB: number;
    apiCallsToday: number;
    lastCalculated: string;
}

export interface OrganizationSettings {
    dateFormat: string;
    timeFormat: string;
    language: string;
    emailNotificationsEnabled: boolean;
    logoUrl?: string;
    brandColor?: string;
}

export interface SecuritySettings {
    twoFactorRequired: boolean;
    ipWhitelistEnabled: boolean;
    allowedIPs?: string[];
    sessionTimeoutMinutes: number;
    passwordExpiryDays?: number;
    auditLogEnabled: boolean;
    encryptionEnabled: boolean;
    ssoEnabled?: boolean;
}

// Organization Registration
export interface OrganizationRegistrationRequest {
    organizationName: string;
    subdomain: string;
    industry?: string;
    companySize?: string;
    adminEmail: string;
    password: string;
    adminName: string;
}

export interface OrganizationRegistrationResponse {
    organizationId: string;
    tenantId: string;
    subdomain: string;
    organizationName: string;
    userId: string;
    userEmail: string;
    token: string;
    subscriptionTier?: string;
    trialDaysRemaining?: number;
    message: string;
}

// Subdomain Check
export interface SubdomainAvailability {
    subdomain: string;
    available: boolean;
    message: string;
}

// Organization Usage
export interface OrganizationUsage {
    limits: UsageLimits;
    usage: UsageMetrics;
    subscriptionTier: string;
    status: OrganizationStatus;
}

// Invitations
export interface InvitationRequest {
    email: string;
    roleId?: string;
    roleName: string;
    profileId?: string;
    profileName?: string;
    personalMessage?: string;
}

export interface Invitation {
    invitationId: string;
    email: string;
    organizationName: string;
    organizationId: string;
    invitedByName: string;
    roleName: string;
    profileName?: string;
    status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
    personalMessage?: string;
    sentAt: string;
    expiresAt: string;
    isExpired: boolean;
}

export interface AcceptInvitationRequest {
    fullName: string;
    password: string;
}

// Analytics
export interface DashboardStats {
    totalLeads: number;
    totalContacts: number;
    totalOpportunities: number;
    totalActivities: number;
}

export interface GrowthTrends {
    period: string;
    leadGrowth: number;
    contactGrowth: number;
    opportunityGrowth: number;
}
