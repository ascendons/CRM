import { apiRequest } from "./api-client";

const BASE = "/hr/performance";

export const performanceApi = {
  getCycles: () => apiRequest<any>(`${BASE}/cycles`),
  createCycle: (data: any) => apiRequest<any>(`${BASE}/cycles`, { method: "POST", body: JSON.stringify(data) }),
  deleteCycle: (id: string) => apiRequest<any>(`${BASE}/cycles/${id}`, { method: "DELETE" }),
  getReviews: (cycleId: string) => apiRequest<any>(`${BASE}/cycles/${cycleId}/reviews`),
  createReview: (data: any) => apiRequest<any>(`${BASE}/reviews`, { method: "POST", body: JSON.stringify(data) }),
  submitReview: (id: string) => apiRequest<any>(`${BASE}/reviews/${id}/submit`, { method: "POST" }),
  acknowledgeReview: (id: string) => apiRequest<any>(`${BASE}/reviews/${id}/acknowledge`, { method: "POST" }),
  getObjectives: () => apiRequest<any>("/hr/okrs"),
  createObjective: (data: any) => apiRequest<any>("/hr/okrs", { method: "POST", body: JSON.stringify(data) }),
  updateKeyResult: (id: string, krIndex: number, data: any) =>
    apiRequest<any>(`/hr/okrs/${id}/key-results/${krIndex}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteObjective: (id: string) => apiRequest<any>(`/hr/okrs/${id}`, { method: "DELETE" }),
};
