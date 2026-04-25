"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leadsService } from "@/lib/leads";
import { contactsService } from "@/lib/contacts";
import { accountsService } from "@/lib/accounts";
import { authService } from "@/lib/auth";
import { CountryStateSelector } from "@/components/common/CountryStateSelector";
import { CreateLeadRequest, LeadSource, Industry, CompanySize } from "@/types/lead";
import { Contact, CreateContactRequest } from "@/types/contact";
import { Account } from "@/types/account";
import { ApiError } from "@/lib/api-client";
import { CreateContactModal } from "@/components/leads/CreateContactModal";

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Company selection mode: 'new' or 'existing'
  const [companyMode, setCompanyMode] = useState<'new' | 'existing'>('new');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Contacts for selected account
  const [contactsForAccount, setContactsForAccount] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Create contact modal
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);

  // Account search state
  const [accountSuggestions, setAccountSuggestions] = useState<Account[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [companySearchQuery, setCompanySearchQuery] = useState("");

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
    gstNumber: "",
    accountId: undefined,
  });

  // Fetch contacts when account is selected
  useEffect(() => {
    if (selectedAccountId) {
      setLoadingContacts(true);
      contactsService.getContactsByAccount(selectedAccountId)
        .then(setContactsForAccount)
        .catch(err => {
          console.error("Failed to fetch contacts", err);
          setContactsForAccount([]);
        })
        .finally(() => setLoadingContacts(false));
    } else {
      setContactsForAccount([]);
    }
    setSelectedContactId(null);
    setSelectedContact(null);
  }, [selectedAccountId]);

  const handleCompanyModeChange = (mode: 'new' | 'existing') => {
    setCompanyMode(mode);
    setCompanySearchQuery("");
    setAllAccounts([]);
    setAccountSuggestions([]);
    setShowSuggestions(false);
    if (mode === 'new') {
      // Clear company selection
      setSelectedAccountId(null);
      setSelectedAccount(null);
      setFormData(prev => ({
        ...prev,
        companyName: "",
        accountId: undefined,
        // Keep contact fields but clear account-linked ones
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        department: "",
      }));
    } else {
      // For existing company, clear form fields except basic
      setFormData(prev => ({
        ...prev,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        department: "",
      }));
    }
    setContactsForAccount([]);
    setSelectedContactId(null);
    setSelectedContact(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Handle Company Name search (only for 'new' mode - existing mode uses dropdown)
    if (name === "companyName" && companyMode === 'new') {
      setShowSuggestions(true);
      if (searchTimeout) clearTimeout(searchTimeout);

      if (value.trim().length >= 2) {
        setIsSearchingAccount(true);
        const timeout = setTimeout(async () => {
          try {
            const results = await accountsService.searchAccounts(value);
            setAccountSuggestions(results);
          } catch (err) {
            console.error("Failed to search accounts", err);
          } finally {
            setIsSearchingAccount(false);
          }
        }, 300);
        setSearchTimeout(timeout);
      } else {
        setAccountSuggestions([]);
        setIsSearchingAccount(false);
      }
    }

    // Clear field error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccountId(account.id);
    setSelectedAccount(account);
    setCompanySearchQuery(account.accountName);
    setFormData((prev) => ({
      ...prev,
      companyName: account.accountName,
      industry: account.industry as Industry | undefined,
      companySize: account.companySize as CompanySize | undefined,
      annualRevenue: account.annualRevenue,
      numberOfEmployees: account.numberOfEmployees,
      website: account.website || prev.website,
      phone: account.phone || prev.phone,
      email: prev.email || account.email || "",
      streetAddress: account.billingStreet || prev.streetAddress,
      city: account.billingCity || prev.city,
      state: account.billingState || prev.state,
      postalCode: account.billingPostalCode || prev.postalCode,
      country: account.billingCountry || prev.country,
      accountId: account.id,
    }));
    setShowSuggestions(false);
    setAccountSuggestions([]);
  };

  const handleContactSelect = (contactId: string) => {
    const contact = contactsForAccount.find(c => c.id === contactId);
    if (contact) {
      setSelectedContactId(contactId);
      setSelectedContact(contact);
      setFormData((prev) => ({
        ...prev,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || prev.phone,
        jobTitle: contact.jobTitle || prev.jobTitle,
        department: contact.department || prev.department,
      }));
    }
  };

  const handleCreateContact = () => {
    if (selectedAccountId && selectedAccount) {
      router.push(`/contacts/new?accountId=${selectedAccountId}&accountName=${encodeURIComponent(selectedAccount.accountName)}`);
    }
  };

  // Hide suggestions if clicked outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrors({});
    setLoading(true);

    try {
      const lead = await leadsService.createLead(formData);
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

          {/* Company Selection Mode */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Selection</h2>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="companyMode"
                  value="new"
                  checked={companyMode === 'new'}
                  onChange={() => handleCompanyModeChange('new')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Create lead for new company</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="companyMode"
                  value="existing"
                  checked={companyMode === 'existing'}
                  onChange={() => handleCompanyModeChange('existing')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Create lead for existing company</span>
              </label>
            </div>

            {/* Company Selection for Existing */}
            {companyMode === 'existing' && (
              <div className="space-y-4">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Click to search companies..."
                    value={companySearchQuery}
                    onChange={(e) => {
                      setCompanySearchQuery(e.target.value);
                      setSelectedAccount(null);
                      setSelectedAccountId(null);
                      // Filter locally if suggestions already loaded
                      if (accountSuggestions.length > 0) {
                        const query = e.target.value.toLowerCase();
                        const filtered = allAccounts.filter(acc =>
                          acc.accountName.toLowerCase().includes(query)
                        );
                        setAccountSuggestions(filtered);
                        setShowSuggestions(true);
                      }
                    }}
                    onClick={async () => {
                      if (!showSuggestions) {
                        setIsSearchingAccount(true);
                        try {
                          const results = await accountsService.getAllAccounts();
                          setAccountSuggestions(results);
                          setAllAccounts(results);
                        } catch (err) {
                          console.error("Failed to fetch accounts", err);
                        } finally {
                          setIsSearchingAccount(false);
                          setShowSuggestions(true);
                        }
                      }
                    }}
                    onFocus={() => {
                      if (!showSuggestions && allAccounts.length === 0) {
                        setIsSearchingAccount(true);
                        accountsService.getAllAccounts()
                          .then(results => {
                            setAccountSuggestions(results);
                            setAllAccounts(results);
                          })
                          .catch(err => console.error("Failed to fetch accounts", err))
                          .finally(() => {
                            setIsSearchingAccount(false);
                            setShowSuggestions(true);
                          });
                      } else if (allAccounts.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {isSearchingAccount && (
                    <div className="absolute right-3 top-9">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Account Suggestions Dropdown */}
                  {showSuggestions && accountSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                      <ul className="py-1 text-sm text-gray-700">
                        {accountSuggestions.map((account) => (
                          <li
                            key={account.id}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                            onClick={() => handleAccountSelect(account)}
                          >
                            <div className="font-medium text-gray-900">{account.accountName}</div>
                            <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                              {account.industry && <span>{account.industry.replace("_", " ")}</span>}
                              {account.industry && account.companySize && <span>•</span>}
                              {account.companySize && (
                                <span>{account.companySize.replace("_", " ")}</span>
                              )}
                              {account.website && <span>•</span>}
                              {account.website && <span>{account.website}</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Selected Company Display */}
                {selectedAccount && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedAccount.accountName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedAccount.industry?.replace("_", " ")} • {selectedAccount.companySize?.replace("_", " ")}
                          {selectedAccount.website && ` • ${selectedAccount.website}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccount(null);
                          setSelectedAccountId(null);
                          setCompanySearchQuery("");
                          setFormData(prev => ({ ...prev, accountId: undefined }));
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Contact Selection */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Contact
                      </label>
                      {loadingContacts ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Loading contacts...
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={selectedContactId || ""}
                            onChange={(e) => {
                              if (e.target.value === "__create_new__") {
                                setShowCreateContactModal(true);
                              } else {
                                handleContactSelect(e.target.value);
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                          >
                            <option value="">Select a contact</option>
                            {contactsForAccount.map((contact) => (
                              <option key={contact.id} value={contact.id}>
                                {contact.firstName} {contact.lastName}
                                {contact.jobTitle ? ` - ${contact.jobTitle}` : ""}
                              </option>
                            ))}
                            <option value="__create_new__">+ Create New Contact</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              {companyMode === 'new' && (
                <div className="md:col-span-2 relative" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    onFocus={() => {
                      if (formData.companyName.trim().length >= 2) setShowSuggestions(true);
                    }}
                    autoComplete="off"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.companyName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {isSearchingAccount && (
                    <div className="absolute right-3 top-9">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Account Suggestions Dropdown */}
                  {showSuggestions && accountSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                      <ul className="py-1 text-sm text-gray-700">
                        {accountSuggestions.map((account) => (
                          <li
                            key={account.id}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                            onClick={() => handleAccountSelect(account)}
                          >
                            <div className="font-medium text-gray-900">{account.accountName}</div>
                            <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                              {account.industry && <span>{account.industry.replace("_", " ")}</span>}
                              {account.industry && account.companySize && <span>•</span>}
                              {account.companySize && (
                                <span>{account.companySize.replace("_", " ")}</span>
                              )}
                              {account.website && <span>•</span>}
                              {account.website && <span>{account.website}</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                />
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
                  Annual Revenue <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="annualRevenue"
                  value={formData.annualRevenue || ""}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.annualRevenue ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.annualRevenue && (
                  <p className="mt-1 text-sm text-red-600">{errors.annualRevenue}</p>
                )}
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
                  Expected Revenue <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="expectedRevenue"
                  value={formData.expectedRevenue || ""}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.expectedRevenue ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.expectedRevenue && (
                  <p className="mt-1 text-sm text-red-600">{errors.expectedRevenue}</p>
                )}
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

      {/* Create Contact Modal */}
      {selectedAccount && (
        <CreateContactModal
          isOpen={showCreateContactModal}
          onClose={() => setShowCreateContactModal(false)}
          onSuccess={(contactId, contactData) => {
            // Add the new contact to the contacts list
            const newContact: Contact = {
              id: contactId,
              contactId: "",
              firstName: contactData.firstName || "",
              lastName: contactData.lastName || "",
              email: contactData.email || "",
              phone: contactData.phone,
              jobTitle: contactData.jobTitle,
              department: contactData.department,
              accountId: contactData.accountId,
              accountName: selectedAccount.accountName,
              ownerId: "",
              ownerName: "",
              createdAt: new Date().toISOString(),
              createdBy: "",
              createdByName: "",
              lastModifiedAt: new Date().toISOString(),
              lastModifiedBy: "",
              lastModifiedByName: "",
              emailsSent: 0,
              emailsReceived: 0,
              callsMade: 0,
              callsReceived: 0,
              meetingsHeld: 0,
            };
            setContactsForAccount([...contactsForAccount, newContact]);
            // Auto-select the new contact
            handleContactSelect(contactId);
          }}
          accountId={selectedAccount.id}
          accountName={selectedAccount.accountName}
        />
      )}
    </div>
  );
}
