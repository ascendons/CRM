"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { proposalsService } from "@/lib/proposals";
import { authService } from "@/lib/auth";
import {
  ProposalResponse,
  ProposalStatus,
  ProposalSource,
  getProposalStatusLabel,
} from "@/types/proposal";
import { EmptyState } from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { showToast } from "@/lib/toast";
import {
  Search,
  Plus,
  Trash2,
  Filter,
  ArrowUpDown,
  FileText,
  Send,
  Clock,
  User,
  AlertCircle,
  Eye,
  Edit2,
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { PermissionGuard } from "@/components/common/PermissionGuard";

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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProposals = useCallback(async () => {
    try {
      setLoading(true);

      const pagination = {
        page: currentPage,
        size: itemsPerPage,
        sort: `${sortColumn},${sortDirection}`
      };

      let response;
      if (searchTerm) {
        response = await proposalsService.searchProposals(searchTerm, pagination);
      } else if (statusFilter !== "ALL") {
        response = await proposalsService.getProposalsByStatus(statusFilter, pagination);
      } else {
        response = await proposalsService.getAllProposals(pagination);
      }

      if ('content' in response) {
        setProposals(response.content);
        setFilteredProposals(response.content); // Kept for types but filtered locally via server now
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
      } else {
        setProposals(response);
        setFilteredProposals(response);
        setTotalElements(response.length);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortColumn, sortDirection, searchTerm, statusFilter]);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadProposals();
  }, [router, loadProposals]);

  // Removed client-side filtering effects as we use server-side filtered data now

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadProposals();
  }, [router, loadProposals]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
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

  const handleSend = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const getStatusBadge = (status: ProposalStatus) => {
    // Map existing colors to detailed tailwind classes if needed, or stick to simple mapping
    // Here using a simple tailored mapping for demonstration
    const statusStyles = {
      [ProposalStatus.DRAFT]: "bg-slate-100 text-slate-700 border-slate-200   ",
      [ProposalStatus.SENT]: "bg-blue-50 text-blue-700 border-blue-100   ",
      [ProposalStatus.ACCEPTED]: "bg-emerald-50 text-emerald-700 border-emerald-100   ",
      [ProposalStatus.REJECTED]: "bg-rose-50 text-rose-700 border-rose-100   ",
      [ProposalStatus.EXPIRED]: "bg-amber-50 text-amber-700 border-amber-100   ",
    };

    const style = statusStyles[status] || "bg-gray-100 text-gray-800";
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
        {getProposalStatusLabel(status)}
      </span>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500  font-medium">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-white/80  backdrop-blur-lg border-b border-slate-200 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900  tracking-tight">Proposals</h1>
              <p className="text-sm text-slate-500 ">Manage quotations and track proposal status.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/proposals/new")}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Proposal
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
        {/* Toolbar */}
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  p-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, number..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value as ProposalStatus | "ALL")}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value={ProposalStatus.DRAFT}>Draft</option>
                  <option value={ProposalStatus.SENT}>Sent</option>
                  <option value={ProposalStatus.ACCEPTED}>Accepted</option>
                  <option value={ProposalStatus.REJECTED}>Rejected</option>
                  <option value={ProposalStatus.EXPIRED}>Expired</option>
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50  border border-red-200  text-red-700  p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Proposals Table */}
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  overflow-hidden">
          {filteredProposals.length === 0 ? (
            <div className="p-12 text-center">
              {searchTerm || statusFilter !== "ALL" ? (
                <EmptyState
                  icon="search_off"
                  title="No proposals found"
                  description="Try adjusting your search or filters."
                />
              ) : (
                <EmptyState
                  icon="description"
                  title="No proposals yet"
                  description="Create your first proposal to get started."
                  action={{ label: "Create Proposal", href: "/proposals/new" }}
                />
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50  border-b border-slate-200 ">
                  <tr>
                    {[
                      { key: 'proposalNumber', label: 'Proposal #' },
                      { key: 'title', label: 'Title / Customer' },
                      { key: 'totalAmount', label: 'Amount' },
                      { key: 'status', label: 'Status' },
                      { key: 'validUntil', label: 'Valid Until' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider cursor-pointer hover:bg-slate-100  transition-colors group"
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-center gap-2">
                          {col.label}
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === col.key ? 'text-primary' : 'text-slate-300 group-hover:text-slate-500'}`} />
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500  uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {proposals.map((proposal) => (
                    <tr
                      key={proposal.id}
                      className="hover:bg-slate-50  transition-colors group cursor-pointer"
                      onClick={() => router.push(`/proposals/${proposal.id}`)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 ">
                        <span className="font-mono text-primary">{proposal.proposalNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 ">{proposal.title}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500  mt-0.5">
                            <User className="h-3 w-3" />
                            {proposal.customerName || "No customer"}
                            {proposal.source && (
                              <>
                                <span className="mx-1">•</span>
                                <span className="text-xs bg-slate-100  px-1.5 py-0.5 rounded text-slate-500 lowercase">
                                  {proposal.source === ProposalSource.LEAD ? "Lead" : "Opp."}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 ">
                        {formatCurrency(proposal.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(proposal.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 ">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(proposal.validUntil)}
                          {new Date(proposal.validUntil) < new Date() && proposal.status === ProposalStatus.SENT && (
                            <span className="text-xs text-amber-600 font-medium ml-2">(Exp)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/proposals/${proposal.id}`); }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50  rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {proposal.status !== ProposalStatus.ACCEPTED && proposal.status !== ProposalStatus.REJECTED && (
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/proposals/${proposal.id}/edit`); }}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100  rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(proposal.id); }}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50  rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}:
        {totalPages > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={itemsPerPage}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setProposalToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Proposal"
        message="Are you sure you want to delete this proposal? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={deleteLoading}
      />
    </div>
  );
}
