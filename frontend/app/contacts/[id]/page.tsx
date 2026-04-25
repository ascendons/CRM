"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Contact } from "@/types/contact";
import { contactsService } from "@/lib/contacts";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { opportunitiesService } from "@/lib/opportunities";
import { OpportunityStage, Opportunity } from "@/types/opportunity";
import {
  Mail,
  Phone,
  Edit3,
  Trash2,
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  Tag as TagIcon,
  User,
  Linkedin,
  Globe,
  FileText,
  ChevronRight,
  Navigation,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadContact = async () => {
    try {
      setLoading(true);
      const data = await contactsService.getContactById(id);
      setContact(data);

      // Fetch opportunities if contact has an account
      if (data.accountId) {
        try {
          const oppData = await opportunitiesService.getOpportunitiesByAccount(data.accountId);
          setOpportunities(oppData);
        } catch (oppErr) {
          console.error("Failed to load opportunities:", oppErr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await contactsService.deleteContact(id);
      showToast.success("Contact deleted successfully");
      router.push("/contacts");
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to delete contact");
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
          <p className="text-slate-500 font-medium">Loading contact...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <p className="text-red-600 mb-4">{error || "Contact not found"}</p>
        <button
          onClick={() => router.push("/contacts")}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Back to Contacts
        </button>
      </div>
    );
  }

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );

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

  const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/contacts" className="hover:text-primary">Contacts</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 font-medium">{contact.firstName} {contact.lastName}</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    {contact.salutation} {contact.firstName} {contact.lastName}
                  </h1>
                  <p className="text-slate-500">
                    {contact.jobTitle}{contact.department ? ` at ${contact.department}` : ""}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">ID: #{contact.contactId}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  )}
                  <button onClick={() => router.push(`/contacts/${contact.id}/edit`)} className="p-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
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
                <User className="h-4 w-4 text-slate-400" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Email Address</p>
                  <a href={`mailto:${contact.email}`} className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </a>
                </div>
                {contact.phone && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Phone Number</p>
                    <a href={`tel:${contact.phone}`} className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.mobilePhone && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Mobile</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {contact.mobilePhone}
                    </p>
                  </div>
                )}
                {contact.workPhone && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Work Phone</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {contact.workPhone}
                    </p>
                  </div>
                )}
                {contact.homePhone && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Home Phone</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {contact.homePhone}
                    </p>
                  </div>
                )}
                {contact.accountName && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Company</p>
                    <Link href={`/accounts/${contact.accountId}`} className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {contact.accountName}
                    </Link>
                  </div>
                )}
                {contact.isPrimaryContact && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Primary Contact</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      Yes
                    </span>
                  </div>
                )}
                {contact.emailOptOut && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Email Opt Out</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Opted Out
                    </span>
                  </div>
                )}
                {contact.birthdate && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Birthday</p>
                    <p className="text-sm text-slate-700">{new Date(contact.birthdate).toLocaleDateString()}</p>
                  </div>
                )}
                {contact.reportsTo && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Reports To</p>
                    <p className="text-sm text-slate-700">{contact.reportsTo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Address Card */}
            {contact.mailingStreet || contact.mailingCity ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Address
                </h3>
                <div className="flex gap-6">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {contact.mailingStreet ? `${contact.mailingStreet}\n` : ""}
                      {contact.mailingCity ? `${contact.mailingCity}${contact.mailingState ? `, ${contact.mailingState}` : ""} ${contact.mailingPostalCode}\n` : ""}
                      {contact.mailingCountry || ""}
                    </p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(`${contact.mailingStreet} ${contact.mailingCity} ${contact.mailingState} ${contact.mailingPostalCode} ${contact.mailingCountry}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline mt-3">
                      <Navigation className="h-3.5 w-3.5" />
                      Get Directions
                    </a>
                  </div>
                  {/* Map Preview Placeholder */}
                  <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <MapPin className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ) : null}

            {/* About */}
            {(contact.linkedInProfile || contact.website || contact.twitterHandle || contact.facebookProfile || contact.skypeId || contact.description) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  About
                </h3>
                <div className="space-y-4">
                  {contact.linkedInProfile && (
                    <a href={contact.linkedInProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  {contact.twitterHandle && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Globe className="h-4 w-4 text-slate-400" />
                      Twitter: @{contact.twitterHandle}
                    </div>
                  )}
                  {contact.facebookProfile && (
                    <a href={contact.facebookProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                      <Globe className="h-4 w-4" />
                      Facebook Profile
                    </a>
                  )}
                  {contact.skypeId && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Globe className="h-4 w-4 text-slate-400" />
                      Skype: {contact.skypeId}
                    </div>
                  )}
                  {contact.website && (
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                      <Globe className="h-4 w-4" />
                      {contact.website}
                    </a>
                  )}
                  {contact.description && (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{contact.description}</p>
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
                    <p className="text-sm text-slate-700">{new Date(contact.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Last Modified</p>
                    <p className="text-sm text-slate-700">{new Date(contact.lastModifiedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-slate-400" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assistant */}
            {contact.assistantName && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Assistant
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-sm">
                    {contact.assistantName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{contact.assistantName}</p>
                    {contact.assistantPhone && (
                      <a href={`tel:${contact.assistantPhone}`} className="text-xs text-blue-500 hover:underline">{contact.assistantPhone}</a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline Widget */}
            {opportunities.length > 0 ? (() => {
              // Calculate pipeline stats
              const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
              const advancedStages = [OpportunityStage.PROPOSAL, OpportunityStage.NEGOTIATION, OpportunityStage.CLOSED_WON];
              const advancedCount = opportunities.filter(opp => advancedStages.includes(opp.stage)).length;
              const progressionPercent = Math.round((advancedCount / opportunities.length) * 100);

              return (
                <div className="bg-slate-900 rounded-xl shadow-sm p-6 text-white">
                  <h3 className="text-sm font-semibold mb-4">Pipeline Progression</h3>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-3xl font-bold">{progressionPercent}%</span>
                    <span className="text-xs text-slate-400">of deals advanced</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressionPercent}%` }}></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400">Total Deal Value</p>
                    <p className="text-xl font-bold">${totalValue.toLocaleString()}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>{opportunities.length} deal{opportunities.length !== 1 ? "s" : ""}</span>
                    <span>{advancedCount} advanced</span>
                  </div>
                </div>
              );
            })() : (
              <div className="bg-slate-100 rounded-xl shadow-sm p-6 text-slate-500">
                <h3 className="text-sm font-semibold mb-2 text-slate-700">Pipeline Progression</h3>
                <p className="text-xs">No deals linked to this contact's account</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`}
        confirmLabel="Delete Contact"
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
