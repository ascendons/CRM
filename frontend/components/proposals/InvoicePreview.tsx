'use client';

import { forwardRef } from 'react';
import { ProposalResponse } from "@/types/proposal";
import { Organization } from "@/types/organization";

interface InvoicePreviewProps {
    proposal: ProposalResponse;
    organization: Organization | null;
    template: string;
}

const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({
    proposal,
    organization,
    template
}, ref) => {
    const invoiceConfig = organization?.invoiceConfig;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };

    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const isProforma = proposal.isProforma || template === 'PROFORMA';

    // For testing multi-page printing, uncomment the line below:
    // const displayItems = [...proposal.lineItems, ...proposal.lineItems, ...proposal.lineItems];
    const displayItems = proposal.lineItems;

    return (
        <div
            ref={ref}
            className="bg-white p-6 md:p-10 w-full max-w-5xl mx-auto shadow-sm border border-gray-100 text-gray-800 font-sans min-h-[297mm] print:shadow-none print:border-none print:p-6"
        >
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 15mm;
                        size: A4;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: white !important;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tr {
                        page-break-inside: avoid;
                        break-inside: avoid-page;
                    }
                    img {
                        max-width: 100% !important;
                    }
                    .print-break-inside-avoid {
                        page-break-inside: avoid;
                        break-inside: avoid-page;
                    }
                }
            `}</style>

            {/* Header: Company Info Left, Invoice Title Right */}
            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4 mb-4">
                <div className="flex flex-row items-center gap-4 flex-1 max-w-[70%]">
                    {invoiceConfig?.logoUrl && (
                        <div className="flex-shrink-0">
                            <img
                                src={invoiceConfig.logoUrl}
                                alt="Logo"
                                className="max-w-[60px] max-h-[60px] object-contain"
                            />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-black text-blue-900 uppercase tracking-tighter mb-0.5 leading-tight">
                            {invoiceConfig?.companyName || organization?.displayName || organization?.organizationName || 'Company Name'}
                        </h1>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide leading-relaxed whitespace-pre-line">
                            {invoiceConfig?.companyAddress || ''}
                        </div>
                    </div>
                </div>

                <div className="text-right flex flex-col justify-between items-end">
                    <div className="space-y-0.5 mb-4">
                        <div className="text-1xl font-black text-blue-900 uppercase tracking-tight">
                            {isProforma ? 'PROFORMA' : 'QUOTATION'}
                        </div>
                        {/* <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] -mt-0.5">
                            {isProforma ? 'INVOICE' : 'DOCUMENT'}
                        </div> */}
                    </div>

                    <div className="mt-auto space-y-1 text-[10px]">
                        {invoiceConfig?.gstNumber && (
                            <p className="flex justify-end">
                                <span className="text-gray-400 uppercase tracking-widest">GST:</span>
                                <span className="text-gray-500">{invoiceConfig.gstNumber}</span>
                            </p>
                        )}
                        {invoiceConfig?.cinNumber && (
                            <p className="flex justify-end">
                                <span className="text-gray-400 uppercase tracking-widest">CIN:</span>
                                <span className="text-gray-500">{invoiceConfig.cinNumber}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Meta Information: Reference Left, Date Right */}
            <div className="flex justify-between items-center bg-blue-50/30 rounded-xl pb-2 mb-2">
                <div>
                    <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] block mb-1">Reference Number</span>
                    <span className="text-lg font-black text-blue-900 tracking-tight">{proposal.proposalNumber}</span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] block mb-1">Issue Date</span>
                    <span className="text-lg font-black text-blue-900 tracking-tight">{formatDate(proposal.createdAt)}</span>
                </div>
            </div>

            {/* Address Section */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.25em] flex items-center gap-2">
                        <span className="w-6 h-[2px] bg-blue-900"></span>
                        Billed To
                    </h2>
                    <div className="bg-white border-l-4 border-blue-900 pl-5 py-2">
                        <div className="font-black text-gray-900 text-base tracking-tight mb-1">
                            {proposal.billingAddress?.companyName || proposal.companyName || proposal.customerName}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium leading-relaxed whitespace-pre-line mb-1">
                            {(() => {
                                const addr = proposal.billingAddress;
                                if (!addr) return null;
                                const parts = [
                                    addr.street,
                                    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
                                    addr.country
                                ].filter(Boolean);
                                return parts.join('\n');
                            })()}
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-[10px]">
                            {(proposal.billingAddress?.name) && (
                                <p className="flex gap-2">
                                    <span className="font-bold text-gray-400 uppercase w-10 underline decoration-blue-100 underline-offset-4">Name</span>
                                    <span className="font-bold text-gray-900 tracking-wide">{proposal.billingAddress?.name}</span>
                                </p>
                            )}
                            {(proposal.billingAddress?.phone || proposal.customerPhone) && (
                                <p className="flex gap-2">
                                    <span className="font-bold text-gray-400 uppercase w-10 underline decoration-blue-100 underline-offset-4">Phone</span>
                                    <span className="font-bold text-gray-900 truncate">{proposal.billingAddress?.phone || proposal.customerPhone}</span>
                                </p>
                            )}
                            {(proposal.billingAddress?.email || proposal.customerEmail) && (
                                <p className="flex gap-2">
                                    <span className="font-bold text-gray-400 uppercase w-10 underline decoration-blue-100 underline-offset-4">Email</span>
                                    <span className="font-bold text-gray-900 truncate">{proposal.billingAddress?.email || proposal.customerEmail}</span>
                                </p>
                            )}
                            {(proposal.billingAddress?.gstNumber || proposal.gstNumber) && (
                                <p className="flex gap-2">
                                    <span className="font-bold text-gray-400 uppercase w-10 underline decoration-blue-100 underline-offset-4">GSTIN</span>
                                    <span className="font-bold text-gray-900 tracking-wide">{proposal.billingAddress?.gstNumber || proposal.gstNumber}</span>
                                </p>
                            )}


                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.25em] flex items-center gap-2">
                        <span className="w-6 h-[2px] bg-blue-900"></span>
                        Shipped To
                    </h2>
                    <div className="bg-white border-l-4 border-blue-900 pl-5 py-2">
                        <div className="font-black text-gray-900 text-base tracking-tight mb-1">
                            {proposal.shippingAddress?.companyName ||
                                proposal.billingAddress?.name ||
                                proposal.billingAddress?.companyName ||
                                proposal.companyName ||
                                proposal.customerName}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium leading-relaxed whitespace-pre-line mb-1">
                            {(() => {
                                const addr = proposal.shippingAddress || proposal.billingAddress;
                                if (!addr) return null;
                                const parts = [
                                    addr.street,
                                    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
                                    addr.country
                                ].filter(Boolean);
                                return parts.join('\n');
                            })()}
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-[10px]">
                            {(proposal.shippingAddress?.name) && (
                                <p className="flex gap-2">
                                    <span className="font-bold text-gray-400 uppercase w-10 underline decoration-blue-100 underline-offset-4">Name</span>
                                    <span className="font-bold text-gray-900 tracking-wide">{proposal.shippingAddress?.name}</span>
                                </p>
                            )}
                            {(proposal.shippingAddress?.phone || proposal.billingAddress?.phone || proposal.customerPhone) && (
                                <p className="flex gap-2">
                                    <span className="font-bold text-gray-400 uppercase w-10 underline decoration-blue-100 underline-offset-4">Phone</span>
                                    <span className="font-bold text-gray-900 truncate">{proposal.shippingAddress?.phone || proposal.billingAddress?.phone || proposal.customerPhone}</span>
                                </p>
                            )}
                            {(proposal.shippingAddress?.email || proposal.billingAddress?.email || proposal.customerEmail) && (
                                <p className="flex gap-2">
                                    <span className="font-bold text-gray-400 uppercase w-10 underline decoration-blue-100 underline-offset-4">Email</span>
                                    <span className="font-bold text-gray-900 truncate">{proposal.shippingAddress?.email || proposal.billingAddress?.email || proposal.customerEmail}</span>
                                </p>
                            )}
                            {(proposal.shippingAddress?.gstNumber || proposal.billingAddress?.gstNumber || proposal.gstNumber) && (
                                <p className="flex gap-2">
                                    <span className="font-bold text-gray-400 uppercase w-10 underline decoration-blue-100 underline-offset-4">GSTIN</span>
                                    <span className="font-bold text-gray-900 tracking-wide">{proposal.shippingAddress?.gstNumber || proposal.billingAddress?.gstNumber || proposal.gstNumber}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-2 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-900 text-white text-[10px] font-black uppercase tracking-[0.15em]">
                            <th className="py-2.5 px-1 text-center w-6">No.</th>
                            <th className="py-2.5 px-6">Description</th>
                            <th className="py-2.5 px-6 text-center w-24">HSN/SAC</th>
                            <th className="py-2.5 px-6 text-center w-20">QTY</th>
                            <th className="py-2.5 px-6 text-right w-28">Rate</th>
                            <th className="py-2.5 px-6 text-right w-32 underline decoration-blue-400">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px]">
                        {displayItems.map((item, index) => (
                            <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-1 text-center text-gray-400 italic">{String(index + 1).padStart(2, '0')}</td>
                                <td className="py-3 px-6">
                                    <div className="text-gray-900 tracking-tight text-sm mb-0.5">{item.productName}</div>
                                    {item.description && (
                                        <div className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-sm">{item.description}</div>
                                    )}
                                </td>
                                <td className="py-3 px-6 text-center text-gray-900 font-mono">{item.hsnCode || '-'}</td>
                                <td className="py-3 px-6 text-center text-gray-900">
                                    <span>{item.quantity}</span>
                                    {item.unit && <span className="text-[9px] text-gray-700 uppercase ml-1">{item.unit}</span>}
                                </td>
                                <td className="py-3 px-6 text-right tabular-nums text-gray-900">{formatNumber(item.unitPrice)}</td>
                                <td className="py-3 px-6 text-right tabular-nums font-black text-gray-900 text-sm">{formatNumber(item.lineSubtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Terms and Totals Section Side-by-Side */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-4 print:pt-4">
                {/* Payment Terms - Left Side */}
                <div className="flex-1 space-y-8 print-break-inside-avoid">
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-widest underline decoration-blue-900/20 underline-offset-8">Payment Terms</h3>
                        <div className="text-[11px] text-gray-500 font-medium leading-relaxed whitespace-pre-line max-w-md">
                            {proposal.paymentTerms || '10% Advance Payment, 90% on Dispatch'}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-w-md">
                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Bank Details</h3>
                        <div className="space-y-2">
                            {invoiceConfig?.bankName ? (
                                <div className="grid grid-cols-2 gap-4 text-[12px]">
                                    <div>
                                        <p className="text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Bank Name</p>
                                        <p className="font-black text-gray-900 tracking-tight">{invoiceConfig.bankName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Account Number</p>
                                        <p className="font-black text-gray-900 tracking-tight font-mono">{invoiceConfig.accountNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 font-bold uppercase tracking-tighter mb-0.5">IFSC / Routing</p>
                                        <p className="font-black text-gray-900 tracking-tight">{invoiceConfig.ifscCode}</p>
                                    </div>
                                    {invoiceConfig.branchName && (
                                        <div>
                                            <p className="text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Branch</p>
                                            <p className="font-black text-gray-900 tracking-tight">{invoiceConfig.branchName}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="italic text-gray-400 text-xs">Bank details not available for this organization.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Totals Section - Right Side */}
                <div className="w-full max-w-sm space-y-4">
                    <div className="space-y-3 px-6 py-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Subtotal (Excl. Tax)</span>
                            <span className="font-black text-gray-900">{formatCurrency(proposal.subtotal)}</span>
                        </div>
                        {proposal.discountAmount > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-red-400 uppercase tracking-widest text-[10px]">Discount</span>
                                <span className="font-black text-red-600">-{formatCurrency(proposal.discountAmount)}</span>
                            </div>
                        )}
                        {proposal.taxAmount > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px] flex flex-col">
                                    Estimated Tax
                                    {proposal.gstType && <span className="text-[8px] italic normal-case font-medium opacity-50 tracking-normal leading-tight">[{proposal.gstType}]</span>}
                                </span>
                                <span className="font-black text-gray-900">{formatCurrency(proposal.taxAmount)}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-900 rounded-2xl p-7 shadow-xl shadow-blue-900/10 print-break-inside-avoid">
                        <div className="flex justify-between items-center text-white mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Grand Total<br></br> Payable</span>
                            <span className="text-2xl font-black tracking-tighter tabular-nums">{formatCurrency(proposal.totalAmount)}</span>
                        </div>
                        <div className="h-[2px] bg-white/10 w-full mb-3"></div>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.1em] text-center italic">
                            Amounts are inclusive of all applicable taxes.
                            <br />
                            Valid Till : {proposal.validUntil}
                        </p>
                    </div>
                </div>
            </div>

            {/* Details & Signature Section */}
            <div className="flex justify-between items-end gap-10 print-break-inside-avoid">
                {/* Terms and Conditions - Left Side */}
                <div className="flex-1 space-y-4">
                    <div className="space-y-3">
                        <h3 className="text-[9px] font-black text-blue-900 uppercase tracking-widest underline decoration-blue-900/20 underline-offset-8">Terms and Conditions</h3>
                        <div className="text-[9px] text-gray-500 font-medium leading-relaxed whitespace-pre-line max-w-md">
                            {invoiceConfig?.termsAndConditions || '1. Standard 30-day payment cycle.\n2. Prices are subject to change based on market fluctuations.\n3. Orders will be processed only after confirmation.'}
                        </div>
                    </div>
                </div>

                {/* Signature - Right Side */}
                <div className="w-full max-w-[240px] flex flex-col items-center">
                    <div className="w-full flex flex-col items-center space-y-2">
                        {invoiceConfig?.authorizedSignatorySealUrl && (
                            <img
                                src={invoiceConfig.authorizedSignatorySealUrl}
                                alt="Seal"
                                className="max-w-[140px] max-h-[140px] object-contain opacity-90 drop-shadow-sm"
                            />
                        )}
                        <div className="w-full h-[1px] bg-blue-900/10"></div>
                        <div className="text-center">
                            <span className="text-[10px] font-black text-blue-900  block mb-1">
                                {invoiceConfig?.authorizedSignatoryLabel || 'Authorized Signatory'}
                            </span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block italic">
                                Scanned Digital Signature
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Page Footer */}
            <div className="mt-6 pt-2 border-t border-gray-100 flex justify-between items-center text-[6px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <span>Generated by {invoiceConfig?.companyName} | Powered by Ascendons</span>
                <span className="italic">{invoiceConfig?.footerText || 'Thank you for choosing our services.'}</span>
            </div>
        </div>
    );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
