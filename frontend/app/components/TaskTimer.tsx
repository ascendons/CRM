"use client";

import { useState, useEffect, useRef } from "react";
import { timesheetsService, TimeEntry } from "@/lib/timesheets";
import { showToast } from "@/lib/toast";
import { Play, Square, Clock } from "lucide-react";

interface TaskTimerProps {
  taskId: string;
  projectId?: string;
  taskTitle?: string;
}

export default function TaskTimer({ taskId, projectId, taskTitle }: TaskTimerProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = async () => {
    try {
      const entry = await timesheetsService.startTimer(taskId, projectId);
      setActiveEntry(entry);
      setRunning(true);
      setElapsed(0);
      showToast.success("Timer started");
    } catch {
      showToast.error("Failed to start timer");
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;
    try {
      await timesheetsService.stopTimer(activeEntry.entryId);
      setRunning(false);
      setActiveEntry(null);
      setElapsed(0);
      showToast.success("Timer stopped and saved");
    } catch {
      showToast.error("Failed to stop timer");
    }
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2">
      <Clock className="w-4 h-4 text-gray-400" />
      {taskTitle && <span className="text-sm text-gray-600 truncate max-w-32">{taskTitle}</span>}
      {running && (
        <span className="text-sm font-mono text-blue-600 font-medium">
          {formatElapsed(elapsed)}
        </span>
      )}
      {running ? (
        <button
          onClick={stopTimer}
          className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-200"
        >
          <Square className="w-3 h-3" /> Stop
        </button>
      ) : (
        <button
          onClick={startTimer}
          className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-200"
        >
          <Play className="w-3 h-3" /> Start
        </button>
      )}
    </div>
  );
}
