"use client";

import { useState, useEffect } from "react";
import { timesheetsService, TimeEntry } from "@/lib/timesheets";
import { showToast } from "@/lib/toast";
import { Clock, Plus } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(weekOffset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1 + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function TimesheetsPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = getWeekDates(weekOffset);

  useEffect(() => {
    loadEntries();
  }, [weekOffset]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const from = weekDates[0].toISOString();
      const to = weekDates[6].toISOString();
      const data = await timesheetsService.getEntries(undefined, from, to);
      setEntries(data);
    } catch {
      showToast.error("Failed to load time entries");
    } finally {
      setLoading(false);
    }
  };

  const totalMinutes = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

  const entriesByDay = weekDates.map((date) => {
    const dateStr = date.toISOString().split("T")[0];
    return entries.filter((e) => e.startTime?.startsWith(dateStr));
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-500 text-sm">Total this week: {formatDuration(totalMinutes)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            &lt; Prev
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Next &gt;
          </button>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="grid grid-cols-8 border-b border-gray-100">
          <div className="p-3 text-xs font-medium text-gray-500 bg-gray-50" />
          {DAYS.map((day, i) => (
            <div key={day} className="p-3 text-center bg-gray-50 border-l border-gray-100">
              <p className="text-xs font-medium text-gray-500">{day}</p>
              <p className="text-sm font-bold text-gray-700 mt-0.5">{weekDates[i].getDate()}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 min-h-24">
          <div className="p-3 text-xs text-gray-500 border-r border-gray-100 flex items-start pt-4">
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          {entriesByDay.map((dayEntries, i) => (
            <div key={i} className="border-l border-gray-100 p-2 min-h-24">
              {dayEntries.map((entry) => (
                <div
                  key={entry.entryId}
                  className="bg-blue-50 border border-blue-200 rounded p-1 mb-1"
                >
                  <p className="text-xs font-medium text-blue-800 truncate">
                    {entry.description || entry.taskId || "Time entry"}
                  </p>
                  <p className="text-xs text-blue-600">{formatDuration(entry.durationMinutes)}</p>
                </div>
              ))}
              {dayEntries.length === 0 && (
                <div className="h-16 flex items-center justify-center">
                  <span className="text-xs text-gray-300">—</span>
                </div>
              )}
              <div className="text-xs text-right text-gray-400 mt-1">
                {formatDuration(dayEntries.reduce((s, e) => s + (e.durationMinutes || 0), 0))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Entries ({entries.length})</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left p-3 font-medium text-gray-600">Date</th>
              <th className="text-left p-3 font-medium text-gray-600">Description</th>
              <th className="text-left p-3 font-medium text-gray-600">Task/Project</th>
              <th className="text-left p-3 font-medium text-gray-600">Type</th>
              <th className="text-right p-3 font-medium text-gray-600">Duration</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.entryId} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3 text-gray-600">
                  {entry.startTime ? new Date(entry.startTime).toLocaleDateString("en-IN") : "-"}
                </td>
                <td className="p-3 text-gray-700">{entry.description || "-"}</td>
                <td className="p-3 text-gray-500 text-xs">
                  {entry.taskId || entry.projectId || "-"}
                </td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${entry.isBillable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {entry.type || "NON_BILLABLE"}
                  </span>
                </td>
                <td className="p-3 text-right font-medium text-gray-800">
                  {formatDuration(entry.durationMinutes)}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No entries this week
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
