'use client';

import { CheckCircle2, XCircle, Shield } from 'lucide-react';

interface PermissionBadgeProps {
  source: 'PROFILE' | 'USER_GRANT' | 'USER_DENY';
  granted: boolean;
}

export function PermissionBadge({ source, granted }: PermissionBadgeProps) {
  if (source === 'PROFILE') {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Shield className="h-3.5 w-3.5 text-blue-600" />
        <span className="text-blue-700 font-medium">FROM PROFILE</span>
      </div>
    );
  }

  if (source === 'USER_GRANT') {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
        <span className="text-green-700 font-medium">USER GRANT</span>
      </div>
    );
  }

  if (source === 'USER_DENY') {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <XCircle className="h-3.5 w-3.5 text-red-600" />
        <span className="text-red-700 font-medium">USER DENY</span>
      </div>
    );
  }

  return null;
}
