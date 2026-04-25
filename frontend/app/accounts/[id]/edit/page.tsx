"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Account, UpdateAccountRequest } from "@/types/account";
import { accountsService } from "@/lib/accounts";
import { authService } from "@/lib/auth";
import { CountryStateSelector } from "@/components/common/CountryStateSelector";
import { ChevronRight } from "lucide-react";

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [parentAccounts, setParentAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateAccountRequest>({});

  const loadAccount = async () => {
    try {
      const data = await accountsService.getAccountById(id);
      setAccount(data);
      // Pre-populate form
      setFormData({
        accountName: data.accountName,
        parentAccountId: data.parentAccountId,
        accountType: data.accountType,
        industry: data.industry,
        companySize: data.companySize,
        annualRevenue: data.annualRevenue,
        numberOfEmployees: data.numberOfEmployees,
        ownership: data.ownership,
        phone: data.phone,
        fax: data.fax,
        website: data.website,
        email: data.email,
        billingStreet: data.billingStreet,
        billingCity: data.billingCity,
        billingState: data.billingState,
        billingPostalCode: data.billingPostalCode,
        billingCountry: data.billingCountry,
        shippingStreet: data.shippingStreet,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: data.shippingCountry,
        tickerSymbol: data.tickerSymbol,
        sicCode: data.sicCode,
        naicsCode: data.naicsCode,
        dunsNumber: data.dunsNumber,
        taxId: data.taxId,
        linkedInPage: data.linkedInPage,
        twitterHandle: data.twitterHandle,
        facebookPage: data.facebookPage,
        paymentTerms: data.paymentTerms,
        creditStatus: data.creditStatus,
        creditLimit: data.creditLimit,
        currency: data.currency,
        accountStatus: data.accountStatus,
        description: data.description,
        rating: data.rating,
        tags: data.tags,
        notes: data.notes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    }
  };

  const loadParentAccounts = async () => {
    try {
      const data = await accountsService.getAllAccounts();
      setParentAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadAccount();
    loadParentAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updated = await accountsService.updateAccount(id, formData);
      router.push(`/accounts/${updated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({ ...prev, tags }));
  };

  if (!account) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/accounts" className="hover:text-primary">Accounts</Link>
          <ChevronRight className="h-4 w-4" />
          {account && (
            <>
              <Link href={`/accounts/${account.id}`} className="hover:text-primary">{account.accountName}</Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-slate-900 font-medium">Edit</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Edit Account</h1>
          <p className="text-slate-500 mt-1">Update account information</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountName"
                  required
                  value={formData.accountName || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Parent Account</label>
                <select
                  name="parentAccountId"
                  value={formData.parentAccountId || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select Parent Account...</option>
                  {parentAccounts
                    .filter((acc) => acc.id !== account.id)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Account Type</label>
                <select
                  name="accountType"
                  value={formData.accountType || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Customer">Customer</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Partner">Partner</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Competitor">Competitor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Industry</label>
                <select
                  name="industry"
                  value={formData.industry || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select...</option>
                  <option value="TECHNOLOGY">Technology</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="HEALTHCARE">Healthcare</option>
                  <option value="FINANCE">Finance</option>
                  <option value="RETAIL">Retail</option>
                  <option value="EDUCATION">Education</option>
                  <option value="REAL_ESTATE">Real Estate</option>
                  <option value="E_COMMERCE">E-Commerce</option>
                  <option value="CONSULTING">Consulting</option>
                  <option value="PROFESSIONAL_SERVICES">Professional Services</option>
                  <option value="TELECOMMUNICATIONS">Telecommunications</option>
                  <option value="TRANSPORTATION">Transportation</option>
                  <option value="HOSPITALITY">Hospitality</option>
                  <option value="AGRICULTURE">Agriculture</option>
                  <option value="ENERGY">Energy</option>
                  <option value="GOVERNMENT">Government</option>
                  <option value="NON_PROFIT">Non-Profit</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company Size</label>
                <select
                  name="companySize"
                  value={formData.companySize || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select...</option>
                  <option value="MICRO">Micro (1-10 employees)</option>
                  <option value="SMALL">Small (11-50 employees)</option>
                  <option value="MEDIUM">Medium (51-200 employees)</option>
                  <option value="LARGE">Large (201-500 employees)</option>
                  <option value="ENTERPRISE">Enterprise (500+ employees)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Annual Revenue</label>
                <input
                  type="number"
                  name="annualRevenue"
                  value={formData.annualRevenue || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Number of Employees</label>
                <input
                  type="number"
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Billing Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Street</label>
                <input
                  type="text"
                  name="billingStreet"
                  value={formData.billingStreet || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  name="billingCity"
                  value={formData.billingCity || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="billingPostalCode"
                  value={formData.billingPostalCode || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <CountryStateSelector
                  countryValue={formData.billingCountry || ""}
                  stateValue={formData.billingState || ""}
                  onCountryChange={(val) =>
                    setFormData((prev) => ({ ...prev, billingCountry: val }))
                  }
                  onStateChange={(val) => setFormData((prev) => ({ ...prev, billingState: val }))}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Street</label>
                <input
                  type="text"
                  name="shippingStreet"
                  value={formData.shippingStreet || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  name="shippingCity"
                  value={formData.shippingCity || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="shippingPostalCode"
                  value={formData.shippingPostalCode || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <CountryStateSelector
                  countryValue={formData.shippingCountry || ""}
                  stateValue={formData.shippingState || ""}
                  onCountryChange={(val) =>
                    setFormData((prev) => ({ ...prev, shippingCountry: val }))
                  }
                  onStateChange={(val) => setFormData((prev) => ({ ...prev, shippingState: val }))}
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  name="tickerSymbol"
                  value={formData.tickerSymbol || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">SIC Code</label>
                <input
                  type="text"
                  name="sicCode"
                  value={formData.sicCode || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Social Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn Page</label>
                <input
                  type="url"
                  name="linkedInPage"
                  value={formData.linkedInPage || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Terms</label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Net 90">Net 90</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Prepaid">Prepaid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Credit Status</label>
                <select
                  name="creditStatus"
                  value={formData.creditStatus || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Credit Limit</label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select...</option>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rating</label>
                <select
                  name="rating"
                  value={formData.rating || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  defaultValue={account.tags?.join(", ")}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/accounts/${account.id}`)}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
