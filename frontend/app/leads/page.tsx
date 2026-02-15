"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leadsService } from "@/lib/leads";
import { authService } from "@/lib/auth";
import {
  Lead,
  LeadStatus,
  LeadStatistics,
  formatLeadName,
} from "@/types/lead";
import { EmptyState } from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { showToast } from "@/lib/toast";
import {
  Search,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Briefcase,
  TrendingUp,
  Building2,
  LucideIcon,
  LayoutList,
  KanbanSquare,
  Filter
} from "lucide-react";
import { LeadKanbanBoard } from "@/components/leads/LeadKanbanBoard";
import { MultiSelectDropdown } from "@/components/common/MultiSelectDropdown";
import { AssignLeadModal } from "@/components/leads/AssignLeadModal";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [statistics, setStatistics] = useState<LeadStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
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

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState<Lead | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadLeads();
    loadStatistics();
  }, [router]);

  const filterLeads = useCallback(() => {
    let filtered = [...leads];

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

    if (statusFilter.length > 0) {
      filtered = filtered.filter((lead) => statusFilter.includes(lead.leadStatus));
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter]);

  useEffect(() => {
    filterLeads();
  }, [filterLeads]);

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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (statuses: string[]) => {
    setStatusFilter(statuses as LeadStatus[]);
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

  const getSortedLeads = (leadsToSort: Lead[]) => {
    return [...leadsToSort].sort((a, b) => {
      let aValue: string | number | Date = '';
      let bValue: string | number | Date = '';

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
      await Promise.all(
        selectedLeads.map((leadId) => leadsService.deleteLead(leadId))
      );
      showToast.success(`Successfully deleted ${selectedLeads.length} lead(s)`);
      setShowBulkDeleteModal(false);
      setSelectedLeads([]);
      await loadLeads();
      await loadStatistics();
    } catch {
      showToast.error("Failed to delete some leads. Please try again.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleAssignClick = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadToAssign(lead);
    setShowAssignModal(true);
  };

  const handleAssignSuccess = async () => {
    await loadLeads();
    setShowAssignModal(false);
    setLeadToAssign(null);
  };

  const isAllSelected = paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length;
  const isSomeSelected = selectedLeads.length > 0 && selectedLeads.length < paginatedLeads.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500  font-medium">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Sticky Header */}
      <div className="sticky top-16 z-20 bg-white/80  backdrop-blur-lg border-b border-slate-200 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900  tracking-tight">Lead Prospecting</h1>
              <p className="text-sm text-slate-500 ">Manage and convert your incoming prospects.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  title="List View"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "kanban" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  title="Kanban View"
                >
                  <KanbanSquare className="h-4 w-4" />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white  border border-slate-200  text-slate-700  rounded-xl text-sm font-semibold hover:bg-slate-50  transition-colors shadow-sm">
                <Download className="h-4 w-4" />
                Export
              </button>
              <Link
                href="/leads/new"
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Add Lead
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Briefcase} title="Total Leads" value={statistics.totalLeads} color="blue" delay={0} />
            <StatCard icon={CheckCircle2} title="New" value={statistics.newLeads} color="indigo" delay={0.1} />
            <StatCard icon={Clock} title="Contacted" value={statistics.contactedLeads} color="yellow" delay={0.2} />
            <StatCard icon={CheckCircle2} title="Qualified" value={statistics.qualifiedLeads} color="emerald" delay={0.3} />
            <StatCard icon={TrendingUp} title="Converted" value={statistics.convertedLeads} color="purple" delay={0.4} />
          </div>
        )}

        {/* Filters & Actions */}
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  p-1">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2">
            {/* Tabs */}
            {/* Status Filter Dropdown */}
            <MultiSelectDropdown
              label="Status"
              options={Object.values(LeadStatus).map((status) => ({
                label: status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                value: status,
              }))}
              selectedValues={statusFilter}
              onChange={handleStatusChange}
            />

            {/* Search & Bulk Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {selectedLeads.length > 0 ? (
                <div className="flex items-center gap-3 bg-blue-50  text-blue-700  px-4 py-2 rounded-xl text-sm font-medium w-full md:w-auto animate-fade-in">
                  <span>{selectedLeads.length} selected</span>
                  <div className="h-4 w-px bg-blue-200  mx-1"></div>
                  <button onClick={() => setSelectedLeads([])} className="hover:underline">Clear</button>
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="flex items-center gap-1.5 text-red-600 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              ) : (
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50  border border-red-200  text-red-700  p-4 rounded-xl flex items-center gap-3">
            <XCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Lead Table / Kanban Board */}
        {viewMode === "list" ? (
          <>
            <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50  border-b border-slate-200 ">
                      <th className="px-6 py-4 w-12">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isSomeSelected;
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer transition-all"
                          />
                        </div>
                      </th>
                      {[
                        { key: 'name', label: 'Lead Name' },
                        { key: 'company', label: 'Company' },
                        { key: 'score', label: 'Lead Score' },
                        { key: 'status', label: 'Status' },
                        { key: 'assignedTo', label: 'Assigned To' },
                        { key: 'createdAt', label: 'Created' },
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
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 ">
                    {sortedLeads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center">
                          {searchTerm || statusFilter.length > 0 ? (
                            <EmptyState
                              icon="search"
                              title="No leads found"
                              description="No leads match your current filters. Try adjusting your search criteria."
                            />
                          ) : (
                            <EmptyState
                              icon="users"
                              title="No leads yet"
                              description="Get started by adding your first lead to the CRM."
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
                          className="hover:bg-slate-50  transition-colors group cursor-pointer"
                          onClick={() => router.push(`/leads/${lead.id}`)}
                        >
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedLeads.includes(lead.id)}
                                onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                                className="w-4 h-4 text-primary bg-white border-slate-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100   flex items-center justify-center text-blue-700  font-bold text-xs ring-2 ring-white  shadow-sm">
                                {lead.firstName[0]}{lead.lastName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 ">
                                  {formatLeadName(lead)}
                                </p>
                                <p className="text-xs text-slate-500 ">{lead.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-700 ">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              {lead.companyName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 w-16 bg-slate-100  rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${lead.leadScore && lead.leadScore > 70 ? 'bg-emerald-500' : lead.leadScore && lead.leadScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${lead.leadScore || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-slate-700 ">
                                {lead.leadScore || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${lead.leadStatus === LeadStatus.NEW ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                lead.leadStatus === LeadStatus.QUALIFIED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  lead.leadStatus === LeadStatus.CONTACTED ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${lead.leadStatus === LeadStatus.NEW ? 'bg-blue-500' :
                                lead.leadStatus === LeadStatus.QUALIFIED ? 'bg-emerald-500' :
                                  lead.leadStatus === LeadStatus.CONTACTED ? 'bg-yellow-500' :
                                    'bg-slate-500'
                                }`}></span>
                              {lead.leadStatus.toLowerCase().replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            {lead.assignedUserName ? (
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                                  {lead.assignedUserName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-700">{lead.assignedUserName}</span>
                                <button
                                  onClick={(e) => handleAssignClick(lead, e)}
                                  className="ml-1 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Reassign lead"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => handleAssignClick(lead, e)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                Assign
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 ">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100  rounded-lg">
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {sortedLeads.length > 0 && (
              <div className="flex items-center justify-between bg-white  px-6 py-4 rounded-2xl border border-slate-200  shadow-sm">
                <p className="text-sm text-slate-600 ">
                  Showing <span className="font-semibold text-slate-900 ">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900 ">{Math.min(currentPage * itemsPerPage, sortedLeads.length)}</span> of <span className="font-semibold text-slate-900 ">{sortedLeads.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50  transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-600 " />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && <span className="mx-1 text-slate-400">...</span>}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                            : "text-slate-600  hover:bg-slate-50 "
                            }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50  transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-600 " />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <LeadKanbanBoard
            leads={filteredLeads}
            filter={statusFilter}
            onStatusChange={() => {
              loadLeads();
              loadStatistics();
              router.refresh();
            }}
          />
        )}
      </main>

      {/* Bulk Delete Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Delete Multiple Leads"
        message={`Are you sure you want to delete ${selectedLeads.length} selected lead(s)? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedLeads.length} Lead(s)`}
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        isLoading={bulkActionLoading}
      />

      {/* Assign Lead Modal */}
      {leadToAssign && (
        <AssignLeadModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setLeadToAssign(null);
          }}
          leadId={leadToAssign.id}
          leadName={formatLeadName(leadToAssign)}
          currentAssignedUserId={leadToAssign.assignedUserId}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color, delay }: { icon: LucideIcon, title: string; value: number; color: string, delay: number }) {
  const colorStyles: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50  ",
    indigo: "text-indigo-600 bg-indigo-50  ",
    yellow: "text-yellow-600 bg-yellow-50  ",
    emerald: "text-emerald-600 bg-emerald-50  ",
    purple: "text-purple-600 bg-purple-50  ",
  };

  const style = colorStyles[color] || "text-slate-600 bg-slate-50";

  return (
    <div
      className="bg-white  p-4 rounded-2xl shadow-sm border border-slate-200  hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}
    >
      <div className={`h-10 w-10 rounded-xl ${style} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 ">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900  mt-1">{value}</h3>
      </div>
    </div>
  );
}
