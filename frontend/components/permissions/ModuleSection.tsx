"use client";

import { ModulePermissions } from "@/lib/api/permissions";
import { ObjectPermissionRow } from "./ObjectPermissionRow";
import { Building2, Users, Briefcase, Settings } from "lucide-react";

interface ModuleSectionProps {
  module: ModulePermissions;
  onGrant: (objectName: string, action: string, reason?: string) => Promise<void>;
  onRevoke: (objectName: string, action: string, reason?: string) => Promise<void>;
  disabled?: boolean;
}

export function ModuleSection({ module, onGrant, onRevoke, disabled = false }: ModuleSectionProps) {
  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case "ADMINISTRATION":
        return <Settings className="h-5 w-5" />;
      case "CRM":
        return <Briefcase className="h-5 w-5" />;
      case "HR":
        return <Users className="h-5 w-5" />;
      case "SETTINGS":
        return <Building2 className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getModuleColor = (moduleName: string) => {
    switch (moduleName) {
      case "ADMINISTRATION":
        return "from-purple-600 to-purple-700";
      case "CRM":
        return "from-blue-600 to-blue-700";
      case "HR":
        return "from-green-600 to-green-700";
      case "SETTINGS":
        return "from-gray-600 to-gray-700";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div
        className={`bg-gradient-to-r ${getModuleColor(module.moduleName)} rounded-lg px-6 py-4 text-white`}
      >
        <div className="flex items-center gap-3">
          {getModuleIcon(module.moduleName)}
          <div>
            <h3 className="text-lg font-bold">{module.displayName}</h3>
            <p className="text-sm text-white/80">
              {module.objects.length} object{module.objects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Objects */}
      <div className="space-y-3">
        {module.objects.map((object) => (
          <ObjectPermissionRow
            key={object.objectName}
            object={object}
            onGrant={onGrant}
            onRevoke={onRevoke}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
