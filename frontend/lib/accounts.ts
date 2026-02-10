import { Account, CreateAccountRequest, UpdateAccountRequest } from "@/types/account";
import { ApiResponse } from "@/types/auth";
import { authService } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

class AccountService {
  private getAuthHeader(): Record<string, string> {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async createAccount(request: CreateAccountRequest): Promise<Account> {
    const response = await fetch(`${API_URL}/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create account");
    }

    const result: ApiResponse<Account> = await response.json();
    if (!result.data) {
      throw new Error("No data returned from API");
    }
    return result.data;
  }

  async getAllAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_URL}/accounts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch accounts");
    }

    const result: ApiResponse<Account[]> = await response.json();
    return result.data || [];
  }

  async getAccountById(id: string): Promise<Account> {
    const response = await fetch(`${API_URL}/accounts/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch account");
    }

    const result: ApiResponse<Account> = await response.json();
    if (!result.data) {
      throw new Error("Account not found");
    }
    return result.data;
  }

  async getAccountByAccountId(accountId: string): Promise<Account> {
    const response = await fetch(`${API_URL}/accounts/code/${accountId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch account");
    }

    const result: ApiResponse<Account> = await response.json();
    if (!result.data) {
      throw new Error("Account not found");
    }
    return result.data;
  }

  async searchAccounts(query: string): Promise<Account[]> {
    const response = await fetch(`${API_URL}/accounts/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to search accounts");
    }

    const result: ApiResponse<Account[]> = await response.json();
    return result.data || [];
  }

  async updateAccount(id: string, request: UpdateAccountRequest): Promise<Account> {
    const response = await fetch(`${API_URL}/accounts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update account");
    }

    const result: ApiResponse<Account> = await response.json();
    if (!result.data) {
      throw new Error("No data returned from API");
    }
    return result.data;
  }

  async deleteAccount(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/accounts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete account");
    }
  }

  async getAccountCount(): Promise<number> {
    const response = await fetch(`${API_URL}/accounts/statistics/count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch account count");
    }

    const result: ApiResponse<number> = await response.json();
    return result.data ?? 0;
  }
}

export const accountsService = new AccountService();
