"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Opportunity, UpdateOpportunityRequest, OpportunityStage } from "@/types/opportunity";
import { opportunitiesService } from "@/lib/opportunities";
import { accountsService } from "@/lib/accounts";
import { contactsService } from "@/lib/contacts";
import { Account } from "@/types/account";
import { Contact } from "@/types/contact";
import { authService } from "@/lib/auth";
import { ChevronRight } from "lucide-react";

export default function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateOpportunityRequest>({
    opportunityName: "",
    stage: OpportunityStage.PROSPECTING,
    accountId: "",
    amount: 0,
    probability: 0,
    expectedCloseDate: "",
    actualCloseDate: "",
    primaryContactId: "",
    type: "",
    leadSource: "",
    campaignSource: "",
    nextStep: "",
    description: "",
    forecastAmount: 0,
    currency: "INR",
    discountAmount: 0,
    totalAmount: 0,
    products: [],
    services: [],
    solutionOffered: "",
    competitors: [],
    competitiveAdvantage: "",
    lossReason: "",
    decisionMaker: "",
    decisionCriteria: "",
    budgetConfirmed: "",
    decisionTimeframe: "",
    deliveryStatus: "",
    paymentTerms: "",
    tags: [],
    notes: "",
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [id, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [opportunityData, accountsData, contactsData] = await Promise.all([
        opportunitiesService.getOpportunityById(id),
        accountsService.getAllAccounts(),
        contactsService.getAllContacts(),
      ]);

      setAccounts(accountsData);
      setContacts(contactsData);

      // Populate form with existing data
      setFormData({
        opportunityName: opportunityData.opportunityName,
        stage: opportunityData.stage,
        accountId: opportunityData.accountId,
        amount: opportunityData.amount,
        probability: opportunityData.probability,
        expectedCloseDate: opportunityData.expectedCloseDate?.split("T")[0] || "",
        actualCloseDate: opportunityData.actualCloseDate?.split("T")[0] || "",
        primaryContactId: opportunityData.primaryContactId || "",
        type: opportunityData.type || "",
        leadSource: opportunityData.leadSource || "",
        campaignSource: opportunityData.campaignSource || "",
        nextStep: opportunityData.nextStep || "",
        description: opportunityData.description || "",
        forecastAmount: opportunityData.forecastAmount || 0,
        currency: opportunityData.currency || "INR",
        discountAmount: opportunityData.discountAmount || 0,
        totalAmount: opportunityData.totalAmount || 0,
        products: opportunityData.products || [],
        services: opportunityData.services || [],
        solutionOffered: opportunityData.solutionOffered || "",
        competitors: opportunityData.competitors || [],
        competitiveAdvantage: opportunityData.competitiveAdvantage || "",
        lossReason: opportunityData.lossReason || "",
        decisionMaker: opportunityData.decisionMaker || "",
        decisionCriteria: opportunityData.decisionCriteria || "",
        budgetConfirmed: opportunityData.budgetConfirmed || "",
        decisionTimeframe: opportunityData.decisionTimeframe || "",
        deliveryStatus: opportunityData.deliveryStatus || "",
        paymentTerms: opportunityData.paymentTerms || "",
        tags: opportunityData.tags || [],
        notes: opportunityData.notes || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunity");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await opportunitiesService.updateOpportunity(id, formData);
      router.push(`/opportunities/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update opportunity");
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleArrayChange = (name: string, value: string) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    setFormData((prev) => ({ ...prev, [name]: array }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/opportunities" className="hover:text-primary">Opportunities</Link>
          <ChevronRight className="h-4 w-4" />
          {formData.opportunityName && (
            <>
              <Link href={`/opportunities/${id}`} className="hover:text-primary">{formData.opportunityName}</Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-slate-900 font-medium">Edit</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Edit Opportunity</h1>
          <p className="text-slate-500 mt-1">Update opportunity information</p>
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
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Opportunity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="opportunityName"
                  required
                  value={formData.opportunityName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Stage <span className="text-red-500">*</span>
                </label>
                <select
                  name="stage"
                  required
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value={OpportunityStage.PROSPECTING}>Prospecting</option>
                  <option value={OpportunityStage.QUALIFICATION}>Qualification</option>
                  <option value={OpportunityStage.NEEDS_ANALYSIS}>Needs Analysis</option>
                  <option value={OpportunityStage.PROPOSAL}>Proposal</option>
                  <option value={OpportunityStage.NEGOTIATION}>Negotiation</option>
                  <option value={OpportunityStage.CLOSED_WON}>Closed Won</option>
                  <option value={OpportunityStage.CLOSED_LOST}>Closed Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Probability (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="probability"
                  required
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Expected Close Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="expectedCloseDate"
                  required
                  value={formData.expectedCloseDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Actual Close Date
                </label>
                <input
                  type="date"
                  name="actualCloseDate"
                  value={formData.actualCloseDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Account & Contact */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Account & Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Account <span className="text-red-500">*</span>
                </label>
                <select
                  name="accountId"
                  required
                  value={formData.accountId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Primary Contact
                </label>
                <select
                  name="primaryContactId"
                  value={formData.primaryContactId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Contact...</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sales Information */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Sales Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Type...</option>
                  <option value="New Business">New Business</option>
                  <option value="Existing Business">Existing Business</option>
                  <option value="Add-on">Add-on</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Lead Source</label>
                <input
                  type="text"
                  name="leadSource"
                  value={formData.leadSource}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Campaign Source
                </label>
                <input
                  type="text"
                  name="campaignSource"
                  value={formData.campaignSource}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Next Step</label>
                <input
                  type="text"
                  name="nextStep"
                  value={formData.nextStep}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Financial Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Forecast Amount
                </label>
                <input
                  type="number"
                  name="forecastAmount"
                  step="0.01"
                  min="0"
                  value={formData.forecastAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
                <input
                  type="text"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Discount Amount
                </label>
                <input
                  type="number"
                  name="discountAmount"
                  step="0.01"
                  min="0"
                  value={formData.discountAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Total Amount</label>
                <input
                  type="number"
                  name="totalAmount"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Products & Services */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Products & Services</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Products (comma-separated)
                </label>
                <input
                  type="text"
                  defaultValue={formData.products?.join(", ")}
                  onChange={(e) => handleArrayChange("products", e.target.value)}
                  placeholder="Product A, Product B, Product C"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Services (comma-separated)
                </label>
                <input
                  type="text"
                  defaultValue={formData.services?.join(", ")}
                  onChange={(e) => handleArrayChange("services", e.target.value)}
                  placeholder="Service A, Service B, Service C"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Solution Offered
                </label>
                <textarea
                  name="solutionOffered"
                  value={formData.solutionOffered}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Competition */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Competition</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Competitors (comma-separated)
                </label>
                <input
                  type="text"
                  defaultValue={formData.competitors?.join(", ")}
                  onChange={(e) => handleArrayChange("competitors", e.target.value)}
                  placeholder="Competitor A, Competitor B, Competitor C"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Competitive Advantage
                </label>
                <textarea
                  name="competitiveAdvantage"
                  value={formData.competitiveAdvantage}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              {formData.stage === OpportunityStage.CLOSED_LOST && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Loss Reason
                  </label>
                  <textarea
                    name="lossReason"
                    value={formData.lossReason}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Decision Process */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Decision Process</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Decision Maker
                </label>
                <input
                  type="text"
                  name="decisionMaker"
                  value={formData.decisionMaker}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Decision Criteria
                </label>
                <input
                  type="text"
                  name="decisionCriteria"
                  value={formData.decisionCriteria}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Budget Confirmed
                </label>
                <input
                  type="text"
                  name="budgetConfirmed"
                  value={formData.budgetConfirmed}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Decision Timeframe
                </label>
                <input
                  type="text"
                  name="decisionTimeframe"
                  value={formData.decisionTimeframe}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Additional */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-3">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Delivery Status
                </label>
                <input
                  type="text"
                  name="deliveryStatus"
                  value={formData.deliveryStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  defaultValue={formData.tags?.join(", ")}
                  onChange={(e) => handleArrayChange("tags", e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {submitting ? "Updating..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/opportunities/${id}`)}
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
