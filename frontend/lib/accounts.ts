import { api } from "./api-client";
import { Account, CreateAccountRequest, UpdateAccountRequest } from "@/types/account";

export const accountsService = {
  async createAccount(request: CreateAccountRequest): Promise<Account> {
    return await api.post<Account>("/accounts", request);
  },

  async getAllAccounts(): Promise<Account[]> {
    const response = await api.get<any>("/accounts");
    return response?.content || response || [];
  },

  async getAccountById(id: string): Promise<Account> {
    return await api.get<Account>(`/accounts/${id}`);
  },

  async getAccountByAccountId(accountId: string): Promise<Account> {
    return await api.get<Account>(`/accounts/code/${accountId}`);
  },

  async searchAccounts(query: string): Promise<Account[]> {
    return await api.get<Account[]>(`/accounts/search?q=${encodeURIComponent(query)}`);
  },

  async updateAccount(id: string, request: UpdateAccountRequest): Promise<Account> {
    return await api.put<Account>(`/accounts/${id}`, request);
  },

  async deleteAccount(id: string): Promise<void> {
    return await api.delete<void>(`/accounts/${id}`);
  },

  async getAccountCount(): Promise<number> {
    return await api.get<number>("/accounts/statistics/count");
  },
};
