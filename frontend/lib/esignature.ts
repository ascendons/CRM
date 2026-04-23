import { apiRequest } from "./api-client";

export const esignatureApi = {
  createRequest: (data: {
    documentType: string;
    documentId: string;
    signerEmail: string;
    signerName: string;
  }) => apiRequest<any>("/esignature/requests", { method: "POST", body: JSON.stringify(data) }),
  getRequests: (documentId?: string) =>
    apiRequest<any[]>(`/esignature/requests${documentId ? `?documentId=${documentId}` : ""}`),
  getByToken: (token: string) => apiRequest<any>(`/esignature/sign/${token}`),
  submitSignature: (token: string, signatureImageBase64: string) =>
    apiRequest<any>(`/esignature/sign/${token}`, {
      method: "POST",
      body: JSON.stringify({ signatureImageBase64 }),
    }),
  decline: (token: string) =>
    apiRequest<any>(`/esignature/sign/${token}/decline`, { method: "POST" }),
};
