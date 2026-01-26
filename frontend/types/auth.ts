export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "SALES_REP" | "USER";
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "SALES_REP" | "USER";
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
