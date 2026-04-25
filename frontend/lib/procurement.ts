import { api } from "./api-client";

// ---- Types ----

export type VendorStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";
export type VendorCategory = "HVAC" | "ELECTRICAL" | "PLUMBING" | "GENERAL";
export type QualityStatus = "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED";
export type RfqStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type TradingRfqStatus =
  | "DRAFT"
  | "SENT"
  | "RESPONSE_RECEIVED"
  | "ACCEPTED"
  | "CLOSED"
  | "CANCELLED";
export type TradingPoStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "SENT"
  | "RECEIVING"
  | "RECEIVED"
  | "CANCELLED"
  | "CLOSED";
export type RateContractStatus = "ACTIVE" | "TERMINATED" | "EXPIRED";

export interface BankDetails {
  accountNo: string;
  ifsc: string;
  bankName: string;
}

export interface VendorAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  GSTIN?: string;
  paymentTermsDays?: number;
  creditLimit?: number;
  status: VendorStatus;
  categories: VendorCategory[];
  bankDetails?: BankDetails;
  address?: VendorAddress;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVendorRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  GSTIN?: string;
  paymentTermsDays?: number;
  creditLimit?: number;
  status: VendorStatus;
  categories: VendorCategory[];
  bankDetails?: BankDetails;
  address?: VendorAddress;
}

export interface RfqItem {
  partId: string;
  qty: number;
  specs?: string;
}

export interface VendorResponseItem {
  vendorId: string;
  unitPrice: number;
  deliveryDays: number;
  notes?: string;
  partId?: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  description: string;
  items: RfqItem[];
  vendorIds: string[];
  deadline: string;
  status: RfqStatus;
  vendorResponses?: VendorResponseItem[];
  selectedVendorId?: string;
  createdAt?: string;
}

export interface CreateRfqRequest {
  description: string;
  items: RfqItem[];
  vendorIds: string[];
  deadline: string;
}

// ---- Trading RFQ types ----

export interface TradingRfqItem {
  sourceLineItemIndex: number;
  productId?: string;
  productName: string;
  description?: string;
  requestedQty: number;
  unit?: string;
  targetPrice?: number;
  sellUnitPrice?: number;
}

export interface LineQuote {
  sourceLineItemIndex: number;
  quotedUnitPrice: number;
  quotedQty?: number;
}

export interface VendorResponseDetail {
  vendorId: string;
  vendorName: string;
  lineQuotes: LineQuote[];
  deliveryDays?: number;
  notes?: string;
  respondedAt?: string;
  selected: boolean;
}

export interface TradingRFQ {
  id: string;
  rfqId: string;
  tenantId: string;
  title: string;
  sourceType: string;
  sourceId?: string;
  sourceReferenceNumber?: string;
  items: TradingRfqItem[];
  vendorIds: string[];
  vendorNames: string[];
  deadline?: string;
  notes?: string;
  responses: VendorResponseDetail[];
  selectedVendorId?: string;
  selectedVendorName?: string;
  status: TradingRfqStatus;
  createdAt: string;
  createdBy: string;
}

export interface CreateTradingRfqRequest {
  title?: string;
  sourceType?: string;
  sourceId?: string;
  items: TradingRfqItem[];
  vendorIds: string[];
  deadline?: string;
  notes?: string;
  sendImmediately?: boolean;
}

export interface RecordVendorResponseRequest {
  vendorId: string;
  lineQuotes: LineQuote[];
  deliveryDays?: number;
  notes?: string;
}

export interface ConvertRfqToPoRequest {
  vendorId: string;
  lineItemIndexes: number[];
  expectedDeliveryDate?: string;
  notes?: string;
  paymentTerms?: string;
}

// ---- Trading PO types ----

export interface TradingPoLineItem {
  lineItemId: string;
  productId?: string;
  productName: string;
  description?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalAmount: number;
  uom?: string;
  sourceLineItemIndex?: number;
  sellUnitPrice?: number;
}

export interface TradingPurchaseOrder {
  id: string;
  tradingPoId: string;
  tenantId: string;
  sourceProposalId?: string;
  sourceReferenceNumber?: string;
  sourceRfqId?: string;
  rfqReferenceNumber?: string;
  supplierId: string;
  supplierName: string;
  status: TradingPoStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  items: TradingPoLineItem[];
  subtotal: number;
  totalAmount: number;
  notes?: string;
  paymentTerms?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  createdBy: string;
}

export interface GrnLineItem {
  partId: string;
  orderedQty: number;
  receivedQty: number;
  condition?: string;
}

export interface GRN {
  id: string;
  grnNumber?: string;
  poId: string;
  receivedDate: string;
  receivedBy: string;
  lineItems: GrnLineItem[];
  qualityStatus: QualityStatus;
  remarks?: string;
  createdAt?: string;
}

export interface CreateGrnRequest {
  poId: string;
  receivedDate: string;
  receivedBy: string;
  lineItems: GrnLineItem[];
  qualityStatus: QualityStatus;
  remarks?: string;
}

export interface RateContractLineItem {
  partId: string;
  agreedUnitPrice: number;
  minOrderQty: number;
}

export interface RateContract {
  id: string;
  rcNumber?: string;
  vendorId: string;
  lineItems: RateContractLineItem[];
  validFrom: string;
  validTo: string;
  autoRenew: boolean;
  status: RateContractStatus;
  createdAt?: string;
}

export interface CreateRateContractRequest {
  vendorId: string;
  lineItems: RateContractLineItem[];
  validFrom: string;
  validTo: string;
  autoRenew: boolean;
}

// ---- Service ----

export const procurementService = {
  // Vendors
  getAllVendors: () => api.get<Vendor[]>("/vendors"),
  getVendorById: (id: string) => api.get<Vendor>(`/vendors/${id}`),
  createVendor: (data: CreateVendorRequest) => api.post<Vendor>("/vendors", data),
  updateVendor: (id: string, data: Partial<CreateVendorRequest>) =>
    api.put<Vendor>(`/vendors/${id}`, data),
  deleteVendor: (id: string) => api.delete<void>(`/vendors/${id}`),
  updateVendorRating: (id: string, rating: number) =>
    api.post<Vendor>(`/vendors/${id}/rating`, { rating }),

  // RFQ (legacy inventory)
  getAllRfqs: () => api.get<RFQ[]>("/procurement/rfq"),
  getRfqById: (id: string) => api.get<RFQ>(`/procurement/rfq/${id}`),
  createRfq: (data: CreateRfqRequest) => api.post<RFQ>("/procurement/rfq", data),
  submitVendorResponse: (rfqId: string, data: VendorResponseItem) =>
    api.post<RFQ>(`/procurement/rfq/${rfqId}/vendor-response`, data),
  selectRfqVendor: (rfqId: string, vendorId: string) =>
    api.post<RFQ>(`/procurement/rfq/${rfqId}/select-vendor`, { vendorId }),

  // Trading RFQs
  getTradingRfqs: (status?: TradingRfqStatus) =>
    api.get<TradingRFQ[]>(`/rfqs${status ? `?status=${status}` : ""}`),
  getTradingRfqById: (id: string) => api.get<TradingRFQ>(`/rfqs/${id}`),
  getTradingRfqsByProposal: (proposalId: string) =>
    api.get<TradingRFQ[]>(`/rfqs/by-proposal/${proposalId}`),
  createTradingRfq: (data: CreateTradingRfqRequest) => api.post<TradingRFQ>("/rfqs", data),
  sendTradingRfq: (id: string) => api.post<TradingRFQ>(`/rfqs/${id}/send`, {}),
  recordVendorResponse: (id: string, data: RecordVendorResponseRequest) =>
    api.post<TradingRFQ>(`/rfqs/${id}/respond`, data),
  convertRfqToPo: (id: string, data: ConvertRfqToPoRequest) =>
    api.post<TradingPurchaseOrder>(`/rfqs/${id}/convert-to-po`, data),
  cancelTradingRfq: (id: string) => api.post<TradingRFQ>(`/rfqs/${id}/cancel`, {}),

  // Trading Purchase Orders
  getTradingPos: () => api.get<TradingPurchaseOrder[]>("/purchase-orders"),
  getTradingPoById: (id: string) => api.get<TradingPurchaseOrder>(`/purchase-orders/${id}`),
  getTradingPosByProposal: (proposalId: string) =>
    api.get<TradingPurchaseOrder[]>(`/purchase-orders/by-proposal/${proposalId}`),
  getTradingPosByRfq: (rfqId: string) =>
    api.get<TradingPurchaseOrder[]>(`/purchase-orders/by-rfq/${rfqId}`),
  submitPoForApproval: (id: string) =>
    api.post<TradingPurchaseOrder>(`/purchase-orders/${id}/submit`, {}),
  approvePo: (id: string, level: string, comments: string) =>
    api.post<TradingPurchaseOrder>(`/purchase-orders/${id}/approve`, { level, comments }),
  rejectPo: (id: string, level: string, reason: string) =>
    api.post<TradingPurchaseOrder>(`/purchase-orders/${id}/reject`, { level, reason }),
  sendPo: (id: string) => api.post<TradingPurchaseOrder>(`/purchase-orders/${id}/send`, {}),
  markPoReceived: (id: string) =>
    api.post<TradingPurchaseOrder>(`/purchase-orders/${id}/receive`, {}),
  cancelPo: (id: string) => api.post<TradingPurchaseOrder>(`/purchase-orders/${id}/cancel`, {}),

  // GRN
  getAllGrns: () => api.get<GRN[]>("/procurement/grn"),
  createGrn: (data: CreateGrnRequest) => api.post<GRN>("/procurement/grn", data),

  // Rate Contracts
  getAllRateContracts: () => api.get<RateContract[]>("/procurement/rate-contracts"),
  getActiveRateContracts: () => api.get<RateContract[]>("/procurement/rate-contracts/active"),
  createRateContract: (data: CreateRateContractRequest) =>
    api.post<RateContract>("/procurement/rate-contracts", data),
  terminateRateContract: (id: string) =>
    api.post<RateContract>(`/procurement/rate-contracts/${id}/terminate`, {}),
};
