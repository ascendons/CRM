"use client";

import { useState } from "react";
import { PermissionDetail } from "@/lib/api/permissions";
import { PermissionBadge } from "./PermissionBadge";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface PermissionToggleProps {
  objectName: string;
  action: string;
  permission: PermissionDetail;
  onGrant: (objectName: string, action: string, reason?: string) => Promise<void>;
  onRevoke: (objectName: string, action: string, reason?: string) => Promise<void>;
  disabled?: boolean;
}

export function PermissionToggle({
  objectName,
  action,
  permission,
  onGrant,
  onRevoke,
  disabled = false,
}: PermissionToggleProps) {
  const [loading, setLoading] = useState(false);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<"grant" | "revoke" | null>(null);

  const handleToggle = async () => {
    if (disabled || loading) return;

    // If it's an override, revoke it
    if (permission.isOverride) {
      setPendingAction("revoke");
      setShowReasonDialog(true);
      return;
    }

    // If profile denies and we want to grant
    if (!permission.granted) {
      setPendingAction("grant");
      setShowReasonDialog(true);
      return;
    }

    // If profile grants and we want to deny (create explicit deny)
    setPendingAction("revoke");
    setShowReasonDialog(true);
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    setLoading(true);
    try {
      if (pendingAction === "grant") {
        await onGrant(objectName, action, reason || undefined);
      } else {
        await onRevoke(objectName, action, reason || undefined);
      }
      setShowReasonDialog(false);
      setReason("");
      setPendingAction(null);
    } catch (error) {
      console.error("Failed to update permission:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-center gap-3 flex-1">
          {/* Permission status indicator */}
          <div className="flex items-center gap-2">
            {permission.granted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-300" />
            )}
            <span
              className={`text-sm font-medium ${
                permission.granted ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {action}
            </span>
          </div>

          {/* Source badge */}
          <PermissionBadge source={permission.source} granted={permission.granted} />
        </div>

        {/* Action button */}
        <button
          onClick={handleToggle}
          disabled={disabled || loading}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            permission.isOverride
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : permission.granted
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
          } ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            "Loading..."
          ) : permission.isOverride ? (
            <span className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              Revoke
            </span>
          ) : permission.granted ? (
            "Override"
          ) : (
            "Grant"
          )}
        </button>
      </div>

      {/* Reason Dialog */}
      {showReasonDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {pendingAction === "grant" ? "Grant Permission" : "Revoke Permission"}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {pendingAction === "grant"
                    ? `Grant ${action} on ${objectName} to this user?`
                    : `Remove ${action} override on ${objectName}?`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this change is being made..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowReasonDialog(false);
                    setReason("");
                    setPendingAction(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    pendingAction === "grant"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
