'use client';

import { LeaveRequestForm } from '@/components/leaves/LeaveRequestForm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewLeavePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/leaves');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/leaves"
          className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-block"
        >
          ← Back to Leaves
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Apply for Leave</h1>
        <p className="text-gray-600 mt-1">Submit a new leave request for approval</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <LeaveRequestForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Leave requests require manager approval</li>
          <li>• You will receive a notification once your leave is approved or rejected</li>
          <li>• You can cancel pending or approved leaves before the start date</li>
          <li>• Half-day leaves are available for single-day requests</li>
          <li>• Check your leave balance before applying to avoid rejections</li>
        </ul>
      </div>
    </div>
  );
}
