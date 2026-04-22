"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { showToast } from "@/lib/toast";
import {
  MapPin,
  RefreshCw,
  Clock,
  User,
  Briefcase,
  Navigation,
  AlertCircle,
} from "lucide-react";

interface EngineerLocation {
  id: string;
  engineerId: string;
  engineerName?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  workOrderId?: string;
  timestamp: string;
}

function getInitials(name?: string, fallback?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (fallback ?? "??").slice(0, 2).toUpperCase();
}

function relativeTime(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function isFresh(timestamp: string): boolean {
  return Date.now() - new Date(timestamp).getTime() < 5 * 60 * 1000;
}

function formatCoord(val: number, decimals = 6): string {
  return val.toFixed(decimals);
}

function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
      <RefreshCw className="w-8 h-8 animate-spin" />
      <span className="text-sm">Loading engineer locations…</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
      <MapPin className="w-10 h-10 opacity-40" />
      <p className="text-sm font-medium">No location data available</p>
      <p className="text-xs">Engineer locations will appear here once reported.</p>
    </div>
  );
}

export default function DispatchMapPage() {
  const [locations, setLocations] = useState<EngineerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(null);
  const [history, setHistory] = useState<EngineerLocation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchLocations = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await api.get<EngineerLocation[]>("/engineer-locations");
      setLocations(data ?? []);
    } catch {
      showToast.error("Failed to fetch engineer locations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchHistory = useCallback(async (engineerId: string) => {
    setHistoryLoading(true);
    setHistory([]);
    try {
      const data = await api.get<EngineerLocation[]>(
        `/engineer-locations/${engineerId}/history`
      );
      setHistory((data ?? []).slice(0, 10));
    } catch {
      showToast.error("Failed to load location history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchLocations(true), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  // Load history when engineer is selected
  useEffect(() => {
    if (selectedEngineerId) {
      fetchHistory(selectedEngineerId);
    }
  }, [selectedEngineerId, fetchHistory]);

  const selectedLocation = locations.find(
    (l) => l.engineerId === selectedEngineerId
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Navigation className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Field Map — Live Engineer Locations
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Auto-refreshes every 2 minutes
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchLocations()}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : locations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState />
          </div>
        ) : (
          <>
            {/* Left Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {locations.length} Engineer{locations.length !== 1 ? "s" : ""} reporting
                </p>
              </div>
              <ul className="divide-y divide-gray-100">
                {locations.map((loc) => {
                  const fresh = isFresh(loc.timestamp);
                  const selected = loc.engineerId === selectedEngineerId;
                  return (
                    <li key={loc.engineerId}>
                      <button
                        onClick={() => setSelectedEngineerId(loc.engineerId)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                          selected
                            ? "bg-blue-50 border-l-2 border-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {getInitials(loc.engineerName, loc.engineerId)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {loc.engineerName ?? loc.engineerId}
                            </span>
                            {/* Freshness dot */}
                            <span
                              className={`shrink-0 w-2.5 h-2.5 rounded-full ${
                                fresh ? "bg-green-500" : "bg-orange-400"
                              }`}
                              title={fresh ? "Active < 5 min" : "Last seen > 5 min ago"}
                            />
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {relativeTime(loc.timestamp)}
                          </div>
                          {loc.workOrderId && (
                            <div className="mt-1 inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                              <Briefcase className="w-3 h-3" />
                              {loc.workOrderId}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Right Detail Panel */}
            <main className="flex-1 overflow-y-auto p-6">
              {!selectedLocation ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                  <User className="w-12 h-12 opacity-30" />
                  <p className="text-sm">Select an engineer from the sidebar to view details</p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Engineer Header */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                        {getInitials(
                          selectedLocation.engineerName,
                          selectedLocation.engineerId
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-gray-900">
                          {selectedLocation.engineerName ?? selectedLocation.engineerId}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Engineer ID: {selectedLocation.engineerId}
                        </p>
                        {selectedLocation.workOrderId && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            <Briefcase className="w-3 h-3" />
                            Work Order: {selectedLocation.workOrderId}
                          </span>
                        )}
                      </div>
                      <div className="ml-auto text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isFresh(selectedLocation.timestamp)
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFresh(selectedLocation.timestamp)
                                ? "bg-green-500"
                                : "bg-orange-400"
                            }`}
                          />
                          {isFresh(selectedLocation.timestamp) ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      Current Location
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Latitude</p>
                        <p className="text-sm font-mono font-medium text-gray-900">
                          {formatCoord(selectedLocation.latitude)}°
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Longitude</p>
                        <p className="text-sm font-mono font-medium text-gray-900">
                          {formatCoord(selectedLocation.longitude)}°
                        </p>
                      </div>
                      {selectedLocation.accuracy != null && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Accuracy</p>
                          <p className="text-sm font-mono font-medium text-gray-900">
                            ±{selectedLocation.accuracy.toFixed(1)} m
                          </p>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(selectedLocation.timestamp)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ({relativeTime(selectedLocation.timestamp)})
                        </p>
                      </div>
                    </div>

                    {/* Open in Maps link */}
                    <a
                      href={`https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Navigation className="w-3 h-3" />
                      Open in Google Maps
                    </a>
                  </div>

                  {/* Location History */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Location History
                        <span className="text-xs font-normal text-gray-400">(last 10)</span>
                      </h3>
                    </div>

                    {historyLoading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading history…
                      </div>
                    ) : history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                        <AlertCircle className="w-5 h-5 opacity-50" />
                        <span className="text-xs">No history available</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left">
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Time
                              </th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Latitude
                              </th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Longitude
                              </th>
                              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Accuracy
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {history.map((entry, idx) => (
                              <tr
                                key={entry.id ?? idx}
                                className={idx === 0 ? "bg-blue-50/50" : "hover:bg-gray-50"}
                              >
                                <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                                  <div className="font-medium text-xs">
                                    {formatDateTime(entry.timestamp)}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {relativeTime(entry.timestamp)}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-xs text-gray-700">
                                  {formatCoord(entry.latitude)}°
                                </td>
                                <td className="px-4 py-2.5 font-mono text-xs text-gray-700">
                                  {formatCoord(entry.longitude)}°
                                </td>
                                <td className="px-4 py-2.5 text-xs text-gray-500">
                                  {entry.accuracy != null
                                    ? `±${entry.accuracy.toFixed(1)} m`
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
