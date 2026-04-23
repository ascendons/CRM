const PORTAL_TOKEN_KEY = "portal_token";
const PORTAL_EMAIL_KEY = "portal_email";

export function getPortalToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PORTAL_TOKEN_KEY);
}

export function setPortalToken(token: string, email: string) {
  localStorage.setItem(PORTAL_TOKEN_KEY, token);
  localStorage.setItem(PORTAL_EMAIL_KEY, email);
}

export function clearPortalToken() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_EMAIL_KEY);
}

export function getPortalEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PORTAL_EMAIL_KEY);
}

async function portalRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getPortalToken();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data.data ?? data;
}

export const portalApi = {
  requestLink: (email: string, tenantId: string) =>
    portalRequest<any>("/portal/auth/request-link", {
      method: "POST",
      body: JSON.stringify({ email, tenantId }),
    }),
  verify: (token: string) =>
    portalRequest<{ token: string; email: string }>("/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  getInvoices: () => portalRequest<any[]>("/portal/invoices"),
  getServiceRequests: () => portalRequest<any[]>("/portal/service-requests"),
  getWorkOrders: () => portalRequest<any[]>("/portal/work-orders"),
};
