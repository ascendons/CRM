"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ProposalResponse,
  ProposalStatus,
  ProposalSource,
  DiscountType,
  getProposalStatusColor,
  getProposalStatusLabel,

} from "@/types/proposal";
import { ArrowLeft, Edit, Trash2, Send, CheckCircle, XCircle, Download, Eye, X } from "lucide-react";
import { proposalsService } from "@/lib/proposals";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import ConfirmModal from "@/components/ConfirmModal";
import { AuditLogTimeline } from "@/components/common/AuditLogTimeline";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import ProposalComments from "@/components/proposals/ProposalComments";
import CommercialNegotiation from "@/components/proposals/CommercialNegotiation";
import { MessageSquare, Gavel, History } from "lucide-react";
import ProposalVersionHistory from "@/components/proposals/ProposalVersionHistory";
import ProposalVersionDiff from "@/components/proposals/ProposalVersionDiff";
import ProposalSnapshotModal from "@/components/proposals/ProposalSnapshotModal";
import { ProposalVersionResponse } from "@/types/proposal-version";

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  // Negotiation state
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationReason, setNegotiationReason] = useState("");
  const [activeTab, setActiveTab] = useState<'details' | 'technical' | 'commercial' | 'history'>('details');

  // Versioning state
  const [selectedVersion, setSelectedVersion] = useState<ProposalVersionResponse | null>(null);
  const [comparison, setComparison] = useState<{ v1: ProposalVersionResponse, v2: ProposalVersionResponse } | null>(null);

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Switch to correct tab if in negotiation
  useEffect(() => {
    if (proposal?.status === ProposalStatus.NEGOTIATION && activeTab === 'details') {
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
      showToast.error(
        err instanceof Error ? err.message : "Failed to send proposal"
      );
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
      showToast.error(
        err instanceof Error ? err.message : "Failed to accept proposal"
      );
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
      showToast.error(
        err instanceof Error ? err.message : "Failed to reject proposal"
      );
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
        notes: proposal.notes ? `${proposal.notes}\n\nNegotiation Started: ${negotiationReason}` : `Negotiation Started: ${negotiationReason}`
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

  const handleDownloadPdf = async () => {
    if (!proposal) return;
    try {
      setActionLoading(true);
      const blob = await proposalsService.downloadInvoice(proposal.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      showToast.error("Failed to generate preview");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActualDownload = () => {
    if (!previewUrl || !proposal) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `proposal-${proposal.proposalNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
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

  const DetailSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
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
        {value !== undefined && value !== null && value !== ""
          ? String(value)
          : "-"}
      </dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {proposal.title}
                </h1>
                <span
                  className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-${getProposalStatusColor(
                    proposal.status
                  )}-100 text-${getProposalStatusColor(proposal.status)}-800`}
                >
                  {getProposalStatusLabel(proposal.status)}
                </span>
              </div>
              <p className="text-gray-600">{proposal.proposalNumber}</p>
              {proposal.customerName && (
                <p className="text-gray-600 mt-1">
                  Customer: {proposal.customerName}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href="/proposals"
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
                Invoice
              </button>
              {proposal.status === ProposalStatus.DRAFT && (
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

              {proposal.status !== ProposalStatus.ACCEPTED && proposal.status !== ProposalStatus.REJECTED && (
                <PermissionGuard resource="PROPOSAL" action="EDIT">
                  <Link
                    href={`/proposals/${proposal.id}/edit`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                </PermissionGuard>
              )}
              {proposal.status === ProposalStatus.SENT && (
                <>
                  <PermissionGuard resource="PROPOSAL" action="APPROVE">
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </PermissionGuard>
                  <PermissionGuard resource="PROPOSAL" action="EDIT">
                    <button
                      onClick={() => setShowNegotiationModal(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      Negotiate
                    </button>
                  </PermissionGuard>
                  <PermissionGuard resource="PROPOSAL" action="REJECT">
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </PermissionGuard>
                </>
              )}
              <PermissionGuard resource="PROPOSAL" action="DELETE">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>



        {/* Navigation Tabs for Negotiation */}
        {proposal.status === ProposalStatus.NEGOTIATION && (
          <div className="border-b border-gray-200 mb-6 bg-white rounded-lg shadow px-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('details')}
                className={`${activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <CheckCircle className="h-4 w-4" />
                Details
              </button>
              <button
                onClick={() => setActiveTab('technical')}
                className={`${activeTab === 'technical'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <MessageSquare className="h-4 w-4" />
                Technical Negotiation
              </button>
              <button
                onClick={() => setActiveTab('commercial')}
                className={`${activeTab === 'commercial'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Gavel className="h-4 w-4" />
                Place Bid (Commercial)
              </button>
              <button
                onClick={() => { setActiveTab('history'); setComparison(null); }}
                className={`${activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                onClick={() => setActiveTab('details')}
                className={`${activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <CheckCircle className="h-4 w-4" />
                Details
              </button>
              <button
                onClick={() => { setActiveTab('history'); setComparison(null); }}
                className={`${activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className={`${activeTab === 'history' ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>

            {activeTab === 'history' && !comparison && (
              <ProposalVersionHistory
                proposalId={proposal.id}
                onVersionSelect={(v) => setSelectedVersion(v)}
                onCompareSelect={(v1, v2) => setComparison({ v1, v2 })}
              />
            )}

            {activeTab === 'history' && comparison && (
              <ProposalVersionDiff
                version1={comparison.v1}
                version2={comparison.v2}
                onBack={() => setComparison(null)}
              />
            )}

            {activeTab === 'technical' && (
              <ProposalComments proposal={proposal} />
            )}

            {activeTab === 'commercial' && (
              <CommercialNegotiation proposal={proposal} onUpdate={loadProposal} />
            )}

            {activeTab === 'details' && (
              <>
                {/* Basic Information */}
                <DetailSection title="Proposal Details">
                  <dl>
                    <DetailRow label="Description" value={proposal.description} />
                    <DetailRow
                      label="Valid Until"
                      value={formatDate(proposal.validUntil)}
                    />
                    <DetailRow label="Owner" value={proposal.ownerName} />
                  </dl>
                </DetailSection>

                {/* Source Information */}
                <DetailSection title="Source">
                  <dl>
                    <DetailRow
                      label="Type"
                      value={
                        proposal.source === ProposalSource.LEAD
                          ? "Lead"
                          : "Opportunity"
                      }
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
                          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2">Billing Address</h3>
                          <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">
                            {proposal.billingAddress.street && `${proposal.billingAddress.street}\n`}
                            {proposal.billingAddress.city}{proposal.billingAddress.state && `, ${proposal.billingAddress.state}`}{proposal.billingAddress.postalCode && ` - ${proposal.billingAddress.postalCode}`}
                            {proposal.billingAddress.country && `\n${proposal.billingAddress.country}`}
                          </p>
                        </div>
                      )}
                      {proposal.shippingAddress && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2">Shipping Address</h3>
                          <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">
                            {proposal.shippingAddress.street && `${proposal.shippingAddress.street}\n`}
                            {proposal.shippingAddress.city}{proposal.shippingAddress.state && `, ${proposal.shippingAddress.state}`}{proposal.shippingAddress.postalCode && ` - ${proposal.shippingAddress.postalCode}`}
                            {proposal.shippingAddress.country && `\n${proposal.shippingAddress.country}`}
                          </p>
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
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Discount
                          </th>
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
                          if (item.description && item.description.includes(':::')) {
                            const parts = item.description.split(':::');
                            displayName = parts[0];
                            displayDesc = parts[1];
                          }

                          return (
                            <tr key={item.lineItemId}>
                              <td className="px-4 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {displayName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {item.sku}
                                </div>
                                {displayDesc && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {displayDesc}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {item.lineDiscountAmount > 0
                                  ? formatCurrency(item.lineDiscountAmount)
                                  : "-"}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {formatCurrency(item.lineTaxAmount)}
                                <span className="text-gray-500 ml-1">
                                  ({item.taxRate}%)
                                </span>
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
                {(proposal.paymentTerms ||
                  proposal.deliveryTerms ||
                  proposal.notes) && (
                    <DetailSection title="Terms & Notes">
                      <dl>
                        {proposal.paymentTerms && (
                          <DetailRow
                            label="Payment Terms"
                            value={proposal.paymentTerms}
                          />
                        )}
                        {proposal.deliveryTerms && (
                          <DetailRow
                            label="Delivery Terms"
                            value={proposal.deliveryTerms}
                          />
                        )}
                        {proposal.notes && (
                          <DetailRow label="Notes" value={proposal.notes} />
                        )}
                      </dl>
                    </DetailSection>
                  )}

                {/* Activity History */}
                <DetailSection title="Activity History">
                  <AuditLogTimeline entityName="PROPOSAL" entityId={proposal.id} />
                </DetailSection>
              </>
            )}
          </div>

          {/* Sidebar - 1 column - hide if history tab is full width */}
          {activeTab !== 'history' && (
            <div className="space-y-6">
              {/* Totals */}
              <DetailSection title="Summary">
                <dl className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">Subtotal</dt>
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
                              {proposal.discount.overallDiscountType ===
                                DiscountType.PERCENTAGE
                                ? `${proposal.discount.overallDiscountValue}%`
                                : formatCurrency(
                                  proposal.discount.overallDiscountValue
                                )}
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
                    <dt className="text-gray-500">Tax</dt>
                    <dd className="text-gray-900 font-medium">
                      {formatCurrency(proposal.taxAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <dt className="text-gray-900">Total</dt>
                    <dd className="text-blue-600">
                      {formatCurrency(proposal.totalAmount)}
                    </dd>
                  </div>
                </dl>
              </DetailSection>

              {/* Customer Information */}
              {proposal.customerName && (
                <DetailSection title="Customer Information">
                  <dl>
                    <DetailRow label="Name" value={proposal.customerName} />
                    <DetailRow label="Email" value={proposal.customerEmail} />
                    <DetailRow label="Phone" value={proposal.customerPhone} />
                  </dl>
                </DetailSection>
              )}

              {/* System Information */}
              <DetailSection title="System Information">
                <dl>
                  <DetailRow
                    label="Created"
                    value={`${formatDateTime(proposal.createdAt)} by ${proposal.createdByName
                      }`}
                  />
                  {proposal.lastModifiedAt && (
                    <DetailRow
                      label="Last Modified"
                      value={`${formatDateTime(proposal.lastModifiedAt)} by ${proposal.lastModifiedByName
                        }`}
                    />
                  )}
                  {proposal.sentAt && (
                    <DetailRow label="Sent" value={formatDateTime(proposal.sentAt)} />
                  )}
                  {proposal.acceptedAt && (
                    <DetailRow
                      label="Accepted"
                      value={formatDateTime(proposal.acceptedAt)}
                    />
                  )}
                  {proposal.rejectedAt && (
                    <>
                      <DetailRow
                        label="Rejected"
                        value={formatDateTime(proposal.rejectedAt)}
                      />
                      {proposal.rejectionReason && (
                        <DetailRow
                          label="Rejection Reason"
                          value={proposal.rejectionReason}
                        />
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
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Invoice Preview</h3>
                  <p className="text-xs text-gray-500">{proposal?.proposalNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleActualDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-sm shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={closePreviewModal}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-gray-100 p-4">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-lg shadow-sm bg-white"
                  title="Invoice Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  Generating preview...
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
              <button
                onClick={closePreviewModal}
                className="px-6 py-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {
        showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reject Proposal
              </h3>
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
        )
      }

      {/* Negotiation Modal */}
      {
        showNegotiationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Start Negotiation
              </h3>
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
        )
      }

      {selectedVersion && (
        <ProposalSnapshotModal
          version={selectedVersion}
          isOpen={!!selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}

    </div >
  );
}
