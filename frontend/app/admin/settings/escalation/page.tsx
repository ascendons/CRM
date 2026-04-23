"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { showToast } from "@/lib/toast";

interface EscalationRule {
  id: string;
  name: string;
  trigger: "SLA_BREACH" | "WO_UNASSIGNED" | "SR_UNACKNOWLEDGED" | "PO_PENDING_APPROVAL";
  conditionMinutes: number;
  level: "L1" | "L2" | "L3";
  notifyUserIds: string[];
  notificationChannels: string[];
  autoEscalateAfterMinutes: number;
  active: boolean;
}

interface EscalationLog {
  id: string;
  ruleId: string;
  entityType: string;
  entityId: string;
  triggeredAt: string;
  level: string;
  notifiedUserIds: string[];
  acknowledgedAt: string;
  acknowledgedBy: string;
  resolvedAt: string;
}

type Tab = "rules" | "open" | "logs";

const TRIGGER_OPTIONS = [
  { value: "SLA_BREACH", label: "SLA Breach" },
  { value: "WO_UNASSIGNED", label: "WO Unassigned" },
  { value: "SR_UNACKNOWLEDGED", label: "SR Unacknowledged" },
  { value: "PO_PENDING_APPROVAL", label: "PO Pending Approval" },
];

const CHANNEL_OPTIONS = ["InApp", "Email", "SMS"];

const LEVEL_OPTIONS = ["L1", "L2", "L3"];

const emptyRule: Omit<EscalationRule, "id"> = {
  name: "",
  trigger: "SLA_BREACH",
  conditionMinutes: 60,
  level: "L1",
  notifyUserIds: [],
  notificationChannels: [],
  autoEscalateAfterMinutes: 120,
  active: true,
};

function formatDate(dt: string) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RuleModalProps {
  rule: Omit<EscalationRule, "id"> & { id?: string };
  onClose: () => void;
  onSave: (rule: Omit<EscalationRule, "id"> & { id?: string }) => Promise<void>;
}

function RuleModal({ rule: initial, onClose, onSave }: RuleModalProps) {
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const [userIdsText, setUserIdsText] = useState((initial.notifyUserIds ?? []).join(", "));

  const toggleChannel = (ch: string) => {
    setForm((f) => ({
      ...f,
      notificationChannels: f.notificationChannels.includes(ch)
        ? f.notificationChannels.filter((c) => c !== ch)
        : [...f.notificationChannels, ch],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      notifyUserIds: userIdsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    await onSave(payload);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">
            {form.id ? "Edit Escalation Rule" : "Add Escalation Rule"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trigger</label>
            <select
              value={form.trigger}
              onChange={(e) =>
                setForm((f) => ({ ...f, trigger: e.target.value as EscalationRule["trigger"] }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TRIGGER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {/* Condition Minutes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Condition (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={form.conditionMinutes}
              onChange={(e) => setForm((f) => ({ ...f, conditionMinutes: Number(e.target.value) }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
            <select
              value={form.level}
              onChange={(e) =>
                setForm((f) => ({ ...f, level: e.target.value as EscalationRule["level"] }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {/* Notify User IDs */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notify User IDs <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={userIdsText}
              onChange={(e) => setUserIdsText(e.target.value)}
              placeholder="userId1, userId2, ..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Notification Channels */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notification Channels
            </label>
            <div className="flex gap-4">
              {CHANNEL_OPTIONS.map((ch) => (
                <label key={ch} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.notificationChannels.includes(ch)}
                    onChange={() => toggleChannel(ch)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{ch}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Auto Escalate After */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Auto-escalate After (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={form.autoEscalateAfterMinutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, autoEscalateAfterMinutes: Number(e.target.value) }))
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Active */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-slate-700">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EscalationSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("rules");
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [openLogs, setOpenLogs] = useState<EscalationLog[]>([]);
  const [allLogs, setAllLogs] = useState<EscalationLog[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [modalRule, setModalRule] = useState<(Omit<EscalationRule, "id"> & { id?: string }) | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await api.get<EscalationRule[]>("/admin/settings/escalation/rules");
      setRules(res);
    } catch {
      showToast.error("Failed to load escalation rules");
    } finally {
      setLoadingRules(false);
    }
  }, []);

  const fetchOpenLogs = useCallback(async () => {
    setLoadingOpen(true);
    try {
      const res = await api.get<EscalationLog[]>("/admin/settings/escalation/logs/open");
      setOpenLogs(res);
    } catch {
      showToast.error("Failed to load open escalations");
    } finally {
      setLoadingOpen(false);
    }
  }, []);

  const fetchAllLogs = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await api.get<EscalationLog[]>("/admin/settings/escalation/logs");
      setAllLogs(res);
    } catch {
      showToast.error("Failed to load escalation logs");
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    if (activeTab === "open") fetchOpenLogs();
    if (activeTab === "logs") fetchAllLogs();
  }, [activeTab, fetchOpenLogs, fetchAllLogs]);

  const handleSaveRule = async (rule: Omit<EscalationRule, "id"> & { id?: string }) => {
    try {
      if (rule.id) {
        const updated = await api.put<EscalationRule>(
          `/admin/settings/escalation/rules/${rule.id}`,
          rule
        );
        setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
        showToast.success("Rule updated");
      } else {
        const created = await api.post<EscalationRule>("/admin/settings/escalation/rules", rule);
        setRules((prev) => [...prev, created]);
        showToast.success("Rule created");
      }
      setModalRule(null);
    } catch {
      showToast.error("Failed to save rule");
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await api.delete<void>(`/admin/settings/escalation/rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
      showToast.success("Rule deleted");
    } catch {
      showToast.error("Failed to delete rule");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (rule: EscalationRule) => {
    try {
      const updated = await api.put<EscalationRule>(`/admin/settings/escalation/rules/${rule.id}`, {
        ...rule,
        active: !rule.active,
      });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch {
      showToast.error("Failed to update rule");
    }
  };

  const handleAcknowledge = async (logId: string) => {
    try {
      await api.post<void>(`/admin/settings/escalation/logs/${logId}/acknowledge`, {});
      setOpenLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, acknowledgedAt: new Date().toISOString() } : l))
      );
      showToast.success("Acknowledged");
    } catch {
      showToast.error("Failed to acknowledge");
    }
  };

  const handleResolve = async (logId: string) => {
    try {
      await api.post<void>(`/admin/settings/escalation/logs/${logId}/resolve`, {});
      setOpenLogs((prev) => prev.filter((l) => l.id !== logId));
      showToast.success("Resolved");
    } catch {
      showToast.error("Failed to resolve");
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "rules", label: "Rules", icon: "rule" },
    { key: "open", label: "Open Escalations", icon: "warning" },
    { key: "logs", label: "All Logs", icon: "history" },
  ];

  const levelBadge = (level: string) => {
    const colors: Record<string, string> = {
      L1: "bg-yellow-100 text-yellow-800",
      L2: "bg-orange-100 text-orange-800",
      L3: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[level] ?? "bg-slate-100 text-slate-600"}`}
      >
        {level}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Escalation Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure escalation rules and monitor active escalations
          </p>
        </div>
        {activeTab === "rules" && (
          <button
            onClick={() => setModalRule({ ...emptyRule })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Rule
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Rules Tab */}
          {activeTab === "rules" && (
            <>
              {loadingRules ? (
                <div className="flex items-center justify-center h-48">
                  <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">
                    progress_activity
                  </span>
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-slate-300">rule</span>
                  <p className="text-slate-500 mt-2">No escalation rules configured</p>
                  <button
                    onClick={() => setModalRule({ ...emptyRule })}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Add your first rule
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Name
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Trigger
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Condition
                        </th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Level
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Channels
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Auto-escalate
                        </th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Active
                        </th>
                        <th className="px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-3 py-3 font-medium text-slate-800">{rule.name}</td>
                          <td className="px-3 py-3 text-slate-600 text-xs">
                            {TRIGGER_OPTIONS.find((t) => t.value === rule.trigger)?.label ??
                              rule.trigger}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-700">
                            {rule.conditionMinutes} min
                          </td>
                          <td className="px-3 py-3 text-center">{levelBadge(rule.level)}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {rule.notificationChannels.map((ch) => (
                                <span
                                  key={ch}
                                  className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded"
                                >
                                  {ch}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-slate-700">
                            {rule.autoEscalateAfterMinutes} min
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleToggleActive(rule)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                rule.active ? "bg-blue-600" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  rule.active ? "translate-x-4.5" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setModalRule({ ...rule })}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(rule.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Open Escalations Tab */}
          {activeTab === "open" && (
            <>
              {loadingOpen ? (
                <div className="flex items-center justify-center h-48">
                  <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">
                    progress_activity
                  </span>
                </div>
              ) : openLogs.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-green-400">
                    check_circle
                  </span>
                  <p className="text-slate-500 mt-2">No open escalations</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Entity Type
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Entity ID
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Triggered At
                        </th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Level
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Notified
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Acknowledged At
                        </th>
                        <th className="px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {openLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-3 py-3 text-slate-700">{log.entityType}</td>
                          <td className="px-3 py-3 font-mono text-xs text-slate-500">
                            {log.entityId}
                          </td>
                          <td className="px-3 py-3 text-slate-600 text-xs">
                            {formatDate(log.triggeredAt)}
                          </td>
                          <td className="px-3 py-3 text-center">{levelBadge(log.level)}</td>
                          <td className="px-3 py-3 text-right text-slate-700">
                            {log.notifiedUserIds?.length ?? 0}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">
                            {formatDate(log.acknowledgedAt)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {!log.acknowledgedAt && (
                                <button
                                  onClick={() => handleAcknowledge(log.id)}
                                  className="px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-lg transition-colors"
                                >
                                  Acknowledge
                                </button>
                              )}
                              <button
                                onClick={() => handleResolve(log.id)}
                                className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 rounded-lg transition-colors"
                              >
                                Resolve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* All Logs Tab */}
          {activeTab === "logs" && (
            <>
              {loadingAll ? (
                <div className="flex items-center justify-center h-48">
                  <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">
                    progress_activity
                  </span>
                </div>
              ) : allLogs.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
                  <p className="text-slate-500 mt-2">No escalation logs</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Entity Type
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Entity ID
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Triggered At
                        </th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Level
                        </th>
                        <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Notified
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Acknowledged At
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2.5">
                          Resolved At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-3 py-3 text-slate-700">{log.entityType}</td>
                          <td className="px-3 py-3 font-mono text-xs text-slate-500">
                            {log.entityId}
                          </td>
                          <td className="px-3 py-3 text-slate-600 text-xs">
                            {formatDate(log.triggeredAt)}
                          </td>
                          <td className="px-3 py-3 text-center">{levelBadge(log.level)}</td>
                          <td className="px-3 py-3 text-right text-slate-700">
                            {log.notifiedUserIds?.length ?? 0}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">
                            {formatDate(log.acknowledgedAt)}
                          </td>
                          <td className="px-3 py-3 text-xs">
                            {log.resolvedAt ? (
                              <span className="text-green-600">{formatDate(log.resolvedAt)}</span>
                            ) : (
                              <span className="text-orange-500">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rule Modal */}
      {modalRule && (
        <RuleModal rule={modalRule} onClose={() => setModalRule(null)} onSave={handleSaveRule} />
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-50 p-2 rounded-lg">
                <span className="material-symbols-outlined text-red-600">delete</span>
              </div>
              <h2 className="text-base font-semibold text-slate-800">Delete Rule</h2>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this escalation rule? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRule(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
