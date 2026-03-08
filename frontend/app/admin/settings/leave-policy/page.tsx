'use client';

import { useEffect, useState } from 'react';
import { leavePolicyApi, LeavePolicy, LeaveTypePolicy } from '@/lib/api/leave-policy';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const LEAVE_TYPES = [
  { key: 'CASUAL', name: 'Casual Leave', color: 'bg-blue-100 text-blue-800' },
  { key: 'SICK', name: 'Sick Leave', color: 'bg-red-100 text-red-800' },
  { key: 'EARNED', name: 'Earned Leave', color: 'bg-green-100 text-green-800' },
  { key: 'PAID', name: 'Paid Leave', color: 'bg-purple-100 text-purple-800' },
  { key: 'UNPAID', name: 'Unpaid Leave', color: 'bg-gray-100 text-gray-800' },
  { key: 'COMPENSATORY', name: 'Comp Off', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'MATERNITY', name: 'Maternity Leave', color: 'bg-pink-100 text-pink-800' },
  { key: 'PATERNITY', name: 'Paternity Leave', color: 'bg-indigo-100 text-indigo-800' },
  { key: 'BEREAVEMENT', name: 'Bereavement Leave', color: 'bg-gray-100 text-gray-800' },
  { key: 'MARRIAGE', name: 'Marriage Leave', color: 'bg-orange-100 text-orange-800' }
];

export default function LeavePolicyPage() {
  const [policy, setPolicy] = useState<LeavePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const data = await leavePolicyApi.getPolicy();
      setPolicy(data);
    } catch (error: any) {
      console.error('Failed to load policy:', error);
      toast.error('Failed to load leave policy');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeaveType = (leaveTypeKey: string, field: keyof LeaveTypePolicy, value: any) => {
    if (!policy) return;

    const updatedPolicy = { ...policy };
    if (!updatedPolicy.leaveTypes[leaveTypeKey]) {
      // Initialize if doesn't exist
      updatedPolicy.leaveTypes[leaveTypeKey] = {
        defaultAllocation: 0,
        isCarryForward: false,
        maxCarryForward: 0,
        minNoticeRequired: 0,
        maxConsecutiveDays: null,
        requiresApproval: true,
        requiresDocuments: false
      };
    }

    updatedPolicy.leaveTypes[leaveTypeKey] = {
      ...updatedPolicy.leaveTypes[leaveTypeKey],
      [field]: value
    };

    setPolicy(updatedPolicy);
  };

  const handleSave = async () => {
    if (!policy) return;

    setSaving(true);
    try {
      await leavePolicyApi.updatePolicy(policy);
      toast.success('Leave policy updated successfully!');
      loadPolicy(); // Reload to get updated timestamps
    } catch (error: any) {
      console.error('Failed to save policy:', error);
      toast.error(error.message || 'Failed to save leave policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Policy</h3>
          <p className="text-red-700">Failed to load leave policy. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Policy Configuration</h1>
          <p className="text-gray-600 mt-1">
            Configure default leave allocations for all users in your organization
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Settings
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900">Important Notes</h3>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Changes apply to new users only. Existing users keep their current balances.</li>
              <li>Set allocation to 0 for leave types that should not be available by default.</li>
              <li>Leave types with 0 allocation will not appear in user balance cards.</li>
              <li>All changes are saved per tenant (organization).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Global Settings */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Global Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Allow Carry Forward</label>
              <p className="text-sm text-gray-600">Enable carrying forward unused leaves to next year</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={policy.allowCarryForward || false}
                onChange={(e) => setPolicy({ ...policy, allowCarryForward: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Pro-rate for New Joiners</label>
              <p className="text-sm text-gray-600">Automatically calculate proportional leaves for mid-year joiners</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={policy.proRateForNewJoiners || false}
                onChange={(e) => setPolicy({ ...policy, proRateForNewJoiners: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Leave Types Configuration */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Leave Types Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">Configure allocation and rules for each leave type</p>
        </div>

        <div className="divide-y divide-gray-200">
          {LEAVE_TYPES.map((leaveType) => {
            const typePolicy = policy.leaveTypes[leaveType.key] || {
              defaultAllocation: 0,
              isCarryForward: false,
              maxCarryForward: 0,
              minNoticeRequired: 0,
              maxConsecutiveDays: null,
              requiresApproval: true,
              requiresDocuments: false
            };

            return (
              <div key={leaveType.key} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${leaveType.color}`}>
                      {leaveType.name}
                    </span>
                    {typePolicy.defaultAllocation === 0 && (
                      <span className="text-xs text-gray-500">(Disabled)</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Default Allocation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Allocation (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={typePolicy.defaultAllocation}
                      onChange={(e) => handleUpdateLeaveType(leaveType.key, 'defaultAllocation', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Min Notice Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Notice (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={typePolicy.minNoticeRequired}
                      onChange={(e) => handleUpdateLeaveType(leaveType.key, 'minNoticeRequired', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Max Consecutive Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Consecutive (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="No limit"
                      value={typePolicy.maxConsecutiveDays || ''}
                      onChange={(e) => handleUpdateLeaveType(leaveType.key, 'maxConsecutiveDays', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Max Carry Forward */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Carry Forward (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={typePolicy.maxCarryForward}
                      onChange={(e) => handleUpdateLeaveType(leaveType.key, 'maxCarryForward', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!typePolicy.isCarryForward}
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typePolicy.isCarryForward}
                      onChange={(e) => handleUpdateLeaveType(leaveType.key, 'isCarryForward', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Allow Carry Forward</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typePolicy.requiresApproval}
                      onChange={(e) => handleUpdateLeaveType(leaveType.key, 'requiresApproval', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Requires Approval</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typePolicy.requiresDocuments}
                      onChange={(e) => handleUpdateLeaveType(leaveType.key, 'requiresDocuments', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Requires Documents</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={loadPolicy}
          disabled={saving}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset Changes
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
      </div>

      {/* Metadata */}
      {policy.lastModifiedAt && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>
            Last updated: {new Date(policy.lastModifiedAt).toLocaleString()}
            {policy.lastModifiedBy && ` by ${policy.lastModifiedBy}`}
          </p>
        </div>
      )}
    </div>
  );
}
