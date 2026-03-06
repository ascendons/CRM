'use client';

import { useState } from 'react';
import { attendanceApi, CheckInRequest } from '@/lib/api/attendance';
import { getCurrentPosition, getDeviceInfo } from '@/lib/utils/geolocation';
import { toast } from 'react-hot-toast';

interface CheckInButtonProps {
  onSuccess?: () => void;
  officeLocationId?: string;
}

export function CheckInButton({ onSuccess, officeLocationId }: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'OFFICE' | 'REMOTE' | 'FIELD'>('OFFICE');

  const handleCheckIn = async () => {
    setLoading(true);

    try {
      // Get geolocation
      const position = await getCurrentPosition();

      const request: CheckInRequest = {
        type: attendanceType,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        deviceInfo: getDeviceInfo(),
        officeLocationId: attendanceType === 'OFFICE' ? officeLocationId : undefined
      };

      const response = await attendanceApi.checkIn(request);

      if (response.success) {
        toast.success('✅ Checked in successfully!');
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to check in');
      }
    } catch (error: any) {
      console.error('Check-in error:', error);

      if (error.message?.includes('permission')) {
        toast.error('📍 Please enable location access to check in');
      } else if (error.message?.includes('geofence')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to check in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setAttendanceType('OFFICE')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            attendanceType === 'OFFICE'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Office
        </button>
        <button
          onClick={() => setAttendanceType('REMOTE')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            attendanceType === 'REMOTE'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Remote
        </button>
        <button
          onClick={() => setAttendanceType('FIELD')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            attendanceType === 'FIELD'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Field
        </button>
      </div>

      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400
                   text-white font-semibold rounded-xl text-lg transition-colors
                   flex items-center justify-center gap-2 shadow-lg"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Getting Location...
          </>
        ) : (
          <>
            📍 Check In ({attendanceType})
          </>
        )}
      </button>
    </div>
  );
}
