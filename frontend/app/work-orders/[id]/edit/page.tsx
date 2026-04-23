"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderType,
} from "@/types/field-service";
import { fieldService } from "@/lib/field-service";
import { usersService } from "@/lib/users";
import { authService } from "@/lib/auth";
import { UserResponse } from "@/types/user";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  Save,
  Settings2,
  Calendar,
  Clock,
  AlertCircle,
  User,
  MessageSquare,
  Activity,
  Stethoscope,
  CheckCircle2,
  Loader2,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EditWorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [engineers, setEngineers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    priority: WorkOrderPriority.MEDIUM,
    status: WorkOrderStatus.OPEN,
    assignedEngineerIds: [] as string[],
    scheduledDate: "",
    symptoms: "",
    diagnosis: "",
    resolution: "",
    rootCause: "",
    closureNotes: "",
    totalLaborHours: 0,
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadInitialData();
  }, [id, router]);

  const loadInitialData = async () => {
    try {
      setFetchingData(true);
      const [orderData, usersData] = await Promise.all([
        fieldService.getWorkOrderById(id),
        usersService.getActiveUsers(),
      ]);

      setEngineers(
        usersData.filter(
          (u) => u.roleName?.includes("Engineer") || u.roleName?.includes("Technician")
        )
      );

      setFormData({
        priority: orderData.priority,
        status: orderData.status,
        assignedEngineerIds: orderData.assignedEngineerIds || [],
        scheduledDate: orderData.scheduledDate
          ? new Date(orderData.scheduledDate).toISOString().split("T")[0]
          : "",
        symptoms: orderData.symptoms || "",
        diagnosis: orderData.diagnosis || "",
        resolution: orderData.resolution || "",
        rootCause: orderData.rootCause || "",
        closureNotes: orderData.closureNotes || "",
        totalLaborHours: orderData.totalLaborHours || 0,
      });
    } catch (err) {
      setError("Failed to load work order. Please refresh.");
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fieldService.updateWorkOrder(id, formData);
      showToast.success("Work order updated successfully");
      router.push(`/work-orders/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update work order");
      showToast.error("Update failure");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value,
    }));
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">
            Accessing engineering record...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full h-11 w-11 hover:bg-slate-100 border border-slate-100"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Modify Work Order
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Update Diagnostics & Workflow
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="rounded-2xl font-bold px-6 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-2xl px-8 font-black shadow-xl shadow-primary/25 bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? "Saving..." : "Update Record"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-10 p-5 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-center gap-4 text-rose-700 animate-in shake-in">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <AlertCircle className="h-6 w-6 text-rose-500" />
            </div>
            <p className="font-bold text-sm tracking-tight">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Technical Data */}
            <div className="lg:col-span-2 space-y-10">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2">
                <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight text-slate-900">
                        Professional Diagnosis
                      </CardTitle>
                      <CardDescription className="text-slate-400 font-medium">
                        Record the technical cause and observed issues.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      Chief Symptoms (Updated)
                    </Label>
                    <textarea
                      name="symptoms"
                      rows={3}
                      value={formData.symptoms}
                      onChange={handleChange}
                      className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-5 text-sm font-medium focus:outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      Technician Diagnosis *
                    </Label>
                    <textarea
                      name="diagnosis"
                      required
                      rows={4}
                      value={formData.diagnosis}
                      onChange={handleChange}
                      placeholder="Explain the root cause found during inspection..."
                      className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-5 text-sm font-medium focus:outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2">
                <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight text-slate-900">
                        Resolution & Closure
                      </CardTitle>
                      <CardDescription className="text-slate-400 font-medium">
                        Document the fix and finalize the record.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4 space-y-10">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      Resolution Strategy *
                    </Label>
                    <textarea
                      name="resolution"
                      required
                      rows={4}
                      value={formData.resolution}
                      onChange={handleChange}
                      placeholder="What steps were taken to resolve the issue?"
                      className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-5 text-sm font-medium focus:outline-none focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                        Root Cause Category
                      </Label>
                      <Input
                        name="rootCause"
                        value={formData.rootCause}
                        onChange={handleChange}
                        placeholder="e.g. Mechanical Wear, Improper Use"
                        className="h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 font-bold px-4 focus:ring-0 focus:border-emerald-600"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                        Total Labor Hours
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        name="totalLaborHours"
                        value={formData.totalLaborHours}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-2 border-slate-50 bg-slate-50/50 font-bold px-4 focus:ring-0 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      Closure Notes (Private)
                    </Label>
                    <textarea
                      name="closureNotes"
                      rows={2}
                      value={formData.closureNotes}
                      onChange={handleChange}
                      className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-5 text-sm font-medium focus:outline-none focus:border-emerald-600 transition-all"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Workflow Control */}
            <div className="space-y-10">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-2">
                <CardHeader className="px-8 pt-8 pb-4 border-b border-white/5">
                  <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center justify-between">
                    Operational State
                    <Settings2 className="h-5 w-5 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-8 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                      Workflow Progress
                    </Label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl bg-white/5 border-2 border-white/10 text-white font-bold px-4 focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      {Object.values(WorkOrderStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                      Response Priority
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(WorkOrderPriority)
                        .slice(0, 4)
                        .map((priority) => (
                          <button
                            key={priority}
                            type="button"
                            onClick={() => setFormData((prev: any) => ({ ...prev, priority }))}
                            className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              formData.priority === priority
                                ? "bg-white text-slate-900 shadow-xl"
                                : "bg-white/5 text-slate-500 hover:bg-white/10"
                            }`}
                          >
                            {priority}
                          </button>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-2 border-2 border-primary/5">
                <CardHeader className="px-8 pt-8 pb-4">
                  <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center justify-between">
                    Allocation
                    <User className="h-5 w-5 text-emerald-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 py-8 space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      Primary Engineer
                    </Label>
                    <select
                      value={formData.assignedEngineerIds[0] || ""}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          assignedEngineerIds: e.target.value ? [e.target.value] : [],
                        }))
                      }
                      className="w-full h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 px-5 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary transition-all appearance-none"
                    >
                      <option value="">Unassigned</option>
                      {engineers.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.profile?.fullName || e.username} ({e.roleName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      Reschedule Date
                    </Label>
                    <Input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                      className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50/50 font-bold focus:ring-0 px-5"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border-2 border-blue-100 flex items-start gap-4">
                <History className="h-6 w-6 text-blue-500 mt-1 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-black text-blue-900 uppercase italic tracking-tight">
                    Audit Preservation
                  </p>
                  <p className="text-[11px] text-blue-700 font-medium leading-relaxed opacity-80">
                    State transitions are logged for SLA calculation and field force performance
                    evaluation. Ensure data accuracy before locking the record.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
