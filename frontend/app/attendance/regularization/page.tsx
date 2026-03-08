'use client';

import { useEffect, useState } from 'react';
import { regularizationApi, RegularizationResponse } from '@/lib/api/regularization';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function RegularizationPage() {
  const [regularizations, setRegularizations] = useState<RegularizationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRegularizations = async () => {
    try {
      const data = await regularizationApi.getMyRegularizations();
      setRegularizations(data || []);
    } catch (error) {
      console.error('Failed to load regularizations:', error);
      toast.error('Failed to load regularizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegularizations();
  }, []);

  const getStatusBadge = (status: string) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'AUTO_APPROVED': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeName = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Regularization</h1>
          <p className="text-gray-600 mt-1">Request corrections for missed or incorrect attendance records</p>
        </div>
        <Link
          href="/attendance/regularization/new"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          New Request
        </Link>
      </div>

      {/* Regularization List */}
      {regularizations.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Regularization Requests</h3>
          <p className="text-gray-600 mb-6">You haven't submitted any regularization requests yet.</p>
          <Link
            href="/attendance/regularization/new"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Create Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {regularizations.map((reg) => (
            <div key={reg.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{reg.regularizationId}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(reg.attendanceDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(reg.status)}`}>
                  {reg.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="text-sm font-medium text-gray-900">{getTypeName(reg.type)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Submitted</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{reg.reason}</p>
              </div>

              {reg.status === 'APPROVED' && reg.approverName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-900">
                    Approved by {reg.approverName}
                  </p>
                  {reg.approvalNotes && (
                    <p className="text-sm text-green-800 mt-1">{reg.approvalNotes}</p>
                  )}
                </div>
              )}

              {reg.status === 'REJECTED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-900">Rejected</p>
                  {reg.rejectionReason && (
                    <p className="text-sm text-red-800 mt-1">{reg.rejectionReason}</p>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/attendance/regularization/${reg.regularizationId}`}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
