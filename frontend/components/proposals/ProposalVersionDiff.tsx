"use client";

import { ProposalVersionResponse } from "@/types/proposal-version";
import { ArrowLeft, Diff, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DiscountType } from "@/types/proposal";

interface ProposalVersionDiffProps {
    version1: ProposalVersionResponse; // Older version
    version2: ProposalVersionResponse; // Newer version
    onBack: () => void;
}

export default function ProposalVersionDiff({ version1, version2, onBack }: ProposalVersionDiffProps) {
    const v1 = version1.snapshot;
    const v2 = version2.snapshot;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    const getDiffStatus = (val1: any, val2: any) => {
        if (val1 === val2) return "neutral";
        if (typeof val1 === "number" && typeof val2 === "number") {
            return val2 > val1 ? "increase" : "decrease";
        }
        return "changed";
    };

    const DiffBadge = ({ status, value1, value2 }: { status: string, value1: any, value2: any }) => {
        if (status === "neutral") return null;

        return (
            <div className={`mt-1 flex items-center gap-1.5 text-xs font-bold ${status === "increase" ? "text-emerald-600" : status === "decrease" ? "text-rose-600" : "text-amber-600"
                }`}>
                {status === "increase" && <TrendingUp className="h-3 w-3" />}
                {status === "decrease" && <TrendingDown className="h-3 w-3" />}
                {status === "changed" && <Minus className="h-3 w-3" />}
                Was: {typeof value1 === "number" ? formatCurrency(value1) : String(value1 || "N/A")}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Diff className="h-5 w-5 text-primary" />
                            Comparing Versions
                        </h2>
                        <p className="text-sm text-slate-500">
                            Showing changes from Version {version1.version} to Version {version2.version}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Comparison Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Info Comparison */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Header Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-xs font-bold text-slate-500 mb-1">Title</dt>
                                <dd className={`text-sm font-medium ${v1.title !== v2.title ? "text-primary" : "text-slate-900"}`}>
                                    {v2.title}
                                </dd>
                                <DiffBadge status={getDiffStatus(v1.title, v2.title)} value1={v1.title} value2={v2.title} />
                            </div>
                            <div>
                                <dt className="text-xs font-bold text-slate-500 mb-1">Status</dt>
                                <dd className={`text-sm font-medium ${v1.status !== v2.status ? "text-primary" : "text-slate-900"}`}>
                                    {v2.status}
                                </dd>
                                <DiffBadge status={getDiffStatus(v1.status, v2.status)} value1={v1.status} value2={v2.status} />
                            </div>
                            <div className="md:col-span-2">
                                <dt className="text-xs font-bold text-slate-500 mb-1">Description</dt>
                                <dd className={`text-sm font-medium ${v1.description !== v2.description ? "text-primary" : "text-slate-900"}`}>
                                    {v2.description || "None"}
                                </dd>
                                <DiffBadge status={getDiffStatus(v1.description, v2.description)} value1={v1.description} value2={v2.description} />
                            </div>
                        </div>
                    </div>

                    {/* Line Items Comparison */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Line Items</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Quantity</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Unit Price</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {v2.lineItems.map((item2) => {
                                        const item1 = v1.lineItems.find(i => i.productId === item2.productId);
                                        const isNew = !item1;
                                        const isChanged = item1 && (
                                            item1.quantity !== item2.quantity ||
                                            item1.unitPrice !== item2.unitPrice ||
                                            item1.lineTotal !== item2.lineTotal
                                        );

                                        return (
                                            <tr key={item2.lineItemId} className={isNew ? "bg-emerald-50/30" : isChanged ? "bg-amber-50/30" : ""}>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-900">{item2.productName}</div>
                                                    <div className="text-xs text-slate-500">SKU: {item2.sku}</div>
                                                    {isNew && <span className="mt-1 inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">New</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`text-sm font-medium ${item1?.quantity !== item2.quantity ? "text-primary font-bold" : "text-slate-900"}`}>
                                                        {item2.quantity} {item2.unit}
                                                    </div>
                                                    <DiffBadge status={getDiffStatus(item1?.quantity, item2.quantity)} value1={item1?.quantity} value2={item2.quantity} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`text-sm font-medium ${item1?.unitPrice !== item2.unitPrice ? "text-primary font-bold" : "text-slate-900"}`}>
                                                        {formatCurrency(item2.unitPrice)}
                                                    </div>
                                                    <DiffBadge status={getDiffStatus(item1?.unitPrice, item2.unitPrice)} value1={item1?.unitPrice} value2={item2.unitPrice} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`text-sm font-bold ${item1?.lineTotal !== item2.lineTotal ? "text-primary" : "text-slate-900"}`}>
                                                        {formatCurrency(item2.lineTotal)}
                                                    </div>
                                                    <DiffBadge status={getDiffStatus(item1?.lineTotal, item2.lineTotal)} value1={item1?.lineTotal} value2={item2.lineTotal} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Items that were removed */}
                                    {v1.lineItems.filter(i1 => !v2.lineItems.find(i2 => i2.productId === i1.productId)).map(item1 => (
                                        <tr key={item1.lineItemId} className="bg-rose-50/30 grayscale-[0.5]">
                                            <td className="px-6 py-4 opacity-70">
                                                <div className="text-sm font-bold text-slate-900 line-through">{item1.productName}</div>
                                                <div className="text-xs text-slate-500">SKU: {item1.sku}</div>
                                                <span className="mt-1 inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">Removed</span>
                                            </td>
                                            <td className="px-6 py-4 text-right opacity-70 line-through">
                                                {item1.quantity} {item1.unit}
                                            </td>
                                            <td className="px-6 py-4 text-right opacity-70 line-through">
                                                {formatCurrency(item1.unitPrice)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-rose-600">
                                                -{formatCurrency(item1.lineTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Totals Comparison Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 relative z-10">Financial Impact</h3>

                        <dl className="space-y-6 relative z-10">
                            <div>
                                <dt className="text-xs font-bold text-slate-500 mb-1">Subtotal</dt>
                                <dd className="text-base font-bold text-slate-900">
                                    {formatCurrency(v2.subtotal)}
                                </dd>
                                <DiffBadge status={getDiffStatus(v1.subtotal, v2.subtotal)} value1={v1.subtotal} value2={v2.subtotal} />
                            </div>

                            <div>
                                <dt className="text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                    Discount
                                    {v2.discount && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                                            {v2.discount.overallDiscountType === DiscountType.PERCENTAGE ? `${v2.discount.overallDiscountValue}%` : "Fixed"}
                                        </span>
                                    )}
                                </dt>
                                <dd className={`text-base font-bold ${v2.discountAmount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                                    -{formatCurrency(v2.discountAmount)}
                                </dd>
                                <DiffBadge status={getDiffStatus(v1.discountAmount, v2.discountAmount)} value1={v1.discountAmount} value2={v2.discountAmount} />
                            </div>

                            <div>
                                <dt className="text-xs font-bold text-slate-500 mb-1">Tax Amount</dt>
                                <dd className="text-base font-bold text-slate-900">
                                    {formatCurrency(v2.taxAmount)}
                                </dd>
                                <DiffBadge status={getDiffStatus(v1.taxAmount, v2.taxAmount)} value1={v1.taxAmount} value2={v2.taxAmount} />
                            </div>

                            <div className="pt-6 border-t border-slate-100 mt-2">
                                <dt className="text-xs font-bold text-primary uppercase tracking-tighter mb-1">Final Total</dt>
                                <dd className="text-3xl font-black text-slate-900 tracking-tight">
                                    {formatCurrency(v2.totalAmount)}
                                </dd>
                                <DiffBadge status={getDiffStatus(v1.totalAmount, v2.totalAmount)} value1={v1.totalAmount} value2={v2.totalAmount} />
                            </div>
                        </dl>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Version Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                                    {version2.version}
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Current View</p>
                                    <p className="text-sm font-bold">{version2.createdByName}</p>
                                </div>
                            </div>
                            <div className="text-xs bg-white/5 p-3 rounded-xl border border-white/10 italic text-slate-300">
                                "{version2.comment}"
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
