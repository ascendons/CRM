"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Loader2,
  Inbox,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  X,
} from "lucide-react";
import { dispatchService, EngineerSchedule, AvailableEngineer } from "@/lib/dispatch";
import { fieldService } from "@/lib/field-service";
import { WorkOrder, WorkOrderPriority } from "@/types/field-service";
import { showToast } from "@/lib/toast";

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function priorityBadge(priority: WorkOrderPriority) {
  const map: Record<WorkOrderPriority, { label: string; cls: string }> = {
    CRITICAL: { label: "Critical", cls: "bg-red-100 text-red-700" },
    EMERGENCY: { label: "Emergency", cls: "bg-red-200 text-red-800 font-bold" },
    HIGH: { label: "High", cls: "bg-orange-100 text-orange-700" },
    MEDIUM: { label: "Medium", cls: "bg-yellow-100 text-yellow-700" },
    LOW: { label: "Low", cls: "bg-green-100 text-green-700" },
  };
  const { label, cls } = map[priority] ?? { label: priority, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function availabilityBadge(av: EngineerSchedule["availability"]) {
  const map: Record<EngineerSchedule["availability"], { label: string; cls: string }> = {
    AVAILABLE: { label: "Available", cls: "bg-green-100 text-green-700" },
    ON_JOB: { label: "On Job", cls: "bg-blue-100 text-blue-700" },
    LEAVE: { label: "Leave", cls: "bg-slate-100 text-slate-500" },
    TRAVEL: { label: "Travel", cls: "bg-orange-100 text-orange-700" },
    TRAINING: { label: "Training", cls: "bg-purple-100 text-purple-700" },
  };
  const { label, cls } = map[av] ?? { label: av, cls: "bg-slate-100 text-slate-600" };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Dispatch Modal ──────────────────────────────────────────────────────────

interface DispatchModalProps {
  workOrder: WorkOrder;
  availableEngineers: AvailableEngineer[];
  onClose: () => void;
  onSuccess: () => void;
}

function DispatchModal({ workOrder, availableEngineers, onClose, onSuccess }: DispatchModalProps) {
  const [engineerId, setEngineerId] = useState("");
  const [arrivalMinutes, setArrivalMinutes] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleDispatch() {
    if (!engineerId) {
      showToast.error("Please select an engineer.");
      return;
    }
    setSubmitting(true);
    try {
      await dispatchService.dispatchWorkOrder({
        workOrderId: workOrder.id,
        engineerId,
        estimatedArrivalMinutes: arrivalMinutes !== "" ? Number(arrivalMinutes) : undefined,
        notes: notes || undefined,
      });
      showToast.success("Work order dispatched successfully.");
      onSuccess();
    } catch {
      showToast.error("Failed to dispatch work order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Dispatch Work Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-slate-700">{workOrder.woNumber}</p>
            <p className="text-slate-500 mt-0.5">{workOrder.symptoms ?? ""}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Engineer <span className="text-red-500">*</span>
            </label>
            <select
              value={engineerId}
              onChange={(e) => setEngineerId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select an engineer --</option>
              {availableEngineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name}
                </option>
              ))}
            </select>
            {availableEngineers.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">No available engineers for this date.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estimated Arrival (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={arrivalMinutes}
              onChange={(e) =>
                setArrivalMinutes(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 30"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional dispatch notes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDispatch}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Send size={14} />
            Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DispatchBoardPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [openWorkOrders, setOpenWorkOrders] = useState<WorkOrder[]>([]);
  const [schedules, setSchedules] = useState<EngineerSchedule[]>([]);
  const [availableEngineers, setAvailableEngineers] = useState<AvailableEngineer[]>([]);
  const [dispatchTarget, setDispatchTarget] = useState<WorkOrder | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wos, scheds, avail] = await Promise.all([
        fieldService.getAllWorkOrders({ status: "OPEN" as any }),
        dispatchService.getAllSchedules(date),
        dispatchService.getAvailableEngineers(date),
      ]);
      setOpenWorkOrders(wos || []);
      setSchedules(scheds || []);
      setAvailableEngineers(avail || []);
    } catch {
      showToast.error("Failed to load dispatch data.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleDispatchSuccess() {
    setDispatchTarget(null);
    loadData();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dispatch Board</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage work order assignments and engineer schedules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Open Work Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-700">
                  Open Work Orders
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({openWorkOrders.length})
                  </span>
                </h2>
              </div>
              {openWorkOrders.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-12 flex flex-col items-center text-slate-400">
                  <Inbox size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">No open work orders</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                  {openWorkOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="bg-white rounded-xl border border-slate-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {wo.woNumber}
                            </span>
                            {priorityBadge(wo.priority)}
                          </div>
                          <p className="text-sm text-slate-700 font-medium truncate">
                            {wo.symptoms ?? ""}
                          </p>
                          {wo.assetId && (
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              Asset: {wo.assetId}
                            </p>
                          )}
                          {wo.scheduledDate && (
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock size={12} />
                              Scheduled: {new Date(wo.scheduledDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setDispatchTarget(wo)}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Send size={12} />
                          Dispatch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Engineer Schedules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-700">
                  Engineer Schedules
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({schedules.length})
                  </span>
                </h2>
              </div>
              {schedules.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-12 flex flex-col items-center text-slate-400">
                  <User size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">No engineer schedules for this date</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                  {schedules.map((sched) => (
                    <div key={sched.id} className="bg-white rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {sched.engineerName || sched.engineerId}
                            </p>
                            <p className="text-xs text-slate-400">ID: {sched.engineerId}</p>
                          </div>
                        </div>
                        {availabilityBadge(sched.availability)}
                      </div>

                      {sched.slots.length === 0 ? (
                        <p className="text-xs text-slate-400 italic pl-1">No slots scheduled</p>
                      ) : (
                        <div className="space-y-1.5">
                          {sched.slots.map((slot, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs"
                            >
                              <Clock size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="font-mono text-slate-600">
                                {slot.startTime} – {slot.endTime}
                              </span>
                              <span className="text-blue-600 font-medium truncate flex-1">
                                {slot.workOrderId}
                              </span>
                              <span className="text-slate-400">{slot.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {dispatchTarget && (
        <DispatchModal
          workOrder={dispatchTarget}
          availableEngineers={availableEngineers}
          onClose={() => setDispatchTarget(null)}
          onSuccess={handleDispatchSuccess}
        />
      )}
    </div>
  );
}
