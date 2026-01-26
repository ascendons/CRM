"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Account } from "@/types/account";
import { accountsService } from "@/lib/accounts";
import { authService } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadAccounts();
  }, [router]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountsService.getAllAccounts();
      setAccounts(data);
      setFilteredAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredAccounts(accounts);
      return;
    }

    try {
      const results = await accountsService.searchAccounts(query);
      setFilteredAccounts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    try {
      await accountsService.deleteAccount(id);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-700">Loading accounts...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number | undefined | null) => {
    if (value === null || value === undefined || value === 0) return "-";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  return (
    <div className="min-h-screen bg-background-light">
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Page Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Account Management
              </h2>
              <p className="text-slate-700">Manage your company accounts and relationships.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/accounts/new")}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                New Account
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                search
              </span>
              <input
                type="text"
                placeholder="Search accounts by name or website..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {error && <div className="bg-rose-50">{error}</div>}

          {/* Accounts Table */}
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Account
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Website
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Contacts
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Status
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
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-0">
                        {searchQuery ? (
                          <EmptyState
                            icon="search_off"
                            title="No accounts found"
                            description="No accounts match your current search. Try adjusting your search criteria."
                          />
                        ) : (
                          <EmptyState
                            icon="business"
                            title="No accounts yet"
                            description="Get started by adding your first company account to manage business relationships."
                            action={{ label: "Add Your First Account", href: "/accounts/new" }}
                          />
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                              {account.accountName?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {account.accountName}
                              </p>
                              <p className="text-xs text-slate-700">{account.accountId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {account.industry || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {account.website || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {formatCurrency(account.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {account.totalContacts ?? 0}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              account.accountStatus === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {account.accountStatus || "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">{account.ownerName}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/accounts/${account.id}`)}
                            className="text-primary hover:text-primary/90 mr-4 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/accounts/${account.id}/edit`)}
                            className="text-primary hover:text-primary/90 mr-4 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
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
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        </div>
      </main>
    </div>
  );
}
