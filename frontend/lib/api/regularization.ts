import { api } from '../api-client';

export interface CreateRegularizationRequest {
  attendanceId?: string;
  attendanceDate: string;
  type: 'MISSED_CHECKIN' | 'MISSED_CHECKOUT' | 'WRONG_LOCATION' | 'LATE_ARRIVAL' | 'EARLY_LEAVE' | 'FORGOT_CHECKOUT' | 'SYSTEM_ERROR' | 'WRONG_TIME' | 'OTHER';
  requestedCheckInTime?: string;
  requestedCheckOutTime?: string;
  requestedLatitude?: number;
  requestedLongitude?: number;
  requestedAddress?: string;
  reason: string;
  supportingDocuments?: string[];
}

export interface ApproveRegularizationRequest {
  regularizationId: string;
  approved: boolean;
  notes?: string;
  rejectionReason?: string;
}

export interface RegularizationResponse {
  id: string;
  regularizationId: string;
  tenantId: string;
  attendanceId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  attendanceDate: string;
  type: string;
  requestedCheckInTime?: string;
  requestedCheckOutTime?: string;
  originalCheckInTime?: string;
  originalCheckOutTime?: string;
  requestedLatitude?: number;
  requestedLongitude?: number;
  requestedAddress?: string;
  reason: string;
  supportingDocuments: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED';
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  managerNotes?: string;
  systemNotes?: string;
  isAutoApproved: boolean;
  autoApprovalReason?: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

/**
 * API client for attendance regularization
 */
export const regularizationApi = {
  /**
   * Request attendance regularization
   */
  requestRegularization: (data: CreateRegularizationRequest): Promise<RegularizationResponse> =>
    api.post('/attendance/regularizations', data),

  /**
   * Get my regularizations
   */
  getMyRegularizations: (): Promise<RegularizationResponse[]> =>
    api.get('/attendance/regularizations/my'),

  /**
   * Get regularization by ID
   */
  getRegularizationById: (regularizationId: string): Promise<RegularizationResponse> =>
    api.get(`/attendance/regularizations/${regularizationId}`),

  /**
   * Get pending approvals (Manager)
   */
  getPendingApprovals: (): Promise<RegularizationResponse[]> =>
    api.get('/attendance/regularizations/admin/pending'),

  /**
   * Get all pending regularizations (Admin)
   */
  getAllPendingRegularizations: (): Promise<RegularizationResponse[]> =>
    api.get('/attendance/regularizations/admin/all-pending'),

  /**
   * Approve or reject regularization (Manager)
   */
  approveRegularization: (data: ApproveRegularizationRequest): Promise<RegularizationResponse> =>
    api.post('/attendance/regularizations/admin/approve', data)
};
