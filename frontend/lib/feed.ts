import { apiRequest } from "./api-client";

export const feedApi = {
  getFeed: (page = 0, size = 20) => apiRequest<any>(`/feed?page=${page}&size=${size}`),
  createPost: (data: any) =>
    apiRequest<any>("/feed", { method: "POST", body: JSON.stringify(data) }),
  react: (id: string, emoji: string) =>
    apiRequest<any>(`/feed/${id}/react`, { method: "POST", body: JSON.stringify({ emoji }) }),
  vote: (id: string, optionIndex: number) =>
    apiRequest<any>(`/feed/${id}/vote`, { method: "POST", body: JSON.stringify({ optionIndex }) }),
  pin: (id: string) => apiRequest<any>(`/feed/${id}/pin`, { method: "PUT" }),
  deletePost: (id: string) => apiRequest<any>(`/feed/${id}`, { method: "DELETE" }),
};
