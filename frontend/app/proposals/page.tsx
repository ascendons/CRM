"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { proposalsService } from "@/lib/proposals";
import { authService } from "@/lib/auth";
import {
  ProposalResponse,
  ProposalStatus,
  ProposalSource,
  getProposalStatusColor,
  getProposalStatusLabel,
} from "@/types/proposal";
import { EmptyState } from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { showToast } from "@/lib/toast";

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<ProposalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "ALL">("ALL");
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadProposals();
  }, [router]);

  useEffect(() => {
    filterProposals();
  }, [searchTerm, statusFilter, proposals]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await proposalsService.getAllProposals();
      setProposals(data);
      setFilteredProposals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const filterProposals = () => {
    let filtered = [...proposals];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (proposal) =>
          proposal.title.toLowerCase().includes(term) ||
          proposal.proposalNumber.toLowerCase().includes(term) ||
          (proposal.customerName && proposal.customerName.toLowerCase().includes(term)) ||
          proposal.sourceName.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((proposal) => proposal.status === statusFilter);
    }

    setFilteredProposals(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: ProposalStatus | "ALL") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortedProposals = (proposalsToSort: ProposalResponse[]) => {
    return [...proposalsToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "totalAmount":
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "validUntil":
          aValue = new Date(a.validUntil).getTime();
          bValue = new Date(b.validUntil).getTime();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getPaginatedProposals = () => {
    const sorted = getSortedProposals(filteredProposals);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  const handleDelete = (id: string) => {
    setProposalToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!proposalToDelete) return;

    try {
      setDeleteLoading(true);
      await proposalsService.deleteProposal(proposalToDelete);
      showToast.success("Proposal deleted successfully");
      loadProposals();
      setShowDeleteModal(false);
      setProposalToDelete(null);
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Failed to delete proposal"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await proposalsService.sendProposal(id);
      showToast.success("Proposal sent successfully");
      loadProposals();
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : "Failed to send proposal"
      );
    }
  };

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600 mt-1">
            Manage quotations and proposals
          </p>
        </div>
        <Link
          href="/proposals/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Proposal
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search by title, number, or customer..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as ProposalStatus | "ALL")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value={ProposalStatus.DRAFT}>Draft</option>
              <option value={ProposalStatus.SENT}>Sent</option>
              <option value={ProposalStatus.ACCEPTED}>Accepted</option>
              <option value={ProposalStatus.REJECTED}>Rejected</option>
              <option value={ProposalStatus.EXPIRED}>Expired</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Proposals Table or Empty State */}
      {filteredProposals.length === 0 && !loading ? (
        <EmptyState
          title="No proposals found"
          description={
            searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first proposal"
          }
          actionLabel={searchTerm || statusFilter !== "ALL" ? undefined : "Create Proposal"}
          onAction={searchTerm || statusFilter !== "ALL" ? undefined : () => router.push("/proposals/new")}
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort("proposalNumber")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Proposal #
                  </th>
                  <th
                    onClick={() => handleSort("title")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th
                    onClick={() => handleSort("totalAmount")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Total Amount
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Status
                  </th>
                  <th
                    onClick={() => handleSort("validUntil")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedProposals().map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {proposal.proposalNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {proposal.title}
                      </div>
                      {proposal.customerName && (
                        <div className="text-sm text-gray-500">
                          {proposal.customerName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {proposal.source === ProposalSource.LEAD ? "Lead" : "Opportunity"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {proposal.sourceName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(proposal.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getProposalStatusColor(
                          proposal.status
                        )}-100 text-${getProposalStatusColor(proposal.status)}-800`}
                      >
                        {getProposalStatusLabel(proposal.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(proposal.validUntil)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        {proposal.status === ProposalStatus.DRAFT && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleSend(proposal.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Send
                            </button>
                            <span className="text-gray-300">|</span>
                            <Link
                              href={`/proposals/${proposal.id}/edit`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </Link>
                          </>
                        )}
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(proposal.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
              <div className="flex justify-between items-center w-full">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredProposals.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{filteredProposals.length}</span>{" "}
                    results
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setProposalToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Proposal"
        message="Are you sure you want to delete this proposal? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={deleteLoading}
        variant="danger"
      />
    </div>
  );
}
