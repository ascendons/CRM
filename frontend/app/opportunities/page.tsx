"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Opportunity, OpportunityStage } from "@/types/opportunity";
import { opportunitiesService } from "@/lib/opportunities";
import { authService } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { showToast } from "@/lib/toast"; // Assuming showToast is available or consistent with other pages
import ConfirmModal from "@/components/ConfirmModal"; // Assuming ConfirmModal is available
import {
  Search,
  Plus,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  DollarSign,
  Calendar,
  User,
  MoreVertical,
  XCircle,
  Briefcase
} from "lucide-react";

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Selection & Actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadOpportunities();
  }, [router]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await opportunitiesService.getAllOpportunities();
      setOpportunities(data);
      setFilteredOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    filterOpportunities(query, stageFilter);
  };

  const handleStageFilter = (stage: string) => {
    setStageFilter(stage);
    setCurrentPage(1);
    filterOpportunities(searchQuery, stage);
  };

  const filterOpportunities = (query: string, stage: string) => {
    let filtered = opportunities;

    if (stage) {
      filtered = filtered.filter((opp) => opp.stage === stage);
    }

    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.opportunityName.toLowerCase().includes(lowerQuery) ||
          opp.accountName.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredOpportunities(filtered);
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

  const getSortedOpportunities = (opportunitiesToSort: Opportunity[]) => {
    return [...opportunitiesToSort].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortColumn) {
        case "name":
          aValue = a.opportunityName.toLowerCase();
          bValue = b.opportunityName.toLowerCase();
          break;
        case "account":
          aValue = a.accountName.toLowerCase();
          bValue = b.accountName.toLowerCase();
          break;
        case "amount":
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case "stage":
          aValue = a.stage;
          bValue = b.stage;
          break;
        case "probability":
          aValue = a.probability || 0;
          bValue = b.probability || 0;
          break;
        case "closeDate":
          aValue = new Date(a.expectedCloseDate || 0).getTime();
          bValue = new Date(b.expectedCloseDate || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedOpportunities = getSortedOpportunities(filteredOpportunities);
  const totalPages = Math.ceil(sortedOpportunities.length / itemsPerPage);
  const paginatedOpportunities = sortedOpportunities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmDelete = (id: string) => {
    setOpportunityToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!opportunityToDelete) return;

    try {
      setActionLoading(true);
      await opportunitiesService.deleteOpportunity(opportunityToDelete);
      showToast.success("Opportunity deleted successfully"); // Assuming showToast exists
      setShowDeleteModal(false);
      setOpportunityToDelete(null);
      loadOpportunities();
    } catch {
      // Using simpler error handling to avoid unused var
      // If showToast is not available, we might want to use alert or console
      console.error("Failed to delete opportunity");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === null || value === undefined || value === 0) return "-";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStageBadgeColor = (stage: OpportunityStage) => {
    const colors = {
      [OpportunityStage.PROSPECTING]: "bg-blue-50 text-blue-700 border-blue-100   ",
      [OpportunityStage.QUALIFICATION]: "bg-indigo-50 text-indigo-700 border-indigo-100   ",
      [OpportunityStage.NEEDS_ANALYSIS]: "bg-amber-50 text-amber-700 border-amber-100   ",
      [OpportunityStage.PROPOSAL]: "bg-purple-50 text-purple-700 border-purple-100   ",
      [OpportunityStage.NEGOTIATION]: "bg-orange-50 text-orange-700 border-orange-100   ",
      [OpportunityStage.CLOSED_WON]: "bg-emerald-50 text-emerald-700 border-emerald-100   ",
      [OpportunityStage.CLOSED_LOST]: "bg-rose-50 text-rose-700 border-rose-100   ",
    };
    return colors[stage] || "bg-slate-100 text-slate-700 border-slate-200   ";
  };

  const getStageLabel = (stage: OpportunityStage) => {
    return stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 ">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500  font-medium">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 ">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-white/80  backdrop-blur-lg border-b border-slate-200 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900  tracking-tight">Sales Opportunities</h1>
              <p className="text-sm text-slate-500 ">Manage your pipeline and track deal progress.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white  border border-slate-200  text-slate-700  rounded-xl text-sm font-semibold hover:bg-slate-50  transition-colors shadow-sm">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => router.push("/opportunities/new")}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="h-4 w-4" />
                New Opportunity
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
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <select
                  value={stageFilter}
                  onChange={(e) => handleStageFilter(e.target.value)}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">All Stages</option>
                  <option value={OpportunityStage.PROSPECTING}>Prospecting</option>
                  <option value={OpportunityStage.QUALIFICATION}>Qualification</option>
                  <option value={OpportunityStage.NEEDS_ANALYSIS}>Needs Analysis</option>
                  <option value={OpportunityStage.PROPOSAL}>Proposal</option>
                  <option value={OpportunityStage.NEGOTIATION}>Negotiation</option>
                  <option value={OpportunityStage.CLOSED_WON}>Closed Won</option>
                  <option value={OpportunityStage.CLOSED_LOST}>Closed Lost</option>
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50  border border-red-200  text-red-700  p-4 rounded-xl flex items-center gap-3">
            <XCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Opportunities Table */}
        <div className="bg-white  rounded-2xl shadow-sm border border-slate-200  overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50  border-b border-slate-200 ">
                  {[
                    { key: 'name', label: 'Opportunity / Account' },
                    { key: 'amount', label: 'Proposal Value' },
                    { key: 'stage', label: 'Stage' },
                    { key: 'probability', label: 'Probability' },
                    { key: 'closeDate', label: 'Expected Close' },
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
                {sortedOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      {searchQuery || stageFilter ? (
                        <EmptyState
                          icon="search_off"
                          title="No opportunities found"
                          description="No opportunities match your current filters."
                        />
                      ) : (
                        <EmptyState
                          icon="handshake"
                          title="No opportunities yet"
                          description="Get started by creating your first sales opportunity."
                          action={{ label: "Create Opportunity", href: "/opportunities/new" }}
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedOpportunities.map((opportunity) => (
                    <tr
                      key={opportunity.id}
                      className="hover:bg-slate-50  transition-colors group cursor-pointer"
                      onClick={() => router.push(`/opportunities/${opportunity.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-100  flex items-center justify-center text-blue-700  shadow-sm">
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 ">
                              {opportunity.opportunityName}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 ">
                              <User className="h-3 w-3" />
                              {opportunity.accountName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 ">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                          {formatCurrency(opportunity.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStageBadgeColor(opportunity.stage)}`}>
                          {getStageLabel(opportunity.stage)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-24 h-2 bg-slate-100  rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${opportunity.probability > 75 ? 'bg-emerald-500' :
                                opportunity.probability > 40 ? 'bg-blue-500' :
                                  'bg-amber-500'
                                }`}
                              style={{ width: `${opportunity.probability}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-slate-600  w-8">
                            {opportunity.probability}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 ">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {formatDate(opportunity.expectedCloseDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/opportunities/${opportunity.id}/edit`); }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100  rounded-lg transition-colors"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); confirmDelete(opportunity.id); }}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50  rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {sortedOpportunities.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white  px-6 py-4 rounded-2xl border border-slate-200  shadow-sm">
            <p className="text-sm text-slate-600 ">
              Showing <span className="font-semibold text-slate-900 ">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900 ">{Math.min(currentPage * itemsPerPage, sortedOpportunities.length)}</span> of <span className="font-semibold text-slate-900 ">{sortedOpportunities.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200  rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50  transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600 " />
              </button>
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

      </main>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Opportunity"
        message="Are you sure you want to delete this opportunity? This action cannot be undone."
        confirmLabel="Delete Opportunity"
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={actionLoading}
      />
    </div>
  );
}
