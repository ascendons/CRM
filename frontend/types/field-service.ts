export enum AssetStatus {
  ACTIVE = "ACTIVE",
  UNDER_REPAIR = "UNDER_REPAIR",
  DECOMMISSIONED = "DECOMMISSIONED",
  IN_TRANSIT = "IN_TRANSIT",
  SCRAPPED = "SCRAPPED",
}

export enum AssetCategoryType {
  EQUIPMENT = "EQUIPMENT",
  SPARE_PART = "SPARE_PART",
  CONSUMABLE = "CONSUMABLE",
}

export enum ContractVisitStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  MISSED = "MISSED",
  RESCHEDULED = "RESCHEDULED",
  CANCELLED = "CANCELLED",
}

export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  type: AssetCategoryType;
  maintenanceIntervalDays?: number;
  requiredSkills: string[];
  defaultChecklistTemplateId?: string;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Asset {
  id: string;
  assetCode: string;
  tenantId: string;
  serialNo: string;
  model: string;
  brand: string;
  categoryId: string;
  categoryName?: string; // Resolved from ID
  accountId: string;
  accountName?: string; // Resolved from ID
  contactId?: string;
  contactName?: string; // Resolved from ID
  assignedEngineerId?: string;
  assignedEngineerName?: string; // Resolved from ID
  siteAddress?: string;
  siteLat?: number;
  siteLng?: number;
  installDate?: string;
  warrantyExpiry?: string;
  status: AssetStatus;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CreateAssetRequest {
  serialNo: string;
  model: string;
  brand: string;
  categoryId: string;
  accountId: string;
  contactId?: string;
  assignedEngineerId?: string;
  siteAddress?: string;
  siteLat?: number;
  siteLng?: number;
  installDate?: string;
  warrantyExpiry?: string;
  status: AssetStatus;
  notes?: string;
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {}

export enum ContractType {
  AMC = "AMC",
  WARRANTY = "WARRANTY",
  PROJECT = "PROJECT",
  REPAIR = "REPAIR",
}

export enum ContractStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  RENEWED = "RENEWED",
  CANCELLED = "CANCELLED",
}

export enum BillingCycle {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  HALF_YEARLY = "HALF_YEARLY",
  ANNUAL = "ANNUAL",
  ONE_TIME = "ONE_TIME",
}

export interface SlaConfig {
  responseHrs: number;
  resolutionHrs: number;
}

export interface PenaltyConfig {
  perHourBreachPenalty: number;
  maxPenaltyCap: number;
}

export interface Contract {
  id: string;
  contractNumber: string;
  tenantId: string;
  type: ContractType;
  accountId: string;
  accountName?: string;
  assetIds: string[];
  assets?: Asset[]; // Resolved from IDs
  startDate: string;
  endDate: string;
  billingCycle: BillingCycle;
  visitFrequencyPerYear: number;
  contractValue: number;
  slaConfig: SlaConfig;
  penaltyConfig: PenaltyConfig;
  status: ContractStatus;
  renewalReminderSentAt?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CreateContractRequest {
  type: ContractType;
  accountId: string;
  assetIds: string[];
  startDate: string;
  endDate: string;
  billingCycle: BillingCycle;
  visitFrequencyPerYear: number;
  contractValue: number;
  slaConfig: SlaConfig;
  penaltyConfig: PenaltyConfig;
  status: ContractStatus;
  notes?: string;
}

export interface ContractVisit {
  id: string;
  contractId: string;
  visitNumber: number;
  scheduledDate: string;
  actualDate?: string;
  workOrderId?: string;
  engineerId?: string;
  status: ContractVisitStatus;
  notes?: string;
}

export enum WorkOrderType {
  INSTALLATION = "INSTALLATION",
  PREVENTIVE_MAINTENANCE = "PREVENTIVE_MAINTENANCE",
  BREAKDOWN = "BREAKDOWN",
  AMC_VISIT = "AMC_VISIT",
  WARRANTY = "WARRANTY",
  PROJECT_WORK = "PROJECT_WORK",
  INSPECTION = "INSPECTION",
}

export enum WorkOrderPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
  EMERGENCY = "EMERGENCY",
}

export enum WorkOrderStatus {
  OPEN = "OPEN",
  ASSIGNED = "ASSIGNED",
  EN_ROUTE = "EN_ROUTE",
  ON_SITE = "ON_SITE",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_SPARES = "PENDING_SPARES",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REOPENED = "REOPENED",
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  tenantId: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  accountId: string;
  accountName?: string;
  contactId?: string;
  assetId?: string;
  assetName?: string;
  contractId?: string;
  serviceRequestId?: string;
  assignedEngineerIds: string[];
  slaDeadline: string;
  slaBreached: boolean;
  scheduledDate: string;
  actualStartTime?: string;
  actualEndTime?: string;
  symptoms?: string;
  diagnosis?: string;
  resolution?: string;
  rootCause?: string;
  partsUsed?: PartUsed[];
  photos?: WorkOrderPhoto[];
  checklistTemplateId?: string;
  checklistCompletedAt?: string;
  closureNotes?: string;
  reopenCount?: number;
  totalLaborHours?: number;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
}

export interface PartUsed {
  partId: string;
  qty: number;
  serialNo?: string;
}

export interface WorkOrderPhoto {
  url: string;
  caption?: string;
  uploadedAt: string;
}

export enum ServiceRequestStatus {
  OPEN = "OPEN",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  WO_CREATED = "WO_CREATED",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

export enum ServiceRequestSource {
  PORTAL = "PORTAL",
  PHONE = "PHONE",
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
}

export interface ServiceRequest {
  id: string;
  srNumber: string;
  tenantId: string;
  source: ServiceRequestSource;
  accountId: string;
  contactId?: string;
  assetId?: string;
  description: string;
  priority: string;
  status: ServiceRequestStatus;
  workOrderId?: string;
  slaDeadline: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface ChecklistItem {
  itemCode: string;
  description: string;
  inputType: "PASS_FAIL" | "NUMERIC" | "TEXT";
  isMandatory: boolean;
  failureAction?: "BLOCK" | "WARN";
}

export interface Checklist {
  id: string;
  name: string;
  assetCategoryId: string;
  jobType: WorkOrderType;
  items: ChecklistItem[];
}

export enum ChecklistItemStatus {
  PASS = "PASS",
  FAIL = "FAIL",
  OBSERVED = "OBSERVED",
  N_A = "N_A",
}

export interface ChecklistItemResponse {
  itemCode: string;
  status: ChecklistItemStatus;
  value?: string;
  note?: string;
  photoUrl?: string;
}

export interface ChecklistResponse {
  id: string;
  workOrderId: string;
  templateId: string;
  engineerId: string;
  startedAt: string;
  completedAt?: string;
  responses: ChecklistItemResponse[];
}
