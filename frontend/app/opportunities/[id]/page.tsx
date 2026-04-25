"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Opportunity, OpportunityStage } from "@/types/opportunity";
import { opportunitiesService } from "@/lib/opportunities";
import { proposalsService } from "@/lib/proposals";
import {
  ProposalResponse,
  ProposalSource,
  getProposalStatusLabel,
  getProposalStatusColor,
} from "@/types/proposal";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import ConfirmModal from "@/components/ConfirmModal";
import {
  ChevronRight,
  Edit3,
  Trash2,
  FileText,
  CheckSquare,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  User,
  Briefcase,
  Tag as TagIcon,
  Mail,
  Phone,
  MessageSquare,
  Target,
} from "lucide-react";
import { EntityActivities } from "@/components/common/EntityActivities";
import { activitiesService } from "@/lib/activities";
import { Activity } from "@/types/activity";

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"details" | "proposals" | "activities">("details");

  // Activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadOpportunity();
    loadProposals();
    loadActivities();
  }, [id, router]);

  const loadOpportunity = async () => {
    try {
      setLoading(true);
      const data = await opportunitiesService.getOpportunityById(id);
      setOpportunity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunity");
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async () => {
    try {
      setProposalsLoading(true);
      const data = await proposalsService.getProposalsBySource(ProposalSource.OPPORTUNITY, id);
      if ("content" in data) {
        setProposals(data.content);
      } else {
        setProposals(data || []);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const data = await activitiesService.getActivitiesByOpportunity(id);
      setActivities(data);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await opportunitiesService.deleteOpportunity(id);
      showToast.success("Opportunity deleted successfully");
      router.push("/opportunities");
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Failed to delete opportunity");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "-";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getStageBadgeColor = (stage: OpportunityStage) => {
    const colors = {
      [OpportunityStage.PROSPECTING]: "bg-blue-50 text-blue-700 border-blue-100",
      [OpportunityStage.QUALIFICATION]: "bg-indigo-50 text-indigo-700 border-indigo-100",
      [OpportunityStage.NEEDS_ANALYSIS]: "bg-amber-50 text-amber-700 border-amber-100",
      [OpportunityStage.PROPOSAL]: "bg-purple-50 text-purple-700 border-purple-100",
      [OpportunityStage.NEGOTIATION]: "bg-orange-50 text-orange-700 border-orange-100",
      [OpportunityStage.CLOSED_WON]: "bg-emerald-50 text-emerald-700 border-emerald-100",
      [OpportunityStage.CLOSED_LOST]: "bg-red-50 text-red-700 border-red-100",
    };
    return colors[stage] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStageLabel = (stage: OpportunityStage) => {
    return stage.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStageProgress = (stage: OpportunityStage) => {
    const stages = [
      OpportunityStage.PROSPECTING,
      OpportunityStage.QUALIFICATION,
      OpportunityStage.NEEDS_ANALYSIS,
      OpportunityStage.PROPOSAL,
      OpportunityStage.NEGOTIATION,
      OpportunityStage.CLOSED_WON,
    ];
    const index = stages.indexOf(stage);
    if (index === -1) return 0;
    return ((index + 1) / stages.length) * 100;
  };

  const getStageIconColor = (stage: OpportunityStage) => {
    const colors = {
      [OpportunityStage.PROSPECTING]: "bg-blue-500",
      [OpportunityStage.QUALIFICATION]: "bg-indigo-500",
      [OpportunityStage.NEEDS_ANALYSIS]: "bg-amber-500",
      [OpportunityStage.PROPOSAL]: "bg-purple-500",
      [OpportunityStage.NEGOTIATION]: "bg-orange-500",
      [OpportunityStage.CLOSED_WON]: "bg-emerald-500",
      [OpportunityStage.CLOSED_LOST]: "bg-red-500",
    };
    return colors[stage] || "bg-slate-500";
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

  if (error || !opportunity) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 min-h-[calc(100vh-4rem)]">
        <p className="text-red-600 mb-4">{error || "Opportunity not found"}</p>
        <button
          onClick={() => router.push("/opportunities")}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          Back to Opportunities
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

  const weightedValue = ((opportunity.amount || 0) * (opportunity.probability || 0)) / 100;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/opportunities" className="hover:text-primary">Opportunities</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 font-medium">{opportunity.opportunityName}</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              <Briefcase className="h-10 w-10" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {opportunity.opportunityName}
                    </h1>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStageBadgeColor(opportunity.stage)}`}
                    >
                      {getStageLabel(opportunity.stage)}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    {opportunity.accountName || "No Account"}
                    {opportunity.primaryContactName ? ` • ${opportunity.primaryContactName}` : ""}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">ID: #{opportunity.opportunityId}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/opportunities/${opportunity.id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Progress Card */}
        {opportunity.stage !== OpportunityStage.CLOSED_LOST && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                Sales Progress
              </h3>
              <span className="text-sm font-bold text-primary">
                {getStageProgress(opportunity.stage).toFixed(0)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getStageIconColor(opportunity.stage)}`}
                style={{ width: `${getStageProgress(opportunity.stage)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-400" />
                Financial Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Proposal Value</p>
                  <p className="text-xl font-bold text-emerald-700">{formatCurrency(opportunity.amount)}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Probability</p>
                  <p className="text-xl font-bold text-blue-700">{opportunity.probability}%</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Weighted Value</p>
                  <p className="text-xl font-bold text-purple-700">{formatCurrency(weightedValue)}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Expected Close</p>
                  <p className="text-lg font-bold text-slate-700">{formatDate(opportunity.expectedCloseDate)}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200">
                <nav className="-mb-px flex" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`${
                      activeTab === "details"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                  >
                    <FileText className="h-4 w-4" />
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("proposals")}
                    className={`${
                      activeTab === "proposals"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Proposals
                    <span className="bg-slate-100 text-slate-600 ml-1.5 py-0.5 px-2 rounded-full text-xs font-medium">
                      {proposals.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("activities")}
                    className={`${
                      activeTab === "activities"
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Activities
                    <span className="bg-slate-100 text-slate-600 ml-1.5 py-0.5 px-2 rounded-full text-xs font-medium">
                      {activities.length}
                    </span>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "details" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        Basic Information
                      </h4>
                      <dl className="space-y-1">
                        <DetailRow label="Type" value={opportunity.type} />
                        <DetailRow label="Lead Source" value={opportunity.leadSource} />
                        <DetailRow label="Next Step" value={opportunity.nextStep} />
                        <DetailRow label="Days in Stage" value={opportunity.daysInStage} />
                      </dl>
                    </div>

                    {/* Account & Contact */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        Account & Contact
                      </h4>
                      <dl className="space-y-1">
                        <DetailRow
                          label="Account"
                          value={opportunity.accountName}
                          href={opportunity.accountId ? `/accounts/${opportunity.accountId}` : undefined}
                        />
                        <DetailRow label="Primary Contact" value={opportunity.primaryContactName} />
                        <DetailRow label="Campaign Source" value={opportunity.campaignSource} />
                      </dl>
                    </div>

                    {/* Financial Details */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        Financial Details
                      </h4>
                      <dl className="space-y-1">
                        <DetailRow label="Forecast Amount" value={formatCurrency(opportunity.forecastAmount)} />
                        <DetailRow label="Currency" value={opportunity.currency} />
                        <DetailRow label="Discount Amount" value={formatCurrency(opportunity.discountAmount)} />
                        <DetailRow label="Total Amount" value={formatCurrency(opportunity.totalAmount)} />
                      </dl>
                    </div>

                    {/* Decision Process */}
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-slate-400" />
                        Decision Process
                      </h4>
                      <dl className="space-y-1">
                        <DetailRow label="Decision Maker" value={opportunity.decisionMaker} />
                        <DetailRow label="Decision Criteria" value={opportunity.decisionCriteria} />
                        <DetailRow label="Budget Confirmed" value={opportunity.budgetConfirmed ? "Yes" : "No"} />
                        <DetailRow label="Decision Timeframe" value={opportunity.decisionTimeframe} />
                      </dl>
                    </div>

                    {/* Products & Services */}
                    {(opportunity.products?.length || opportunity.services?.length) && (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          Products & Services
                        </h4>
                        <dl className="space-y-1">
                          <DetailRow
                            label="Products"
                            value={opportunity.products?.join(", ")}
                          />
                          <DetailRow
                            label="Services"
                            value={opportunity.services?.join(", ")}
                          />
                          <DetailRow label="Solution Offered" value={opportunity.solutionOffered} />
                        </dl>
                      </div>
                    )}

                    {/* Competition */}
                    {opportunity.competitors?.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-slate-400" />
                          Competition
                        </h4>
                        <dl className="space-y-1">
                          <DetailRow label="Competitors" value={opportunity.competitors?.join(", ")} />
                          <DetailRow label="Competitive Advantage" value={opportunity.competitiveAdvantage} />
                          {opportunity.lossReason && (
                            <DetailRow label="Loss Reason" value={opportunity.lossReason} />
                          )}
                        </dl>
                      </div>
                    )}

                    {/* Description */}
                    {opportunity.description && (
                      <div className="bg-slate-50 rounded-xl p-4 md:col-span-2">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Description</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{opportunity.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "proposals" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-900">Proposals</h3>
                      <Link
                        href={`/proposals/new?source=OPPORTUNITY&sourceId=${id}`}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                      >
                        + Create Proposal
                      </Link>
                    </div>

                    {proposalsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <CheckSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p>No proposals yet</p>
                        <Link
                          href={`/proposals/new?source=OPPORTUNITY&sourceId=${id}`}
                          className="text-primary hover:underline text-sm mt-2 inline-block"
                        >
                          Create your first proposal
                        </Link>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proposal #</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Valid Until</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {proposals.map((proposal) => (
                              <tr key={proposal.id} className="hover:bg-slate-50">
                                <td className="px-4 py-4 text-sm font-medium text-primary">
                                  <Link href={`/proposals/${proposal.id}`}>
                                    {proposal.referenceNumber || proposal.proposalNumber}
                                  </Link>
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-900">{proposal.title}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">₹{proposal.totalAmount.toLocaleString()}</td>
                                <td className="px-4 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    proposal.isProforma ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                  }`}>
                                    {proposal.isProforma ? "Proforma" : "Quotation"}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700`}>
                                    {getProposalStatusLabel(proposal.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-500">
                                  {new Date(proposal.validUntil).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "activities" && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Discussion & Activities</h3>
                    <EntityActivities
                      entityId={id}
                      entityType="OPPORTUNITY"
                      activities={activities}
                      loading={activitiesLoading}
                      onActivityChanged={loadActivities}
                    />
                  </div>
                )}
              </div>
            </div>
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
                    <p className="text-sm text-slate-700">{new Date(opportunity.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Last Modified</p>
                    <p className="text-sm text-slate-700">{new Date(opportunity.lastModifiedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {opportunity.ownerName && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Owner</p>
                      <p className="text-sm text-slate-700">{opportunity.ownerName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {opportunity.tags && opportunity.tags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-slate-400" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {opportunity.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                Engagement
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-slate-700">{opportunity.emailsSent || 0}</p>
                  <p className="text-xs text-slate-500">Emails</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-slate-700">{opportunity.callsMade || 0}</p>
                  <p className="text-xs text-slate-500">Calls</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-slate-700">{opportunity.meetingsHeld || 0}</p>
                  <p className="text-xs text-slate-500">Meetings</p>
                </div>
              </div>
            </div>

            {/* Stage History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Stage History
              </h3>
              <div className="space-y-3">
                {opportunity.prospectingDate && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500">Prospecting</span>
                    <span className="text-xs text-slate-700">{formatDate(opportunity.prospectingDate)}</span>
                  </div>
                )}
                {opportunity.qualificationDate && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500">Qualification</span>
                    <span className="text-xs text-slate-700">{formatDate(opportunity.qualificationDate)}</span>
                  </div>
                )}
                {opportunity.proposalDate && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500">Proposal</span>
                    <span className="text-xs text-slate-700">{formatDate(opportunity.proposalDate)}</span>
                  </div>
                )}
                {opportunity.negotiationDate && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500">Negotiation</span>
                    <span className="text-xs text-slate-700">{formatDate(opportunity.negotiationDate)}</span>
                  </div>
                )}
                {opportunity.closedDate && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-slate-500">Closed</span>
                    <span className="text-xs text-slate-700">{formatDate(opportunity.closedDate)}</span>
                  </div>
                )}
                {!opportunity.prospectingDate && !opportunity.qualificationDate && !opportunity.proposalDate && (
                  <p className="text-xs text-slate-400">No stage history available</p>
                )}
              </div>
            </div>

            {/* Payment Info */}
            {(opportunity.paymentTerms || opportunity.deliveryStatus) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  Additional Info
                </h3>
                <div className="space-y-3">
                  {opportunity.paymentTerms && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Payment Terms</span>
                      <span className="text-sm font-medium text-slate-700">{opportunity.paymentTerms}</span>
                    </div>
                  )}
                  {opportunity.deliveryStatus && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-500">Delivery Status</span>
                      <span className="text-sm font-medium text-slate-700">{opportunity.deliveryStatus}</span>
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
        title="Delete Opportunity"
        message={`Are you sure you want to delete ${opportunity.opportunityName}? This action cannot be undone.`}
        confirmLabel="Delete Opportunity"
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={deleting}
      />
    </div>
  );
}
