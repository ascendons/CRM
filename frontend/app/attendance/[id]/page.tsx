'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { attendanceApi } from '@/lib/api/attendance';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  Coffee,
  Building2,
  Home,
  Briefcase
} from 'lucide-react';

interface AttendanceLocation {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

interface BreakRecord {
  id: string;
  type: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  location?: AttendanceLocation;
}

interface Attendance {
  id: string;
  attendanceId: string;
  userId: string;
  userName: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLocation: AttendanceLocation;
  checkOutLocation?: AttendanceLocation;
  type: string;
  status: string;
  totalWorkMinutes?: number;
  overtimeMinutes?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  breaks?: BreakRecord[];
  shiftId?: string;
  shiftName?: string;
  officeLocationId?: string;
  officeLocationName?: string;
  isLocationVerified: boolean;
  locationValidationMessage?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
  userNotes?: string;
  managerNotes?: string;
  systemNotes?: string;
  createdAt: string;
  lastModifiedAt: string;
}

export default function AttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const attendanceId = params.id as string;

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendanceDetails();
  }, [attendanceId]);

  const loadAttendanceDetails = async () => {
    try {
      setLoading(true);
      const data = await attendanceApi.getAttendanceById<Attendance>(attendanceId);
      setAttendance(data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      toast.error('Failed to load attendance details');
      router.push('/attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PRESENT: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Present' },
      LATE: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle, label: 'Late' },
      HALF_DAY: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock, label: 'Half Day' },
      ABSENT: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Absent' },
      ON_LEAVE: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Calendar, label: 'On Leave' },
      HOLIDAY: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Calendar, label: 'Holiday' },
      WEEK_OFF: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Home, label: 'Week Off' },
      PENDING: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock, label: 'Pending' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      OFFICE: Building2,
      REMOTE: Home,
      FIELD: Briefcase,
      HYBRID: Building2,
      CLIENT_SITE: Briefcase,
    };
    return icons[type as keyof typeof icons] || Building2;
  };

  const getBreakTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      LUNCH: '🍽️ Lunch Break',
      TEA: '☕ Tea Break',
      PERSONAL: '🚶 Personal',
      PRAYER: '🕌 Prayer',
      SMOKING: '🚬 Smoking',
      MEETING: '👥 Meeting',
    };
    return labels[type] || type;
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attendance) {
    return null;
  }

  const TypeIcon = getTypeIcon(attendance.type);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/attendance')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Details</h1>
            <p className="text-gray-600 mt-1">ID: {attendance.attendanceId}</p>
          </div>
        </div>
        {getStatusBadge(attendance.status)}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Date & Type Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">{formatDate(attendance.attendanceDate)}</h2>
                <p className="text-blue-100 mt-1">{attendance.userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <TypeIcon className="h-5 w-5" />
              <span className="font-semibold">{attendance.type}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-6">
          {/* Check-in & Check-out Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-in */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-800 font-semibold mb-3">
                <Clock className="h-5 w-5" />
                Check-in Time
              </div>
              <p className="text-3xl font-bold text-green-900 mb-3">{formatTime(attendance.checkInTime)}</p>
              {attendance.lateMinutes! > 0 && (
                <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-3 py-2 text-sm">
                  <span className="text-yellow-800 font-medium">⚠ Late by {attendance.lateMinutes} minutes</span>
                </div>
              )}
            </div>

            {/* Check-out */}
            <div className={`${attendance.checkOutTime ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
              <div className={`flex items-center gap-2 ${attendance.checkOutTime ? 'text-blue-800' : 'text-gray-600'} font-semibold mb-3`}>
                <Clock className="h-5 w-5" />
                Check-out Time
              </div>
              {attendance.checkOutTime ? (
                <>
                  <p className="text-3xl font-bold text-blue-900 mb-3">{formatTime(attendance.checkOutTime)}</p>
                  {attendance.earlyLeaveMinutes! > 0 && (
                    <div className="bg-orange-100 border border-orange-200 rounded-lg px-3 py-2 text-sm">
                      <span className="text-orange-800 font-medium">⚠ Early leave by {attendance.earlyLeaveMinutes} minutes</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-2xl text-gray-500">Not checked out yet</p>
              )}
            </div>
          </div>

          {/* Work Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">Total Work</p>
                <p className="text-2xl font-bold text-blue-900">{formatDuration(attendance.totalWorkMinutes)}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-sm text-purple-600 mb-1">Overtime</p>
                <p className="text-2xl font-bold text-purple-900">{formatDuration(attendance.overtimeMinutes)}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <p className="text-sm text-yellow-600 mb-1">Late</p>
                <p className="text-2xl font-bold text-yellow-900">{attendance.lateMinutes || 0} min</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-600 mb-1">Early Leave</p>
                <p className="text-2xl font-bold text-orange-900">{attendance.earlyLeaveMinutes || 0} min</p>
              </div>
            </div>
          </div>

          {/* Breaks */}
          {attendance.breaks && attendance.breaks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Coffee className="h-5 w-5 text-blue-600" />
                Breaks ({attendance.breaks.length})
              </h3>
              <div className="space-y-3">
                {attendance.breaks.map((breakRecord) => (
                  <div key={breakRecord.id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{getBreakTypeLabel(breakRecord.type).split(' ')[0]}</span>
                      <div>
                        <p className="font-medium text-slate-900">{getBreakTypeLabel(breakRecord.type).substring(2)}</p>
                        <p className="text-sm text-slate-600">
                          {formatTime(breakRecord.startTime)}
                          {breakRecord.endTime && ` - ${formatTime(breakRecord.endTime)}`}
                        </p>
                      </div>
                    </div>
                    {breakRecord.durationMinutes !== undefined && (
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Duration</p>
                        <p className="font-bold text-slate-900">{formatDuration(breakRecord.durationMinutes)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Total break time: <span className="font-bold">
                    {formatDuration(attendance.breaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0))}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Location Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Location Details
            </h3>

            {/* Shift & Office Location */}
            {(attendance.shiftName || attendance.officeLocationName) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {attendance.shiftName && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-600 mb-1">Shift</p>
                    <p className="font-semibold text-slate-900">{attendance.shiftName}</p>
                  </div>
                )}
                {attendance.officeLocationName && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-600 mb-1">Office Location</p>
                    <p className="font-semibold text-slate-900">{attendance.officeLocationName}</p>
                  </div>
                )}
              </div>
            )}

            {/* GPS Verification */}
            <div className={`${attendance.isLocationVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-4 mb-4`}>
              <div className="flex items-center gap-2 mb-2">
                {attendance.isLocationVerified ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Location Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Location Not Verified</span>
                  </>
                )}
              </div>
              {attendance.locationValidationMessage && (
                <p className="text-sm text-slate-700">{attendance.locationValidationMessage}</p>
              )}
            </div>

            {/* GPS Coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm text-emerald-700 font-medium mb-2">Check-in Location</p>
                <button
                  onClick={() => openMaps(attendance.checkInLocation.latitude, attendance.checkInLocation.longitude)}
                  className="text-xs font-mono text-emerald-900 hover:underline mb-2 block"
                >
                  📍 {attendance.checkInLocation.latitude.toFixed(6)}, {attendance.checkInLocation.longitude.toFixed(6)}
                </button>
                {attendance.checkInLocation.address && (
                  <p className="text-sm text-emerald-800">{attendance.checkInLocation.address}</p>
                )}
                {attendance.checkInLocation.accuracy && (
                  <p className="text-xs text-emerald-600 mt-1">Accuracy: ±{attendance.checkInLocation.accuracy.toFixed(0)}m</p>
                )}
              </div>

              {attendance.checkOutLocation && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <p className="text-sm text-sky-700 font-medium mb-2">Check-out Location</p>
                  <button
                    onClick={() => openMaps(attendance.checkOutLocation!.latitude, attendance.checkOutLocation!.longitude)}
                    className="text-xs font-mono text-sky-900 hover:underline mb-2 block"
                  >
                    📍 {attendance.checkOutLocation.latitude.toFixed(6)}, {attendance.checkOutLocation.longitude.toFixed(6)}
                  </button>
                  {attendance.checkOutLocation.address && (
                    <p className="text-sm text-sky-800">{attendance.checkOutLocation.address}</p>
                  )}
                  {attendance.checkOutLocation.accuracy && (
                    <p className="text-xs text-sky-600 mt-1">Accuracy: ±{attendance.checkOutLocation.accuracy.toFixed(0)}m</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {(attendance.userNotes || attendance.managerNotes || attendance.systemNotes) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="space-y-3">
                {attendance.userNotes && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-700 font-medium mb-1">User Notes</p>
                    <p className="text-slate-800">{attendance.userNotes}</p>
                  </div>
                )}
                {attendance.managerNotes && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-sm text-purple-700 font-medium mb-1">Manager Notes</p>
                    <p className="text-slate-800">{attendance.managerNotes}</p>
                  </div>
                )}
                {attendance.systemNotes && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 font-medium mb-1">System Notes</p>
                    <p className="text-slate-800">{attendance.systemNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval Status */}
          {attendance.requiresApproval && attendance.approvedBy && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                <CheckCircle className="h-5 w-5" />
                Approved
              </div>
              <div className="text-sm space-y-1">
                <p className="text-green-800">Approved by: <span className="font-semibold">{attendance.approvedBy}</span></p>
                {attendance.approvedAt && (
                  <p className="text-green-700">Approved at: {formatDateTime(attendance.approvedAt)}</p>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Created: {formatDateTime(attendance.createdAt)}</span>
              </div>
              {attendance.lastModifiedAt !== attendance.createdAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Last Updated: {formatDateTime(attendance.lastModifiedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
