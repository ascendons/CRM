'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { locationsApi } from '@/lib/api/locations';
import { getCurrentPosition } from '@/lib/utils/geolocation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Navigation } from 'lucide-react';
import Link from 'next/link';

const LOCATION_TYPES = ['HEAD_OFFICE', 'BRANCH', 'CLIENT_SITE', 'COWORKING'];

export default function EditLocationPage() {
  const router = useRouter();
  const params = useParams();
  const locationId = params.locationId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    loadLocation();
  }, [locationId]);

  const loadLocation = async () => {
    try {
      setLoading(true);
      const data = await locationsApi.getLocationById(locationId);
      setFormData(data);
    } catch (error) {
      console.error('Failed to load location:', error);
      toast.error('Failed to load location');
      router.push('/admin/settings/locations');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const position = await getCurrentPosition();
      setFormData((prev: any) => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }));
      toast.success('Location captured successfully!');
    } catch (error: any) {
      console.error('Failed to get location:', error);
      toast.error('Failed to get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await locationsApi.updateLocation(locationId, formData);
      toast.success('Location updated successfully!');
      router.push('/admin/settings/locations');
    } catch (error: any) {
      console.error('Failed to update location:', error);
      toast.error(error.message || 'Failed to update location');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/settings/locations" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Locations
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit Location</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Copy all form sections from new/page.tsx but with formData values */}
          {/* For brevity, implementing key fields only */}
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location Code</label>
                <input type="text" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Address *</label>
                <textarea required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                <input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                <input type="text" required value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">GPS Coordinates</h2>
              <button type="button" onClick={handleGetCurrentLocation} disabled={gettingLocation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm flex items-center gap-2">
                {gettingLocation ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Navigation className="h-4 w-4" />Update Location</>}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Latitude *</label>
                <input type="number" step="any" required value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Longitude *</label>
                <input type="number" step="any" required value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Radius (m) *</label>
                <input type="number" min="10" required value={formData.radiusMeters} onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={formData.enforceGeofence} onChange={(e) => setFormData({ ...formData, enforceGeofence: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                <span className="text-sm font-medium text-slate-700">Enforce Geofence</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="h-5 w-5" />Update Location</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
