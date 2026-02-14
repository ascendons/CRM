"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Account, UpdateAccountRequest } from "@/types/account";
import { accountsService } from "@/lib/accounts";
import { authService } from "@/lib/auth";
import { CountryStateSelector } from "@/components/common/CountryStateSelector";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Account</h1>
          <p className="mt-2 text-gray-600">Update account information</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountName"
                  required
                  value={formData.accountName || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Account
                </label>
                <select
                  name="parentAccountId"
                  value={formData.parentAccountId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <select
                  name="accountType"
                  value={formData.accountType || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  name="industry"
                  value={formData.industry || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                <select
                  name="companySize"
                  value={formData.companySize || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Revenue
                </label>
                <input
                  type="number"
                  name="annualRevenue"
                  value={formData.annualRevenue || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Employees
                </label>
                <input
                  type="number"
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                <input
                  type="text"
                  name="billingStreet"
                  value={formData.billingStreet || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="billingCity"
                  value={formData.billingCity || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  name="billingPostalCode"
                  value={formData.billingPostalCode || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <CountryStateSelector
                  countryValue={formData.billingCountry || ""}
                  stateValue={formData.billingState || ""}
                  onCountryChange={(val) => setFormData((prev) => ({ ...prev, billingCountry: val }))}
                  onStateChange={(val) => setFormData((prev) => ({ ...prev, billingState: val }))}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                <input
                  type="text"
                  name="shippingStreet"
                  value={formData.shippingStreet || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="shippingCity"
                  value={formData.shippingCity || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  name="shippingPostalCode"
                  value={formData.shippingPostalCode || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <CountryStateSelector
                  countryValue={formData.shippingCountry || ""}
                  stateValue={formData.shippingState || ""}
                  onCountryChange={(val) => setFormData((prev) => ({ ...prev, shippingCountry: val }))}
                  onStateChange={(val) => setFormData((prev) => ({ ...prev, shippingState: val }))}
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticker Symbol
                </label>
                <input
                  type="text"
                  name="tickerSymbol"
                  value={formData.tickerSymbol || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SIC Code</label>
                <input
                  type="text"
                  name="sicCode"
                  value={formData.sicCode || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Page
                </label>
                <input
                  type="url"
                  name="linkedInPage"
                  value={formData.linkedInPage || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter Handle
                </label>
                <input
                  type="text"
                  name="twitterHandle"
                  value={formData.twitterHandle || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Status
                </label>
                <select
                  name="creditStatus"
                  value={formData.creditStatus || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit</label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  name="currency"
                  value={formData.currency || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  name="rating"
                  value={formData.rating || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  defaultValue={account.tags?.join(", ")}
                  onChange={handleTagsChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/accounts/${account.id}`)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
