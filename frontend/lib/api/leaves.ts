import { api } from '../api-client';

export interface CreateLeaveRequest {
  leaveType: 'SICK' | 'CASUAL' | 'EARNED' | 'PAID' | 'UNPAID' | 'MATERNITY' | 'PATERNITY' | 'COMPENSATORY' | 'BEREAVEMENT' | 'MARRIAGE';
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay?: boolean;
  halfDayType?: 'FIRST_HALF' | 'SECOND_HALF';
  attachments?: string[];
  isEmergencyLeave?: boolean;
  emergencyContactNumber?: string;
  contactNumberDuringLeave?: string;
  alternateEmail?: string;
}

export interface ApproveLeaveRequest {
  leaveId: string;
  approved: boolean;
  notes?: string;
  rejectionReason?: string;
}

export interface CancelLeaveRequest {
  leaveId: string;
  cancellationReason: string;
}

export interface LeaveResponse {
  id: string;
  leaveId: string;
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  businessDays: number;
  isHalfDay: boolean;
  halfDayType?: string;
  reason: string;
  attachments: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  isEmergencyLeave: boolean;
  emergencyContactNumber?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  contactNumberDuringLeave?: string;
  alternateEmail?: string;
  managerNotes?: string;
  systemNotes?: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface LeaveTypeBalance {
  total: number;
  used: number;
  pending: number;
  available: number;
  isCarryForward: boolean;
  carriedForward: number;
  lastUpdated: string;
}

export interface LeaveBalanceResponse {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  year: number;
  balances: {
    [key: string]: LeaveTypeBalance;
  };
  createdAt: string;
  lastModifiedAt?: string;
}

/**
 * API client for leave management
 */
export const leavesApi = {
  /**
   * Apply for leave
   */
  applyLeave: (data: CreateLeaveRequest) =>
    api.post('/leaves', data),

  /**
   * Get my leaves
   */
  getMyLeaves: () =>
    api.get('/leaves/my'),

  /**
   * Get leave by ID
   */
  getLeaveById: (leaveId: string) =>
    api.get(`/leaves/${leaveId}`),

  /**
   * Cancel leave
   */
  cancelLeave: (data: CancelLeaveRequest) =>
    api.post('/leaves/cancel', data),

  /**
   * Get leave balance
   */
  getMyBalance: (year?: number) =>
    api.get(`/leaves/my/balance${year ? `?year=${year}` : ''}`),

  /**
   * Get pending approvals (Manager)
   */
  getPendingApprovals: () =>
    api.get('/leaves/admin/pending'),

  /**
   * Get all pending approvals (Admin)
   */
  getAllPendingApprovals: () =>
    api.get('/leaves/admin/all-pending'),

  /**
   * Approve or reject leave (Manager)
   */
  approveLeave: (data: ApproveLeaveRequest) =>
    api.post('/leaves/admin/approve', data)
};
