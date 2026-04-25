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
import {
  User,
  Building2,
  Tag,
  MapPin,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Mail,
  Phone,
  Linkedin,
  Globe,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  X,
  Search,
  Loader2,
  Sparkles,
} from "lucide-react";

const STEPS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "contact", label: "Contact", icon: User },
  { id: "classification", label: "Classification", icon: Tag },
  { id: "address", label: "Address", icon: MapPin },
];

const LEAD_SOURCES = [
  { value: LeadSource.WEBSITE, label: "Website", icon: Globe },
  { value: LeadSource.REFERRAL, label: "Referral", icon: Users },
  { value: LeadSource.LINKEDIN, label: "LinkedIn", icon: Linkedin },
  { value: LeadSource.COLD_CALL, label: "Cold Call", icon: Phone },
  { value: LeadSource.TRADE_SHOW, label: "Trade Show", icon: Briefcase },
  { value: LeadSource.PARTNER, label: "Partner", icon: Users },
  { value: LeadSource.ADVERTISING, label: "Advertising", icon: TrendingUp },
  { value: LeadSource.EMAIL_CAMPAIGN, label: "Email Campaign", icon: Mail },
  { value: LeadSource.IMPORT, label: "Import", icon: FileText },
  { value: LeadSource.OTHER, label: "Other", icon: Sparkles },
];

const INDUSTRIES = [
  { value: Industry.RENEWABLE_ENERGY, label: "Renewable Energy", icon: TrendingUp },
  { value: Industry.SOLAR, label: "Solar", icon: Sparkles },
  { value: Industry.TECHNOLOGY, label: "Technology", icon: Globe },
  { value: Industry.MANUFACTURING, label: "Manufacturing", icon: Building2 },
  { value: Industry.HEALTHCARE, label: "Healthcare", icon: Users },
  { value: Industry.FINANCE, label: "Finance", icon: TrendingUp },
  { value: Industry.RETAIL, label: "Retail", icon: Building2 },
  { value: Industry.EDUCATION, label: "Education", icon: Users },
  { value: Industry.CONSULTING, label: "Consulting", icon: Briefcase },
  { value: Industry.GOVERNMENT, label: "Government", icon: Building2 },
];

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Company selection mode
  const [companyMode, setCompanyMode] = useState<"new" | "existing">("new");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [contactsForAccount, setContactsForAccount] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [accountSuggestions, setAccountSuggestions] = useState<Account[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [companySearchQuery, setCompanySearchQuery] = useState("");

  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (selectedAccountId) {
      setLoadingContacts(true);
      contactsService
        .getContactsByAccount(selectedAccountId)
        .then(setContactsForAccount)
        .catch((err) => {
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

  const handleCompanyModeChange = (mode: "new" | "existing") => {
    setCompanyMode(mode);
    setCompanySearchQuery("");
    setAllAccounts([]);
    setAccountSuggestions([]);
    setShowSuggestions(false);
    if (mode === "new") {
      setSelectedAccountId(null);
      setSelectedAccount(null);
      setFormData((prev) => ({
        ...prev,
        companyName: "",
        accountId: undefined,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        department: "",
      }));
    } else {
      setFormData((prev) => ({
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

    if (name === "companyName" && companyMode === "new") {
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
    const contact = contactsForAccount.find((c) => c.id === contactId);
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
      router.push(
        `/contacts/new?accountId=${selectedAccountId}&accountName=${encodeURIComponent(
          selectedAccount.accountName
        )}`
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setDirection("backward");
    } else {
      setDirection("forward");
    }
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsTransitioning(false);
    }, 200);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection("forward");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection("backward");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

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

  const calculateProgress = () => {
    const requiredFields = ["firstName", "lastName", "email", "phone", "companyName"];
    const filled = requiredFields.filter((field) => formData[field as keyof CreateLeadRequest]).length;
    return Math.round((filled / requiredFields.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Create New Lead
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Add a new lead to your pipeline</p>
            </div>
            <Link
              href="/leads"
              className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Leads
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-xs font-semibold text-blue-600">
              {calculateProgress()}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = currentStep === index;
              const isComplete = currentStep > index;
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => index < currentStep && goToStep(index)}
                  disabled={index > currentStep}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    index > currentStep
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isComplete
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                        : isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? "text-blue-600" : isComplete ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Step Content */}
          <div
            className={`transition-all duration-200 ${
              isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
            }`}
          >
            {/* Step 1: Company */}
            {currentStep === 0 && (
              <div className="space-y-3">
                {/* Company Selection */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Company Selection</h2>
                      <p className="text-sm text-slate-500">Choose new or existing company</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => handleCompanyModeChange("new")}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        companyMode === "new"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            companyMode === "new" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <span
                          className={`font-medium ${
                            companyMode === "new" ? "text-blue-700" : "text-slate-600"
                          }`}
                        >
                          New Company
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompanyModeChange("existing")}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                        companyMode === "existing"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            companyMode === "existing"
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Building2 className="h-6 w-6" />
                        </div>
                        <span
                          className={`font-medium ${
                            companyMode === "existing" ? "text-blue-700" : "text-slate-600"
                          }`}
                        >
                          Existing Company
                        </span>
                      </div>
                    </button>
                  </div>

                  {companyMode === "existing" && (
                    <div className="space-y-3">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Select Company <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search companies..."
                            value={companySearchQuery}
                            onChange={(e) => {
                              setCompanySearchQuery(e.target.value);
                              setSelectedAccount(null);
                              setSelectedAccountId(null);
                              if (accountSuggestions.length > 0) {
                                const query = e.target.value.toLowerCase();
                                const filtered = allAccounts.filter((acc) =>
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
                                accountsService
                                  .getAllAccounts()
                                  .then((results) => {
                                    setAccountSuggestions(results);
                                    setAllAccounts(results);
                                  })
                                  .catch((err) => console.error("Failed to fetch accounts", err))
                                  .finally(() => {
                                    setIsSearchingAccount(false);
                                    setShowSuggestions(true);
                                  });
                              } else if (allAccounts.length > 0) {
                                setShowSuggestions(true);
                              }
                            }}
                            autoComplete="off"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                          />
                          {isSearchingAccount && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                          )}
                        </div>

                        {showSuggestions && accountSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-auto">
                            <ul className="py-1 text-sm text-slate-700">
                              {accountSuggestions.map((account) => (
                                <li
                                  key={account.id}
                                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                                  onClick={() => handleAccountSelect(account)}
                                >
                                  <div className="font-medium text-slate-900">{account.accountName}</div>
                                  <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                                    {account.industry && <span>{account.industry.replace("_", " ")}</span>}
                                    {account.industry && account.companySize && <span>•</span>}
                                    {account.companySize && <span>{account.companySize.replace("_", " ")}</span>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {selectedAccount && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-slate-900">{selectedAccount.accountName}</h3>
                              <p className="text-sm text-slate-500 mt-1">
                                {selectedAccount.industry?.replace("_", " ")} •{" "}
                                {selectedAccount.companySize?.replace("_", " ")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAccount(null);
                                setSelectedAccountId(null);
                                setCompanySearchQuery("");
                                setFormData((prev) => ({ ...prev, accountId: undefined }));
                              }}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Select Contact
                            </label>
                            {loadingContacts ? (
                              <div className="flex items-center text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
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
                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Company Info for New Mode */}
                {companyMode === "new" && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">Company Details</h2>
                        <p className="text-sm text-slate-500">Enter company information</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                            placeholder="Acme Corporation"
                            className={`w-full pl-9 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              errors.companyName ? "border-red-300 bg-red-50" : "border-slate-200"
                            }`}
                          />
                        </div>
                        {errors.companyName && (
                          <p className="text-sm text-red-600">{errors.companyName}</p>
                        )}

                        {showSuggestions && accountSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-auto">
                            <ul className="py-1 text-sm text-slate-700">
                              {accountSuggestions.map((account) => (
                                <li
                                  key={account.id}
                                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                                  onClick={() => handleAccountSelect(account)}
                                >
                                  <div className="font-medium text-slate-900">{account.accountName}</div>
                                  <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                                    {account.industry && <span>{account.industry.replace("_", " ")}</span>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">GST Number</label>
                        <input
                          type="text"
                          name="gstNumber"
                          value={formData.gstNumber || ""}
                          onChange={handleChange}
                          placeholder="29ABCDE1234F1Z5"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Industry</label>
                        <select
                          name="industry"
                          value={formData.industry || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Industry</option>
                          {Object.values(Industry).map((ind) => (
                            <option key={ind} value={ind}>
                              {ind.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Company Size</label>
                        <select
                          name="companySize"
                          value={formData.companySize || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Size</option>
                          <option value={CompanySize.MICRO}>1-10 employees</option>
                          <option value={CompanySize.SMALL}>11-50 employees</option>
                          <option value={CompanySize.MEDIUM}>51-200 employees</option>
                          <option value={CompanySize.LARGE}>201-500 employees</option>
                          <option value={CompanySize.ENTERPRISE}>500+ employees</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">
                          Number of Employees
                        </label>
                        <input
                          type="number"
                          name="numberOfEmployees"
                          value={formData.numberOfEmployees || ""}
                          onChange={handleChange}
                          placeholder="50"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">
                          Annual Revenue <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                          <input
                            type="number"
                            name="annualRevenue"
                            value={formData.annualRevenue || ""}
                            onChange={handleChange}
                            required
                            placeholder="1000000"
                            className={`w-full pl-7 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                              errors.annualRevenue ? "border-red-300 bg-red-50" : "border-slate-200"
                            }`}
                          />
                        </div>
                        {errors.annualRevenue && (
                          <p className="text-sm text-red-600">{errors.annualRevenue}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Contact */}
            {currentStep === 1 && (
              <div className="space-y-3">
                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Contact Information</h2>
                      <p className="text-sm text-slate-500">
                        {selectedContact ? "Contact auto-filled from existing contact" : "Enter the lead's contact details"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="John"
                        className={`w-full px-3 py-1.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.firstName ? "border-red-300 bg-red-50" : "border-slate-200"
                        }`}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Doe"
                        className={`w-full px-3 py-1.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.lastName ? "border-red-300 bg-red-50" : "border-slate-200"
                        }`}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="john.doe@company.com"
                          className={`w-full pl-9 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            errors.email ? "border-red-300 bg-red-50" : "border-slate-200"
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+919876543210"
                          required
                          className={`w-full pl-9 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            errors.phone ? "border-red-300 bg-red-50" : "border-slate-200"
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Job Details</h2>
                      <p className="text-sm text-slate-500">Additional contact information</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        placeholder="Sales Manager"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="Sales"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        LinkedIn Profile
                      </label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="url"
                          name="linkedInProfile"
                          value={formData.linkedInProfile}
                          onChange={handleChange}
                          placeholder="linkedin.com/in/johndoe"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://example.com"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Classification */}
            {currentStep === 2 && (
              <div className="space-y-3">
                {/* Lead Source */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Tag className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Lead Source</h2>
                      <p className="text-sm text-slate-500">How did you find this lead?</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {LEAD_SOURCES.map((source) => {
                      const Icon = source.icon;
                      const isSelected = formData.leadSource === source.value;
                      return (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, leadSource: source.value }))
                          }
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-amber-500 bg-amber-50 shadow-md"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              isSelected ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-amber-700" : "text-slate-600"
                            }`}
                          >
                            {source.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue & Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Revenue & Timeline</h2>
                      <p className="text-sm text-slate-500">Expected business value</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        Expected Revenue <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                        <input
                          type="number"
                          name="expectedRevenue"
                          value={formData.expectedRevenue || ""}
                          onChange={handleChange}
                          required
                          placeholder="500000"
                          className={`w-full pl-7 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            errors.expectedRevenue ? "border-red-300 bg-red-50" : "border-slate-200"
                          }`}
                        />
                      </div>
                      {errors.expectedRevenue && (
                        <p className="text-sm text-red-600">{errors.expectedRevenue}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        Expected Close Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="date"
                          name="expectedCloseDate"
                          value={formData.expectedCloseDate || ""}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Additional Notes</h2>
                      <p className="text-sm text-slate-500">Any additional information</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      maxLength={2000}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Add any additional notes about this lead..."
                    />
                    <p className="text-sm text-slate-500 text-right">
                      {formData.description?.length || 0} / 2000 characters
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Address */}
            {currentStep === 3 && (
              <div className="space-y-3">
                {/* Address */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-rose-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Address Information</h2>
                      <p className="text-sm text-slate-500">Lead's location details</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <CountryStateSelector
                      countryValue={formData.country || ""}
                      stateValue={formData.state || ""}
                      onCountryChange={(val) => setFormData((prev) => ({ ...prev, country: val }))}
                      onStateChange={(val) => setFormData((prev) => ({ ...prev, state: val }))}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Mumbai"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Postal Code</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          placeholder="400001"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Street Address</label>
                        <input
                          type="text"
                          name="streetAddress"
                          value={formData.streetAddress}
                          onChange={handleChange}
                          placeholder="123 Business Park, Phase 2"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-4">Lead Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {formData.firstName} {formData.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Company:</span>
                      <span className="ml-2 font-medium text-slate-900">{formData.companyName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Email:</span>
                      <span className="ml-2 font-medium text-slate-900">{formData.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      <span className="ml-2 font-medium text-slate-900">{formData.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Source:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {formData.leadSource?.replace("_", " ") || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Expected Revenue:</span>
                      <span className="ml-2 font-medium text-slate-900">
                        {formData.expectedRevenue ? `₹${formData.expectedRevenue.toLocaleString()}` : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-4">
              <Link
                href="/leads"
                className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-all"
              >
                Cancel
              </Link>

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-200 transition-all"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Create Lead
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Create Contact Modal */}
      {selectedAccount && (
        <CreateContactModal
          isOpen={showCreateContactModal}
          onClose={() => setShowCreateContactModal(false)}
          onSuccess={(contactId, contactData) => {
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
            handleContactSelect(contactId);
          }}
          accountId={selectedAccount.id}
          accountName={selectedAccount.accountName}
        />
      )}
    </div>
  );
}
