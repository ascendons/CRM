import { api } from '@/lib/api-client';

export interface LeaveTypePolicy {
  defaultAllocation: number;
  isCarryForward: boolean;
  maxCarryForward: number;
  minNoticeRequired: number;
  maxConsecutiveDays: number | null;
  requiresApproval: boolean;
  requiresDocuments: boolean;
}

export interface LeavePolicy {
  id?: string;
  tenantId?: string;
  leaveTypes: {
    [key: string]: LeaveTypePolicy;
  };
  allowCarryForward: boolean;
  maxCarryForwardDays?: {
    [key: string]: number;
  };
  proRateForNewJoiners: boolean;
  createdAt?: string;
  createdBy?: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export const leavePolicyApi = {
  getPolicy: () =>
    api.get<LeavePolicy>('/admin/leave-policy'),

  updatePolicy: (policy: LeavePolicy) =>
    api.put<LeavePolicy>('/admin/leave-policy', policy)
};
