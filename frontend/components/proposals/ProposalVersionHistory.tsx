"use client";

import { useState, useEffect } from "react";
import { ProposalVersionResponse, getActionLabel, getActionColor } from "@/types/proposal-version";
import { proposalsService } from "@/lib/proposals";
import { formatDateTimeLongIST } from "@/lib/utils/date";
import { Clock, User, ArrowRight, Layers, FileSearch } from "lucide-react";

interface ProposalVersionHistoryProps {
    proposalId: string;
    onVersionSelect: (version: ProposalVersionResponse) => void;
    onCompareSelect: (v1: ProposalVersionResponse, v2: ProposalVersionResponse) => void;
}

export default function ProposalVersionHistory({
    proposalId,
    onVersionSelect,
    onCompareSelect
}: ProposalVersionHistoryProps) {
    const [history, setHistory] = useState<ProposalVersionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

    useEffect(() => {
        loadHistory();
    }, [proposalId]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await proposalsService.getVersionHistory(proposalId);
            setHistory(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load version history");
        } finally {
            setLoading(false);
        }
    };

    const handleCompareToggle = (id: string) => {
        if (selectedForCompare.includes(id)) {
            setSelectedForCompare(selectedForCompare.filter(i => i !== id));
        } else {
            if (selectedForCompare.length < 2) {
                setSelectedForCompare([...selectedForCompare, id]);
            } else {
                // Replace the first one
                setSelectedForCompare([selectedForCompare[1], id]);
            }
        }
    };

    const handleCompareClick = () => {
        if (selectedForCompare.length === 2) {
            const v1 = history.find(v => v.id === selectedForCompare[0]);
            const v2 = history.find(v => v.id === selectedForCompare[1]);
            if (v1 && v2) {
                // Ensure v1 is the older version for logical diff
                if (v1.version > v2.version) {
                    onCompareSelect(v2, v1);
                } else {
                    onCompareSelect(v1, v2);
                }
            }
        }
    };

    if (loading) return (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm border">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-500">Loading version history...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <p>{error}</p>
        </div>
    );

    if (history.length === 0) return (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm border">
            <Layers className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No version history found.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Comparison Header */}
            {history.length >= 2 && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <FileSearch className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Compare Versions</h3>
                            <p className="text-xs text-slate-500">Select any two versions to see changes</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCompareClick}
                        disabled={selectedForCompare.length !== 2}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${selectedForCompare.length === 2
                                ? "bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        Compare Selected ({selectedForCompare.length}/2)
                        {selectedForCompare.length === 2 && <ArrowRight className="h-4 w-4" />}
                    </button>
                </div>
            )}

            {/* Version List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <ul className="divide-y divide-slate-100">
                    {history.map((version) => (
                        <li
                            key={version.id}
                            className={`hover:bg-slate-50/80 transition-all group ${selectedForCompare.includes(version.id) ? "bg-primary/5" : ""
                                }`}
                        >
                            <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20 cursor-pointer"
                                            checked={selectedForCompare.includes(version.id)}
                                            onChange={() => handleCompareToggle(version.id)}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                Version {version.version}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-${getActionColor(version.action)}-100 text-${getActionColor(version.action)}-700 border border-${getActionColor(version.action)}-200`}>
                                                {getActionLabel(version.action)}
                                            </span>
                                            {version.version === Math.max(...history.map(v => v.version)) && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    Current
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-600 font-medium mb-3">
                                            {version.comment}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                {version.createdByName}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                {formatDateTimeLongIST(version.createdAt)}
                                            </div>
                                            <div className="text-primary font-bold">
                                                {new Intl.NumberFormat("en-IN", {
                                                    style: "currency",
                                                    currency: "INR",
                                                }).format(version.snapshot.totalAmount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 sm:self-center">
                                    <button
                                        onClick={() => onVersionSelect(version)}
                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        View Snapshot
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
