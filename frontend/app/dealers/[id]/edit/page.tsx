"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { dealersService, Dealer, CreateDealerRequest } from "@/lib/dealers";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { ArrowLeft, Save } from "lucide-react";

const TIERS = ["PLATINUM", "GOLD", "SILVER", "BRONZE"] as const;
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

interface FormErrors {
  [key: string]: string;
}

export default function EditDealerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreateDealerRequest>({
    companyName: "",
    tier: "SILVER",
    region: "",
    territory: "",
    creditLimit: 0,
    contactPerson: "",
    email: "",
    phone: "",
    GSTIN: "",
    status: "ACTIVE",
    onboardedDate: new Date().toISOString().split("T")[0],
    accountManagerId: "",
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadDealer();
  }, [id]);

  async function loadDealer() {
    setFetching(true);
    try {
      const dealer = await dealersService.getDealerById(id);
      setFormData({
        companyName: dealer.companyName || "",
        tier: dealer.tier || "SILVER",
        region: dealer.region || "",
        territory: dealer.territory || "",
        creditLimit: dealer.creditLimit || 0,
        contactPerson: dealer.contactPerson || "",
        email: dealer.email || "",
        phone: dealer.phone || "",
        GSTIN: dealer.GSTIN || "",
        status: dealer.status || "ACTIVE",
        onboardedDate: dealer.onboardedDate
          ? dealer.onboardedDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        accountManagerId: dealer.accountManagerId || "",
      });
    } catch {
      showToast.error("Failed to load dealer.");
      router.push("/dealers");
    } finally {
      setFetching(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "creditLimit" ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required.";
    if (!formData.contactPerson.trim())
      newErrors.contactPerson = "Contact person is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone is required.";
    if (formData.creditLimit < 0)
      newErrors.creditLimit = "Credit limit cannot be negative.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await dealersService.updateDealer(id, formData);
      showToast.success("Dealer updated successfully.");
      router.push(`/dealers/${id}`);
    } catch (err: any) {
      showToast.error(err?.message || "Failed to update dealer.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/dealers/${id}`}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Dealer</h1>
            <p className="text-sm text-slate-500">
              Update dealer information
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          {/* Company Info */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Company Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.companyName ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {errors.companyName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tier
                </label>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Territory
                </label>
                <input
                  type="text"
                  name="territory"
                  value={formData.territory}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Credit Limit (INR)
                </label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  min={0}
                  step={1000}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.creditLimit ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {errors.creditLimit && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.creditLimit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  name="GSTIN"
                  value={formData.GSTIN}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Onboarded Date
                </label>
                <input
                  type="date"
                  name="onboardedDate"
                  value={formData.onboardedDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Manager ID
                </label>
                <input
                  type="text"
                  name="accountManagerId"
                  value={formData.accountManagerId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contactPerson
                      ? "border-red-400"
                      : "border-slate-200"
                  }`}
                />
                {errors.contactPerson && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.contactPerson}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              href={`/dealers/${id}`}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
