"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ObjectPermissions } from "@/lib/api/permissions";
import { PermissionToggle } from "./PermissionToggle";

interface ObjectPermissionRowProps {
  object: ObjectPermissions;
  onGrant: (objectName: string, action: string, reason?: string) => Promise<void>;
  onRevoke: (objectName: string, action: string, reason?: string) => Promise<void>;
  disabled?: boolean;
}

export function ObjectPermissionRow({
  object,
  onGrant,
  onRevoke,
  disabled = false,
}: ObjectPermissionRowProps) {
  const [expanded, setExpanded] = useState(false);

  // Count granted permissions
  const grantedCount = Object.values(object.permissions).filter((p) => p.granted).length;
  const totalCount = Object.keys(object.permissions).length;
  const hasOverrides = Object.values(object.permissions).some((p) => p.isOverride);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
          <div className="text-left">
            <h4 className="text-sm font-semibold text-gray-900">{object.displayName}</h4>
            <p className="text-xs text-gray-500">
              {grantedCount} of {totalCount} permissions granted
              {hasOverrides && <span className="text-blue-600 ml-2">• Has overrides</span>}
            </p>
          </div>
        </div>

        {/* Quick status indicator */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(grantedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {Math.round((grantedCount / totalCount) * 100)}%
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="bg-gray-50 px-4 py-3 space-y-1">
          {Object.entries(object.permissions).map(([action, permission]) => (
            <PermissionToggle
              key={action}
              objectName={object.objectName}
              action={action}
              permission={permission}
              onGrant={onGrant}
              onRevoke={onRevoke}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
