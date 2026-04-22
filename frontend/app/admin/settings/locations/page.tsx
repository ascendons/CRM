"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { locationsApi } from "@/lib/api/locations";
import { toast } from "react-hot-toast";
import {
  Plus,
  MapPin,
  Edit,
  Trash2,
  Building2,
  CheckCircle2,
  XCircle,
  Navigation,
} from "lucide-react";

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await locationsApi.getAllLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load locations:", error);
      toast.error("Failed to load locations");
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) {
      return;
    }

    try {
      setDeleteLoading(locationId);
      await locationsApi.deleteLocation(locationId);
      toast.success("Location deleted successfully");
      loadLocations();
    } catch (error: any) {
      console.error("Failed to delete location:", error);
      toast.error(error.message || "Failed to delete location");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Office Locations</h1>
            <p className="text-slate-600 mt-1">Manage office locations and geofencing</p>
          </div>
          <Link
            href="/admin/settings/locations/new"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Location
          </Link>
        </div>

        {/* Locations Grid */}
        {locations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <MapPin className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Locations Added</h3>
            <p className="text-slate-600 mb-6">
              Add your first office location to enable GPS-based attendance.
            </p>
            <Link
              href="/admin/settings/locations/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Your First Location
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{location.name}</h3>
                        {location.isHeadquarters && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            HQ
                          </span>
                        )}
                      </div>
                      {location.code && <p className="text-sm text-slate-500">{location.code}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {location.isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-slate-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-900">{location.address}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {[location.city, location.state, location.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Geofencing */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Navigation className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Radius</p>
                      </div>
                      <p className="text-sm font-bold text-blue-900">{location.radiusMeters}m</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <p className="text-xs text-purple-600 font-medium">Type</p>
                      </div>
                      <p className="text-sm font-bold text-purple-900">
                        {location.type || "OFFICE"}
                      </p>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-600 font-medium mb-1">Coordinates</p>
                        <p className="text-xs font-mono text-emerald-900">
                          {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                        </p>
                      </div>
                      {location.enforceGeofence && (
                        <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded">
                          Enforced
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  {location.contactPerson && (
                    <div className="text-xs text-slate-600 mb-4">
                      <p className="font-medium">Contact: {location.contactPerson}</p>
                      {location.contactPhone && (
                        <p className="text-slate-500">{location.contactPhone}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-200">
                    <Link
                      href={`/admin/settings/locations/${location.locationId}`}
                      className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(location.locationId)}
                      disabled={deleteLoading === location.locationId}
                      className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {deleteLoading === location.locationId ? (
                        <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
