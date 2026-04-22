import { apiRequest } from "./api-client";

export const onboardingApi = {
  getTemplates: () => apiRequest<any>("/hr/onboarding/templates"),
  createTemplate: (data: any) => apiRequest<any>("/hr/onboarding/templates", { method: "POST", body: JSON.stringify(data) }),
  getTemplate: (id: string) => apiRequest<any>(`/hr/onboarding/templates/${id}`),
  deleteTemplate: (id: string) => apiRequest<any>(`/hr/onboarding/templates/${id}`, { method: "DELETE" }),
  getInstances: () => apiRequest<any>("/hr/onboarding/instances"),
  createInstance: (data: any) => apiRequest<any>("/hr/onboarding/instances", { method: "POST", body: JSON.stringify(data) }),
  completeTask: (instanceId: string, taskIndex: number) => apiRequest<any>(`/hr/onboarding/instances/${instanceId}/tasks/${taskIndex}/complete`, { method: "POST" }),
  getInstancesByEmployee: (employeeId: string) => apiRequest<any>(`/hr/onboarding/instances/${employeeId}`),
};
