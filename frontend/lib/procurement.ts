import { api } from "./api-client";

// ---- Types ----

export type VendorStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";
export type VendorCategory = "HVAC" | "ELECTRICAL" | "PLUMBING" | "GENERAL";
export type QualityStatus = "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED";
export type RfqStatus = "OPEN" | "CLOSED" | "CANCELLED";
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

  // RFQ
  getAllRfqs: () => api.get<RFQ[]>("/procurement/rfq"),
  getRfqById: (id: string) => api.get<RFQ>(`/procurement/rfq/${id}`),
  createRfq: (data: CreateRfqRequest) => api.post<RFQ>("/procurement/rfq", data),
  submitVendorResponse: (rfqId: string, data: VendorResponseItem) =>
    api.post<RFQ>(`/procurement/rfq/${rfqId}/vendor-response`, data),
  selectRfqVendor: (rfqId: string, vendorId: string) =>
    api.post<RFQ>(`/procurement/rfq/${rfqId}/select-vendor`, { vendorId }),

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
