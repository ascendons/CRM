# Phase 4: Team & Invitations (Important)

## Overview

**Duration**: 3 days
**Tasks**: 5 (TASK-019 to TASK-023)
**Priority**: 🟡 Important
**Dependencies**: Phase 1, Phase 2 complete

This phase implements team invitation functionality, allowing organization admins to invite users to join their organization. It includes invitation management, acceptance flow, and team integration.

---

## What You'll Build

1. ✅ Invitation API client
2. ✅ Invite User Modal with role selection
3. ✅ Invitations List with status tracking
4. ✅ Accept Invitation Page for new users
5. ✅ Team Page integration

---

## Success Criteria

By the end of Phase 4, you will have:
- [x] Admins can invite users via email
- [x] Real-time invitation status tracking
- [x] Email invitations with secure tokens
- [x] User acceptance flow with account creation
- [x] Complete team management interface

---

## Task List

- [TASK-019](#task-019-create-invitation-api) - Invitation API (45 min)
- [TASK-020](#task-020-create-invite-user-modal) - Invite Modal (1.5 hours)
- [TASK-021](#task-021-create-invitations-list-component) - Invitations List (1 hour)
- [TASK-022](#task-022-create-accept-invitation-page) - Accept Page (2 hours)
- [TASK-023](#task-023-update-team-page) - Team Page Integration (1 hour)

**Total Time**: ~6.5 hours actual coding + testing

---

## TASK-019: Create Invitation API

**Priority**: 🟡 Important
**Estimated Time**: 45 minutes
**Dependencies**: TASK-002 (from Phase 1)
**Files**: `lib/api/invitation.ts` (NEW)

### Description
Create API client methods for invitation-related endpoints based on OrganizationInvitationService.

### Requirements
1. Send invitation
2. Get all invitations
3. Get pending invitations
4. Revoke invitation
5. Get invitation by ID
6. Accept invitation

### Implementation

**File**: `lib/api/invitation.ts` (NEW FILE)

```typescript
import { api } from '../api-client';
import type {
  Invitation,
  InvitationRequest,
  AcceptInvitationRequest,
} from '@/types/organization';

export const invitationApi = {
  /**
   * Send invitation to user
   * Admin only
   */
  async send(data: InvitationRequest): Promise<Invitation> {
    return api.post<Invitation>('/invitations/send', data);
  },

  /**
   * Get all invitations for current organization
   * Admin only
   */
  async getAll(): Promise<Invitation[]> {
    return api.get<Invitation[]>('/invitations');
  },

  /**
   * Get pending invitations
   * Admin only
   */
  async getPending(): Promise<Invitation[]> {
    return api.get<Invitation[]>('/invitations/pending');
  },

  /**
   * Revoke invitation
   * Admin only
   */
  async revoke(invitationId: string): Promise<void> {
    return api.delete(`/invitations/${invitationId}/revoke`);
  },

  /**
   * Get invitation by ID (for acceptance page)
   * Public endpoint - no auth required
   */
  async getById(invitationId: string): Promise<Invitation> {
    return api.get<Invitation>(`/invitations/${invitationId}`);
  },

  /**
   * Accept invitation and create user account
   * Public endpoint - no auth required
   */
  async accept(
    invitationId: string,
    data: AcceptInvitationRequest
  ): Promise<{
    userId: string;
    token: string;
    message: string;
  }> {
    return api.post(`/invitations/${invitationId}/accept`, data);
  },
};
```

### Acceptance Criteria
- [x] All API methods defined
- [x] Type-safe with proper interfaces
- [x] Uses centralized API client
- [x] Error handling included
- [x] JSDoc comments added

### Testing
```typescript
// Test in React component
import { invitationApi } from '@/lib/api/invitation';

// Send invitation
const invitation = await invitationApi.send({
  email: 'user@example.com',
  roleName: 'SALES_REP',
  personalMessage: 'Welcome to our team!',
});

// Get pending
const pending = await invitationApi.getPending();
console.log(pending);
```

---

## TASK-020: Create Invite User Modal

**Priority**: 🟡 Important
**Estimated Time**: 1.5 hours
**Dependencies**: TASK-019
**Files**: `components/team/InviteUserModal.tsx` (NEW)

### Description
Create modal component for inviting users to the organization.

### Requirements
1. Email input with validation
2. Role selection
3. Optional personal message
4. Send invitation
5. Success/error feedback
6. Loading states

### Implementation

**File**: `components/team/InviteUserModal.tsx` (NEW FILE)

```typescript
"use client";

import { useState } from "react";
import { invitationApi } from "@/lib/api/invitation";
import { ApiError } from "@/lib/api-client";
import {
  X,
  Mail,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteUserModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    roleName: "USER",
    personalMessage: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await invitationApi.send({
        email: formData.email,
        roleName: formData.roleName,
        personalMessage: formData.personalMessage || undefined,
      });

      setSuccess("Invitation sent successfully!");

      // Reset form
      setFormData({
        email: "",
        roleName: "USER",
        personalMessage: "",
      });

      // Call success callback
      onSuccess?.();

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to send invitation");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Invite Team Member
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {/* Messages */}
            {success && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role *
                </label>
                <select
                  name="roleName"
                  value={formData.roleName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="USER">User</option>
                  <option value="SALES_REP">Sales Representative</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Choose the role this user will have in your organization
                </p>
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Personal Message (Optional)
                </label>
                <textarea
                  name="personalMessage"
                  value={formData.personalMessage}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a personal welcome message..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Send Invitation
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [x] Modal opens/closes properly
- [x] Email validation
- [x] Role selection dropdown
- [x] Optional personal message
- [x] Loading states
- [x] Success/error feedback
- [x] Auto-close on success

### Testing
```typescript
// Use in team page
import InviteUserModal from '@/components/team/InviteUserModal';

function TeamPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Invite User</button>
      <InviteUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => console.log('Invitation sent!')}
      />
    </>
  );
}
```

---

## TASK-021: Create Invitations List Component

**Priority**: 🟡 Important
**Estimated Time**: 1 hour
**Dependencies**: TASK-019
**Files**: `components/team/InvitationsList.tsx` (NEW)

### Description
Create component to display all invitations with status and actions.

### Requirements
1. List all invitations
2. Show status badges (pending, accepted, revoked, expired)
3. Revoke action for pending invitations
4. Filter by status
5. Empty state

### Implementation

**File**: `components/team/InvitationsList.tsx` (NEW FILE)

```typescript
"use client";

import { useState, useEffect } from "react";
import { invitationApi } from "@/lib/api/invitation";
import type { Invitation } from "@/types/organization";
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  Users,
} from "lucide-react";

interface InvitationsListProps {
  refreshKey?: number;
}

export default function InvitationsList({ refreshKey }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted">("all");

  useEffect(() => {
    loadInvitations();
  }, [refreshKey]);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const data = await invitationApi.getAll();
      setInvitations(data);
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) {
      return;
    }

    try {
      await invitationApi.revoke(invitationId);
      loadInvitations();
    } catch (err: any) {
      alert(err.message || "Failed to revoke invitation");
    }
  };

  const getStatusBadge = (invitation: Invitation) => {
    const { status, isExpired } = invitation;

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          <Clock className="h-3 w-3" />
          Expired
        </span>
      );
    }

    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </span>
        );
      case "REVOKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Revoked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const filteredInvitations = invitations.filter((inv) => {
    if (filter === "all") return true;
    if (filter === "pending") return inv.status === "PENDING" && !inv.isExpired;
    if (filter === "accepted") return inv.status === "ACCEPTED";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "all"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All ({invitations.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "pending"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending (
          {invitations.filter((inv) => inv.status === "PENDING" && !inv.isExpired).length})
        </button>
        <button
          onClick={() => setFilter("accepted")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "accepted"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Accepted ({invitations.filter((inv) => inv.status === "ACCEPTED").length})
        </button>
      </div>

      {/* Invitations List */}
      {filteredInvitations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No invitations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInvitations.map((invitation) => (
            <div
              key={invitation.invitationId}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Email */}
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {invitation.email}
                    </span>
                    {getStatusBadge(invitation)}
                  </div>

                  {/* Details */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      Role: <span className="font-medium">{invitation.roleName}</span>
                    </p>
                    {invitation.profileName && (
                      <p>
                        Profile: <span className="font-medium">{invitation.profileName}</span>
                      </p>
                    )}
                    <p>
                      Invited by: <span className="font-medium">{invitation.invitedByName}</span>
                    </p>
                    <p>
                      Sent: {new Date(invitation.sentAt).toLocaleDateString()}
                    </p>
                    <p>
                      Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Personal Message */}
                  {invitation.personalMessage && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700 italic">
                      "{invitation.personalMessage}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                {invitation.status === "PENDING" && !invitation.isExpired && (
                  <button
                    onClick={() => handleRevoke(invitation.invitationId)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Revoke invitation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Acceptance Criteria
- [x] Lists all invitations
- [x] Status badges with icons
- [x] Filter by status
- [x] Revoke action works
- [x] Empty state
- [x] Responsive layout

### Testing
```bash
1. Navigate to team page
2. Send some invitations
3. See invitations list
4. Filter by status
5. Try revoking pending invitation
```

---

## TASK-022: Create Accept Invitation Page

**Priority**: 🟡 Important
**Estimated Time**: 2 hours
**Dependencies**: TASK-019
**Files**: `app/(auth)/accept-invitation/[invitationId]/page.tsx` (NEW)

### Description
Create public page for users to accept invitations and create accounts.

### Requirements
1. Validate invitation ID
2. Show organization details
3. Account creation form
4. Accept invitation and create user
5. Auto-login after acceptance
6. Handle expired invitations

### Implementation

**File**: `app/(auth)/accept-invitation/[invitationId]/page.tsx` (NEW FILE)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { invitationApi } from "@/lib/api/invitation";
import { authService } from "@/lib/auth";
import type { Invitation } from "@/types/organization";
import { ApiError } from "@/lib/api-client";
import {
  Building2,
  Mail,
  User,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function AcceptInvitationPage({
  params,
}: {
  params: { invitationId: string };
}) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadInvitation();
  }, [params.invitationId]);

  const loadInvitation = async () => {
    try {
      setIsLoading(true);
      const data = await invitationApi.getById(params.invitationId);
      setInvitation(data);
    } catch (err: any) {
      setError(err.message || "Invitation not found");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await invitationApi.accept(params.invitationId, {
        fullName: formData.fullName,
        password: formData.password,
      });

      // Set auth
      authService.setAuth({
        userId: response.userId,
        email: invitation!.email,
        fullName: formData.fullName,
        role: invitation!.roleName as any,
        token: response.token,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to accept invitation");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  // Check if expired
  if (invitation.isExpired || invitation.status !== "PENDING") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
            <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invitation {invitation.status.toLowerCase()}
            </h2>
            <p className="text-gray-600">
              {invitation.isExpired
                ? "This invitation has expired. Please contact your organization admin for a new invitation."
                : `This invitation has been ${invitation.status.toLowerCase()}.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Join {invitation.organizationName}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited by {invitation.invitedByName}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          {/* Invitation Details */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4" />
                <span>{invitation.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4" />
                <span>Role: {invitation.roleName}</span>
              </div>
            </div>
            {invitation.personalMessage && (
              <div className="mt-3 pt-3 border-t border-blue-200 text-sm text-gray-700 italic">
                "{invitation.personalMessage}"
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Accept Invitation & Join
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Acceptance Criteria
- [x] Validates invitation
- [x] Shows organization details
- [x] Account creation form
- [x] Password validation
- [x] Handles expired invitations
- [x] Auto-login after acceptance
- [x] Error handling

### Testing
```bash
1. Send invitation via team page
2. Copy invitation link from email
3. Open link in new browser/incognito
4. Fill account details
5. Submit form
6. Should auto-login and redirect to dashboard
```

---

## TASK-023: Update Team Page

**Priority**: 🟡 Important
**Estimated Time**: 1 hour
**Dependencies**: TASK-020, TASK-021
**Files**: `app/team/page.tsx` (UPDATE or NEW)

### Description
Update or create team page with invite button and invitations list.

### Requirements
1. "Invite User" button
2. InviteUserModal integration
3. InvitationsList integration
4. Refresh on new invitation
5. Team members list (existing)

### Implementation

**File**: `app/team/page.tsx` (UPDATE or NEW FILE)

```typescript
"use client";

import { useState } from "react";
import InviteUserModal from "@/components/team/InviteUserModal";
import InvitationsList from "@/components/team/InvitationsList";
import { UserPlus, Users, Mail } from "lucide-react";

export default function TeamPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleInviteSuccess = () => {
    // Refresh invitations list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Team Management
            </h1>
            <p className="text-gray-600 mt-2">
              Invite and manage your team members
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg"
          >
            <UserPlus className="h-5 w-5" />
            Invite User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button className="flex items-center gap-2 py-4 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
            <Mail className="h-5 w-5" />
            Invitations
          </button>
          <button className="flex items-center gap-2 py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
            <Users className="h-5 w-5" />
            Team Members
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <InvitationsList refreshKey={refreshKey} />
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
```

### Acceptance Criteria
- [x] "Invite User" button visible
- [x] Modal opens on click
- [x] Invitations list displays
- [x] List refreshes after invite
- [x] Clean layout
- [x] Responsive design

### Testing
```bash
1. Navigate to /team
2. Click "Invite User" button
3. Fill form and send invitation
4. See invitation appear in list
5. Try filtering invitations
6. Test revoke action
```

---

## Phase 4 Complete!

You now have complete team invitation functionality including:
- Email invitations with role assignment
- Real-time invitation tracking
- Secure acceptance flow with account creation
- Full team management interface

**Next Step**: Move to [Phase 5: Analytics Dashboard](./PHASE_5_ANALYTICS_DASHBOARD.md)
