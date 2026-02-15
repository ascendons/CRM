"use client";

import { useState } from "react";
import { ProposalResponse, UpdateProposalRequest, DiscountType, ProposalStatus } from "@/types/proposal";
import { proposalsService } from "@/lib/proposals";
import { showToast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

interface CommercialNegotiationProps {
    proposal: ProposalResponse;
    onUpdate: () => void;
}

export default function CommercialNegotiation({ proposal, onUpdate }: CommercialNegotiationProps) {
    const [loading, setLoading] = useState(false);

    // Local state for editable fields
    const [items, setItems] = useState(proposal.lineItems.map(item => ({
        ...item,
        // Ensure discount fields are initialized
        discountType: item.discountType || DiscountType.PERCENTAGE,
        discountValue: item.discountValue || 0,
        // Extract custom name if present in description
        productName: (item.description && item.description.includes(':::'))
            ? item.description.split(':::')[0]
            : item.productName,
        description: (item.description && item.description.includes(':::'))
            ? item.description.split(':::')[1]
            : item.description
    })));

    const [discount, setDiscount] = useState<{
        enabled: boolean;
        type: DiscountType;
        value: number;
        reason: string;
    }>({
        enabled: !!proposal.discount,
        type: proposal.discount?.overallDiscountType || DiscountType.PERCENTAGE,
        value: proposal.discount?.overallDiscountValue || 0,
        reason: proposal.discount?.discountReason || ""
    });

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSaveChanges = async (finalize: boolean = false) => {
        try {
            setLoading(true);

            // Reconstruct logic for saving
            const lineItemsDTO = items.map(item => {
                let finalDescription = item.description;
                // Encode custom name if it was a custom product (we identify by checking if we extracted it)
                // Or we can just apply the same logic: if productId is custom, encode it.
                // For safety, let's just re-encode it if the user edited the name 
                // effectively preserving our custom name logic
                if (item.productName) {
                    // Check if this was a custom item (simple check: did we extract it before?)
                    // Or just always encode it if productId is missing or generic.
                    // The safest is to rely on the page logic.
                    if (!item.productId || item.productId === 'CUSTOM' || (item.description && item.description.includes(':::'))) {
                        finalDescription = `${item.productName}:::${finalDescription || ''}`;
                    }
                }

                return {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    description: finalDescription,
                    discountType: item.discountType || undefined,
                    discountValue: Number(item.discountValue) || undefined
                };
            });

            const discountDTO = discount.enabled ? {
                overallDiscountType: discount.type,
                overallDiscountValue: Number(discount.value),
                discountReason: discount.reason
            } : undefined;

            const updateRequest: UpdateProposalRequest = {
                lineItems: lineItemsDTO,
                discount: discountDTO,
                status: finalize ? ProposalStatus.SENT : undefined // If finalizing, move back to SENT
            };

            await proposalsService.updateProposal(proposal.id, updateRequest);

            showToast.success(finalize ? "Bid finalized and sent!" : "Bid updated successfully");
            onUpdate();
        } catch (error) {
            console.error("Failed to update bid:", error);
            showToast.error("Failed to update negotiation bid");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Commercial Negotiation (Place Bid)</h3>
                    <p className="text-sm text-gray-500">Adjust pricing and discounts to reach an agreement.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSaveChanges(false)}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Save Progress
                    </button>
                    <button
                        onClick={() => handleSaveChanges(true)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Finalize & Resend
                    </button>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border rounded-lg mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Unit Price</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Discount</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">Tax (%)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                    <div className="text-xs text-gray-500">{item.sku}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        className="w-full text-right p-1 border rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                        className="w-full text-right p-1 border rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.discountValue || ""}
                                            onChange={(e) => handleItemChange(index, 'discountValue', e.target.value)}
                                            placeholder="0"
                                            className="w-full text-right p-1 border rounded focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                        <select
                                            value={item.discountType || DiscountType.PERCENTAGE}
                                            onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                                            className="text-xs border-none bg-transparent focus:ring-0"
                                        >
                                            <option value={DiscountType.PERCENTAGE}>%</option>
                                            <option value={DiscountType.FIXED_AMOUNT}>$</option>
                                        </select>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-500">
                                    {item.taxRate}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Overall Discount */}
            <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center mb-3">
                    <input
                        type="checkbox"
                        id="enableDiscount"
                        checked={discount.enabled}
                        onChange={(e) => setDiscount(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enableDiscount" className="ml-2 text-sm font-medium text-gray-700">Apply Overall Discount</label>
                </div>

                {discount.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                            <select
                                value={discount.type}
                                onChange={(e) => setDiscount(prev => ({ ...prev, type: e.target.value as DiscountType }))}
                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                                <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                            <input
                                type="number"
                                value={discount.value}
                                onChange={(e) => setDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                            <input
                                type="text"
                                value={discount.reason}
                                onChange={(e) => setDiscount(prev => ({ ...prev, reason: e.target.value }))}
                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Negotiation discount..."
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
