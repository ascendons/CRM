import { ApiResponse } from "@/types/auth";

// Use environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("auth_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token && !endpoint.includes("/auth/")) {
    headers["Authorization"] = `Bearer ${token}`;

    // Add Tenant ID if available in token or localStorage
    try {
      // Decode locally if needed or get from storage (simpler)
      // For now, let's rely on what's in localStorage 'user' object or the store
      // But purely inside api-client, we can't easily access Zustand store without hooks
      // Best approach: Parse token or separate storage

      // Simple parse of token to get tenantId
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.tenantId) {
          headers["X-Tenant-ID"] = payload.tenantId;
        }
      }
    } catch (e) {
      // Ignore token parse errors
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`[apiRequest] Fetching: ${options.method || 'GET'} ${url}`, { headers });
    
    const response = await fetch(url, config);
    console.log(`[apiRequest] Response status: ${response.status} ${response.statusText}`);

    const data: ApiResponse<T> = await response.json();
    console.log(`[apiRequest] Response data:`, data);

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("[apiRequest] 401 Unauthorized - clearing auth");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      throw new ApiError(data.message || "An error occurred", response.status, data.errors);
    }

    return data.data as T;
  } catch (error) {
    console.error("[apiRequest] Error:", error);
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Network error occurred", 500);
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "DELETE" }),

  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || "An error occurred", response.status, data.errors);
    }

    return data.data as T;
  },

  download: async (endpoint: string): Promise<Blob> => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;

      // Add Tenant ID from token
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.tenantId) {
            headers["X-Tenant-ID"] = payload.tenantId;
          }
        }
      } catch (e) {
        // Ignore token parse errors
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new ApiError("Failed to download file", response.status);
    }

    return response.blob();
  },

  fetchHtml: async (endpoint: string): Promise<string> => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      "Accept": "text/html",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;

      // Add Tenant ID from token
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.tenantId) {
            headers["X-Tenant-ID"] = payload.tenantId;
          }
        }
      } catch (e) {
        // Ignore token parse errors
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new ApiError("Failed to fetch HTML", response.status);
    }

    return response.text();
  },
};
