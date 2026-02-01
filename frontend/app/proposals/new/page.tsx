"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProposalForm from "@/components/proposals/ProposalForm";
import { ProposalSource } from "@/types/proposal";

function CreateProposalContent() {
  const searchParams = useSearchParams();
  const source = (searchParams.get("source") as ProposalSource) || undefined;
  const sourceId = searchParams.get("sourceId") || undefined;

  return (
    <ProposalForm
      mode="create"
      sourceType={source}
      sourceId={sourceId}
    />
  );
}

export default function NewProposalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Proposal
            </h1>
            <p className="text-gray-600 mt-1">
              Create a quotation for a lead or opportunity
            </p>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <CreateProposalContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
