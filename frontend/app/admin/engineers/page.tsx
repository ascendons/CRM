"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { showToast } from "@/lib/toast";
import {
  Users,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Wrench,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Availability = "AVAILABLE" | "ON_JOB" | "LEAVE" | "TRAVEL" | "TRAINING";

interface ScheduleSlot {
  startTime: string;
  endTime: string;
  workOrderId: string;
  status: string;
}

interface EngineerSchedule {
  id: string;
  engineerId: string;
  engineerName?: string;
  date: string;
  availability: Availability;
  slots: ScheduleSlot[];
}

interface AvailableEngineer {
  id: string;
  name: string;
  skills: string[];
}

interface EngineerSkill {
  skillName: string;
  proficiencyLevel: string;
  certifiedUntil?: string;
}

interface TrainingRecord {
  trainingName: string;
  completedDate: string;
  expiryDate?: string;
}

interface EngineerSkillProfile {
  engineerId: string;
  engineerName: string;
  skills: EngineerSkill[];
  trainingRecords: TrainingRecord[];
}

// Merged view per engineer
interface EngineerRow {
  engineerId: string;
  engineerName: string;
  availability: Availability;
  slots: ScheduleSlot[];
  skills: EngineerSkill[];
  trainingRecords: TrainingRecord[];
  scheduleId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVAILABILITY_OPTIONS: Availability[] = ["AVAILABLE", "ON_JOB", "LEAVE", "TRAVEL", "TRAINING"];

const availabilityBadge: Record<Availability, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ON_JOB: "bg-blue-100 text-blue-800",
  LEAVE: "bg-slate-100 text-slate-700",
  TRAVEL: "bg-orange-100 text-orange-800",
  TRAINING: "bg-purple-100 text-purple-800",
};

const proficiencyBadge: Record<string, string> = {
  BEGINNER: "bg-gray-100 text-gray-600",
  INTERMEDIATE: "bg-yellow-100 text-yellow-700",
  ADVANCED: "bg-blue-100 text-blue-700",
  EXPERT: "bg-green-100 text-green-800",
};

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(t: string) {
  if (!t) return "-";
  // Accept HH:mm or HH:mm:ss
  return t.slice(0, 5);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EngineerManagementPage() {
  const [date, setDate] = useState<string>(todayString());
  const [engineers, setEngineers] = useState<EngineerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadData = useCallback(async (selectedDate: string) => {
    setLoading(true);
    try {
      const [schedules, skillProfiles] = await Promise.all([
        api.get<EngineerSchedule[]>(`/dispatch/schedules?date=${selectedDate}`),
        api.get<EngineerSkillProfile[]>("/skill-matrix/engineers"),
      ]);

      // Build skill map keyed by engineerId
      const skillMap = new Map<string, EngineerSkillProfile>();
      for (const sp of skillProfiles ?? []) {
        skillMap.set(sp.engineerId, sp);
      }

      // Build engineer rows from schedules
      const scheduleMap = new Map<string, EngineerRow>();
      for (const s of schedules ?? []) {
        const profile = skillMap.get(s.engineerId);
        scheduleMap.set(s.engineerId, {
          engineerId: s.engineerId,
          engineerName: s.engineerName ?? profile?.engineerName ?? s.engineerId,
          availability: s.availability,
          slots: s.slots ?? [],
          skills: profile?.skills ?? [],
          trainingRecords: profile?.trainingRecords ?? [],
          scheduleId: s.id,
        });
        skillMap.delete(s.engineerId); // handled
      }

      // Add skill-profile-only engineers (no schedule entry for this date)
      for (const [eid, sp] of skillMap) {
        scheduleMap.set(eid, {
          engineerId: sp.engineerId,
          engineerName: sp.engineerName,
          availability: "AVAILABLE",
          slots: [],
          skills: sp.skills ?? [],
          trainingRecords: sp.trainingRecords ?? [],
        });
      }

      setEngineers(Array.from(scheduleMap.values()));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load engineer data";
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(date);
  }, [date, loadData]);

  // ── Availability update ─────────────────────────────────────────────────────

  const handleAvailabilityChange = async (engineer: EngineerRow, newAvailability: Availability) => {
    if (newAvailability === engineer.availability) return;
    setUpdatingId(engineer.engineerId);
    try {
      await api.put(`/dispatch/schedules/${engineer.engineerId}/availability`, {
        date,
        availability: newAvailability,
      });
      setEngineers((prev) =>
        prev.map((e) =>
          e.engineerId === engineer.engineerId ? { ...e, availability: newAvailability } : e
        )
      );
      showToast.success(`${engineer.engineerName} marked as ${newAvailability}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update availability";
      showToast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Toggle expand ───────────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Engineer Management</h1>
              <p className="text-sm text-gray-500">Availability &amp; skill roster</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm text-gray-800 bg-transparent outline-none"
              />
            </div>
            <button
              onClick={() => loadData(date)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            <p className="mt-4 text-gray-500 text-sm">Loading engineer data…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && engineers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium">No engineers found</p>
            <p className="text-gray-400 text-sm mt-1">
              No schedule or skill data available for {date}.
            </p>
          </div>
        )}

        {/* Roster table */}
        {!loading && engineers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8" />
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Work Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Change Availability
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {engineers.map((eng) => (
                  <>
                    {/* Main row */}
                    <tr
                      key={eng.engineerId}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(eng.engineerId)}
                    >
                      {/* Expand toggle */}
                      <td className="px-4 py-4 text-gray-400">
                        {expandedId === eng.engineerId ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                            {eng.engineerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{eng.engineerName}</p>
                            <p className="text-xs text-gray-400">{eng.engineerId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Availability badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${availabilityBadge[eng.availability]}`}
                        >
                          {eng.availability.replace("_", " ")}
                        </span>
                      </td>

                      {/* Skills count */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          {eng.skills.length}
                        </div>
                      </td>

                      {/* Work orders count */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {eng.slots.length}
                        </div>
                      </td>

                      {/* Availability dropdown */}
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()} // prevent row toggle
                      >
                        <select
                          value={eng.availability}
                          disabled={updatingId === eng.engineerId}
                          onChange={(e) =>
                            handleAvailabilityChange(eng, e.target.value as Availability)
                          }
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          {AVAILABILITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        {updatingId === eng.engineerId && (
                          <span className="ml-2 text-xs text-gray-400">Saving…</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail panel */}
                    {expandedId === eng.engineerId && (
                      <tr key={`${eng.engineerId}-detail`}>
                        <td colSpan={6} className="bg-gray-50 px-6 py-5 border-t border-gray-200">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Scheduled slots */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                Scheduled Slots — {date}
                              </h3>
                              {eng.slots.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">
                                  No slots scheduled for this date.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {eng.slots.map((slot, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                                    >
                                      <span className="font-medium text-gray-800">
                                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                      </span>
                                      <span className="text-gray-500 text-xs">
                                        {slot.workOrderId}
                                      </span>
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                          slot.status === "COMPLETED"
                                            ? "bg-green-100 text-green-700"
                                            : slot.status === "IN_PROGRESS"
                                              ? "bg-blue-100 text-blue-700"
                                              : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {slot.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Skills */}
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-indigo-500" />
                                Skills &amp; Proficiency
                              </h3>
                              {eng.skills.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No skills on record.</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {eng.skills.map((skill, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                                    >
                                      <span className="text-sm text-gray-800 font-medium">
                                        {skill.skillName}
                                      </span>
                                      <span
                                        className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                          proficiencyBadge[skill.proficiencyLevel] ??
                                          "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {skill.proficiencyLevel}
                                      </span>
                                      {skill.certifiedUntil && (
                                        <span className="text-xs text-gray-400 ml-1">
                                          until {skill.certifiedUntil}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Training records */}
                              {eng.trainingRecords.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Training Records
                                  </p>
                                  <div className="space-y-1">
                                    {eng.trainingRecords.map((tr, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between text-xs text-gray-600 bg-white border border-gray-100 rounded px-3 py-1.5"
                                      >
                                        <span className="font-medium">{tr.trainingName}</span>
                                        <span className="text-gray-400">
                                          {tr.completedDate}
                                          {tr.expiryDate ? ` → ${tr.expiryDate}` : ""}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
              {engineers.length} engineer{engineers.length !== 1 ? "s" : ""} for {date}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
