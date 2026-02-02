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
import { proposalsService } from "@/lib/proposals";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import ConfirmModal from "@/components/ConfirmModal";
import { AuditLogTimeline } from "@/components/common/AuditLogTimeline";
import { PermissionGuard } from "@/components/common/PermissionGuard";

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
      showToast.error(
        err instanceof Error ? err.message : "Failed to delete proposal"
      );
    } finally {
      setActionLoading(false);
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
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </Link>
              {proposal.status === ProposalStatus.DRAFT && (
                <>
                  <PermissionGuard resource="PROPOSAL" action="SEND">
                    <button
                      onClick={handleSend}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Send to Customer
                    </button>
                  </PermissionGuard>
                  <PermissionGuard resource="PROPOSAL" action="EDIT">
                    <Link
                      href={`/proposals/${proposal.id}/edit`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                  </PermissionGuard>
                </>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
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
                    {proposal.lineItems.map((item) => (
                      <tr key={item.lineItemId}>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.sku}
                          </div>
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
                    ))}
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
          </div>

          {/* Sidebar - 1 column */}
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

      {/* Reject Modal */}
      {showRejectModal && (
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
      )}
    </div>
  );
}
