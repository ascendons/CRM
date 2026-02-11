"use client";

import { useEffect, useState } from "react";
import { AdminRoute } from "@/components/AdminRoute";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Save, RefreshCw, Settings2 } from "lucide-react";
import {
  AssignmentStrategy,
  LeadAssignmentConfig,
  UpdateLeadAssignmentConfigRequest,
  getStrategyDisplayName,
  getStrategyDescription,
} from "@/types/leadAssignment";
import { leadAssignmentService } from "@/lib/leadAssignment";
import { rolesService } from "@/lib/roles";
import type { RoleResponse } from "@/types/role";

export default function LeadAssignmentConfigPage() {
  return (
    <AdminRoute>
      <LeadAssignmentConfigContent />
    </AdminRoute>
  );
}

function LeadAssignmentConfigContent() {
  const [config, setConfig] = useState<LeadAssignmentConfig | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<AssignmentStrategy>(AssignmentStrategy.ROUND_ROBIN);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, rolesData] = await Promise.all([
        leadAssignmentService.getConfiguration(),
        rolesService.getAllRoles(true), // Get only active roles
      ]);

      setConfig(configData);
      setRoles(rolesData);

      // Set form state from config
      setSelectedRoleIds(configData.eligibleRoles.map((r) => r.roleId));
      setStrategy(configData.strategy);
      setEnabled(configData.enabled);
    } catch (error: any) {
      console.error("Failed to load configuration:", error);
      toast.error(error.message || "Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    if (selectedRoleIds.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    setSaving(true);
    try {
      const request: UpdateLeadAssignmentConfigRequest = {
        eligibleRoleIds: selectedRoleIds,
        strategy,
        enabled,
      };

      await leadAssignmentService.updateConfiguration(request);
      toast.success("Configuration updated successfully");
      await loadData(); // Reload to get updated config
    } catch (error: any) {
      console.error("Failed to save configuration:", error);
      toast.error(error.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setSelectedRoleIds(config.eligibleRoles.map((r) => r.roleId));
      setStrategy(config.strategy);
      setEnabled(config.enabled);
      toast.success("Form reset to saved configuration");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Lead Auto-Assignment Configuration</h1>
        </div>
        <p className="text-gray-600">
          Configure which roles are eligible for automatic lead assignment and choose the assignment strategy.
        </p>
      </div>

      {/* Configuration Form */}
      <div className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Auto-Assignment Status</h2>
              <p className="text-sm text-gray-600 mt-1">
                {enabled
                  ? "New leads will be automatically assigned to eligible users"
                  : "Auto-assignment is disabled. Leads must be assigned manually."}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Assignment Strategy */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Strategy</h2>
          <div className="space-y-3">
            {Object.values(AssignmentStrategy).map((strategyOption) => (
              <label
                key={strategyOption}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  strategy === strategyOption
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value={strategyOption}
                  checked={strategy === strategyOption}
                  onChange={(e) => setStrategy(e.target.value as AssignmentStrategy)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{getStrategyDisplayName(strategyOption)}</div>
                  <div className="text-sm text-gray-600 mt-1">{getStrategyDescription(strategyOption)}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Eligible Roles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Eligible Roles</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select which roles are eligible to receive auto-assigned leads. Only active users with these roles will be included in the assignment rotation.
          </p>

          {roles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No roles available. Please create roles first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedRoleIds.includes(role.roleId)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.roleId)}
                    onChange={() => handleRoleToggle(role.roleId)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{role.roleName}</span>
                        {role.description && (
                          <span className="text-sm text-gray-600 ml-2">– {role.description}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{role.roleId}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <Button
            variant="default"
            onClick={handleSave}
            disabled={saving || selectedRoleIds.length === 0}
            className="inline-flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>

        {/* Current Configuration Info */}
        {config && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>{" "}
                <span className={`font-medium ${config.enabled ? "text-green-600" : "text-red-600"}`}>
                  {config.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Strategy:</span>{" "}
                <span className="font-medium text-gray-900">{getStrategyDisplayName(config.strategy)}</span>
              </div>
              <div>
                <span className="text-gray-600">Eligible Roles:</span>{" "}
                <span className="font-medium text-gray-900">{config.eligibleRoles.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Last Modified:</span>{" "}
                <span className="font-medium text-gray-900">
                  {new Date(config.lastModifiedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
