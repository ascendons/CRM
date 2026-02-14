"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Account } from "@/types/account";
import { accountsService } from "@/lib/accounts";
import { authService } from "@/lib/auth";
import { MessageSquare, FileText } from "lucide-react";
import { EntityActivities } from "@/components/common/EntityActivities";
import { activitiesService } from "@/lib/activities";
import { Activity } from "@/types/activity";

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'details' | 'activities'>('details');

  // Activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadAccount();
    loadActivities();
  }, [id, router]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const data = await accountsService.getAccountById(id);
      setAccount(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const data = await activitiesService.getActivitiesByAccount(id);
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    try {
      await accountsService.deleteAccount(id);
      router.push("/accounts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Account not found"}</p>
          <button
            onClick={() => router.push("/accounts")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number | boolean | undefined | null;
  }) => (
    <div className="py-3 border-b border-gray-200 last:border-0">
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">
        {value !== undefined && value !== null && value !== "" ? String(value) : "-"}
      </dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{account.accountName}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {account.accountStatus}
              </span>
            </div>
            <p className="text-gray-600">Account ID: {account.accountId}</p>
            <p className="text-sm text-gray-500 mt-1">Owner: {account.ownerName}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/accounts/${account.id}/edit`)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Edit Account
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => router.push("/accounts")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 font-medium">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`${activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              <FileText className="h-4 w-4" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`${activeTab === 'activities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              <MessageSquare className="h-4 w-4" />
              Activities
              <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">
                {activities.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <DetailSection title="Basic Information">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Account Name" value={account.accountName} />
                  <DetailRow label="Parent Account" value={account.parentAccountName} />
                  <DetailRow label="Account Type" value={account.accountType} />
                  <DetailRow label="Industry" value={account.industry} />
                  <DetailRow label="Company Size" value={account.companySize} />
                  <DetailRow
                    label="Annual Revenue"
                    value={
                      account.annualRevenue ? `₹${account.annualRevenue.toLocaleString()}` : undefined
                    }
                  />
                  <DetailRow label="Number of Employees" value={account.numberOfEmployees} />
                  <DetailRow label="Ownership" value={account.ownership} />
                </dl>
              </DetailSection>

              {/* Contact Information */}
              <DetailSection title="Contact Information">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Phone" value={account.phone} />
                  <DetailRow label="Fax" value={account.fax} />
                  <DetailRow label="Website" value={account.website} />
                  <DetailRow label="Email" value={account.email} />
                </dl>
              </DetailSection>

              {/* Billing Address */}
              <DetailSection title="Billing Address">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Street" value={account.billingStreet} />
                  <DetailRow label="City" value={account.billingCity} />
                  <DetailRow label="State/Province" value={account.billingState} />
                  <DetailRow label="Postal Code" value={account.billingPostalCode} />
                  <DetailRow label="Country" value={account.billingCountry} />
                </dl>
              </DetailSection>

              {/* Shipping Address */}
              <DetailSection title="Shipping Address">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Street" value={account.shippingStreet} />
                  <DetailRow label="City" value={account.shippingCity} />
                  <DetailRow label="State/Province" value={account.shippingState} />
                  <DetailRow label="Postal Code" value={account.shippingPostalCode} />
                  <DetailRow label="Country" value={account.shippingCountry} />
                </dl>
              </DetailSection>

              {/* Business Information */}
              <DetailSection title="Business Information">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Ticker Symbol" value={account.tickerSymbol} />
                  <DetailRow label="SIC Code" value={account.sicCode} />
                  <DetailRow label="NAICS Code" value={account.naicsCode} />
                  <DetailRow label="DUNS Number" value={account.dunsNumber} />
                  <DetailRow label="Tax ID" value={account.taxId} />
                </dl>
              </DetailSection>

              {/* Social Media */}
              <DetailSection title="Social Media">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="LinkedIn Page" value={account.linkedInPage} />
                  <DetailRow label="Twitter Handle" value={account.twitterHandle} />
                  <DetailRow label="Facebook Page" value={account.facebookPage} />
                </dl>
              </DetailSection>

              {/* Relationship Information */}
              <DetailSection title="Relationship Information">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Primary Contact" value={account.primaryContactName} />
                  {account.convertedFromLeadId && (
                    <>
                      <DetailRow label="Converted From Lead" value={account.convertedFromLeadId} />
                      <DetailRow label="Conversion Date" value={account.convertedDate} />
                    </>
                  )}
                </dl>
              </DetailSection>

              {/* Financial Information */}
              <DetailSection title="Financial Information">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Payment Terms" value={account.paymentTerms} />
                  <DetailRow label="Credit Status" value={account.creditStatus} />
                  <DetailRow
                    label="Credit Limit"
                    value={account.creditLimit ? `₹${account.creditLimit.toLocaleString()}` : undefined}
                  />
                  <DetailRow label="Currency" value={account.currency} />
                </dl>
              </DetailSection>

              {/* Business Metrics */}
              <DetailSection title="Business Metrics">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Total Opportunities" value={account.totalOpportunities} />
                  <DetailRow label="Won Opportunities" value={account.wonOpportunities} />
                  <DetailRow label="Lost Opportunities" value={account.lostOpportunities} />
                  <DetailRow
                    label="Total Revenue"
                    value={`₹${(account.totalRevenue || 0).toLocaleString()}`}
                  />
                  <DetailRow
                    label="Lifetime Value"
                    value={`₹${(account.lifetimeValue || 0).toLocaleString()}`}
                  />
                  <DetailRow label="Total Contacts" value={account.totalContacts} />
                </dl>
              </DetailSection>

              {/* Activity Information */}
              <DetailSection title="Activity Information">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Last Activity Date" value={account.lastActivityDate} />
                  <DetailRow label="Last Purchase Date" value={account.lastPurchaseDate} />
                  <DetailRow label="Last Contact Date" value={account.lastContactDate} />
                </dl>
              </DetailSection>

              {/* Additional Information */}
              <DetailSection title="Additional Information">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Description" value={account.description} />
                  <DetailRow label="Rating" value={account.rating} />
                  <DetailRow
                    label="Tags"
                    value={
                      account.tags && account.tags.length > 0 ? account.tags.join(", ") : undefined
                    }
                  />
                  <DetailRow label="Notes" value={account.notes} />
                </dl>
              </DetailSection>

              {/* System Information */}
              <DetailSection title="System Information">
                <dl className="divide-y divide-gray-200">
                  <DetailRow label="Created By" value={account.createdByName} />
                  <DetailRow label="Created At" value={new Date(account.createdAt).toLocaleString()} />
                  <DetailRow label="Last Modified By" value={account.lastModifiedByName} />
                  <DetailRow
                    label="Last Modified At"
                    value={new Date(account.lastModifiedAt).toLocaleString()}
                  />
                </dl>
              </DetailSection>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Account Activities</h2>
              </div>
              <EntityActivities
                entityId={id}
                entityType="ACCOUNT"
                activities={activities}
                loading={activitiesLoading}
                onActivityChanged={loadActivities}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
