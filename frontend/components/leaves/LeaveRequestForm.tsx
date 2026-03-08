'use client';

import { useState } from 'react';
import { CreateLeaveRequest, leavesApi } from '@/lib/api/leaves';
import { toast } from 'react-hot-toast';

interface LeaveRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeaveRequestForm({ onSuccess, onCancel }: LeaveRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateLeaveRequest>({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false
  });

  const leaveTypes = [
    { value: 'SICK', label: 'Sick Leave' },
    { value: 'CASUAL', label: 'Casual Leave' },
    { value: 'EARNED', label: 'Earned Leave' },
    { value: 'PAID', label: 'Paid Leave' },
    { value: 'COMPENSATORY', label: 'Comp Off' },
    { value: 'MARRIAGE', label: 'Marriage Leave' },
    { value: 'BEREAVEMENT', label: 'Bereavement Leave' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await leavesApi.applyLeave(formData);
      toast.success('Leave request submitted successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Leave request error:', error);
      toast.error(error.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateLeaveRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Leave Type *
        </label>
        <select
          value={formData.leaveType}
          onChange={(e) => handleChange('leaveType', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          {leaveTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Half Day Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isHalfDay"
          checked={formData.isHalfDay || false}
          onChange={(e) => {
            handleChange('isHalfDay', e.target.checked);
            if (e.target.checked) {
              handleChange('endDate', formData.startDate);
            }
          }}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isHalfDay" className="ml-2 text-sm text-gray-700">
          This is a half-day leave
        </label>
      </div>

      {/* Half Day Type */}
      {formData.isHalfDay && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Half Day Type *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="halfDayType"
                value="FIRST_HALF"
                checked={formData.halfDayType === 'FIRST_HALF'}
                onChange={(e) => handleChange('halfDayType', e.target.value)}
                className="w-4 h-4 text-blue-600"
                required
              />
              <span className="ml-2 text-sm text-gray-700">First Half (Morning)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="halfDayType"
                value="SECOND_HALF"
                checked={formData.halfDayType === 'SECOND_HALF'}
                onChange={(e) => handleChange('halfDayType', e.target.value)}
                className="w-4 h-4 text-blue-600"
                required
              />
              <span className="ml-2 text-sm text-gray-700">Second Half (Afternoon)</span>
            </label>
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => {
              handleChange('startDate', e.target.value);
              if (formData.isHalfDay) {
                handleChange('endDate', e.target.value);
              }
            }}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            min={formData.startDate || new Date().toISOString().split('T')[0]}
            disabled={formData.isHalfDay}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            required
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason *
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) => handleChange('reason', e.target.value)}
          rows={4}
          minLength={10}
          maxLength={1000}
          placeholder="Please provide a reason for your leave request (minimum 10 characters)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.reason.length}/1000 characters
        </p>
      </div>

      {/* Emergency Leave Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isEmergencyLeave"
          checked={formData.isEmergencyLeave || false}
          onChange={(e) => handleChange('isEmergencyLeave', e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isEmergencyLeave" className="ml-2 text-sm text-gray-700">
          This is an emergency leave
        </label>
      </div>

      {/* Emergency Contact */}
      {formData.isEmergencyLeave && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Contact Number
          </label>
          <input
            type="tel"
            value={formData.emergencyContactNumber || ''}
            onChange={(e) => handleChange('emergencyContactNumber', e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Contact During Leave */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Number During Leave (Optional)
        </label>
        <input
          type="tel"
          value={formData.contactNumberDuringLeave || ''}
          onChange={(e) => handleChange('contactNumberDuringLeave', e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
