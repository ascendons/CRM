"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  procurementService,
  CreateVendorRequest,
  VendorCategory,
  VendorStatus,
} from "@/lib/procurement";
import { showToast } from "@/lib/toast";
import { ArrowLeft } from "lucide-react";

const CATEGORIES: VendorCategory[] = ["HVAC", "ELECTRICAL", "PLUMBING", "GENERAL"];

const defaultForm: CreateVendorRequest = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  GSTIN: "",
  paymentTermsDays: undefined,
  creditLimit: undefined,
  status: "ACTIVE",
  categories: [],
  bankDetails: { accountNo: "", ifsc: "", bankName: "" },
  address: { street: "", city: "", state: "", pincode: "", country: "" },
};

export default function NewVendorPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateVendorRequest>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const setBankDetail = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails!, [field]: value },
    }));
  };

  const setAddress = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address!, [field]: value },
    }));
  };

  const toggleCategory = (cat: VendorCategory) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.contactPerson.trim()) e.contactPerson = "Contact person is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      await procurementService.createVendor(form);
      showToast.success("Vendor created successfully");
      router.push("/vendors");
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to create vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add Vendor</h1>
          <p className="text-slate-500 text-sm">Fill in the details to register a new vendor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.contactPerson && (
                <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">GSTIN</label>
              <input
                type="text"
                value={form.GSTIN}
                onChange={(e) => set("GSTIN", e.target.value)}
                placeholder="22AAAAA0000A1Z5"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as VendorStatus)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLACKLISTED">Blacklisted</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                min={0}
                value={form.paymentTermsDays ?? ""}
                onChange={(e) =>
                  set("paymentTermsDays", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.creditLimit ?? ""}
                onChange={(e) =>
                  set("creditLimit", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.categories.includes(cat)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Bank Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Account No</label>
              <input
                type="text"
                value={form.bankDetails?.accountNo ?? ""}
                onChange={(e) => setBankDetail("accountNo", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">IFSC Code</label>
              <input
                type="text"
                value={form.bankDetails?.ifsc ?? ""}
                onChange={(e) => setBankDetail("ifsc", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankDetails?.bankName ?? ""}
                onChange={(e) => setBankDetail("bankName", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-700 mb-2">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Street</label>
              <input
                type="text"
                value={form.address?.street ?? ""}
                onChange={(e) => setAddress("street", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
              <input
                type="text"
                value={form.address?.city ?? ""}
                onChange={(e) => setAddress("city", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">State</label>
              <input
                type="text"
                value={form.address?.state ?? ""}
                onChange={(e) => setAddress("state", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pincode</label>
              <input
                type="text"
                value={form.address?.pincode ?? ""}
                onChange={(e) => setAddress("pincode", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
              <input
                type="text"
                value={form.address?.country ?? ""}
                onChange={(e) => setAddress("country", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Create Vendor"}
          </button>
        </div>
      </form>
    </div>
  );
}
