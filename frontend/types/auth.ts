export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "SALES_REP" | "USER";
  tenantId?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "MANAGER" | "SALES_REP" | "USER";
  token: string;
  tenantId?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
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
