import { apiRequest } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export const driveApi = {
  getFolders: (parentId?: string) =>
    apiRequest<any>(`/drive/folders${parentId ? `?parentId=${parentId}` : ""}`),
  createFolder: (data: any) =>
    apiRequest<any>("/drive/folders", { method: "POST", body: JSON.stringify(data) }),
  getFiles: (folderId?: string) =>
    apiRequest<any>(`/drive/files${folderId ? `?folderId=${folderId}` : ""}`),
  uploadFile: async (file: File, folderId?: string): Promise<any> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const fd = new FormData();
    fd.append("file", file);
    if (folderId) fd.append("folderId", folderId);
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          if (payload.tenantId) headers["X-Tenant-ID"] = payload.tenantId;
        }
      } catch {}
    }
    const res = await fetch(`${API_URL}/drive/files/upload`, { method: "POST", headers, body: fd });
    return res.json();
  },
  downloadFile: (id: string) => apiRequest<any>(`/drive/files/${id}/download`),
  deleteFile: (id: string) => apiRequest<any>(`/drive/files/${id}`, { method: "DELETE" }),
  getVersions: (id: string) => apiRequest<any>(`/drive/files/${id}/versions`),
};
