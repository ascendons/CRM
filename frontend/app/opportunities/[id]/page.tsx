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

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadOpportunity();
    loadProposals();
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
      setProposals(data);
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this opportunity?")) {
      return;
    }

    try {
      await opportunitiesService.deleteOpportunity(id);
      router.push("/opportunities");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete opportunity");
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
      [OpportunityStage.PROSPECTING]: "bg-blue-100 text-blue-800",
      [OpportunityStage.QUALIFICATION]: "bg-indigo-100 text-indigo-800",
      [OpportunityStage.NEEDS_ANALYSIS]: "bg-yellow-100 text-yellow-800",
      [OpportunityStage.PROPOSAL]: "bg-purple-100 text-purple-800",
      [OpportunityStage.NEGOTIATION]: "bg-orange-100 text-orange-800",
      [OpportunityStage.CLOSED_WON]: "bg-green-100 text-green-800",
      [OpportunityStage.CLOSED_LOST]: "bg-red-100 text-red-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Opportunity not found"}</p>
          <button
            onClick={() => router.push("/opportunities")}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Back to Opportunities
          </button>
        </div>
      </div>
    );
  }

  const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow p-6">
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
              <h1 className="text-3xl font-bold text-gray-900">{opportunity.opportunityName}</h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageBadgeColor(opportunity.stage)}`}
              >
                {getStageLabel(opportunity.stage)}
              </span>
            </div>
            <p className="text-gray-600">Opportunity ID: {opportunity.opportunityId}</p>
            <p className="text-sm text-gray-500 mt-1">
              Owner: {opportunity.ownerName} | Account: {opportunity.accountName}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/opportunities/${opportunity.id}/edit`)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Edit Opportunity
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => router.push("/opportunities")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>

        {/* Stage Progress Bar */}
        {opportunity.stage !== OpportunityStage.CLOSED_LOST && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${getStageProgress(opportunity.stage)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {getStageProgress(opportunity.stage).toFixed(0)}% Complete
            </p>
          </div>
        )}

        {/* Financial Metrics */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(opportunity.amount)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Probability</p>
            <p className="text-2xl font-bold text-gray-900">{opportunity.probability}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Weighted Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency((opportunity.amount * opportunity.probability) / 100)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Close Date</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatDate(opportunity.expectedCloseDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <DetailSection title="Basic Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Opportunity Name" value={opportunity.opportunityName} />
              <DetailRow label="Stage" value={getStageLabel(opportunity.stage)} />
              <DetailRow label="Amount" value={formatCurrency(opportunity.amount)} />
              <DetailRow label="Probability" value={`${opportunity.probability}%`} />
              <DetailRow
                label="Expected Close Date"
                value={formatDate(opportunity.expectedCloseDate)}
              />
              <DetailRow
                label="Actual Close Date"
                value={formatDate(opportunity.actualCloseDate)}
              />
              <DetailRow label="Days in Stage" value={opportunity.daysInStage} />
            </dl>
          </DetailSection>

          {/* Account & Contact */}
          <DetailSection title="Account & Contact">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Account" value={opportunity.accountName} />
              <DetailRow label="Primary Contact" value={opportunity.primaryContactName} />
              {opportunity.convertedFromLeadId && (
                <>
                  <DetailRow label="Converted From Lead" value={opportunity.convertedFromLeadId} />
                  <DetailRow
                    label="Conversion Date"
                    value={formatDate(opportunity.convertedDate)}
                  />
                </>
              )}
            </dl>
          </DetailSection>

          {/* Sales Information */}
          <DetailSection title="Sales Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Type" value={opportunity.type} />
              <DetailRow label="Lead Source" value={opportunity.leadSource} />
              <DetailRow label="Campaign Source" value={opportunity.campaignSource} />
              <DetailRow label="Next Step" value={opportunity.nextStep} />
              <DetailRow label="Description" value={opportunity.description} />
            </dl>
          </DetailSection>

          {/* Financial Details */}
          <DetailSection title="Financial Details">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Amount" value={formatCurrency(opportunity.amount)} />
              <DetailRow
                label="Forecast Amount"
                value={formatCurrency(opportunity.forecastAmount)}
              />
              <DetailRow label="Currency" value={opportunity.currency} />
              <DetailRow
                label="Discount Amount"
                value={formatCurrency(opportunity.discountAmount)}
              />
              <DetailRow label="Total Amount" value={formatCurrency(opportunity.totalAmount)} />
            </dl>
          </DetailSection>

          {/* Products & Services */}
          <DetailSection title="Products & Services">
            <dl className="divide-y divide-gray-200">
              <DetailRow
                label="Products"
                value={
                  opportunity.products && opportunity.products.length > 0
                    ? opportunity.products.join(", ")
                    : undefined
                }
              />
              <DetailRow
                label="Services"
                value={
                  opportunity.services && opportunity.services.length > 0
                    ? opportunity.services.join(", ")
                    : undefined
                }
              />
              <DetailRow label="Solution Offered" value={opportunity.solutionOffered} />
            </dl>
          </DetailSection>

          {/* Competition */}
          <DetailSection title="Competition">
            <dl className="divide-y divide-gray-200">
              <DetailRow
                label="Competitors"
                value={
                  opportunity.competitors && opportunity.competitors.length > 0
                    ? opportunity.competitors.join(", ")
                    : undefined
                }
              />
              <DetailRow label="Competitive Advantage" value={opportunity.competitiveAdvantage} />
              {opportunity.lossReason && (
                <DetailRow label="Loss Reason" value={opportunity.lossReason} />
              )}
            </dl>
          </DetailSection>

          {/* Decision Process */}
          <DetailSection title="Decision Process">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Decision Maker" value={opportunity.decisionMaker} />
              <DetailRow label="Decision Criteria" value={opportunity.decisionCriteria} />
              <DetailRow label="Budget Confirmed" value={opportunity.budgetConfirmed} />
              <DetailRow label="Decision Timeframe" value={opportunity.decisionTimeframe} />
            </dl>
          </DetailSection>

          {/* Engagement */}
          <DetailSection title="Engagement">
            <dl className="divide-y divide-gray-200">
              <DetailRow
                label="Last Activity Date"
                value={formatDate(opportunity.lastActivityDate)}
              />
              <DetailRow label="Total Activities" value={opportunity.totalActivities} />
              <DetailRow label="Emails Sent" value={opportunity.emailsSent} />
              <DetailRow label="Calls Made" value={opportunity.callsMade} />
              <DetailRow label="Meetings Held" value={opportunity.meetingsHeld} />
            </dl>
          </DetailSection>

          {/* Team */}
          <DetailSection title="Team">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Owner" value={opportunity.ownerName} />
              <DetailRow
                label="Team Members"
                value={
                  opportunity.teamMembers && opportunity.teamMembers.length > 0
                    ? opportunity.teamMembers.join(", ")
                    : undefined
                }
              />
            </dl>
          </DetailSection>

          {/* Additional Information */}
          <DetailSection title="Additional Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Delivery Status" value={opportunity.deliveryStatus} />
              <DetailRow label="Payment Terms" value={opportunity.paymentTerms} />
              <DetailRow
                label="Tags"
                value={
                  opportunity.tags && opportunity.tags.length > 0
                    ? opportunity.tags.join(", ")
                    : undefined
                }
              />
              <DetailRow label="Notes" value={opportunity.notes} />
            </dl>
          </DetailSection>

          {/* Stage History */}
          <DetailSection title="Stage History">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Prospecting Date" value={formatDate(opportunity.prospectingDate)} />
              <DetailRow
                label="Qualification Date"
                value={formatDate(opportunity.qualificationDate)}
              />
              <DetailRow
                label="Needs Analysis Date"
                value={formatDate(opportunity.needsAnalysisDate)}
              />
              <DetailRow label="Proposal Date" value={formatDate(opportunity.proposalDate)} />
              <DetailRow label="Negotiation Date" value={formatDate(opportunity.negotiationDate)} />
              <DetailRow label="Closed Date" value={formatDate(opportunity.closedDate)} />
            </dl>
          </DetailSection>

          {/* System Information */}
          <DetailSection title="System Information">
            <dl className="divide-y divide-gray-200">
              <DetailRow label="Created By" value={opportunity.createdByName} />
              <DetailRow
                label="Created At"
                value={new Date(opportunity.createdAt).toLocaleString()}
              />
              <DetailRow label="Last Modified By" value={opportunity.lastModifiedByName} />
              <DetailRow
                label="Last Modified At"
                value={new Date(opportunity.lastModifiedAt).toLocaleString()}
              />
            </dl>
          </DetailSection>
        </div>

        {/* Proposals Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Proposals</h2>
            <Link
              href={`/proposals/new?source=OPPORTUNITY&sourceId=${id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              + Create Proposal
            </Link>
          </div>

          {proposalsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No proposals yet</p>
              <Link
                href={`/proposals/new?source=OPPORTUNITY&sourceId=${id}`}
                className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
              >
                Create your first proposal
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Proposal #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Valid Until
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link href={`/proposals/${proposal.id}`}>
                          {proposal.proposalNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {proposal.title}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{proposal.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getProposalStatusColor(
                            proposal.status
                          )}-100 text-${getProposalStatusColor(proposal.status)}-800`}
                        >
                          {getProposalStatusLabel(proposal.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(proposal.validUntil).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
