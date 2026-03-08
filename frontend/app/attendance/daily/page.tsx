'use client';

import { useEffect, useState } from 'react';
import { attendanceApi } from '@/lib/api/attendance';
import { locationsApi } from '@/lib/api/locations';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface AttendanceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

interface BreakRecord {
  id: string;
  type: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
}

interface TodayAttendance {
  attendanceId: string;
  userId: string;
  userName: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  type: string;
  status: string;
  totalWorkMinutes?: number;
  breaks: BreakRecord[];
  isLocationVerified: boolean;
  checkInLocation?: AttendanceLocation;
  checkOutLocation?: AttendanceLocation;
}

interface OfficeLocation {
  id: string;
  locationId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export default function DailyAttendancePage() {
  const [attendance, setAttendance] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onBreak, setOnBreak] = useState(false);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  useEffect(() => {
    loadTodayAttendance();
    getCurrentLocation();
    loadOfficeLocations();

    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check if currently on break
    if (attendance?.breaks) {
      const activeBreak = attendance.breaks.find(b => !b.endTime);
      setOnBreak(!!activeBreak);
    }
  }, [attendance]);

  const loadTodayAttendance = async () => {
    try {
      setLoading(true);
      const data = await attendanceApi.getMyToday();
      setAttendance(data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to load attendance:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOfficeLocations = async () => {
    try {
      const data = await locationsApi.getActiveLocations();
      console.log('Loaded office locations:', data);
      setOfficeLocations(data || []);
      // Auto-select first location if available - use locationId (custom ID)
      if (data && data.length > 0) {
        const firstLocationId = data[0].locationId || data[0].id;
        console.log('Auto-selecting location:', firstLocationId);
        setSelectedLocationId(firstLocationId);
      }
    } catch (error: any) {
      console.error('Failed to load office locations:', error);
      toast.error('Failed to load office locations. Please create one in settings.');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        setLocationError('');
      },
      (error) => {
        setLocationError(error.message);
        toast.error('Failed to get your location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckIn = async (type: 'OFFICE' | 'REMOTE' | 'FIELD') => {
    if (!currentLocation) {
      toast.error('Getting your location...');
      getCurrentLocation();
      return;
    }

    // Validate office location for OFFICE type
    if (type === 'OFFICE' && !selectedLocationId) {
      toast.error('Please wait while office locations are loading...');
      return;
    }

    setActionLoading(true);
    try {
      const checkInData: any = {
        type,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        deviceInfo: navigator.userAgent
      };

      // Add officeLocationId for OFFICE check-ins
      if (type === 'OFFICE') {
        checkInData.officeLocationId = selectedLocationId;
      }

      console.log('Check-in request:', checkInData);
      console.log('Selected location ID:', selectedLocationId);
      console.log('Available locations:', officeLocations);

      await attendanceApi.checkIn(checkInData);

      toast.success('Checked in successfully!');
      loadTodayAttendance();
    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast.error(error.response?.data?.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendance || !currentLocation) return;

    setActionLoading(true);
    try {
      await attendanceApi.checkOut({
        attendanceId: attendance.attendanceId,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy
      });

      toast.success('Checked out successfully!');
      loadTodayAttendance();
    } catch (error: any) {
      console.error('Check-out failed:', error);
      toast.error(error.response?.data?.message || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async (breakType: string) => {
    if (!attendance) return;

    setActionLoading(true);
    try {
      await attendanceApi.startBreak({
        attendanceId: attendance.attendanceId,
        type: breakType as any,
        latitude: currentLocation?.coords.latitude,
        longitude: currentLocation?.coords.longitude,
        accuracy: currentLocation?.coords.accuracy
      });

      toast.success('Break started');
      loadTodayAttendance();
    } catch (error: any) {
      console.error('Start break failed:', error);
      toast.error(error.response?.data?.message || 'Failed to start break');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!attendance) return;

    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (!activeBreak) return;

    setActionLoading(true);
    try {
      await attendanceApi.endBreak({
        attendanceId: attendance.attendanceId,
        breakId: activeBreak.id,
        latitude: currentLocation?.coords.latitude,
        longitude: currentLocation?.coords.longitude,
        accuracy: currentLocation?.coords.accuracy
      });

      toast.success('Break ended');
      loadTodayAttendance();
    } catch (error: any) {
      console.error('End break failed:', error);
      toast.error(error.response?.data?.message || 'Failed to end break');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-800',
      LATE: 'bg-yellow-100 text-yellow-800',
      ABSENT: 'bg-red-100 text-red-800',
      HALF_DAY: 'bg-orange-100 text-orange-800',
      ON_LEAVE: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasCheckedIn = !!attendance?.checkInTime;
  const hasCheckedOut = !!attendance?.checkOutTime;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Attendance</h1>
          <p className="text-gray-600 mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/attendance"
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          View History
        </Link>
      </div>

      {/* Current Time Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <div className="text-center">
          <div className="text-6xl font-bold tracking-tight">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </div>
          <div className="text-blue-100 mt-2">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
        </div>

        {/* Location Status */}
        <div className="mt-6 pt-6 border-t border-blue-500/30">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="material-symbols-outlined text-lg">
              {currentLocation ? 'location_on' : 'location_off'}
            </span>
            <span>
              {currentLocation
                ? `Location: ${currentLocation.coords.accuracy?.toFixed(0)}m accuracy`
                : locationError || 'Getting location...'}
            </span>
            <button
              onClick={getCurrentLocation}
              className="ml-2 px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded-lg text-xs font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!hasCheckedIn && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Check In</h2>

          {/* Office Location Selector */}
          {officeLocations.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Office Location (for Office check-in)
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {officeLocations.map((location) => (
                  <option key={location.locationId || location.id} value={location.locationId || location.id}>
                    {location.name} - {location.address}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selected: {selectedLocationId || 'None'}
              </p>
            </div>
          )}

          {officeLocations.length === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No office locations found. Please ask your admin to create one in Settings → Office Locations.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleCheckIn('OFFICE')}
              disabled={actionLoading || !currentLocation}
              className="flex flex-col items-center gap-3 p-6 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-4xl">business</span>
              <span className="font-semibold">Office</span>
            </button>
            <button
              onClick={() => handleCheckIn('REMOTE')}
              disabled={actionLoading || !currentLocation}
              className="flex flex-col items-center gap-3 p-6 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-4xl">home</span>
              <span className="font-semibold">Remote</span>
            </button>
            <button
              onClick={() => handleCheckIn('FIELD')}
              disabled={actionLoading || !currentLocation}
              className="flex flex-col items-center gap-3 p-6 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-4xl">navigation</span>
              <span className="font-semibold">Field</span>
            </button>
          </div>
        </div>
      )}

      {/* Today's Attendance Summary */}
      {hasCheckedIn && attendance && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's Status</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(attendance.status)}`}>
                {attendance.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Check In/Out Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="material-symbols-outlined text-green-600 text-2xl">login</span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Check In</div>
                  <div className="text-2xl font-bold text-gray-900">{formatTime(attendance.checkInTime)}</div>
                  {attendance.isLocationVerified && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Location Verified
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <span className="material-symbols-outlined text-orange-600 text-2xl">logout</span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Check Out</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {hasCheckedOut ? formatTime(attendance.checkOutTime) : 'Not yet'}
                  </div>
                </div>
              </div>
            </div>

            {/* Work Duration */}
            {!hasCheckedOut && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">Work Duration</div>
                    <div className="text-2xl font-bold text-blue-900">{formatDuration(attendance.totalWorkMinutes)}</div>
                  </div>
                  <span className="material-symbols-outlined text-blue-600 text-4xl">schedule</span>
                </div>
              </div>
            )}

            {/* Break Management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Breaks</h3>
                {hasCheckedIn && !hasCheckedOut && (
                  <>
                    {!onBreak ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartBreak('LUNCH')}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Lunch Break
                        </button>
                        <button
                          onClick={() => handleStartBreak('TEA')}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Tea Break
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleEndBreak}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
                      >
                        End Break
                      </button>
                    )}
                  </>
                )}
              </div>

              {attendance.breaks.length > 0 ? (
                <div className="space-y-2">
                  {attendance.breaks.map((breakRecord, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-600">coffee</span>
                        <div>
                          <div className="font-medium text-gray-900">{breakRecord.type}</div>
                          <div className="text-sm text-gray-600">
                            {formatTime(breakRecord.startTime)} - {breakRecord.endTime ? formatTime(breakRecord.endTime) : 'Ongoing'}
                          </div>
                        </div>
                      </div>
                      {breakRecord.durationMinutes && (
                        <div className="text-sm font-medium text-gray-700">
                          {formatDuration(breakRecord.durationMinutes)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No breaks taken today
                </div>
              )}
            </div>

            {/* Check Out Button */}
            {hasCheckedIn && !hasCheckedOut && !onBreak && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading || !currentLocation}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? 'Processing...' : 'Check Out'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* No Attendance Message */}
      {!attendance && !loading && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <span className="text-6xl mb-4 block">👋</span>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to start your day?</h3>
          <p className="text-gray-600">
            Check in to start tracking your attendance
          </p>
        </div>
      )}
    </div>
  );
}
