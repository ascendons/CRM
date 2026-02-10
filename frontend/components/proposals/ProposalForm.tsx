"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { proposalsService } from "@/lib/proposals";
import { productsService } from "@/lib/products";
import { leadsService } from "@/lib/leads";
import { opportunitiesService } from "@/lib/opportunities";
import { showToast } from "@/lib/toast";
import {
    CreateProposalRequest,
    UpdateProposalRequest,
    LineItemDTO,
    ProposalResponse,
    ProposalSource,
    ProposalStatus,
    DiscountType,
} from "@/types/proposal";
import { ProductResponse } from "@/types/product";
import { Lead } from "@/types/lead";
import { Opportunity } from "@/types/opportunity";
import CatalogProductSearch from "./CatalogProductSearch";

interface ProposalFormProps {
    mode: "create" | "edit";
    initialData?: ProposalResponse;
    sourceType?: ProposalSource;
    sourceId?: string;
}

export default function ProposalForm({
    mode,
    initialData,
    sourceType,
    sourceId: initialSourceId,
}: ProposalFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

    // Form state
    const [source, setSource] = useState<ProposalSource>(
        initialData?.source || sourceType || ProposalSource.LEAD
    );
    const [sourceId, setSourceId] = useState(
        initialData?.sourceId || initialSourceId || ""
    );
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(
        initialData?.description || ""
    );
    const [validUntil, setValidUntil] = useState(
        initialData?.validUntil ? initialData.validUntil.split("T")[0] : ""
    );
    const [paymentTerms, setPaymentTerms] = useState(
        initialData?.paymentTerms || ""
    );
    const [deliveryTerms, setDeliveryTerms] = useState(
        initialData?.deliveryTerms || ""
    );
    const [notes, setNotes] = useState(initialData?.notes || "");

    interface FormLineItem extends LineItemDTO {
        productName?: string;
    }

    // Line items state
    const [lineItems, setLineItems] = useState<FormLineItem[]>(
        initialData?.lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            description: item.description, // Map existing description
            productName: item.productName, // Map existing name
        })) || [
            {
                productId: "",
                quantity: 1,
                unitPrice: undefined,
                discountType: undefined,
                discountValue: undefined,
                description: "",
                productName: "",
            },
        ]
    );

    // Overall discount state
    const [hasOverallDiscount, setHasOverallDiscount] = useState(
        !!initialData?.discount
    );
    const [overallDiscountType, setOverallDiscountType] = useState<DiscountType>(
        initialData?.discount?.overallDiscountType || DiscountType.PERCENTAGE
    );
    const [overallDiscountValue, setOverallDiscountValue] = useState<number>(
        initialData?.discount?.overallDiscountValue || 0
    );
    const [discountReason, setDiscountReason] = useState(
        initialData?.discount?.discountReason || ""
    );

    // Status state (only for edit mode)
    const [status, setStatus] = useState<ProposalStatus>(
        initialData?.status || ProposalStatus.DRAFT
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsData, leadsData, opportunitiesData] = await Promise.all([
                productsService.getAllProducts(),
                leadsService.getAllLeads(),
                opportunitiesService.getAllOpportunities(),
            ]);
            // Force cast or check if it's an array to satisfy TS
            if (Array.isArray(productsData)) {
                setProducts(productsData);
            } else if (productsData && 'content' in productsData) {
                setProducts(productsData.content);
            }
            setLeads(leadsData);
            setOpportunities(opportunitiesData);
        } catch (err) {
            showToast.error("Failed to load form data");
        }
    };

    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            {
                productId: "",
                quantity: 1,
                unitPrice: undefined,
                discountType: undefined,
                discountValue: undefined,
                description: "",
                productName: "",
            },
        ]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length === 1) {
            showToast.error("At least one line item is required");
            return;
        }
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (
        index: number,
        field: keyof FormLineItem,
        value: string | number | undefined
    ) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-populate unit price when product is selected
        if (field === "productId" && value) {
            const product = products.find((p) => p.id === value);
            if (product) {
                updated[index].unitPrice = product.basePrice;
            }
        }

        setLineItems(updated);
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!sourceId && mode === "create") errors.push("Please select a source");
        if (!title.trim()) errors.push("Please enter a title");
        if (!validUntil) errors.push("Please select a valid until date");
        if (new Date(validUntil) <= new Date())
            errors.push("Valid until date must be in the future");

        // Validate Max 12 months in future
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 12);
        if (new Date(validUntil) > maxDate)
            errors.push("Valid until date cannot be more than 12 months in the future");

        if (lineItems.some((item) => !item.productId))
            errors.push("Please select a product for all line items");
        if (lineItems.some((item) => item.quantity < 1))
            errors.push("Quantity must be at least 1");

        // Discount validation
        if (hasOverallDiscount) {
            if (overallDiscountType === DiscountType.PERCENTAGE && overallDiscountValue > 100) {
                errors.push("Discount percentage cannot exceed 100%");
            }
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validateForm();
        if (errors.length > 0) {
            errors.forEach((err) => showToast.error(err));
            return;
        }

        // Prepare line items
        const processedLineItems = lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description,
            discountType: item.discountType,
            discountValue: item.discountValue,
        }));

        // Prepare discount
        const discount =
            hasOverallDiscount && overallDiscountValue > 0
                ? {
                    overallDiscountType,
                    overallDiscountValue,
                    discountReason: discountReason.trim() || undefined,
                }
                : undefined;

        try {
            setLoading(true);

            if (mode === "create") {
                const request: CreateProposalRequest = {
                    source,
                    sourceId,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    validUntil,
                    lineItems: processedLineItems,
                    discount,
                    paymentTerms: paymentTerms.trim() || undefined,
                    deliveryTerms: deliveryTerms.trim() || undefined,
                    notes: notes.trim() || undefined,
                };

                const created = await proposalsService.createProposal(request);
                showToast.success("Proposal created successfully");
                router.push(`/proposals/${created.id}`);
            } else {
                if (!initialData?.id) return;

                const request: UpdateProposalRequest = {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    status: status, // Include status update
                    validUntil,
                    lineItems: processedLineItems,
                    discount,
                    paymentTerms: paymentTerms.trim() || undefined,
                    deliveryTerms: deliveryTerms.trim() || undefined,
                    notes: notes.trim() || undefined,
                };

                const updated = await proposalsService.updateProposal(
                    initialData.id,
                    request
                );
                showToast.success("Proposal updated successfully");
                router.push(`/proposals/${updated.id}`);
            }
        } catch (err) {
            showToast.error(
                err instanceof Error
                    ? err.message
                    : `Failed to ${mode} proposal`
            );
        } finally {
            setLoading(false);
        }
    };

    const getSourceOptions = () => {
        if (source === ProposalSource.LEAD) {
            return leads.map((lead) => ({
                value: lead.id,
                label: `${lead.firstName} ${lead.lastName} (${lead.leadId})`,
            }));
        } else {
            return opportunities.map((opp) => ({
                value: opp.id,
                label: `${opp.opportunityName} (${opp.opportunityId})`,
            }));
        }
    };

    // Check for read-only status based on INITIAL status, not current state
    // This allows users to change status to ACCEPTED/REJECTED and submit
    const isReadOnly =
        mode === "edit" &&
        (initialData?.status === ProposalStatus.ACCEPTED || initialData?.status === ProposalStatus.REJECTED);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {isReadOnly && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                This proposal is <strong>{status}</strong> and cannot be edited.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Source Selection - Read Only in Edit Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={source}
                        onChange={(e) => {
                            setSource(e.target.value as ProposalSource);
                            setSourceId("");
                        }}
                        disabled={mode === "edit"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        required
                    >
                        <option value={ProposalSource.LEAD}>Lead</option>
                        <option value={ProposalSource.OPPORTUNITY}>Opportunity</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select {source === ProposalSource.LEAD ? "Lead" : "Opportunity"}{" "}
                        <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                        disabled={mode === "edit"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        required
                    >
                        <option value="">Select...</option>
                        {getSourceOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Dropdown - Only in Edit Mode */}
                {mode === "edit" && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ProposalStatus)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                            disabled={isReadOnly}
                        >
                            <option value={ProposalStatus.DRAFT}>Draft</option>
                            <option value={ProposalStatus.SENT}>Sent</option>
                            <option value={ProposalStatus.ACCEPTED}>Accepted</option>
                            <option value={ProposalStatus.REJECTED}>Rejected</option>
                            <option value={ProposalStatus.EXPIRED}>Expired</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Basic Details */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Website Development Proposal"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    required
                    disabled={isReadOnly}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this proposal..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={isReadOnly}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    required
                    disabled={isReadOnly}
                />
            </div>

            {/* Line Items */}
            <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
                    <button
                        type="button"
                        onClick={addLineItem}
                        disabled={isReadOnly}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + Add Item
                    </button>
                </div>

                <div className="space-y-4">
                    {lineItems.map((item, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Item #{index + 1}
                                </h3>
                                {lineItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeLineItem(index)}
                                        disabled={isReadOnly}
                                        className="text-red-600 hover:text-red-800 text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-2">
                                    {item.productId ? (
                                        <div className="flex justify-between items-center p-2 border border-blue-200 bg-blue-50 rounded-lg">
                                            <div>
                                                <div className="font-medium text-blue-900">
                                                    {/* We might want to store name in lineItem to show it here, 
                                                        but for now we fallback to looking it up in products (legacy) 
                                                        or user just sees ID if not in legacy list. 
                                                        Wait, we can't look it up if we don't have the full product list.
                                                        Better to add productName to LineItemDTO state for display purposes.
                                                     */}
                                                    {/* For this refactor, I'll rely on the parent updating state correctly. 
                                                        But wait, lineItems state is LineItemDTO which doesn't have name.
                                                        I should probably extend the local lineItems state to include display info.
                                                    */}
                                                    {/* use item.productName if available (dynamic), else fallback to legacy lookup */}
                                                    {item.productName || products.find(p => p.id === item.productId)?.productName || item.productId}
                                                </div>
                                                <div className="text-xs text-blue-700">ID: {item.productId}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => updateLineItem(index, "productId", "")}
                                                disabled={isReadOnly}
                                                className="text-blue-500 hover:text-blue-700 p-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <CatalogProductSearch
                                            onSelect={(product) => {
                                                // Handle selection atomically
                                                setLineItems(prev => {
                                                    const updated = [...prev];
                                                    const currentItem = updated[index];

                                                    // Base updates
                                                    const newUpdates: Partial<FormLineItem> = {
                                                        productId: product.id,
                                                        productName: product.displayName
                                                    };

                                                    // Price
                                                    const priceAttr = product.attributes.find(a =>
                                                        a.key === 'base_price' ||
                                                        a.key === 'list_price' ||
                                                        a.key === 'price'
                                                    );
                                                    if (priceAttr && priceAttr.numericValue) {
                                                        newUpdates.unitPrice = priceAttr.numericValue;
                                                    }

                                                    // Description
                                                    const descAttr = product.attributes.find(a =>
                                                        a.key === 'description' ||
                                                        a.key.includes('description')
                                                    );
                                                    if (descAttr && descAttr.value) {
                                                        newUpdates.description = descAttr.value;
                                                    }

                                                    updated[index] = { ...currentItem, ...newUpdates };
                                                    return updated;
                                                });
                                            }}
                                            required
                                            disabled={isReadOnly}
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateLineItem(
                                                index,
                                                "quantity",
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        required
                                        disabled={isReadOnly}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={item.unitPrice || ""}
                                        onChange={(e) =>
                                            updateLineItem(
                                                index,
                                                "unitPrice",
                                                parseFloat(e.target.value) || undefined
                                            )
                                        }
                                        step="0.01"
                                        min="0"
                                        placeholder="Auto-filled"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        disabled={isReadOnly}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Type
                                    </label>
                                    <select
                                        value={item.discountType || ""}
                                        onChange={(e) =>
                                            updateLineItem(
                                                index,
                                                "discountType",
                                                e.target.value || undefined
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        disabled={isReadOnly}
                                    >
                                        <option value="">No Discount</option>
                                        <option value={DiscountType.PERCENTAGE}>
                                            Percentage (%)
                                        </option>
                                        <option value={DiscountType.FIXED_AMOUNT}>
                                            Fixed Amount (₹)
                                        </option>
                                    </select>
                                </div>

                                {item.discountType && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Discount Value
                                        </label>
                                        <input
                                            type="number"
                                            value={item.discountValue || ""}
                                            onChange={(e) =>
                                                updateLineItem(
                                                    index,
                                                    "discountValue",
                                                    parseFloat(e.target.value) || undefined
                                                )
                                            }
                                            step="0.01"
                                            min="0"
                                            placeholder={
                                                item.discountType === DiscountType.PERCENTAGE
                                                    ? "0-100"
                                                    : "Amount"
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                )}

                                <div className="md:col-span-2 lg:col-span-4 mt-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Description (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={item.description || ""}
                                        onChange={(e) =>
                                            updateLineItem(
                                                index,
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Product description or custom notes..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overall Discount */}
            <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        id="hasDiscount"
                        checked={hasOverallDiscount}
                        onChange={(e) => setHasOverallDiscount(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:text-gray-400"
                        disabled={isReadOnly}
                    />
                    <label
                        htmlFor="hasDiscount"
                        className="ml-2 text-sm font-medium text-gray-700"
                    >
                        Apply Overall Discount
                    </label>
                </div>

                {hasOverallDiscount && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Discount Type
                            </label>
                            <select
                                value={overallDiscountType}
                                onChange={(e) =>
                                    setOverallDiscountType(e.target.value as DiscountType)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={isReadOnly}
                            >
                                <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                                <option value={DiscountType.FIXED_AMOUNT}>
                                    Fixed Amount (₹)
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Discount Value
                            </label>
                            <input
                                type="number"
                                value={overallDiscountValue}
                                onChange={(e) =>
                                    setOverallDiscountValue(parseFloat(e.target.value) || 0)
                                }
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={isReadOnly}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason
                            </label>
                            <input
                                type="text"
                                value={discountReason}
                                onChange={(e) => setDiscountReason(e.target.value)}
                                placeholder="e.g., Bulk order"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Terms */}
            <div className="border-t pt-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                    Terms & Conditions
                </h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms
                    </label>
                    <textarea
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        placeholder="e.g., 50% advance, 50% on delivery"
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={isReadOnly}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Terms
                    </label>
                    <textarea
                        value={deliveryTerms}
                        onChange={(e) => setDeliveryTerms(e.target.value)}
                        placeholder="e.g., Delivery within 30 days"
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={isReadOnly}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes or terms..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={isReadOnly}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || isReadOnly}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading
                        ? "Saving..."
                        : mode === "create"
                            ? "Create Proposal"
                            : "Update Proposal"}
                </button>
            </div>
        </form >
    );
}
