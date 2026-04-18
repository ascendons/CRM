import { api } from './api-client';
import { 
  Asset, 
  AssetCategory, 
  CreateAssetRequest, 
  UpdateAssetRequest,
  Contract,
  CreateContractRequest,
  ContractVisit,
  ContractVisitStatus,
  WorkOrder,
  WorkOrderStatus,
  ServiceRequest,
  Checklist,
  ChecklistResponse,
  ChecklistItemResponse
} from '@/types/field-service';

export const fieldService = {
  // Assets
  getAllAssets: (params?: { accountId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.accountId) query.append('accountId', params.accountId);
    if (params?.status) query.append('status', params.status);
    return api.get<Asset[]>(`/assets?${query.toString()}`);
  },
  getAssetById: (id: string) => api.get<Asset>(`/assets/${id}`),
  createAsset: (data: CreateAssetRequest) => api.post<Asset>('/assets', data),
  updateAsset: (id: string, data: UpdateAssetRequest) => api.put<Asset>(`/assets/${id}`, data),
  deleteAsset: (id: string) => api.delete<void>(`/assets/${id}`),

  // Asset Categories
  getAllAssetCategories: () => api.get<AssetCategory[]>('/asset-categories'),
  getAssetCategoryById: (id: string) => api.get<AssetCategory>(`/asset-categories/${id}`),
  createAssetCategory: (data: Partial<AssetCategory>) => api.post<AssetCategory>('/asset-categories', data),
  updateAssetCategory: (id: string, data: Partial<AssetCategory>) => api.put<AssetCategory>(`/asset-categories/${id}`, data),
  deleteAssetCategory: (id: string) => api.delete<void>(`/asset-categories/${id}`),

  // Contracts
  getAllContracts: (params?: { accountId?: string; expiringSoonDays?: number }) => {
    const query = new URLSearchParams();
    if (params?.accountId) query.append('accountId', params.accountId);
    if (params?.expiringSoonDays) query.append('expiringSoonDays', params.expiringSoonDays.toString());
    return api.get<Contract[]>(`/contracts?${query.toString()}`);
  },
  getContractById: (id: string) => api.get<Contract>(`/contracts/${id}`),
  createContract: (data: CreateContractRequest) => api.post<Contract>('/contracts', data),
  activateContract: (id: string) => api.post<Contract>(`/contracts/${id}/activate`, {}),
  cancelContract: (id: string) => api.post<Contract>(`/contracts/${id}/cancel`, {}),
  renewContract: (id: string, data: CreateContractRequest) => api.post<Contract>(`/contracts/${id}/renew`, data),
  updateContract: (id: string, data: CreateContractRequest) => api.put<Contract>(`/contracts/${id}`, data),
  getContractVisits: (id: string) => api.get<ContractVisit[]>(`/contracts/${id}/visits`),
  updateContractVisit: (visitId: string, data: Partial<ContractVisit>) => api.put<ContractVisit>(`/contracts/visits/${visitId}`, data),
  deleteContract: (id: string) => api.delete<void>(`/contracts/${id}`),

  // Service Requests
  getAllServiceRequests: () => api.get<ServiceRequest[]>('/service-requests'),
  getServiceRequestById: (id: string) => api.get<ServiceRequest>(`/service-requests/${id}`),
  createServiceRequest: (data: any) => api.post<ServiceRequest>('/service-requests', data),
  acknowledgeServiceRequest: (id: string) => api.post<ServiceRequest>(`/service-requests/${id}/acknowledge`, {}),
  closeServiceRequest: (id: string) => api.post<ServiceRequest>(`/service-requests/${id}/close`, {}),

  // Work Orders
  getAllWorkOrders: (params?: { status?: WorkOrderStatus; engineerId?: string; assetId?: string; slaBreached?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.engineerId) query.append('engineerId', params.engineerId);
    if (params?.assetId) query.append('assetId', params.assetId);
    if (params?.slaBreached) query.append('slaBreached', params.slaBreached.toString());
    return api.get<WorkOrder[]>(`/work-orders?${query.toString()}`);
  },
  getWorkOrderById: (id: string) => api.get<WorkOrder>(`/work-orders/${id}`),
  assignWorkOrder: (id: string, engineerIds: string[]) => api.post<WorkOrder>(`/work-orders/${id}/assign`, { engineerIds }),
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => api.post<WorkOrder>(`/work-orders/${id}/status`, { status }),
  createWorkOrder: (data: Partial<WorkOrder>) => api.post<WorkOrder>('/work-orders', data),
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => api.put<WorkOrder>(`/work-orders/${id}`, data),
  
  // Checklists
  getAllChecklistTemplates: () => api.get<Checklist[]>('/checklists/templates'),
  getChecklistTemplateById: (id: string) => api.get<Checklist>(`/checklists/templates/${id}`),
  createChecklistTemplate: (data: Partial<Checklist>) => api.post<Checklist>('/checklists/templates', data),
  updateChecklistTemplate: (id: string, data: Partial<Checklist>) => api.put<Checklist>(`/checklists/templates/${id}`, data),
  deleteChecklistTemplate: (id: string) => api.delete<void>(`/checklists/templates/${id}`),
  
  getChecklistResponse: (woId: string) => api.get<ChecklistResponse>(`/checklists/responses/work-order/${woId}`),
  startChecklist: (woId: string, data: { templateId: string; engineerId: string }) => 
    api.post<ChecklistResponse>(`/checklists/responses/work-order/${woId}/start`, data),
  saveChecklistResponses: (woId: string, responses: ChecklistItemResponse[]) => 
    api.post<ChecklistResponse>(`/checklists/responses/work-order/${woId}/save`, responses),
  completeChecklist: (woId: string) =>
    api.post<ChecklistResponse>(`/checklists/responses/work-order/${woId}/complete`, {}),

  // Service Analytics
  getServiceKpis: () => api.get<any>('/analytics/service/kpis'),
  getServiceVolume: () => api.get<any>('/analytics/service/volume'),
  getPartsAvailability: () => api.get<any>('/analytics/service/parts-availability'),
  getInventoryDeadStock: () => api.get<any>('/analytics/service/inventory/dead-stock'),
  getInventoryReorder: () => api.get<any>('/analytics/service/inventory/reorder'),
  getInventoryTopConsumed: (limit = 20) => api.get<any>(`/analytics/service/inventory/top-consumed?limit=${limit}`),

  // Escalation Rules
  getEscalationRules: () => api.get<any[]>('/admin/settings/escalation/rules'),
  createEscalationRule: (data: any) => api.post<any>('/admin/settings/escalation/rules', data),
  updateEscalationRule: (id: string, data: any) => api.put<any>(`/admin/settings/escalation/rules/${id}`, data),
  deleteEscalationRule: (id: string) => api.delete<void>(`/admin/settings/escalation/rules/${id}`),

  // Escalation Logs
  getEscalationLogs: () => api.get<any[]>('/admin/settings/escalation/logs'),
  getOpenEscalationLogs: () => api.get<any[]>('/admin/settings/escalation/logs/open'),
  acknowledgeEscalation: (logId: string) => api.post<void>(`/admin/settings/escalation/logs/${logId}/acknowledge`, {}),
  resolveEscalation: (logId: string) => api.post<void>(`/admin/settings/escalation/logs/${logId}/resolve`, {}),
};
