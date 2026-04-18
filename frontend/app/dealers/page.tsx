"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dealersService, Dealer } from "@/lib/dealers";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import {
  Search,
  Plus,
  Building2,
  CreditCard,
  Users,
  AlertTriangle,
  ChevronRight,
  Filter,
} from "lucide-react";

const TIER_STYLES: Record<string, string> = {
  PLATINUM: "bg-purple-100 text-purple-800 border border-purple-200",
  GOLD: "bg-amber-100 text-amber-800 border border-amber-200",
  SILVER: "bg-gray-100 text-gray-700 border border-gray-200",
  BRONZE: "bg-orange-100 text-orange-800 border border-orange-200",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border border-green-200",
  INACTIVE: "bg-gray-100 text-gray-600 border border-gray-200",
  SUSPENDED: "bg-red-100 text-red-800 border border-red-200",
};

function CreditBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color =
    pct > 80
      ? "bg-red-500"
      : pct > 60
      ? "bg-yellow-500"
      : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 bg-gray-200 rounded-full h-2 flex-shrink-0">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export default function DealersPage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [filtered, setFiltered] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("");

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadDealers();
  }, []);

  async function loadDealers() {
    setLoading(true);
    setError("");
    try {
      const data = await dealersService.getAllDealers();
      setDealers(data);
      setFiltered(data);
    } catch (e: any) {
      setError("Failed to load dealers.");
      showToast.error("Failed to load dealers.");
    } finally {
      setLoading(false);
    }
  }

  const applyFilters = useCallback(() => {
    let result = [...dealers];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.companyName?.toLowerCase().includes(q) ||
          d.dealerCode?.toLowerCase().includes(q) ||
          d.contactPerson?.toLowerCase().includes(q) ||
          d.territory?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((d) => d.status === statusFilter);
    if (tierFilter) result = result.filter((d) => d.tier === tierFilter);
    if (territoryFilter.trim())
      result = result.filter((d) =>
        d.territory?.toLowerCase().includes(territoryFilter.toLowerCase())
      );
    setFiltered(result);
  }, [dealers, search, statusFilter, tierFilter, territoryFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Stats
  const totalDealers = dealers.length;
  const activeDealers = dealers.filter((d) => d.status === "ACTIVE").length;
  const suspendedDealers = dealers.filter(
    (d) => d.status === "SUSPENDED"
  ).length;
  const totalCreditUsed = dealers.reduce(
    (sum, d) => sum + (d.currentCreditUsed || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dealers</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your dealer and distributor network
            </p>
          </div>
          <Link
            href="/dealers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Dealer
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Dealers</p>
              <p className="text-xl font-bold text-slate-900">{totalDealers}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active</p>
              <p className="text-xl font-bold text-slate-900">
                {activeDealers}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Suspended</p>
              <p className="text-xl font-bold text-slate-900">
                {suspendedDealers}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Credit Used</p>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(totalCreditUsed)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search dealers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tiers</option>
              <option value="PLATINUM">Platinum</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="BRONZE">Bronze</option>
            </select>
            <input
              type="text"
              placeholder="Territory..."
              value={territoryFilter}
              onChange={(e) => setTerritoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(statusFilter || tierFilter || territoryFilter || search) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setTierFilter("");
                  setTerritoryFilter("");
                }}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No dealers found</p>
              <p className="text-sm mt-1">
                {dealers.length === 0
                  ? "Create your first dealer to get started."
                  : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      Dealer Code
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      Company Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      Tier
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      Territory
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      Contact Person
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      Credit Limit
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      Credit Utilized
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((dealer) => (
                    <tr
                      key={dealer.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dealers/${dealer.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {dealer.dealerCode || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {dealer.companyName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            TIER_STYLES[dealer.tier] || ""
                          }`}
                        >
                          {dealer.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {dealer.territory || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {dealer.contactPerson || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {formatCurrency(dealer.creditLimit || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <CreditBar
                          used={dealer.currentCreditUsed || 0}
                          limit={dealer.creditLimit || 0}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[dealer.status] || ""
                          }`}
                        >
                          {dealer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-slate-400 mt-3 text-right">
            Showing {filtered.length} of {dealers.length} dealers
          </p>
        )}
      </div>
    </div>
  );
}
