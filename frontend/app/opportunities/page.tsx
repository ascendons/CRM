"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Opportunity, OpportunityStage } from "@/types/opportunity";
import { opportunitiesService } from "@/lib/opportunities";
import { authService } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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
    if (!query.trim() && !stageFilter) {
      setFilteredOpportunities(opportunities);
      return;
    }

    try {
      if (query.trim()) {
        const results = await opportunitiesService.searchOpportunities(query);
        let filtered = results;
        if (stageFilter) {
          filtered = results.filter((opp) => opp.stage === stageFilter);
        }
        setFilteredOpportunities(filtered);
      } else {
        const filtered = opportunities.filter((opp) => opp.stage === stageFilter);
        setFilteredOpportunities(filtered);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  };

  const handleStageFilter = (stage: string) => {
    setStageFilter(stage);
    if (!stage && !searchQuery.trim()) {
      setFilteredOpportunities(opportunities);
      return;
    }

    let filtered = opportunities;
    if (stage) {
      filtered = filtered.filter((opp) => opp.stage === stage);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (opp) =>
          opp.opportunityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opp.accountName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredOpportunities(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) {
      return;
    }

    try {
      await opportunitiesService.deleteOpportunity(id);
      loadOpportunities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete opportunity");
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === null || value === undefined || value === 0) return "-";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStageBadgeColor = (stage: OpportunityStage) => {
    const colors = {
      [OpportunityStage.PROSPECTING]: "bg-blue-50",
      [OpportunityStage.QUALIFICATION]: "bg-indigo-50",
      [OpportunityStage.NEEDS_ANALYSIS]: "bg-amber-50",
      [OpportunityStage.PROPOSAL]: "bg-purple-50",
      [OpportunityStage.NEGOTIATION]: "bg-amber-50",
      [OpportunityStage.CLOSED_WON]: "bg-emerald-50",
      [OpportunityStage.CLOSED_LOST]: "bg-rose-50",
    };
    return colors[stage] || "bg-slate-100";
  };

  const getStageLabel = (stage: OpportunityStage) => {
    return stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-700">Loading opportunities...</p>
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
                Sales Opportunities
              </h2>
              <p className="text-slate-700">Manage your sales pipeline and track deals.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/opportunities/new")}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                New Opportunity
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search opportunities by name or account..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <select
                  value={stageFilter}
                  onChange={(e) => handleStageFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary"
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
              </div>
            </div>
          </div>

          {error && <div className="bg-rose-50">{error}</div>}

          {/* Opportunities Table */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Company
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Value
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Close Date
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-0">
                        {searchQuery || stageFilter ? (
                          <EmptyState
                            icon="search_off"
                            title="No opportunities found"
                            description="No opportunities match your current filters. Try adjusting your search or stage filter."
                          />
                        ) : (
                          <EmptyState
                            icon="handshake"
                            title="No opportunities yet"
                            description="Get started by creating your first sales opportunity to track deals in your pipeline."
                            action={{ label: "Create Your First Opportunity", href: "/opportunities/new" }}
                          />
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredOpportunities.map((opportunity) => (
                      <tr key={opportunity.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                              {opportunity.accountName?.[0]?.toUpperCase() || "O"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {opportunity.opportunityName}
                              </p>
                              <p className="text-xs text-slate-700">{opportunity.accountName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {formatCurrency(opportunity.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 ${getStageBadgeColor(opportunity.stage)} text-slate-900 rounded text-xs font-medium`}
                          >
                            {getStageLabel(opportunity.stage)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {opportunity.probability}%
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {formatDate(opportunity.expectedCloseDate)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-900">
                          {opportunity.ownerName}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/opportunities/${opportunity.id}`)}
                            className="text-primary hover:text-primary/90 mr-4 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/opportunities/${opportunity.id}/edit`)}
                            className="text-primary hover:text-primary/90 mr-4 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(opportunity.id)}
                            className="text-rose-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="text-sm text-slate-700">
            Showing {filteredOpportunities.length} of {opportunities.length} opportunities
          </div>
        </div>
      </main>
    </div>
  );
}
