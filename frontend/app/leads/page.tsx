"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leadsService } from "@/lib/leads";
import { authService } from "@/lib/auth";
import {
  Lead,
  LeadStatus,
  LeadStatistics,
  getLeadStatusColor,
  getLeadGradeColor,
  formatLeadName,
} from "@/types/lead";
import EmptyState from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { showToast } from "@/lib/toast";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [statistics, setStatistics] = useState<LeadStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Bulk actions state
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadLeads();
    loadStatistics();
  }, [router]);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, statusFilter, leads]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getAllLeads();
      setLeads(data);
      setFilteredLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await leadsService.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.firstName.toLowerCase().includes(term) ||
          lead.lastName.toLowerCase().includes(term) ||
          lead.email.toLowerCase().includes(term) ||
          lead.companyName.toLowerCase().includes(term) ||
          lead.leadId.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((lead) => lead.leadStatus === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleStatusFilter = (status: LeadStatus | "ALL") => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortedLeads = (leadsToSort: Lead[]) => {
    return [...leadsToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "name":
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case "company":
          aValue = a.companyName.toLowerCase();
          bValue = b.companyName.toLowerCase();
          break;
        case "score":
          aValue = a.leadScore || 0;
          bValue = b.leadScore || 0;
          break;
        case "status":
          aValue = a.leadStatus;
          bValue = b.leadStatus;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Get sorted and paginated leads
  const sortedLeads = getSortedLeads(filteredLeads);
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Bulk actions handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(paginatedLeads.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkActionLoading(true);

      // Delete all selected leads
      await Promise.all(
        selectedLeads.map((leadId) => leadsService.deleteLead(leadId))
      );

      showToast.success(`Successfully deleted ${selectedLeads.length} lead(s)`);
      setShowBulkDeleteModal(false);
      setSelectedLeads([]);

      // Reload leads
      await loadLeads();
      await loadStatistics();
    } catch (err) {
      showToast.error("Failed to delete some leads. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const isAllSelected = paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length;
  const isSomeSelected = selectedLeads.length > 0 && selectedLeads.length < paginatedLeads.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-700">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Page Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Lead Prospecting Queue
              </h2>
              <p className="text-slate-700">
                Filter and qualify raw incoming leads for the sales pipeline.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm font-semibold hover:bg-slate-50">
                <span className="material-symbols-outlined text-lg">file_download</span>
                Export
              </button>
              <Link
                href="/leads/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Add Lead
              </Link>
            </div>
          </div>

          {/* Tabs & Toolbar */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4">
              <div className="flex gap-6">
                <button
                  className={`px-2 py-4 text-sm font-bold ${statusFilter === "ALL" ? "text-primary border-b-2 border-primary" : "text-slate-700 hover:text-slate-900"}`}
                  onClick={() => handleStatusFilter("ALL")}
                >
                  All Leads
                </button>
                <button
                  className={`px-2 py-4 text-sm font-medium ${statusFilter === LeadStatus.NEW ? "text-primary border-b-2 border-primary" : "text-slate-700 hover:text-slate-900"}`}
                  onClick={() => handleStatusFilter(LeadStatus.NEW)}
                >
                  New
                </button>
                <button
                  className={`px-2 py-4 text-sm font-medium ${statusFilter === LeadStatus.CONTACTED ? "text-primary border-b-2 border-primary" : "text-slate-700 hover:text-slate-900"}`}
                  onClick={() => handleStatusFilter(LeadStatus.CONTACTED)}
                >
                  Contacted
                </button>
                <button
                  className={`px-2 py-4 text-sm font-medium ${statusFilter === LeadStatus.QUALIFIED ? "text-primary border-b-2 border-primary" : "text-slate-700 hover:text-slate-900"}`}
                  onClick={() => handleStatusFilter(LeadStatus.QUALIFIED)}
                >
                  Qualified
                </button>
              </div>
              <div className="flex items-center gap-2 py-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search prospects, companies, or activities..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>
            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 px-6 pt-6">
                <StatCard title="Total Leads" value={statistics.totalLeads} color="blue" />
                <StatCard title="New" value={statistics.newLeads} color="indigo" />
                <StatCard title="Contacted" value={statistics.contactedLeads} color="yellow" />
                <StatCard title="Qualified" value={statistics.qualifiedLeads} color="green" />
                <StatCard title="Converted" value={statistics.convertedLeads} color="emerald" />
              </div>
            )}

            {/* Error Message */}
            {error && <div className="bg-rose-50">{error}</div>}

            {/* Bulk Actions Toolbar */}
            {selectedLeads.length > 0 && (
              <div className="bg-blue-50 border-y border-blue-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-600">check_circle</span>
                  <span className="text-sm font-semibold text-blue-900">
                    {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedLeads([])}
                    className="px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 border-b border-slate-200 w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                      />
                    </th>
                    <th
                      className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Lead Name</span>
                        <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-slate-600">
                          {sortColumn === "name"
                            ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward")
                            : "unfold_more"}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("company")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Company</span>
                        <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-slate-600">
                          {sortColumn === "company"
                            ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward")
                            : "unfold_more"}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("score")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Score</span>
                        <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-slate-600">
                          {sortColumn === "score"
                            ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward")
                            : "unfold_more"}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</span>
                        <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-slate-600">
                          {sortColumn === "status"
                            ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward")
                            : "unfold_more"}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Created</span>
                        <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-slate-600">
                          {sortColumn === "createdAt"
                            ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward")
                            : "unfold_more"}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-3 border-b border-slate-200"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        {searchTerm || statusFilter !== "ALL" ? (
                          <EmptyState
                            icon="search_off"
                            title="No leads found"
                            description="No leads match your current filters. Try adjusting your search criteria or filters."
                          />
                        ) : (
                          <EmptyState
                            icon="person_add"
                            title="No leads yet"
                            description="Get started by adding your first lead to the CRM. Track prospects and convert them into customers."
                            action={{
                              label: "Add Your First Lead",
                              href: "/leads/new",
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-blue-100">
                              {lead.firstName[0]}
                              {lead.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {formatLeadName(lead)}
                              </p>
                              <p className="text-xs text-slate-700">{lead.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                          {lead.companyName}
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-green-500"></span>
                            <span className="text-sm font-bold text-green-600">
                              {lead.leadScore || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getLeadStatusColor(lead.leadStatus)}`}
                          >
                            {lead.leadStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700 cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                          Created {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="material-symbols-outlined text-slate-700"
                          >
                            chevron_right
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {sortedLeads.length > 0 && (
            <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex-1 flex justify-between items-center sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="text-sm text-slate-700">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, sortedLeads.length)}
                    </span>{" "}
                    of <span className="font-medium">{sortedLeads.length}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <div key={page} className="inline-flex">
                            {showEllipsis && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? "z-10 bg-primary border-primary text-white"
                                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Delete Multiple Leads"
        message={`Are you sure you want to delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedLeads.length} Lead${selectedLeads.length > 1 ? 's' : ''}`}
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        isLoading={bulkActionLoading}
      />
    </div>
  );
}

// Statistics Card Component
function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="rounded-xl shadow-sm p-6 bg-white">
      <div className="text-sm font-medium text-slate-700">{title}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
