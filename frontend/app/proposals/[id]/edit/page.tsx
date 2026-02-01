"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProposalForm from "@/components/proposals/ProposalForm";
import { proposalsService } from "@/lib/proposals";
import { ProposalResponse, ProposalStatus } from "@/types/proposal";
import { authService } from "@/lib/auth";

export default function EditProposalPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [proposal, setProposal] = useState<ProposalResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            router.push("/login");
            return;
        }
        loadProposal();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, router]);

    const loadProposal = async () => {
        try {
            setLoading(true);
            const data = await proposalsService.getProposalById(id);

            if (data.status !== ProposalStatus.DRAFT) {
                setError("Only DRAFT proposals can be edited");
                return;
            }

            setProposal(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load proposal");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading proposal...</p>
                </div>
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <span className="material-symbols-outlined text-red-500 text-6xl">
                            error
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Unable to Edit Proposal
                    </h2>
                    <p className="text-gray-600 mb-6">{error || "Proposal not found"}</p>
                    <button
                        onClick={() => router.push("/proposals")}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 decoration-none"
                    >
                        Back to Proposals
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Edit Proposal
                            </h1>
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                                {proposal.proposalNumber}
                            </span>
                        </div>
                        <p className="text-gray-600 mt-1">
                            Update details for {proposal.title}
                        </p>
                    </div>

                    <ProposalForm mode="edit" initialData={proposal} />
                </div>
            </div>
        </div>
    );
}
