import { api } from "./api-client";
import { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types/auth";

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    this.setAuth(response);
    return response;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    this.setAuth(response);
    return response;
  },

  logout(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    // Remove cookie
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  },

  setAuth(authResponse: AuthResponse): void {
    // Store in localStorage
    localStorage.setItem("auth_token", authResponse.token);
    const user: User = {
      userId: authResponse.userId,
      email: authResponse.email,
      fullName: authResponse.fullName,
      role: authResponse.role,
    };
    localStorage.setItem("user", JSON.stringify(user));

    // Also store token in cookie for middleware to access
    // Set cookie with 7 days expiration
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    document.cookie = `auth_token=${authResponse.token}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Strict`;
  },

  getToken(): string | null {
    return localStorage.getItem("auth_token");
  },

  getUser(): User | null {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (token) {
      // Ensure cookie is also set (for existing logged-in users)
      if (!document.cookie.includes("auth_token=")) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        document.cookie = `auth_token=${token}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Strict`;
      }
      return true;
    }
    return false;
  },
};
