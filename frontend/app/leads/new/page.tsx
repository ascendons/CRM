"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leadsService } from "@/lib/leads";
import { authService } from "@/lib/auth";
import { CountryStateSelector } from "@/components/common/CountryStateSelector";
import { CreateLeadRequest, LeadSource, Industry, CompanySize } from "@/types/lead";
import { ApiError } from "@/lib/api-client";

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
  }, [router]);

  const [formData, setFormData] = useState<CreateLeadRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    jobTitle: "",
    department: "",
    mobilePhone: "",
    workPhone: "",
    linkedInProfile: "",
    website: "",
    industry: undefined,
    companySize: undefined,
    annualRevenue: undefined,
    numberOfEmployees: undefined,
    country: "",
    state: "",
    city: "",
    streetAddress: "",
    postalCode: "",
    leadSource: undefined,
    expectedRevenue: undefined,
    expectedCloseDate: "",
    description: "",
    tags: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors({});
    setLoading(true);

    try {
      // Create lead
      const lead = await leadsService.createLead(formData);

      // Redirect to lead detail page
      router.push(`/leads/${lead.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) {
          setErrors(err.errors);
        }
      } else {
        setError("Failed to create lead. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Lead</h1>
              <p className="mt-1 text-sm text-gray-500">Add a new lead to your CRM</p>
            </div>
            <Link
              href="/leads"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ← Back to Leads
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+919876543210"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.companyName ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedInProfile"
                  value={formData.linkedInProfile}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                <select
                  name="industry"
                  value={formData.industry || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Industry</option>
                  {Object.values(Industry).map((ind) => (
                    <option key={ind} value={ind}>
                      {ind.replace("_", " ")}
                    </option>
                  ))}
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
                  <option value="">Select Size</option>
                  <option value={CompanySize.MICRO}>1-10 employees</option>
                  <option value={CompanySize.SMALL}>11-50 employees</option>
                  <option value={CompanySize.MEDIUM}>51-200 employees</option>
                  <option value={CompanySize.LARGE}>201-500 employees</option>
                  <option value={CompanySize.ENTERPRISE}>500+ employees</option>
                </select>
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
            </div>
          </div>

          {/* Lead Classification */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Classification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lead Source</label>
                <select
                  name="leadSource"
                  value={formData.leadSource || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Source</option>
                  {Object.values(LeadSource).map((source) => (
                    <option key={source} value={source}>
                      {source.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Revenue
                </label>
                <input
                  type="number"
                  name="expectedRevenue"
                  value={formData.expectedRevenue || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  name="expectedCloseDate"
                  value={formData.expectedCloseDate || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <CountryStateSelector
                  countryValue={formData.country || ""}
                  stateValue={formData.state || ""}
                  onCountryChange={(val) => setFormData((prev) => ({ ...prev, country: val }))}
                  onStateChange={(val) => setFormData((prev) => ({ ...prev, state: val }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description / Notes
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes about this lead..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.description?.length || 0} / 2000 characters
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Link
              href="/leads"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
