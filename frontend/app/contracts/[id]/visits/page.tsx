"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ContractVisit, ContractVisitStatus, Contract } from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { usersService } from "@/lib/users";
import { authService } from "@/lib/auth";
import { UserResponse } from "@/types/user";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function ContractVisitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [contract, setContract] = useState<Contract | null>(null);
  const [visits, setVisits] = useState<ContractVisit[]>([]);
  const [engineers, setEngineers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reschedulingVisit, setReschedulingVisit] = useState<ContractVisit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [rescheduleData, setRescheduleData] = useState({
    scheduledDate: "",
    engineerId: "",
    notes: "",
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [id, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractData, visitsData, usersData] = await Promise.all([
        fieldService.getContractById(id),
        fieldService.getContractVisits(id),
        usersService.getActiveUsers(),
      ]);

      setContract(contractData);
      setVisits(Array.isArray(visitsData) ? visitsData : []);
      setEngineers(usersData);
    } catch (err) {
      console.error("Failed to load visits:", err);
      showToast.error("Failed to load visit schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (visit: ContractVisit) => {
    setReschedulingVisit(visit);
    setRescheduleData({
      scheduledDate: visit.scheduledDate,
      engineerId: visit.engineerId || "",
      notes: visit.notes || "",
    });
  };

  const submitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingVisit) return;

    setIsSubmitting(true);
    try {
      await fieldService.updateContractVisit(reschedulingVisit.id, {
        ...rescheduleData,
        status: ContractVisitStatus.RESCHEDULED,
      });
      showToast.success("Visit rescheduled successfully");
      setReschedulingVisit(null);
      loadData();
    } catch (err) {
      showToast.error("Failed to reschedule visit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ContractVisitStatus) => {
    switch (status) {
      case ContractVisitStatus.SCHEDULED:
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px] font-black">
            Scheduled
          </Badge>
        );
      case ContractVisitStatus.COMPLETED:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-black">
            Completed
          </Badge>
        );
      case ContractVisitStatus.MISSED:
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-100 uppercase text-[10px] font-black">
            Missed
          </Badge>
        );
      case ContractVisitStatus.RESCHEDULED:
        return (
          <Badge className="bg-violet-50 text-violet-700 border-violet-100 uppercase text-[10px] font-black">
            Rescheduled
          </Badge>
        );
      case ContractVisitStatus.CANCELLED:
        return (
          <Badge className="bg-slate-50 text-slate-700 border-slate-100 uppercase text-[10px] font-black">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredVisits = visits.filter(
    (v) =>
      v.visitNumber.toString().includes(searchQuery) ||
      v.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Accessing visit schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full hover:bg-slate-100 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Maintenance Schedule
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  {contract?.contractNumber} • Prevention Visits
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {visits.length} Visits Allocated
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Left: Contract Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="p-3 bg-white/10 rounded-2xl w-fit">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Contract Validity
                  </p>
                  <p className="text-sm font-bold">
                    {new Date(contract?.startDate || "").toLocaleDateString()} —{" "}
                    {new Date(contract?.endDate || "").toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Requirement
                  </p>
                  <p className="text-xs font-medium leading-relaxed opacity-80">
                    Performing periodic maintenance reduces equipment downtime by up to 35% and
                    maintains warranty eligibility.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Visits List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by visit # or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-14 rounded-2xl border-none shadow-xl bg-white focus:ring-primary/20"
                />
              </div>
              <Button
                variant="outline"
                className="h-14 w-14 rounded-2xl border-none shadow-xl bg-white hover:bg-slate-50"
              >
                <Filter className="h-5 w-5 text-slate-600" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredVisits.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-xl border-2 border-dashed border-slate-200">
                  <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Calendar className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                    Schedule Not Found
                  </h3>
                  <p className="text-slate-500 font-medium">
                    No maintenance visits have been initialized for this contract yet.
                  </p>
                </div>
              ) : (
                filteredVisits
                  .sort((a, b) => a.visitNumber - b.visitNumber)
                  .map((visit) => (
                    <Card
                      key={visit.id}
                      className="rounded-[2rem] border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group overflow-hidden"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="flex-shrink-0 w-24 h-24 bg-slate-50 rounded-3xl flex flex-col items-center justify-center border-2 border-slate-100 group-hover:border-primary/20 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                              Visit
                            </span>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">
                              #{visit.visitNumber}
                            </span>
                          </div>

                          <div className="flex-1 space-y-2 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                              {getStatusBadge(visit.status)}
                              {visit.actualDate && (
                                <Badge className="bg-slate-900 text-white uppercase text-[10px] font-black">
                                  Performed on {new Date(visit.actualDate).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-6 text-slate-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-sm font-bold">
                                  {new Date(visit.scheduledDate).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-bold">
                                  {(() => {
                                    const eng = engineers.find((e) => e.id === visit.engineerId);
                                    return eng
                                      ? eng.profile?.fullName || eng.username
                                      : "Unassigned Engineer";
                                  })()}
                                </span>
                              </div>
                            </div>
                            {visit.notes && (
                              <p className="text-xs font-medium text-slate-400 italic">
                                "{visit.notes}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {visit.status === ContractVisitStatus.SCHEDULED ||
                            visit.status === ContractVisitStatus.RESCHEDULED ? (
                              <Button
                                onClick={() => handleReschedule(visit)}
                                className="rounded-xl h-12 px-6 font-black tracking-tight shadow-lg shadow-violet-500/20 bg-slate-900 hover:bg-slate-800"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reschedule
                              </Button>
                            ) : null}
                            {visit.workOrderId && (
                              <Button
                                variant="ghost"
                                onClick={() => router.push(`/work-orders/${visit.workOrderId}`)}
                                className="rounded-xl h-12 w-12 border border-slate-100 p-0 text-slate-400 hover:text-primary"
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Reschedule Modal */}
      {reschedulingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-2 border-white">
            <div className="px-10 pt-10 pb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-100 rounded-2xl text-violet-600">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Modify Schedule
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Visit #{reschedulingVisit.visitNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReschedulingVisit(null)}
                className="h-12 w-12 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <XCircle className="h-6 w-6 text-slate-300" />
              </button>
            </div>

            <form onSubmit={submitReschedule} className="p-10 pt-4 space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Target Date *
                  </Label>
                  <Input
                    type="date"
                    value={rescheduleData.scheduledDate}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, scheduledDate: e.target.value })
                    }
                    required
                    className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 text-md font-bold focus:ring-0 focus:border-violet-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Assign System Engineer
                  </Label>
                  <select
                    value={rescheduleData.engineerId}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, engineerId: e.target.value })
                    }
                    className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-md font-bold focus:outline-none focus:border-violet-500 transition-all appearance-none"
                  >
                    <option value="">Auto-Assign System Engineer</option>
                    {engineers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.profile?.fullName || user.username} ({user.roleName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Change Notes
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="Reason for rescheduling or specific instructions..."
                    value={rescheduleData.notes}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, notes: e.target.value })
                    }
                    className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-5 text-sm font-medium focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 rounded-[2rem] font-black text-md tracking-tight shadow-2xl shadow-violet-500/20 bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                ) : (
                  <RefreshCw className="h-5 w-5 mr-3" />
                )}
                Apply Rescheduling
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
