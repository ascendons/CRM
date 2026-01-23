'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { leadsService } from '@/lib/leads';
import {
  Lead,
  LeadStatus,
  getLeadStatusColor,
  getLeadGradeColor,
  formatLeadName,
  formatCompanySize,
} from '@/types/lead';

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>(LeadStatus.NEW);

  useEffect(() => {
    loadLead();
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeadById(id);
      setLead(data);
      setNewStatus(data.leadStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!lead) return;

    try {
      setUpdating(true);
      const updated = await leadsService.updateLeadStatus(lead.id, newStatus);
      setLead(updated);
      setShowStatusModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleConvert = async () => {
    if (!lead) return;

    if (lead.leadStatus !== LeadStatus.QUALIFIED) {
      alert('Only qualified leads can be converted');
      return;
    }

    if (confirm('Are you sure you want to convert this lead to an opportunity?')) {
      try {
        setUpdating(true);
        const converted = await leadsService.convertLead(lead.id);
        setLead(converted);
        alert('Lead converted successfully!');
      } catch (err: any) {
        alert(err.message || 'Failed to convert lead');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!lead) return;

    if (confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        setUpdating(true);
        await leadsService.deleteLead(lead.id);
        router.push('/leads');
      } catch (err: any) {
        alert(err.message || 'Failed to delete lead');
        setUpdating(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Lead not found'}</p>
          <Link href="/leads" className="text-blue-600 hover:underline">
            ← Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {formatLeadName(lead)}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getLeadStatusColor(
                    lead.leadStatus
                  )}`}
                >
                  {lead.leadStatus.replace('_', ' ')}
                </span>
                <span
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold ${getLeadGradeColor(
                    lead.leadGrade || 'D'
                  )}`}
                >
                  {lead.leadGrade}
                </span>
              </div>
              <p className="mt-2 text-gray-600">{lead.companyName}</p>
              <p className="text-sm text-gray-500">{lead.leadId}</p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/leads"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </Link>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Change Status
              </button>
              {lead.leadStatus === LeadStatus.QUALIFIED && (
                <button
                  onClick={handleConvert}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                >
                  Convert to Opportunity
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                      {lead.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                      {lead.phone}
                    </a>
                  </dd>
                </div>
                {lead.jobTitle && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.jobTitle}</dd>
                  </div>
                )}
                {lead.department && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.department}</dd>
                  </div>
                )}
                {lead.linkedInProfile && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a
                        href={lead.linkedInProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Profile
                      </a>
                    </dd>
                  </div>
                )}
                {lead.website && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {lead.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Company Information
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.companyName}</dd>
                </div>
                {lead.industry && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Industry</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.industry.replace('_', ' ')}
                    </dd>
                  </div>
                )}
                {lead.companySize && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCompanySize(lead.companySize)}
                    </dd>
                  </div>
                )}
                {lead.numberOfEmployees && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Number of Employees
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.numberOfEmployees.toLocaleString()}
                    </dd>
                  </div>
                )}
                {lead.annualRevenue && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Annual Revenue</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ${lead.annualRevenue.toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Address */}
            {(lead.country || lead.state || lead.city) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
                <address className="text-sm text-gray-900 not-italic">
                  {lead.streetAddress && <div>{lead.streetAddress}</div>}
                  <div>
                    {[lead.city, lead.state, lead.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  {lead.country && <div>{lead.country}</div>}
                </address>
              </div>
            )}

            {/* Description */}
            {lead.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Description / Notes
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {lead.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lead Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Score</h2>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div
                    className={`w-24 h-24 flex items-center justify-center rounded-full text-4xl font-bold ${getLeadGradeColor(
                      lead.leadGrade || 'D'
                    )}`}
                  >
                    {lead.leadScore || 0}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Grade: {lead.leadGrade || 'D'}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Demographic Score:</span>
                  <span className="font-medium">{lead.demographicScore || 0} / 40</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Behavioral Score:</span>
                  <span className="font-medium">{lead.behavioralScore || 0} / 60</span>
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h2>
              <dl className="space-y-3">
                {lead.leadSource && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Source</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.leadSource.replace('_', ' ')}
                    </dd>
                  </div>
                )}
                {lead.leadOwnerName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Owner</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.leadOwnerName}</dd>
                  </div>
                )}
                {lead.expectedRevenue && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Expected Revenue
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ${lead.expectedRevenue.toLocaleString()}
                    </dd>
                  </div>
                )}
                {lead.expectedCloseDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Expected Close Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(lead.expectedCloseDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(lead.createdAt).toLocaleString()}
                  </dd>
                </div>
                {lead.lastModifiedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(lead.lastModifiedAt).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Lead Status
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(LeadStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={updating}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
