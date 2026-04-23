import { api } from "./api-client";

export interface Dealer {
  id: string;
  dealerCode: string;
  companyName: string;
  tier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE";
  region: string;
  territory: string;
  creditLimit: number;
  currentCreditUsed: number;
  contactPerson: string;
  email: string;
  phone: string;
  GSTIN: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onboardedDate: string;
  accountManagerId: string;
  isDeleted: boolean;
}

export interface DealerOrder {
  id: string;
  orderNumber: string;
  dealerId: string;
  products: { productId: string; qty: number; unitPrice: number }[];
  totalValue: number;
  creditUsed: number;
  status: string;
  placedAt: string;
  deliveredAt: string;
}

export interface DealerPerformance {
  id: string;
  dealerId: string;
  month: number;
  year: number;
  target: number;
  actualSales: number;
  incentivesEarned: number;
  openOrders: number;
  pendingPayments: number;
}

export interface CreateDealerRequest {
  companyName: string;
  tier: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE";
  region: string;
  territory: string;
  creditLimit: number;
  contactPerson: string;
  email: string;
  phone: string;
  GSTIN: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onboardedDate: string;
  accountManagerId: string;
}

export interface PlaceOrderRequest {
  products: { productId: string; qty: number; unitPrice: number }[];
  totalValue: number;
  creditUsed: number;
}

export const dealersService = {
  async getAllDealers(params?: {
    status?: string;
    tier?: string;
    territory?: string;
  }): Promise<Dealer[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.tier) query.append("tier", params.tier);
    if (params?.territory) query.append("territory", params.territory);
    const qs = query.toString();
    const response = await api.get<any>(`/dealers${qs ? `?${qs}` : ""}`);
    if (response && response.content && Array.isArray(response.content)) {
      return response.content;
    }
    return Array.isArray(response) ? response : [];
  },

  async getDealerById(id: string): Promise<Dealer> {
    return await api.get<Dealer>(`/dealers/${id}`);
  },

  async createDealer(data: CreateDealerRequest): Promise<Dealer> {
    return await api.post<Dealer>("/dealers", data);
  },

  async updateDealer(id: string, data: Partial<CreateDealerRequest>): Promise<Dealer> {
    return await api.put<Dealer>(`/dealers/${id}`, data);
  },

  async updateStatus(id: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED"): Promise<Dealer> {
    return await api.post<Dealer>(`/dealers/${id}/status`, { status });
  },

  async deleteDealer(id: string): Promise<void> {
    return await api.delete<void>(`/dealers/${id}`);
  },

  async getDealerOrders(id: string): Promise<DealerOrder[]> {
    const response = await api.get<any>(`/dealers/${id}/orders`);
    if (response && response.content && Array.isArray(response.content)) {
      return response.content;
    }
    return Array.isArray(response) ? response : [];
  },

  async placeOrder(id: string, data: PlaceOrderRequest): Promise<DealerOrder> {
    return await api.post<DealerOrder>(`/dealers/${id}/orders`, data);
  },

  async getDealerPerformance(id: string, month: number, year: number): Promise<DealerPerformance> {
    return await api.get<DealerPerformance>(
      `/dealers/${id}/performance?month=${month}&year=${year}`
    );
  },

  async getAllDealersPerformance(month: number, year: number): Promise<DealerPerformance[]> {
    const response = await api.get<any>(`/dealers/performance/monthly?month=${month}&year=${year}`);
    if (response && response.content && Array.isArray(response.content)) {
      return response.content;
    }
    return Array.isArray(response) ? response : [];
  },
};
