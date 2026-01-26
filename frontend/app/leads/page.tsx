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

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [statistics, setStatistics] = useState<LeadStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [error, setError] = useState("");

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
  };

  const handleStatusFilter = (status: LeadStatus | "ALL") => {
    setStatusFilter(status);
  };

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

            {/* Data Table */}
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 border-b border-slate-200">Lead Name</th>
                    <th className="px-6 py-3 border-b border-slate-200">Company</th>
                    <th className="px-6 py-3 border-b border-slate-200">Score</th>
                    <th className="px-6 py-3 border-b border-slate-200">Status</th>
                    <th className="px-6 py-3 border-b border-slate-200">Last Action</th>
                    <th className="px-6 py-3 border-b border-slate-200"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-700">
                        {searchTerm || statusFilter !== "ALL"
                          ? "No leads match your filters"
                          : "No leads found. Create your first lead!"}
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {lead.companyName}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-green-500"></span>
                            <span className="text-sm font-bold text-green-600">
                              {lead.leadScore || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getLeadStatusColor(lead.leadStatus)}`}
                          >
                            {lead.leadStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700">
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

          {/* Stats */}
          <div className="text-sm text-slate-700">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>
      </main>
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
