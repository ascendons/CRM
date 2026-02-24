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
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Create New Proposal</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create a quotation for a lead or opportunity
          </p>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <Suspense fallback={<div>Loading...</div>}>
          <CreateProposalContent />
        </Suspense>
      </div>
    </div>
  );
}
