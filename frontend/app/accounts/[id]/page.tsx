"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Account } from "@/types/account";
import { accountsService } from "@/lib/accounts";
import { contactsService } from "@/lib/contacts";
import { opportunitiesService } from "@/lib/opportunities";
import { OpportunityStage, Opportunity } from "@/types/opportunity";
import { Contact } from "@/types/contact";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import {
  Mail,
  Phone,
  Edit3,
  Trash2,
  Building2,
  Globe,
  FileText,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Tag as TagIcon,
  Linkedin,
  Navigation,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const data = await accountsService.getAccountById(id);
      setAccount(data);

      // Fetch contacts and opportunities in parallel
      if (data.id) {
        try {
          const [contactsData, oppData] = await Promise.all([
            contactsService.getContactsByAccount(data.id),
            opportunitiesService.getOpportunitiesByAccount(data.id)
          ]);
          setContacts(contactsData);
          setOpportunities(oppData);
        } catch (oppErr) {
          console.error("Failed to load contacts/opportunities:", oppErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await accountsService.deleteAccount(id);
      showToast.success("Account deleted successfully");
      router.push("/accounts");
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to delete account");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Loading account...</p>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <p className="text-red-600 mb-4">{error || "Account not found"}</p>
        <button
          onClick={() => router.push("/accounts")}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Back to Accounts
        </button>
      </div>
    );
  }

  const DetailRow = ({
    label,
    value,
    href,
  }: {
    label: string;
    value: string | number | boolean | undefined | null;
    href?: string;
  }) => (
    <div className="py-3 border-b border-slate-100 last:border-0 flex justify-between items-center">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">
        {value !== undefined && value !== null && value !== "" ? (
          href ? (
            <Link href={href} className="text-primary hover:underline">
              {String(value)}
            </Link>
          ) : (
            String(value)
          )
        ) : (
          "-"
        )}
      </dd>
    </div>
  );

  const initials = `${account.accountName?.[0] || ""}`.toUpperCase();

  // Calculate pipeline stats
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const wonValue = opportunities
    .filter((opp) => opp.stage === OpportunityStage.CLOSED_WON)
    .reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const advancedStages = [OpportunityStage.PROPOSAL, OpportunityStage.NEGOTIATION, OpportunityStage.CLOSED_WON];
  const advancedCount = opportunities.filter((opp) => advancedStages.includes(opp.stage)).length;
  const progressionPercent = opportunities.length > 0 ? Math.round((advancedCount / opportunities.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/accounts" className="hover:text-primary">Accounts</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 font-medium">{account.accountName}</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {account.accountName}
                    </h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      account.accountStatus === "Active"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {account.accountStatus || "Inactive"}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    {account.industry || "No Industry"}
                    {account.companySize ? ` • ${account.companySize}` : ""}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">ID: #{account.accountId}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {account.email && (
                    <a href={`mailto:${account.email}`} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  )}
                  {account.phone && (
                    <a href={`tel:${account.phone}`} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  )}
                  <button onClick={() => router.push(`/accounts/${account.id}/edit`)} className="p-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button onClick={() => setShowDeleteModal(true)} className="p-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {account.email && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Email</p>
                    <a href={`mailto:${account.email}`} className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {account.email}
                    </a>
                  </div>
                )}
                {account.phone && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Phone</p>
                    <a href={`tel:${account.phone}`} className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {account.phone}
                    </a>
                  </div>
                )}
                {account.website && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Website</p>
                    <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {account.website}
                    </a>
                  </div>
                )}
                {account.fax && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Fax</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {account.fax}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                Key Metrics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
                  <p className="text-lg font-bold text-emerald-700">${(account.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Lifetime Value</p>
                  <p className="text-lg font-bold text-blue-700">${(account.lifetimeValue || 0).toLocaleString()}</p>
                </div>
                <Link href={`/contacts?accountId=${account.id}`} className="text-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <p className="text-xs text-slate-500 mb-1">Contacts</p>
                  <p className="text-lg font-bold text-blue-600 hover:underline">{contacts.length}</p>
                </Link>
                <Link href={`/opportunities?accountId=${account.id}`} className="text-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <p className="text-xs text-slate-500 mb-1">Opportunities</p>
                  <p className="text-lg font-bold text-blue-600 hover:underline">{opportunities.length}</p>
                </Link>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Won</p>
                  <p className="text-lg font-bold text-emerald-700">{account.wonOpportunities ?? 0}</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Lost</p>
                  <p className="text-lg font-bold text-red-700">{account.lostOpportunities ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Billing Address */}
            {account.billingStreet || account.billingCity ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Billing Address
                </h3>
                <div className="flex gap-6">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {account.billingStreet ? `${account.billingStreet}\n` : ""}
                      {account.billingCity ? `${account.billingCity}${account.billingState ? `, ${account.billingState}` : ""} ${account.billingPostalCode}\n` : ""}
                      {account.billingCountry || ""}
                    </p>
                    {(account.billingStreet || account.billingCity) && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(`${account.billingStreet} ${account.billingCity} ${account.billingState} ${account.billingPostalCode} ${account.billingCountry}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline mt-3">
                        <Navigation className="h-3.5 w-3.5" />
                        Get Directions
                      </a>
                    )}
                  </div>
                  <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <MapPin className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ) : null}

            {/* Shipping Address */}
            {account.shippingStreet || account.shippingCity ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Shipping Address
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {account.shippingStreet ? `${account.shippingStreet}\n` : ""}
                  {account.shippingCity ? `${account.shippingCity}${account.shippingState ? `, ${account.shippingState}` : ""} ${account.shippingPostalCode}\n` : ""}
                  {account.shippingCountry || ""}
                </p>
              </div>
            ) : null}

            {/* Business Information */}
            {(account.tickerSymbol || account.sicCode || account.naicsCode || account.dunsNumber || account.taxId) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Business Information
                </h3>
                <div className="space-y-3">
                  {account.tickerSymbol && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Ticker Symbol</span>
                      <span className="text-sm font-medium text-slate-700">{account.tickerSymbol}</span>
                    </div>
                  )}
                  {account.sicCode && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">SIC Code</span>
                      <span className="text-sm font-medium text-slate-700">{account.sicCode}</span>
                    </div>
                  )}
                  {account.naicsCode && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">NAICS Code</span>
                      <span className="text-sm font-medium text-slate-700">{account.naicsCode}</span>
                    </div>
                  )}
                  {account.dunsNumber && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">DUNS Number</span>
                      <span className="text-sm font-medium text-slate-700">{account.dunsNumber}</span>
                    </div>
                  )}
                  {account.taxId && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-500">Tax ID</span>
                      <span className="text-sm font-medium text-slate-700">{account.taxId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {(account.linkedInPage || account.description) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  About
                </h3>
                <div className="space-y-4">
                  {account.linkedInPage && (
                    <a href={account.linkedInPage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Page
                    </a>
                  )}
                  {account.description && (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{account.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-6">
            {/* System Record */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                System Record
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Created On</p>
                    <p className="text-sm text-slate-700">{new Date(account.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Last Modified</p>
                    <p className="text-sm text-slate-700">{new Date(account.lastModifiedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {account.ownerName && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Owner</p>
                      <p className="text-sm text-slate-700">{account.ownerName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {account.tags && account.tags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-slate-400" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {account.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline Widget */}
            {opportunities.length > 0 ? (
              <div className="bg-slate-900 rounded-xl shadow-sm p-6 text-white">
                <h3 className="text-sm font-semibold mb-4">Deal Pipeline</h3>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold">{progressionPercent}%</span>
                  <span className="text-xs text-slate-400">of deals advanced</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressionPercent}%` }}></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400">Total Pipeline</p>
                  <p className="text-xl font-bold">${totalValue.toLocaleString()}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400">Won Value</p>
                  <p className="text-lg font-bold text-emerald-400">${wonValue.toLocaleString()}</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{opportunities.length} deal{opportunities.length !== 1 ? "s" : ""}</span>
                  <span>{advancedCount} advanced</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl shadow-sm p-6 text-slate-500">
                <h3 className="text-sm font-semibold mb-2 text-slate-700">Deal Pipeline</h3>
                <p className="text-xs">No deals linked to this account</p>
              </div>
            )}

            {/* Financial Info */}
            {(account.paymentTerms || account.creditStatus || account.creditLimit) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  Financial Information
                </h3>
                <div className="space-y-3">
                  {account.paymentTerms && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Payment Terms</span>
                      <span className="text-sm font-medium text-slate-700">{account.paymentTerms}</span>
                    </div>
                  )}
                  {account.creditStatus && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Credit Status</span>
                      <span className="text-sm font-medium text-slate-700">{account.creditStatus}</span>
                    </div>
                  )}
                  {account.creditLimit && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-500">Credit Limit</span>
                      <span className="text-sm font-medium text-slate-700">${account.creditLimit.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account"
        message={`Are you sure you want to delete ${account.accountName}? This action cannot be undone.`}
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
