"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Contract, ContractStatus, ContractType } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { authService } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { showToast } from "@/lib/toast";
import {
  Search,
  Plus,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  XCircle,
  Calendar,
  Building2,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadContracts();
  }, [router]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fieldService.getAllContracts();
      setContracts(data);
      setFilteredContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...contracts];

    // Search filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.contractNumber.toLowerCase().includes(term) ||
        (c.accountName && c.accountName.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter(c => c.status === statusFilter);
    }

    setFilteredContracts(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, contracts]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedContracts = [...filteredContracts].sort((a, b) => {
    let aValue: any = (a as any)[sortColumn] || "";
    let bValue: any = (b as any)[sortColumn] || "";

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedContracts.length / itemsPerPage);
  const paginatedContracts = sortedContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold">Active</Badge>;
      case ContractStatus.DRAFT:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 uppercase text-[10px] font-bold">Draft</Badge>;
      case ContractStatus.EXPIRED:
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Expired</Badge>;
      case ContractStatus.CANCELLED:
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-bold">Cancelled</Badge>;
      case ContractStatus.RENEWED:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-bold">Renewed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium tracking-tight">Loading service contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contract Management</h1>
              </div>
              <p className="text-sm text-slate-500 font-medium">Manage AMC, Warranties, and Service Level Agreements.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="hidden sm:flex gap-2 rounded-xl">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => router.push("/contracts/new")}
                className="flex items-center gap-2 rounded-xl px-5 shadow-lg shadow-primary/25"
              >
                <Plus className="h-4 w-4" />
                New Contract
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Summary Mini Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-white border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Contracts</p>
                 <h2 className="text-2xl font-black text-slate-900">{contracts.filter(c => c.status === ContractStatus.ACTIVE).length}</h2>
              </div>
           </Card>
           <Card className="bg-white border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                 <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiring Soon</p>
                 <h2 className="text-2xl font-black text-slate-900">0</h2>
              </div>
           </Card>
           <Card className="bg-white border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                 <FileText className="h-7 w-7" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                 <h2 className="text-2xl font-black text-slate-900">
                    ₹{contracts.reduce((acc, c) => acc + (c.contractValue || 0), 0).toLocaleString()}
                 </h2>
              </div>
           </Card>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 lg:p-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-4 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contract # or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>
              <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium min-w-[160px]"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(ContractStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <XCircle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 w-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">#</th>
                  {[
                    { key: 'contractNumber', label: 'Contract #' },
                    { key: 'accountName', label: 'Customer' },
                    { key: 'type', label: 'Type' },
                    { key: 'startDate', label: 'Validity' },
                    { key: 'contractValue', label: 'Value' },
                    { key: 'status', label: 'Status' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortColumn === col.key ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-20 text-center">
                      <EmptyState
                        icon="contracts"
                        title={searchQuery ? "No matching contracts" : "No Active Contracts"}
                        description={searchQuery ? "Try adjusting your search or filters." : "Start managing your service commitments by creating your first contract."}
                        action={!searchQuery ? { label: "Create First Contract", href: "/contracts/new" } : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedContracts.map((contract, idx) => (
                    <tr
                      key={contract.id}
                      className="hover:bg-slate-50/80 transition-all group cursor-pointer border-l-2 border-transparent hover:border-primary/40"
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                    >
                      <td className="px-6 py-5 text-center text-xs text-slate-400 font-bold">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-900 font-mono tracking-tight group-hover:text-primary transition-colors">
                          {contract.contractNumber}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-900 tracking-tight">{contract.accountName || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {contract.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                             <Calendar className="h-3 w-3 text-slate-400" />
                             {new Date(contract.startDate).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium pl-4.5">
                            to {new Date(contract.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-700">
                        ₹{contract.contractValue?.toLocaleString()}
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/contracts/${contract.id}`)}
                          className="h-8 w-8 p-0 hover:bg-white hover:text-primary shadow-sm"
                        >
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {sortedContracts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, sortedContracts.length)}</span> of <span className="text-slate-900 font-bold">{sortedContracts.length}</span> Contracts
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 rounded-lg px-2 disabled:bg-slate-50 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-4 h-9 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 min-w-[80px] justify-center">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 rounded-lg px-2 disabled:bg-slate-50 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
