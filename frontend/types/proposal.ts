/**
 * Proposal types matching backend DTOs
 */

export enum ProposalStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum ProposalSource {
  LEAD = "LEAD",
  OPPORTUNITY = "OPPORTUNITY",
}

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
}

export interface ProposalLineItem {
  lineItemId: string;
  productId: string;
  productName: string;
  sku: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discountType?: DiscountType;
  discountValue?: number;
  // Calculated fields
  lineSubtotal: number;
  lineDiscountAmount: number;
  lineTaxAmount: number;
  lineTotal: number;
}

export interface DiscountConfig {
  overallDiscountType: DiscountType;
  overallDiscountValue: number;
  discountReason?: string;
}

export interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ProposalResponse {
  id: string;
  proposalId: string;

  // Source
  source: ProposalSource;
  sourceId: string;
  sourceName: string;

  // Customer
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  billingAddress?: CustomerAddress;
  shippingAddress?: CustomerAddress;

  // Proposal Details
  proposalNumber: string;
  title: string;
  description?: string;
  validUntil: string;

  // Line Items
  lineItems: ProposalLineItem[];

  // Discount
  discount?: DiscountConfig;

  // Totals
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;

  // Status
  status: ProposalStatus;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Owner
  ownerId: string;
  ownerName: string;

  // Terms
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;

  // Audit
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
  lastModifiedByName?: string;
}

export interface LineItemDTO {
  productId: string;
  quantity: number;
  unitPrice?: number;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
}

export interface DiscountDTO {
  overallDiscountType: DiscountType;
  overallDiscountValue: number;
  discountReason?: string;
}

export interface CreateProposalRequest {
  source: ProposalSource;
  sourceId: string;
  title: string;
  description?: string;
  validUntil: string;
  lineItems: LineItemDTO[];
  discount?: DiscountDTO;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
}

export interface UpdateProposalRequest {
  title?: string;
  description?: string;
  validUntil?: string;
  lineItems?: LineItemDTO[];
  discount?: DiscountDTO;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
}

// Helper functions for status badge colors
export function getProposalStatusColor(status: ProposalStatus): string {
  switch (status) {
    case ProposalStatus.DRAFT:
      return "gray";
    case ProposalStatus.SENT:
      return "blue";
    case ProposalStatus.ACCEPTED:
      return "green";
    case ProposalStatus.REJECTED:
      return "red";
    case ProposalStatus.EXPIRED:
      return "orange";
    default:
      return "gray";
  }
}

// Helper functions for status labels
export function getProposalStatusLabel(status: ProposalStatus): string {
  switch (status) {
    case ProposalStatus.DRAFT:
      return "Draft";
    case ProposalStatus.SENT:
      return "Sent";
    case ProposalStatus.ACCEPTED:
      return "Accepted";
    case ProposalStatus.REJECTED:
      return "Rejected";
    case ProposalStatus.EXPIRED:
      return "Expired";
    default:
      return status;
  }
}

// Helper function for discount type labels
export function getDiscountTypeLabel(type: DiscountType): string {
  switch (type) {
    case DiscountType.PERCENTAGE:
      return "Percentage (%)";
    case DiscountType.FIXED_AMOUNT:
      return "Fixed Amount";
    default:
      return type;
  }
}
