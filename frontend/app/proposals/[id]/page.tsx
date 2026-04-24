"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ProposalResponse,
  ProposalStatus,
  ProposalSource,
  DiscountType,
  getProposalStatusColor,
  getProposalStatusLabel,
} from "@/types/proposal";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  X,
} from "lucide-react";
import { proposalsService } from "@/lib/proposals";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import ConfirmModal from "@/components/ConfirmModal";
import { AuditLogTimeline } from "@/components/common/AuditLogTimeline";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { usersService } from "@/lib/users";
import { UserResponse } from "@/types/user";
import ProposalComments from "@/components/proposals/ProposalComments";
import CommercialNegotiation from "@/components/proposals/CommercialNegotiation";
import { MessageSquare, Gavel, History } from "lucide-react";
import ProposalVersionHistory from "@/components/proposals/ProposalVersionHistory";
import InvoicePreviewModal from "@/components/proposals/InvoicePreviewModal";
import ProposalVersionDiff from "@/components/proposals/ProposalVersionDiff";
import ProposalSnapshotModal from "@/components/proposals/ProposalSnapshotModal";
import DocumentTimeline from "@/components/proposals/DocumentTimeline";
import { ProposalVersionResponse } from "@/types/proposal-version";

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [proposal, setProposal] = useState<ProposalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedMilestones, setSelectedMilestones] = useState<any[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = authService.getUser();
    console.log("[ProposalDetailPage] Current user from authService:", user);
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (proposal && currentUser) {
      const isApp = checkIsApprover();
      console.log("[ProposalDetailPage] Visibility Debug:", {
        status: proposal.status,
        isApprover: isApp,
        approverIds: proposal.approverIds,
        currentUserId: currentUser.userId,
        currentId: currentUser.id,
        userRole: currentUser.role,
      });
    }
  }, [proposal, currentUser]);

  const checkIsApprover = () => {
    if (!proposal || !currentUser) return false;

    // Admin/Manager bypass
    if (currentUser.role === "ADMIN" || currentUser.role === "MANAGER") return true;

    const approverIds = proposal.approverIds || [];
    const myId = currentUser.userId || currentUser.id;

    // Match by ID
    if (myId && approverIds.includes(myId)) return true;

    return false;
  };

  // Negotiation state
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationReason, setNegotiationReason] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "technical" | "commercial" | "history">(
    "details"
  );

  // Versioning state
  const [selectedVersion, setSelectedVersion] = useState<ProposalVersionResponse | null>(null);
  const [comparison, setComparison] = useState<{
    v1: ProposalVersionResponse;
    v2: ProposalVersionResponse;
  } | null>(null);

  // Preview state
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Switch to correct tab if in negotiation
  useEffect(() => {
    if (proposal?.status === ProposalStatus.NEGOTIATION && activeTab === "details") {
      // Optional: Default to technical on load? Or keep details.
      // Let's keep detail as default, but user can switch.
    }
  }, [proposal?.status]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      const data = await proposalsService.getProposalById(id);
      setProposal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load proposal");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!proposal) return;
    try {
      setActionLoading(true);
      await proposalsService.sendProposal(proposal.id);
      showToast.success("Proposal sent successfully");
      loadProposal();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to send proposal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!proposal) return;
    try {
      setActionLoading(true);
      await proposalsService.acceptProposal(proposal.id);
      showToast.success("Proposal accepted successfully");
      loadProposal();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to accept proposal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!proposal || !rejectionReason.trim()) {
      showToast.error("Please provide a rejection reason");
      return;
    }
    try {
      setActionLoading(true);
      await proposalsService.rejectProposal(proposal.id, rejectionReason);
      showToast.success("Proposal rejected");
      setShowRejectModal(false);
      setRejectionReason("");
      loadProposal();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to reject proposal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenApprovalModal = async () => {
    console.log("[ProposalDetailPage] handleOpenApprovalModal called");
    try {
      setActionLoading(true);
      console.log("[ProposalDetailPage] Fetching active users...");
      const users = await usersService.getActiveUsers();
      console.log("[ProposalDetailPage] Users fetched:", users);

      const usersArray = Array.isArray(users) ? users : [];
      setAvailableUsers(usersArray);

      const initialApprovers = proposal?.approverIds || [];
      console.log("[ProposalDetailPage] Initial approvers:", initialApprovers);
      setSelectedApprovers(initialApprovers);

      console.log("[ProposalDetailPage] Showing approval modal");
      setShowApprovalModal(true);
    } catch (err) {
      console.error("[ProposalDetailPage] Failed to load users for approval:", err);
      showToast.error("Failed to load users for approval");
      setAvailableUsers([]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!proposal) return;
    if (selectedApprovers.length === 0) {
      showToast.error("Please select at least one approver");
      return;
    }
    try {
      setActionLoading(true);
      // First update the approvers
      await proposalsService.updateProposal(proposal.id, { approverIds: selectedApprovers });
      // Then request approval
      await proposalsService.requestApproval(proposal.id);
      showToast.success("Quotation sent for approval");
      setShowApprovalModal(false);
      loadProposal();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to request approval");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!proposal) return;
    try {
      setActionLoading(true);
      await proposalsService.approveProposal(proposal.id);
      showToast.success("Quotation approved");
      loadProposal();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to approve quotation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInternalReject = async () => {
    if (!proposal) return;
    const reason = window.prompt("Please provide a reason for rejection:");
    if (reason === null) return; // User cancelled prompt

    try {
      setActionLoading(true);
      await proposalsService.internalReject(proposal.id, reason);
      showToast.success("Quotation rejected and moved back to draft");
      loadProposal();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to reject quotation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToProforma = async () => {
    if (!proposal) return;
    try {
      setActionLoading(true);
      await proposalsService.convertToProforma(proposal.id, selectedMilestones);
      showToast.success("Quotation converted to Proforma Invoice(s) successfully");
      setShowConvertModal(false);
      loadProposal();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to convert to proforma");
    } finally {
      setActionLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!proposal) return;
    try {
      setActionLoading(true);
      await proposalsService.deleteProposal(proposal.id);
      showToast.success("Proposal deleted successfully");
      router.push("/proposals");
    } catch (err) {
      console.error("Error deleting proposal:", err);
      showToast.error("Failed to delete proposal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartNegotiation = async () => {
    if (!proposal || !negotiationReason.trim()) {
      showToast.error("Please provide a reason for negotiation");
      return;
    }
    try {
      setActionLoading(true);
      // Update status to NEGOTIATION and append reason to notes
      await proposalsService.updateProposal(proposal.id, {
        status: ProposalStatus.NEGOTIATION,
        notes: proposal.notes
          ? `${proposal.notes}\n\nNegotiation Started: ${negotiationReason}`
          : `Negotiation Started: ${negotiationReason}`,
      });

      showToast.success("Proposal moved to Negotiation");
      setShowNegotiationModal(false);
      setNegotiationReason("");
      loadProposal();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to start negotiation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!proposal) return;
    setShowInvoicePreview(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Proposal not found"}</p>
          <Link
            href="/proposals"
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | boolean | undefined | null;
  }) => (
    <div className="py-3 border-b border-gray-200 last:border-0">
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">
        {value !== undefined && value !== null && value !== "" ? String(value) : "-"}
      </dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Document Lifecycle Timeline */}
        <DocumentTimeline
          status={proposal.status}
          isProforma={proposal.isProforma}
          hasBeenConverted={proposal.hasBeenConverted}
          isRejected={proposal.status === ProposalStatus.REJECTED}
        />

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
                <span
                  className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-${getProposalStatusColor(
                    proposal.status
                  )}-100 text-${getProposalStatusColor(proposal.status)}-800`}
                >
                  {getProposalStatusLabel(proposal.status)}
                </span>
              </div>
              <p className="text-gray-600">{proposal.proposalNumber}</p>
              {proposal.isTechnicalQuotation && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 mt-1">
                  Technical Quotation
                </span>
              )}
              {proposal.customerName && (
                <p className="text-gray-600 mt-1">Customer: {proposal.customerName}</p>
              )}

              {proposal.approvedByNames && proposal.approvedByNames.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 shadow-sm">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-lg">
                      Approved by: {proposal.approvedByNames.join(", ")}
                    </span>
                    <p className="text-sm text-green-700 mt-1">
                      This quotation has been officially approved and is ready for the next stage.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={proposal.isProforma ? "/proposals?tab=proforma" : "/proposals"}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                Back
              </Link>
              <button
                onClick={handleDownloadPdf}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {proposal.isProforma ? "Proforma" : "Quotation"}
              </button>

              {proposal.status === ProposalStatus.DRAFT && (
                <>
                  {!proposal.isProforma && (
                    <button
                      onClick={handleOpenApprovalModal}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Request Approval
                    </button>
                  )}
                </>
              )}

              {/* Internal Approval Actions (Hidden for Proforma) */}
              {proposal.status === ProposalStatus.PENDING_APPROVAL && !proposal.isProforma && (
                <div className="flex gap-2">
                  {checkIsApprover() && (
                    <>
                      {!proposal.approvedByIds?.includes(currentUser?.userId || "") && (
                        <button
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve Quotation
                        </button>
                      )}
                      <button
                        onClick={handleInternalReject}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}

              {proposal.status === ProposalStatus.PENDING_ON_CUSTOMER && !proposal.isProforma && (
                <PermissionGuard resource="PROPOSAL" action="SEND">
                  <button
                    onClick={handleSend}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Send to Customer
                  </button>
                </PermissionGuard>
              )}

              {proposal.status !== ProposalStatus.ACCEPTED &&
                proposal.status !== ProposalStatus.REJECTED && (
                  <PermissionGuard resource="PROPOSAL" action="EDIT">
                    <Link
                      href={`/proposals/${proposal.id}/edit`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                  </PermissionGuard>
                )}
              {/* Quotation Specific Actions */}
              {(proposal.status === ProposalStatus.SENT ||
                proposal.status === ProposalStatus.PENDING_ON_CUSTOMER ||
                proposal.status === ProposalStatus.NEGOTIATION) &&
                !proposal.isProforma && (
                  <div className="flex gap-2">
                    <PermissionGuard resource="PROPOSAL" action="APPROVE">
                      <button
                        onClick={handleAccept}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept
                      </button>
                    </PermissionGuard>
                    {proposal.status === ProposalStatus.SENT && (
                      <PermissionGuard resource="PROPOSAL" action="EDIT">
                        <button
                          onClick={() => setShowNegotiationModal(true)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          Negotiate
                        </button>
                      </PermissionGuard>
                    )}
                    <PermissionGuard resource="PROPOSAL" action="REJECT">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </PermissionGuard>
                  </div>
                )}

              {/* Proforma Specific Actions */}
              {proposal.isProforma && (
                <div className="flex gap-2">
                  {proposal.status === ProposalStatus.DRAFT && (
                    <PermissionGuard resource="PROPOSAL" action="SEND">
                      <button
                        onClick={handleSend}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                        Send to Customer
                      </button>
                    </PermissionGuard>
                  )}
                  {proposal.status === ProposalStatus.SENT && (
                    <>
                      <PermissionGuard resource="PROPOSAL" action="APPROVE">
                        <button
                          onClick={handleAccept}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Paid
                        </button>
                      </PermissionGuard>
                    </>
                  )}
                </div>
              )}
              {proposal.status === ProposalStatus.ACCEPTED &&
                !proposal.isProforma &&
                currentUser?.role === "ADMIN" && (
                  <PermissionGuard resource="PROPOSAL" action="UPDATE">
                    <button
                      onClick={() => {
                        setSelectedMilestones([{ name: "Full Payment", percentage: 100 }]);
                        setShowConvertModal(true);
                      }}
                      disabled={actionLoading || proposal.hasBeenConverted}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {proposal.hasBeenConverted ? "Converted to Proforma" : "Convert to Proforma"}
                    </button>
                  </PermissionGuard>
                )}
              <PermissionGuard resource="PROPOSAL" action="DELETE">
                {proposal.isProforma &&
                  proposal.status !== ProposalStatus.VOIDED &&
                  proposal.status !== ProposalStatus.ACCEPTED &&
                  currentUser?.role === "ADMIN" && (
                    <button
                      onClick={async () => {
                        if (
                          !confirm(
                            "Are you sure you want to void this Proforma Invoice? This action cannot be undone."
                          )
                        )
                          return;
                        setActionLoading(true);
                        try {
                          const updatedProposal = await proposalsService.voidProposal(id);
                          setProposal(updatedProposal);
                          showToast.success("Proforma voided successfully.");
                        } catch (error: any) {
                          showToast.error(error.message || "Failed to void.");
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      title="Void this Proforma Invoice"
                    >
                      Void
                    </button>
                  )}
                {proposal.status === ProposalStatus.DRAFT && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Negotiation */}
        {proposal.status === ProposalStatus.NEGOTIATION && (
          <div className="border-b border-gray-200 mb-6 bg-white rounded-lg shadow px-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("details")}
                className={`${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <CheckCircle className="h-4 w-4" />
                Details
              </button>
              <button
                onClick={() => setActiveTab("technical")}
                className={`${
                  activeTab === "technical"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <MessageSquare className="h-4 w-4" />
                Technical Negotiation
              </button>
              <button
                onClick={() => setActiveTab("commercial")}
                className={`${
                  activeTab === "commercial"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Gavel className="h-4 w-4" />
                Place Bid (Commercial)
              </button>
              <button
                onClick={() => {
                  setActiveTab("history");
                  setComparison(null);
                }}
                className={`${
                  activeTab === "history"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <History className="h-4 w-4" />
                Version History
              </button>
            </nav>
          </div>
        )}

        {/* Normal Tabs (when not in negotiation or manually added) */}
        {proposal.status !== ProposalStatus.NEGOTIATION && (
          <div className="border-b border-gray-200 mb-6 bg-white rounded-lg shadow px-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("details")}
                className={`${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <CheckCircle className="h-4 w-4" />
                Details
              </button>
              <button
                onClick={() => {
                  setActiveTab("history");
                  setComparison(null);
                }}
                className={`${
                  activeTab === "history"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <History className="h-4 w-4" />
                Version History
              </button>
            </nav>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns or full width if history/diff */}
          <div
            className={`${activeTab === "history" ? "lg:col-span-3" : "lg:col-span-2"} space-y-6`}
          >
            {activeTab === "history" && !comparison && (
              <ProposalVersionHistory
                proposalId={proposal.id}
                onVersionSelect={(v) => setSelectedVersion(v)}
                onCompareSelect={(v1, v2) => setComparison({ v1, v2 })}
              />
            )}

            {activeTab === "history" && comparison && (
              <ProposalVersionDiff
                version1={comparison.v1}
                version2={comparison.v2}
                onBack={() => setComparison(null)}
              />
            )}

            {activeTab === "technical" && <ProposalComments proposal={proposal} />}

            {activeTab === "commercial" && (
              <CommercialNegotiation proposal={proposal} onUpdate={loadProposal} />
            )}

            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Milestone Progress Visual for Quotations */}
                {!proposal.isProforma && proposal.hasBeenConverted && (
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Billing Progress
                      </h3>
                      <span className="text-sm font-bold text-blue-600">
                        Converted to Proformas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      All milestones have been converted to Proforma Invoices. See "Related
                      Documents" for details.
                    </p>
                  </div>
                )}

                {/* Basic Information */}
                <DetailSection title="Proposal Details">
                  <dl>
                    <DetailRow label="Description" value={proposal.description} />
                    <DetailRow label="Valid Until" value={formatDate(proposal.validUntil)} />
                    <DetailRow label="Owner" value={proposal.ownerName} />
                  </dl>
                </DetailSection>

                {/* Approval Information for Quotations */}
                {!proposal.isProforma && (proposal.approverIds?.length || 0) > 0 && (
                  <DetailSection title="Approval Status">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-sm font-medium text-gray-700">Status</span>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${
                            proposal.status === ProposalStatus.PENDING_APPROVAL
                              ? "bg-amber-100 text-amber-700"
                              : proposal.status === ProposalStatus.PENDING_ON_CUSTOMER
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getProposalStatusLabel(proposal.status)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Approvers
                        </h4>
                        <div className="space-y-2">
                          {proposal.approverIds?.map((approverId) => {
                            const isApproved =
                              proposal.approvedByIds?.includes(approverId) || false;
                            return (
                              <div
                                key={approverId}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-900">User ID: {approverId}</span>
                                {isApproved ? (
                                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                    <CheckCircle className="h-3 w-3" /> Approved
                                  </span>
                                ) : (
                                  <span className="text-amber-500">Pending</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </DetailSection>
                )}

                {/* Source Information */}
                <DetailSection title="Source">
                  <dl>
                    <DetailRow
                      label="Type"
                      value={proposal.source === ProposalSource.LEAD ? "Lead" : "Opportunity"}
                    />
                    <DetailRow label="Name" value={proposal.sourceName} />
                  </dl>
                </DetailSection>

                {/* Address Information */}
                {(proposal.billingAddress || proposal.shippingAddress) && (
                  <DetailSection title="Address Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {proposal.billingAddress && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2">
                            Billing Address
                          </h3>
                          <div className="text-sm text-gray-900 leading-relaxed space-y-1">
                            <p className="font-bold">
                              {proposal.billingAddress.name ||
                                proposal.billingAddress.companyName ||
                                proposal.customerName}
                            </p>
                            {proposal.billingAddress.companyName &&
                              proposal.billingAddress.name && (
                                <p className="text-gray-600">
                                  {proposal.billingAddress.companyName}
                                </p>
                              )}
                            <p className="whitespace-pre-line text-gray-700">
                              {proposal.billingAddress.street &&
                                `${proposal.billingAddress.street}\n`}
                              {proposal.billingAddress.city}
                              {proposal.billingAddress.state &&
                                `, ${proposal.billingAddress.state}`}
                              {proposal.billingAddress.postalCode &&
                                ` - ${proposal.billingAddress.postalCode}`}
                              {proposal.billingAddress.country &&
                                `\n${proposal.billingAddress.country}`}
                            </p>
                            <div className="pt-2 text-xs space-y-1">
                              {(proposal.billingAddress.email || proposal.customerEmail) && (
                                <p>
                                  <span className="text-gray-500 uppercase font-medium w-12 inline-block">
                                    Email:
                                  </span>{" "}
                                  {proposal.billingAddress.email || proposal.customerEmail}
                                </p>
                              )}
                              {(proposal.billingAddress.phone || proposal.customerPhone) && (
                                <p>
                                  <span className="text-gray-500 uppercase font-medium w-12 inline-block">
                                    Phone:
                                  </span>{" "}
                                  {proposal.billingAddress.phone || proposal.customerPhone}
                                </p>
                              )}
                              {(proposal.billingAddress.gstNumber || proposal.gstNumber) && (
                                <p>
                                  <span className="text-gray-500 uppercase font-medium w-12 inline-block">
                                    GST:
                                  </span>{" "}
                                  {proposal.billingAddress.gstNumber || proposal.gstNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {proposal.shippingAddress && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2">
                            Shipping Address
                          </h3>
                          <div className="text-sm text-gray-900 leading-relaxed space-y-1">
                            <p className="font-bold">
                              {proposal.shippingAddress.name ||
                                proposal.shippingAddress.companyName ||
                                proposal.customerName}
                            </p>
                            {proposal.shippingAddress.companyName &&
                              proposal.shippingAddress.name && (
                                <p className="text-gray-600">
                                  {proposal.shippingAddress.companyName}
                                </p>
                              )}
                            <p className="whitespace-pre-line text-gray-700">
                              {proposal.shippingAddress.street &&
                                `${proposal.shippingAddress.street}\n`}
                              {proposal.shippingAddress.city}
                              {proposal.shippingAddress.state &&
                                `, ${proposal.shippingAddress.state}`}
                              {proposal.shippingAddress.postalCode &&
                                ` - ${proposal.shippingAddress.postalCode}`}
                              {proposal.shippingAddress.country &&
                                `\n${proposal.shippingAddress.country}`}
                            </p>
                            <div className="pt-2 text-xs space-y-1">
                              {(proposal.shippingAddress.email || proposal.customerEmail) && (
                                <p>
                                  <span className="text-gray-500 uppercase font-medium w-12 inline-block">
                                    Email:
                                  </span>{" "}
                                  {proposal.shippingAddress.email || proposal.customerEmail}
                                </p>
                              )}
                              {(proposal.shippingAddress.phone || proposal.customerPhone) && (
                                <p>
                                  <span className="text-gray-500 uppercase font-medium w-12 inline-block">
                                    Phone:
                                  </span>{" "}
                                  {proposal.shippingAddress.phone || proposal.customerPhone}
                                </p>
                              )}
                              {(proposal.shippingAddress.gstNumber || proposal.gstNumber) && (
                                <p>
                                  <span className="text-gray-500 uppercase font-medium w-12 inline-block">
                                    GST:
                                  </span>{" "}
                                  {proposal.shippingAddress.gstNumber || proposal.gstNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </DetailSection>
                )}

                {/* Line Items */}
                <DetailSection title="Line Items">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Product
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Unit Price
                          </th>
                          {!proposal.isTechnicalQuotation && proposal.showDiscount !== false && (
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Discount
                            </th>
                          )}
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Tax
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {proposal.lineItems.map((item) => {
                          let displayName = item.productName;
                          let displayDesc = item.description;

                          // Check for custom product name encoded in description
                          if (item.description && item.description.includes(":::")) {
                            const parts = item.description.split(":::");
                            displayName = parts[0];
                            displayDesc = parts[1];
                          }

                          return (
                            <tr key={item.lineItemId}>
                              <td className="px-4 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {displayName}
                                </div>
                                <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                                {displayDesc && (
                                  <div className="text-xs text-gray-500 mt-1">{displayDesc}</div>
                                )}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {item.unit || "-"}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              {!proposal.isTechnicalQuotation &&
                                proposal.showDiscount !== false && (
                                  <td className="px-4 py-4 text-right text-sm text-gray-900">
                                    {item.lineDiscountAmount > 0
                                      ? formatCurrency(item.lineDiscountAmount)
                                      : "-"}
                                  </td>
                                )}
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {formatCurrency(item.lineTaxAmount)}
                                <span className="text-gray-500 ml-1">({item.taxRate}%)</span>
                              </td>
                              <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                                {formatCurrency(item.lineTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </DetailSection>

                {/* Terms */}
                {(proposal.paymentTerms || proposal.deliveryTerms || proposal.notes) && (
                  <DetailSection title="Terms & Notes">
                    <dl>
                      {proposal.paymentTerms && (
                        <DetailRow label="Payment Terms" value={proposal.paymentTerms} />
                      )}
                      {proposal.deliveryTerms && (
                        <DetailRow label="Delivery Terms" value={proposal.deliveryTerms} />
                      )}
                      {proposal.notes && <DetailRow label="Notes" value={proposal.notes} />}
                    </dl>
                  </DetailSection>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - 1 column - hide if history tab is full width */}
          {activeTab !== "history" && (
            <div className="space-y-6">
              {/* Totals */}
              <DetailSection title="Summary">
                <dl className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">
                      {proposal.isProforma ? "Total Taxable Amount" : "Subtotal"}
                    </dt>
                    <dd className="text-gray-900 font-medium">
                      {formatCurrency(proposal.subtotal)}
                    </dd>
                  </div>
                  {proposal.discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">
                          Discount
                          {proposal.discount && (
                            <span className="ml-1 text-xs">
                              (
                              {proposal.discount.overallDiscountType === DiscountType.PERCENTAGE
                                ? `${proposal.discount.overallDiscountValue}%`
                                : formatCurrency(proposal.discount.overallDiscountValue)}
                              )
                            </span>
                          )}
                        </dt>
                        <dd className="text-red-600 font-medium">
                          -{formatCurrency(proposal.discountAmount)}
                        </dd>
                      </div>
                      {proposal.discount?.discountReason && (
                        <div className="text-xs text-gray-500 italic">
                          Reason: {proposal.discount.discountReason}
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">
                      {proposal.isProforma ? "Total GST Amount" : "Tax"}
                    </dt>
                    <dd className="text-gray-900 font-medium">
                      {(() => {
                        let displayTax = proposal.taxAmount || 0;
                        if (proposal.isProforma) {
                          displayTax = proposal.parentTaxAmount ?? 0;
                          if (displayTax <= 0) {
                            displayTax =
                              proposal.lineItems?.reduce((sum, item) => {
                                if (item.lineTaxAmount > 0) return sum + item.lineTaxAmount;
                                if (item.taxRate > 0) {
                                  const base = item.lineDiscountAmount
                                    ? item.unitPrice * item.quantity - item.lineDiscountAmount
                                    : item.unitPrice * item.quantity;
                                  return sum + (base * item.taxRate) / 100;
                                }
                                return sum;
                              }, 0) ||
                              proposal.taxAmount ||
                              0;
                          }
                        }
                        return formatCurrency(displayTax);
                      })()}
                    </dd>
                  </div>

                  {!proposal.isProforma && (
                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                      <dt className="text-gray-900">Total</dt>
                      <dd className="text-blue-600">{formatCurrency(proposal.totalAmount)}</dd>
                    </div>
                  )}

                  {proposal.milestonePayableAmount !== undefined &&
                    proposal.milestonePayableAmount !== null && (
                      <div className="flex justify-between text-xl font-extrabold border-t-2 border-blue-100 pt-3 mt-2 bg-blue-50 p-2 rounded-lg">
                        <dt className="text-blue-900 flex flex-col">
                          <span>Net Payable</span>
                          {proposal.isProforma && (
                            <span className="text-xs text-blue-700 font-semibold mt-1">
                              {(() => {
                                let milestonePercentage =
                                  proposal.paymentMilestones?.[0]?.percentage || 100;
                                let includesGst = proposal.milestoneIncludesGst ?? false;

                                if (
                                  proposal.paymentMilestones?.[0]?.percentage &&
                                  proposal.paymentMilestones[0].percentage !== 100
                                ) {
                                  milestonePercentage = proposal.paymentMilestones[0].percentage;
                                } else {
                                  // Fallback native logic just in case API didn't map it properly for old proformas
                                  let computedTax = proposal.parentTaxAmount ?? 0;
                                  if (computedTax <= 0) {
                                    computedTax =
                                      proposal.lineItems?.reduce((sum, item) => {
                                        if (item.lineTaxAmount > 0) return sum + item.lineTaxAmount;
                                        if (item.taxRate > 0) {
                                          const base = item.lineDiscountAmount
                                            ? item.unitPrice * item.quantity -
                                              item.lineDiscountAmount
                                            : item.unitPrice * item.quantity;
                                          return sum + (base * item.taxRate) / 100;
                                        }
                                        return sum;
                                      }, 0) ||
                                      proposal.taxAmount ||
                                      0;
                                  }

                                  const subtotal = proposal.subtotal || 0;
                                  const tax = computedTax;
                                  const payable = proposal.milestonePayableAmount!;

                                  if (subtotal > 0) {
                                    const ratioWithoutTax = (payable / subtotal) * 100;
                                    const ratioWithTax = ((payable - tax) / subtotal) * 100;

                                    const isRoundWithoutTax =
                                      Math.abs(Math.round(ratioWithoutTax) - ratioWithoutTax) <
                                      0.05;
                                    const isRoundWithTax =
                                      Math.abs(Math.round(ratioWithTax) - ratioWithTax) < 0.05;

                                    if (tax > 0) {
                                      if (isRoundWithoutTax && isRoundWithTax) {
                                        if (Math.round(ratioWithoutTax) % 5 === 0) {
                                          milestonePercentage = Math.round(ratioWithoutTax);
                                          includesGst = false;
                                        } else {
                                          milestonePercentage = Math.round(ratioWithTax);
                                          includesGst = true;
                                        }
                                      } else if (isRoundWithTax && ratioWithTax > 0) {
                                        milestonePercentage = Math.round(ratioWithTax);
                                        includesGst = true;
                                      } else {
                                        milestonePercentage = Math.round(ratioWithoutTax);
                                        includesGst = false;
                                      }
                                    } else {
                                      milestonePercentage = Math.round(ratioWithoutTax);
                                      includesGst = false;
                                    }
                                  }
                                }
                                return `Based on ${milestonePercentage}% Milestone${includesGst ? " + GST" : ""}`;
                              })()}
                            </span>
                          )}
                        </dt>
                        <dd className="text-blue-700">
                          {formatCurrency(proposal.milestonePayableAmount)}
                        </dd>
                      </div>
                    )}
                </dl>
              </DetailSection>

              {/* Customer Information */}
              {(proposal.billingAddress?.name || proposal.customerName) && (
                <DetailSection title="Customer Information">
                  <dl>
                    <DetailRow
                      label="Name"
                      value={proposal.billingAddress?.name || proposal.customerName}
                    />
                    <DetailRow
                      label="Email"
                      value={proposal.billingAddress?.email || proposal.customerEmail}
                    />
                    <DetailRow
                      label="Phone"
                      value={proposal.billingAddress?.phone || proposal.customerPhone}
                    />
                  </dl>
                </DetailSection>
              )}

              {/* System Information */}
              <DetailSection title="System Information">
                <dl>
                  <DetailRow
                    label="Created"
                    value={`${formatDateTime(proposal.createdAt)} by ${proposal.createdByName}`}
                  />
                  {proposal.lastModifiedAt && (
                    <DetailRow
                      label="Last Modified"
                      value={`${formatDateTime(proposal.lastModifiedAt)} by ${
                        proposal.lastModifiedByName
                      }`}
                    />
                  )}
                  {proposal.sentAt && (
                    <DetailRow label="Sent" value={formatDateTime(proposal.sentAt)} />
                  )}
                  {proposal.acceptedAt && (
                    <DetailRow label="Accepted" value={formatDateTime(proposal.acceptedAt)} />
                  )}
                  {proposal.rejectedAt && (
                    <>
                      <DetailRow label="Rejected" value={formatDateTime(proposal.rejectedAt)} />
                      {proposal.rejectionReason && (
                        <DetailRow label="Rejection Reason" value={proposal.rejectionReason} />
                      )}
                    </>
                  )}
                </dl>
              </DetailSection>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Proposal"
        message="Are you sure you want to delete this proposal? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={actionLoading}
        variant="danger"
      />

      {/* Invoice Preview Modal */}
      {showInvoicePreview && proposal && (
        <InvoicePreviewModal
          proposalId={proposal.id}
          proposalNumber={proposal.referenceNumber || proposal.proposalNumber}
          onClose={() => setShowInvoicePreview(false)}
          proposal={proposal}
          parentTaxAmount={proposal.parentTaxAmount}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Proposal</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this proposal:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      {showNegotiationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Negotiation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide the customer's feedback or reason for negotiation:
            </p>
            <textarea
              value={negotiationReason}
              onChange={(e) => setNegotiationReason(e.target.value)}
              placeholder="E.g. Customer wants 10% discount..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowNegotiationModal(false);
                  setNegotiationReason("");
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStartNegotiation}
                disabled={actionLoading || !negotiationReason.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? "Starting..." : "Start Negotiation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVersion && (
        <ProposalSnapshotModal
          version={selectedVersion}
          isOpen={!!selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}

      {/* Request Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowApprovalModal(false)}
          ></div>

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircle className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Request Approval
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Select users to tag for approving this quotation.
                      </p>

                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                        {Array.isArray(availableUsers) && availableUsers.length > 0 ? (
                          availableUsers.map((user, idx) => {
                            if (!user) return null;
                            const userId = user.id || user.userId || `unknown-${idx}`;
                            const isChecked = (selectedApprovers || []).includes(userId);
                            return (
                              <div
                                key={userId}
                                className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50"
                              >
                                <input
                                  id={`user-${userId}`}
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedApprovers((prev) => [...prev, userId]);
                                    } else {
                                      setSelectedApprovers((prev) =>
                                        prev.filter((aid) => aid !== userId)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`user-${userId}`}
                                  className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer w-full"
                                >
                                  {user.profile?.fullName ||
                                    `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() ||
                                    user.username ||
                                    "System User"}
                                  <span className="text-gray-400 font-normal ml-1">
                                    ({user.email || "No email"})
                                  </span>
                                </label>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-sm text-gray-500 text-center">
                            No active users found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={actionLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleRequestApproval}
                >
                  {actionLoading ? "Sending..." : "Send Request"}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={() => setShowApprovalModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Proforma Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            aria-hidden="true"
            onClick={() => setShowConvertModal(false)}
          ></div>

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircle className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Convert to Proforma Invoice
                    </h3>
                    <div className="mt-2 text-left">
                      <p className="text-sm text-gray-500 mb-4">
                        If you want to split this quotation into multiple proforma invoices based on
                        milestones, add them below. Otherwise, keep it as a single 100% stage.
                      </p>

                      <div className="space-y-3">
                        {selectedMilestones.map((milestone, index) => (
                          <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Milestone Name
                              </label>
                              <input
                                type="text"
                                value={milestone.name}
                                onChange={(e) => {
                                  const newMilestones = [...selectedMilestones];
                                  newMilestones[index].name = e.target.value;
                                  setSelectedMilestones(newMilestones);
                                }}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50"
                                placeholder="e.g. Advance"
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Percentage (%)
                              </label>
                              <input
                                type="number"
                                value={milestone.percentage}
                                onChange={(e) => {
                                  const newMilestones = [...selectedMilestones];
                                  newMilestones[index].percentage = parseFloat(e.target.value) || 0;
                                  setSelectedMilestones(newMilestones);
                                }}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-gray-50"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedMilestones(
                                  selectedMilestones.filter((_, i) => i !== index)
                                )
                              }
                              className="p-2 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedMilestones([
                              ...selectedMilestones,
                              { name: "", percentage: 0 },
                            ])
                          }
                          className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors text-sm"
                        >
                          + Add Milestone
                        </button>

                        <div className="pt-2 flex justify-between items-center text-sm border-t border-gray-100">
                          <span className="text-gray-500 font-medium">Total Percentage:</span>
                          <span
                            className={`font-bold text-base ${selectedMilestones.reduce((sum, m) => sum + m.percentage, 0) === 100 ? "text-green-600" : "text-red-600"}`}
                          >
                            {selectedMilestones.reduce((sum, m) => sum + m.percentage, 0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={
                    actionLoading ||
                    selectedMilestones.reduce((sum, m) => sum + m.percentage, 0) !== 100
                  }
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleConvertToProforma}
                >
                  Convert
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={() => setShowConvertModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
