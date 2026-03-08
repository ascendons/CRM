'use client';

import { useState, useEffect } from 'react';
import { attendanceApi, CheckInRequest } from '@/lib/api/attendance';
import { locationsApi } from '@/lib/api/locations';
import { getCurrentPosition, getDeviceInfo } from '@/lib/utils/geolocation';
import { toast } from 'react-hot-toast';

interface CheckInButtonProps {
  onSuccess?: () => void;
  officeLocationId?: string;
}

interface OfficeLocation {
  id: string;
  locationId: string;
  name: string;
  address: string;
}

export function CheckInButton({ onSuccess, officeLocationId }: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'OFFICE' | 'REMOTE' | 'FIELD'>('OFFICE');
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(officeLocationId || '');

  useEffect(() => {
    loadOfficeLocations();
  }, []);

  useEffect(() => {
    if (officeLocationId) {
      setSelectedLocationId(officeLocationId);
    }
  }, [officeLocationId]);

  const loadOfficeLocations = async () => {
    try {
      const data = await locationsApi.getActiveLocations();
      setOfficeLocations(data || []);
      // Auto-select first location if not already set
      if (data && data.length > 0 && !selectedLocationId) {
        setSelectedLocationId(data[0].locationId || data[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load office locations:', error);
    }
  };

  const handleCheckIn = async () => {
    // Validate office location for OFFICE type
    if (attendanceType === 'OFFICE' && !selectedLocationId) {
      toast.error('Please select an office location or create one in Settings');
      return;
    }

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
        officeLocationId: attendanceType === 'OFFICE' ? selectedLocationId : undefined
      };

      console.log('Check-in request:', request);

      const response = await attendanceApi.checkIn(request);

      toast.success('✅ Checked in successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Check-in error:', error);

      const errorMessage = error.message || error.response?.data?.message || 'Failed to check in';

      if (errorMessage.includes('permission')) {
        toast.error('📍 Please enable location access to check in');
      } else if (errorMessage.includes('geofence')) {
        toast.error(errorMessage);
      } else if (errorMessage.includes('Office location')) {
        toast.error('⚠️ ' + errorMessage);
      } else {
        toast.error(errorMessage);
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

      {/* Office Location Selector (only for OFFICE type) */}
      {attendanceType === 'OFFICE' && officeLocations.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Office Location
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {officeLocations.map((location) => (
              <option key={location.id} value={location.locationId || location.id}>
                {location.name} - {location.address}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Warning if no office locations configured */}
      {attendanceType === 'OFFICE' && officeLocations.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ No office locations configured. Please contact your admin or create one in Settings.
          </p>
        </div>
      )}

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
