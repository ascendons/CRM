"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Contact, UpdateContactRequest } from "@/types/contact";
import { contactsService } from "@/lib/contacts";
import { accountsService } from "@/lib/accounts";
import { Account } from "@/types/account";
import { authService } from "@/lib/auth";
import { CountryStateSelector } from "@/components/common/CountryStateSelector";
import { ChevronRight } from "lucide-react";

export default function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateContactRequest>({});

  const loadContact = async () => {
    try {
      const data = await contactsService.getContactById(id);
      setContact(data);
      // Pre-populate form
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        salutation: data.salutation,
        email: data.email,
        phone: data.phone,
        mobilePhone: data.mobilePhone,
        workPhone: data.workPhone,
        homePhone: data.homePhone,
        jobTitle: data.jobTitle,
        department: data.department,
        reportsTo: data.reportsTo,
        birthdate: data.birthdate,
        emailOptOut: data.emailOptOut,
        linkedInProfile: data.linkedInProfile,
        twitterHandle: data.twitterHandle,
        facebookProfile: data.facebookProfile,
        website: data.website,
        skypeId: data.skypeId,
        accountId: data.accountId,
        isPrimaryContact: data.isPrimaryContact,
        mailingStreet: data.mailingStreet,
        mailingCity: data.mailingCity,
        mailingState: data.mailingState,
        mailingPostalCode: data.mailingPostalCode,
        mailingCountry: data.mailingCountry,
        otherStreet: data.otherStreet,
        otherCity: data.otherCity,
        otherState: data.otherState,
        otherPostalCode: data.otherPostalCode,
        otherCountry: data.otherCountry,
        description: data.description,
        assistantName: data.assistantName,
        assistantPhone: data.assistantPhone,
        tags: data.tags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact");
    }
  };

  const loadAccounts = async () => {
    try {
      const data = await accountsService.getAllAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadContact();
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updated = await contactsService.updateContact(id, formData);
      router.push(`/contacts/${updated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contact");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({ ...prev, tags }));
  };

  if (!contact) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/contacts" className="hover:text-primary">Contacts</Link>
          <ChevronRight className="h-4 w-4" />
          {contact && (
            <>
              <Link href={`/contacts/${contact.id}`} className="hover:text-primary">{contact.firstName} {contact.lastName}</Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-slate-900 font-medium">Edit</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Edit Contact</h1>
          <p className="text-slate-500 mt-1">Update contact information</p>
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Salutation</label>
                <select
                  name="salutation"
                  value={formData.salutation || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  name="mobilePhone"
                  value={formData.mobilePhone || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Birthdate</label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Professional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Reports To</label>
                <input
                  type="text"
                  name="reportsTo"
                  value={formData.reportsTo || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Account Relationship */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Account Relationship</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Account</label>
                <select
                  name="accountId"
                  value={formData.accountId || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select Account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPrimaryContact"
                  checked={formData.isPrimaryContact || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                />
                <label className="ml-2 block text-sm text-slate-700">
                  Primary Contact for Account
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="emailOptOut"
                  checked={formData.emailOptOut || false}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                />
                <label className="ml-2 block text-sm text-slate-700">Email Opt Out</label>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Social Media & Web</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedInProfile"
                  value={formData.linkedInProfile || ""}
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
            </div>
          </div>

          {/* Mailing Address */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Mailing Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Street</label>
                <input
                  type="text"
                  name="mailingStreet"
                  value={formData.mailingStreet || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  name="mailingCity"
                  value={formData.mailingCity || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="mailingPostalCode"
                  value={formData.mailingPostalCode || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div className="md:col-span-3">
                <CountryStateSelector
                  countryValue={formData.mailingCountry || ""}
                  stateValue={formData.mailingState || ""}
                  onCountryChange={(val) =>
                    setFormData((prev) => ({ ...prev, mailingCountry: val }))
                  }
                  onStateChange={(val) => setFormData((prev) => ({ ...prev, mailingState: val }))}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Assistant Name
                </label>
                <input
                  type="text"
                  name="assistantName"
                  value={formData.assistantName || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Assistant Phone
                </label>
                <input
                  type="tel"
                  name="assistantPhone"
                  value={formData.assistantPhone || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  defaultValue={contact.tags?.join(", ")}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
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
              onClick={() => router.push(`/contacts/${contact.id}`)}
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
