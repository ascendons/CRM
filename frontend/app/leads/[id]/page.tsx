"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { leadsService } from "@/lib/leads";
import { proposalsService } from "@/lib/proposals";
import {
  Lead,
  LeadStatus,
  getLeadStatusColor,
  getLeadGradeColor,
  formatLeadName,
  formatCompanySize,
} from "@/types/lead";
import {
  ProposalResponse,
  ProposalSource,
  getProposalStatusLabel,
  getProposalStatusColor,
} from "@/types/proposal";
import { showToast } from "@/lib/toast";
import ConfirmModal from "@/components/ConfirmModal";
import { AssignLeadModal } from "@/components/leads/AssignLeadModal";
import { UserPlus } from "lucide-react";

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>(LeadStatus.NEW);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  useEffect(() => {
    loadLead();
    loadProposals();
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeadById(id);
      setLead(data);
      setNewStatus(data.leadStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async () => {
    try {
      setProposalsLoading(true);
      const data = await proposalsService.getProposalsBySource(ProposalSource.LEAD, id);
      if ('content' in data) {
        setProposals(data.content);
      } else {
        setProposals(data || []);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!lead) return;

    try {
      setUpdating(true);
      const updated = await leadsService.updateLeadStatus(lead.id, newStatus);
      setLead(updated);
      setShowStatusModal(false);
      showToast.success("Lead status updated successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update status";
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertClick = () => {
    if (!lead) return;

    if (lead.leadStatus !== LeadStatus.QUALIFIED) {
      showToast.warning("Only qualified leads can be converted");
      return;
    }

    setShowConvertModal(true);
  };

  const handleConvertConfirm = async () => {
    if (!lead) return;

    try {
      setUpdating(true);
      const converted = await leadsService.convertLead(lead.id);
      setLead(converted);
      setShowConvertModal(false);
      showToast.success("Lead converted successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to convert lead";
      showToast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!lead) return;

    try {
      setUpdating(true);
      await leadsService.deleteLead(lead.id);
      showToast.success("Lead deleted successfully");
      router.push("/leads");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete lead";
      showToast.error(errorMessage);
      setUpdating(false);
      setShowDeleteModal(false);
    }
  };

  const handleAssignSuccess = async () => {
    await loadLead();
    setShowAssignModal(false);
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
          <p className="text-red-600 mb-4">{error || "Lead not found"}</p>
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
                <h1 className="text-3xl font-bold text-gray-900">{formatLeadName(lead)}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getLeadStatusColor(
                    lead.leadStatus
                  )}`}
                >
                  {lead.leadStatus.replace("_", " ")}
                </span>
                <span
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold ${getLeadGradeColor(
                    lead.leadGrade || "D"
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
              <Link
                href={`/leads/${lead.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </Link>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Change Status
              </button>
              {lead.leadStatus === LeadStatus.QUALIFIED && (
                <button
                  onClick={handleConvertClick}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                >
                  Convert to Opportunity
                </button>
              )}
              <button
                onClick={handleDeleteClick}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.companyName}</dd>
                </div>
                {lead.industry && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Industry</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.industry.replace("_", " ")}
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
                    <dt className="text-sm font-medium text-gray-500">Number of Employees</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.numberOfEmployees.toLocaleString()}
                    </dd>
                  </div>
                )}
                {lead.annualRevenue && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Annual Revenue</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ₹{lead.annualRevenue.toLocaleString()}
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
                  <div>{[lead.city, lead.state, lead.postalCode].filter(Boolean).join(", ")}</div>
                  {lead.country && <div>{lead.country}</div>}
                </address>
              </div>
            )}

            {/* Description */}
            {lead.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description / Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.description}</p>
              </div>
            )}

            {/* Proposals */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Proposals</h2>
                <Link
                  href={`/proposals/new?source=LEAD&sourceId=${id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  + Create Proposal
                </Link>
              </div>

              {proposalsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No proposals yet</p>
                  <Link
                    href={`/proposals/new?source=LEAD&sourceId=${id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                  >
                    Create your first proposal
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Proposal #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Valid Until
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {proposals.map((proposal) => (
                        <tr key={proposal.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            <Link href={`/proposals/${proposal.id}`}>
                              {proposal.proposalNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {proposal.title}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{proposal.totalAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getProposalStatusColor(
                                proposal.status
                              )}-100 text-${getProposalStatusColor(proposal.status)}-800`}
                            >
                              {getProposalStatusLabel(proposal.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(proposal.validUntil).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/proposals/${proposal.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
                      lead.leadGrade || "D"
                    )}`}
                  >
                    {lead.leadScore || 0}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Grade: {lead.leadGrade || "D"}</p>
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

            {/* Assigned Sales Person */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Assigned To</h2>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                  title={lead.assignedUserName ? "Reassign lead" : "Assign lead"}
                >
                  <UserPlus className="h-4 w-4" />
                  {lead.assignedUserName ? "Reassign" : "Assign"}
                </button>
              </div>
              {lead.assignedUserName ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-700 font-bold text-lg shadow-sm">
                      {lead.assignedUserName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{lead.assignedUserName}</p>
                      <p className="text-xs text-gray-500">Sales Representative</p>
                    </div>
                  </div>
                  {lead.assignedAt && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Assigned on {new Date(lead.assignedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <UserPlus className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No sales person assigned</p>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Assign Now
                  </button>
                </div>
              )}
            </div>

            {/* Lead Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h2>
              <dl className="space-y-3">
                {lead.leadSource && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Source</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.leadSource.replace("_", " ")}
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
                    <dt className="text-sm font-medium text-gray-500">Expected Revenue</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ₹{lead.expectedRevenue.toLocaleString()}
                    </dd>
                  </div>
                )}
                {lead.expectedCloseDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Expected Close Date</dt>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Lead Status</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(LeadStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
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
                {updating ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Confirmation Modal */}
      <ConfirmModal
        isOpen={showConvertModal}
        title="Convert Lead"
        message="Are you sure you want to convert this lead to a contact and account? This will create new contact and account records."
        confirmLabel="Convert"
        cancelLabel="Cancel"
        confirmButtonClass="bg-green-600 hover:bg-green-700"
        onConfirm={handleConvertConfirm}
        onCancel={() => setShowConvertModal(false)}
        isLoading={updating}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={updating}
      />

      {/* Assign Lead Modal */}
      {lead && (
        <AssignLeadModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          leadId={lead.id}
          leadName={formatLeadName(lead)}
          currentAssignedUserId={lead.assignedUserId}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}
