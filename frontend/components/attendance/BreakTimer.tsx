'use client';

import { useState, useEffect } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import { toast } from 'react-hot-toast';
import { Coffee, Clock, Play, Square } from 'lucide-react';

interface BreakTimerProps {
  attendanceId: string;
  activeBreak?: any;
  onBreakUpdate: () => void;
}

const BREAK_TYPES = [
  { value: 'LUNCH', label: 'Lunch Break', icon: '🍽️' },
  { value: 'TEA', label: 'Tea Break', icon: '☕' },
  { value: 'PERSONAL', label: 'Personal', icon: '🚶' },
  { value: 'PRAYER', label: 'Prayer', icon: '🕌' },
  { value: 'SMOKING', label: 'Smoking', icon: '🚬' },
  { value: 'MEETING', label: 'Meeting', icon: '👥' }
];

export function BreakTimer({ attendanceId, activeBreak, onBreakUpdate }: BreakTimerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState<string>('LUNCH');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time for active break
  useEffect(() => {
    if (!activeBreak) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(activeBreak.startTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000); // seconds
      setElapsedTime(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeBreak]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartBreak = async () => {
    try {
      setLoading(true);

      await attendanceApi.startBreak({
        attendanceId,
        type: selectedBreakType as any
      });

      toast.success('Break started!');
      onBreakUpdate();
    } catch (error: any) {
      console.error('Failed to start break:', error);
      toast.error(error.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setLoading(true);

      await attendanceApi.endBreak({
        attendanceId,
        breakId: activeBreak.id
      });

      toast.success('Break ended!');
      onBreakUpdate();
    } catch (error: any) {
      console.error('Failed to end break:', error);
      toast.error(error.message || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  if (activeBreak) {
    // Show active break timer
    const breakTypeInfo = BREAK_TYPES.find(bt => bt.value === activeBreak.type) || BREAK_TYPES[0];

    return (
      <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <span className="text-xl">{breakTypeInfo.icon}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {breakTypeInfo.label}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Break in progress</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Clock className="h-5 w-5" />
            <span className="text-2xl font-bold font-mono tabular-nums">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <button
            onClick={handleEndBreak}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400
                     text-white font-semibold rounded-lg text-sm transition-colors
                     flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            End Break
          </button>
        </div>
      </div>
    );
  }

  // Show break start controls
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <div className="flex items-center gap-2 mb-3">
        <Coffee className="h-5 w-5 text-white" />
        <p className="text-sm font-semibold text-white">Take a Break</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {BREAK_TYPES.map((breakType) => (
          <button
            key={breakType.value}
            onClick={() => setSelectedBreakType(breakType.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedBreakType === breakType.value
                ? 'bg-white text-blue-700'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="block mb-1">{breakType.icon}</span>
            {breakType.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleStartBreak}
        disabled={loading}
        className="w-full py-2.5 bg-white text-blue-700 hover:bg-blue-50 disabled:bg-gray-400
                   font-semibold rounded-lg text-sm transition-colors
                   flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        Start Break
      </button>
    </div>
  );
}
