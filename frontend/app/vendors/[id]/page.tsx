"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { procurementService, Vendor, RateContract, VendorStatus } from "@/lib/procurement";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Star, Pencil, Trash2, Building2, Phone, Mail, CreditCard } from "lucide-react";

const STATUS_COLORS: Record<VendorStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-700",
  BLACKLISTED: "bg-red-100 text-red-800",
};

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              s <= (hover || value) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function VendorDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [rateContracts, setRateContracts] = useState<RateContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    load();
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [v, rcs] = await Promise.all([
        procurementService.getVendorById(id),
        procurementService.getAllRateContracts(),
      ]);
      setVendor(v);
      setRating(v.rating ?? 0);
      setRateContracts(rcs.filter((rc) => rc.vendorId === id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);
    try {
      setRatingLoading(true);
      await procurementService.updateVendorRating(id, newRating);
      showToast.success("Rating updated");
    } catch {
      showToast.error("Failed to update rating");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await procurementService.deleteVendor(id);
      showToast.success("Vendor deleted");
      router.push("/vendors");
    } catch {
      showToast.error("Failed to delete vendor");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg">
          {error ?? "Vendor not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/vendors")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{vendor.companyName}</h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[vendor.status]}`}
              >
                {vendor.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">{vendor.contactPerson}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/vendors/${id}/edit`)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Vendor Rating</h2>
        <div className="flex items-center gap-3">
          <StarRatingInput value={rating} onChange={handleRatingChange} />
          {ratingLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          )}
          <span className="text-slate-500 text-sm">{rating > 0 ? `${rating}/5` : "Not rated"}</span>
        </div>
      </div>

      {/* Contact & Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-600">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">{vendor.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-700">{vendor.phone}</span>
            </div>
            {vendor.GSTIN && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">GSTIN: {vendor.GSTIN}</span>
              </div>
            )}
            {vendor.address && (
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-700">
                  {[
                    vendor.address.street,
                    vendor.address.city,
                    vendor.address.state,
                    vendor.address.pincode,
                    vendor.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-600">Financial Details</h2>
          <div className="space-y-3 text-sm">
            {vendor.paymentTermsDays != null && (
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Terms</span>
                <span className="font-medium text-slate-700">{vendor.paymentTermsDays} days</span>
              </div>
            )}
            {vendor.creditLimit != null && (
              <div className="flex justify-between">
                <span className="text-slate-500">Credit Limit</span>
                <span className="font-medium text-slate-700">
                  ₹{vendor.creditLimit.toLocaleString()}
                </span>
              </div>
            )}
            {vendor.bankDetails && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank</span>
                  <span className="font-medium text-slate-700">{vendor.bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account No</span>
                  <span className="font-medium text-slate-700">{vendor.bankDetails.accountNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IFSC</span>
                  <span className="font-medium text-slate-700">{vendor.bankDetails.ifsc}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      {vendor.categories?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {vendor.categories.map((c) => (
              <span key={c} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-lg">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rate Contracts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">
            Rate Contracts ({rateContracts.length})
          </h2>
        </div>
        {rateContracts.length === 0 ? (
          <p className="text-slate-400 text-sm p-5">No rate contracts found for this vendor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">RC Number</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Valid From</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Valid To</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Items</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Auto Renew</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {rateContracts.map((rc) => (
                  <tr key={rc.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {rc.rcNumber ?? rc.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(rc.validFrom).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(rc.validTo).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{rc.lineItems.length}</td>
                    <td className="px-4 py-3 text-slate-600">{rc.autoRenew ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          rc.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : rc.status === "TERMINATED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {rc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Delete Vendor</h2>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to delete <strong>{vendor.companyName}</strong>? This cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
