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
import { UserPlus, MessageSquare, FileText, CheckSquare } from "lucide-react";
import { useLeadStatusChange } from "@/hooks/useLeadStatusChange";
import { LogActivityModal } from "@/components/leads/LogActivityModal";
import { EntityActivities } from "@/components/common/EntityActivities";
import { activitiesService } from "@/lib/activities";
import { Activity, ActivityType, ActivityStatus } from "@/types/activity";
import { ProposalStatus } from "@/types/proposal";
import { NegotiationStartModal } from "@/components/proposals/NegotiationStartModal";
import ProposalComments from "@/components/proposals/ProposalComments";
import CommercialNegotiation from "@/components/proposals/CommercialNegotiation";
import { Gavel } from "lucide-react";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'details' | 'proposals' | 'discussion' | 'negotiation'>('details');

  // Activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Status Change Hook
  const {
    handleStatusChangeRequest,
    isActivityModalOpen,
    pendingStatusChange,
    handleActivitySave,
    handleModalClose,
    getModalProps
  } = useLeadStatusChange({
    onStatusChange: async (leadId, newStatus) => {
      if (lead) {
        setLead({ ...lead, leadStatus: newStatus });

        // Handle CONVERTED status - update proposals to ACCEPTED
        if (newStatus === LeadStatus.CONVERTED) {
          try {
            // Find all proposals for this lead and update to ACCEPTED
            const activeProposal = getActiveProposal();
            if (activeProposal) {
              await proposalsService.updateProposal(activeProposal.id, {
                status: ProposalStatus.ACCEPTED
              });
              showToast.success("Proposal marked as accepted");
            }
            // Reload proposals to reflect status change
            await loadProposals();

            // Navigate to opportunities (or to the specific opportunity if ID is available)
            // Since convertLead API might return opportunity ID in the future,
            // for now we navigate to the opportunities list
            setTimeout(() => {
              router.push('/opportunities');
            }, 1500);
          } catch (error) {
            console.error("Failed to update proposal status", error);
          }
        }
      }
    }
  });

  useEffect(() => {
    loadLead();
    loadProposals();
    loadActivities();
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

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const data = await activitiesService.getActivitiesByLead(id);
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const getActiveProposal = () => {
    // Find the proposal that is currently in negotiation or the last sent proposal
    const negotiationProposal = proposals.find(p => p.status === ProposalStatus.NEGOTIATION);
    if (negotiationProposal) return negotiationProposal;

    // Sort by created date desc to get latest
    const sentProposals = proposals
      .filter(p => p.status === ProposalStatus.SENT)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return sentProposals[0];
  };

  const onActivitySaved = async (data: any) => {
    await handleActivitySave(data);
    await loadActivities(); // Reload activities after save
  };

  const handleStatusUpdate = () => {
    if (!lead) return;
    handleStatusChangeRequest(lead.id, newStatus, lead.leadStatus);
    setShowStatusModal(false);
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`${activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <FileText className="h-4 w-4" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`${activeTab === 'proposals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <CheckSquare className="h-4 w-4" />
              Proposals
              <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">
                {proposals.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('discussion')}
              className={`${activeTab === 'discussion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <MessageSquare className="h-4 w-4" />
              Discussion
              <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">
                {activities.length}
              </span>
            </button>
            {lead && lead.leadStatus === LeadStatus.NEGOTIATION && (
              <button
                onClick={() => setActiveTab('negotiation')}
                className={`${activeTab === 'negotiation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Gavel className="h-4 w-4" />
                Negotiation
              </button>
            )}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {activeTab === 'details' && (
              <>
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

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Description / Notes</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.description}</p>
                </div>
              </>
            )}

            {activeTab === 'proposals' && (
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
            )}

            {activeTab === 'discussion' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Discussion & Activities</h2>
                </div>
                <EntityActivities
                  entityId={id}
                  entityType="LEAD"
                  activities={activities}
                  loading={activitiesLoading}
                  onActivityChanged={loadActivities}
                />
              </div>
            )}

            {activeTab === 'negotiation' && lead?.leadStatus === LeadStatus.NEGOTIATION && (
              <div className="space-y-6">
                {(() => {
                  const activeProposal = getActiveProposal();
                  if (!activeProposal) {
                    return (
                      <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500 mb-4">No active proposal found for negotiation.</p>
                        <p className="text-sm text-gray-400">Please ensure there is a SENT proposal to negotiate on.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-6">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <h3 className="text-sm font-semibold text-purple-900">
                          Active Negotiation: {activeProposal.proposalNumber}
                        </h3>
                        <p className="text-sm text-purple-700 mt-1">
                          You are currently negotiating proposal <strong>{activeProposal.title}</strong> worth <strong>₹{activeProposal.totalAmount.toLocaleString()}</strong>.
                        </p>
                      </div>

                      {/* Commercial Negotiation */}
                      <CommercialNegotiation proposal={activeProposal} onUpdate={() => {
                        loadProposals();
                        // Also reload lead to update status if finalized
                        if (activeProposal.status === ProposalStatus.SENT) {
                          loadLead();
                        }
                      }} />

                      {/* Technical Negotiation (Comments) */}
                      <ProposalComments proposal={activeProposal} />
                    </div>
                  );
                })()}
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

      {/* Activity Log Modal (triggered by status change hook) */}
      {pendingStatusChange && (
        pendingStatusChange.newStatus === LeadStatus.NEGOTIATION ? (
          <NegotiationStartModal
            isOpen={isActivityModalOpen}
            onClose={handleModalClose}
            onConfirm={async (reason) => {
              try {
                setUpdating(true);
                // 1. Find active proposal & Update its status
                const activeProposal = getActiveProposal();
                if (activeProposal) {
                  await proposalsService.updateProposal(activeProposal.id, {
                    status: ProposalStatus.NEGOTIATION,
                    notes: activeProposal.notes ? `${activeProposal.notes}\n\nNegotiation Started: ${reason}` : `Negotiation Started: ${reason}`
                  });
                }

                // 2. Update Lead status via handleActivitySave (which logs activity & updates status)
                await handleActivitySave({
                  leadId: pendingStatusChange.leadId,
                  type: ActivityType.NOTE,
                  status: ActivityStatus.COMPLETED,
                  subject: activeProposal ? `Negotiation Started - ${activeProposal.proposalNumber}` : 'Negotiation Started',
                  description: reason,
                });

                // Refresh data
                loadProposals();
                setActiveTab('negotiation');
              } catch (error) {
                console.error("Failed to start negotiation", error);
                showToast.error("Failed to start negotiation");
              } finally {
                setUpdating(false);
              }
            }}
            isLoading={updating}
          />
        ) : (
          <LogActivityModal
            isOpen={isActivityModalOpen}
            onClose={handleModalClose}
            onSave={onActivitySaved}
            leadId={pendingStatusChange.leadId}
            newStatus={pendingStatusChange.newStatus}
            {...getModalProps()}
          />
        )
      )}
    </div>
  );
}
