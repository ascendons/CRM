"use client";

import { ProposalVersionResponse } from "@/types/proposal-version";
import { formatLocaleIST, formatDateIST } from "@/lib/utils/date";
import { X, Download, User, Clock } from "lucide-react";

interface ProposalSnapshotModalProps {
    version: ProposalVersionResponse;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProposalSnapshotModal({ version, isOpen, onClose }: ProposalSnapshotModalProps) {
    if (!isOpen) return null;

    const proposal = version.snapshot;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return formatDateIST(dateString);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-slate-900">Version {version.version} Snapshot</h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                {version.action}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{version.comment}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right mr-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-tight">
                                <User className="h-3 w-3" /> {version.createdByName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                <Clock className="h-3 w-3" /> {formatLocaleIST(version.createdAt)}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10">
                    {/* Internal watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] rotate-[-30deg]">
                        <h1 className="text-9xl font-black whitespace-nowrap">HISTORICAL SNAPSHOT</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Left Column: Details */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Invoice Details</h3>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-xs font-bold text-slate-500 mb-1">Title</dt>
                                        <dd className="text-sm font-bold text-slate-900">{proposal.title}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-bold text-slate-500 mb-1">Description</dt>
                                        <dd className="text-sm text-slate-600 leading-relaxed font-medium">{proposal.description || "No description provided."}</dd>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <dt className="text-xs font-bold text-slate-500 mb-1">Valid Until</dt>
                                            <dd className="text-sm font-bold text-slate-900">{formatDate(proposal.validUntil)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-bold text-slate-500 mb-1">Payment Terms</dt>
                                            <dd className="text-sm font-bold text-slate-900">{proposal.paymentTerms || "Standard"}</dd>
                                        </div>
                                    </div>
                                </dl>
                            </section>

                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Info</h3>
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <p className="text-sm font-bold text-slate-900 mb-1">{proposal.customerName}</p>
                                    <p className="text-xs text-slate-500 font-medium">{proposal.customerEmail}</p>
                                    <p className="text-xs text-slate-500 font-medium">{proposal.customerPhone}</p>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Financials */}
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Amount Summary</h3>
                                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                                    <dl className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <dt className="text-slate-400 font-medium">Subtotal</dt>
                                            <dd className="font-bold">{formatCurrency(proposal.subtotal)}</dd>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <dt className="text-slate-400 font-medium">Discount</dt>
                                            <dd className="font-bold text-rose-400">-{formatCurrency(proposal.discountAmount)}</dd>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <dt className="text-slate-400 font-medium">Tax</dt>
                                            <dd className="font-bold">{formatCurrency(proposal.taxAmount)}</dd>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-end">
                                            <dt className="text-xs font-bold text-primary uppercase tracking-tighter">Total Amount</dt>
                                            <dd className="text-3xl font-black tracking-tight">{formatCurrency(proposal.totalAmount)}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <section>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Line Items</h3>
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Qty</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Unit Price</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {proposal.lineItems.map((item) => (
                                        <tr key={item.lineItemId}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-900">{item.productName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">SKU: {item.sku}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">{item.quantity} {item.unit}</td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-700">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-slate-900">{formatCurrency(item.lineTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Additional Notes */}
                    {proposal.notes && (
                        <section className="bg-amber-50 rounded-2xl p-6 border border-amber-100/50">
                            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Internal Notes / Feedback</h3>
                            <p className="text-sm text-amber-900 font-medium leading-relaxed whitespace-pre-wrap">{proposal.notes}</p>
                        </section>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-200"
                    >
                        Close Snapshot
                    </button>
                </div>
            </div>
        </div>
    );
}
