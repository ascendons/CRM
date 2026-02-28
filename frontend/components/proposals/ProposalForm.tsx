"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productsService } from "@/lib/products";
import { proposalsService } from "@/lib/proposals";

import { leadsService } from "@/lib/leads";
import { opportunitiesService } from "@/lib/opportunities";
import { organizationApi } from "@/lib/api/organization";
import { showToast } from "@/lib/toast";
import {
    CreateProposalRequest,
    UpdateProposalRequest,
    LineItemDTO,
    PaymentMilestoneDTO,
    ProposalResponse,
    ProposalSource,
    ProposalStatus,
    DiscountType,
    GstType,
    CustomerAddress,
} from "@/types/proposal";
import { ProductResponse } from "@/types/product";
import { Lead } from "@/types/lead";
import { Opportunity } from "@/types/opportunity";
import { CountryStateSelector } from "../common/CountryStateSelector";
import CatalogProductSearch from "./CatalogProductSearch";

interface ProposalFormProps {
    mode: "create" | "edit";
    initialData?: ProposalResponse;
    sourceType?: ProposalSource;
    sourceId?: string;
}

// Card wrapper for each section
function SectionCard({
    title,
    description,
    children,
    icon,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                {icon && (
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                        {icon}
                    </div>
                )}
                <div>
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    {description && (
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
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
    const [errors, setErrors] = useState<string[]>([]);

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

    // Customer Contact state
    const [companyName, setCompanyName] = useState(initialData?.companyName || "");
    const [customerName, setCustomerName] = useState(initialData?.customerName || "");
    const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || "");
    const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || "");

    // Address state
    const [billingAddress, setBillingAddress] = useState<CustomerAddress>(
        initialData?.billingAddress || {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
        }
    );
    const [shippingAddress, setShippingAddress] = useState<CustomerAddress>(
        initialData?.shippingAddress || {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
        }
    );

    const [isShippingSameAsBilling, setIsShippingSameAsBilling] = useState(
        mode === "create" ||
        !initialData?.shippingAddress ||
        (initialData?.billingAddress?.street === initialData?.shippingAddress?.street &&
            initialData?.billingAddress?.city === initialData?.shippingAddress?.city &&
            initialData?.billingAddress?.postalCode === initialData?.shippingAddress?.postalCode)
    );

    const copyBillingToShipping = () => {
        setShippingAddress({ ...billingAddress });
    };

    // Auto-sync shipping address when billing address changes and toggle is on
    useEffect(() => {
        if (isShippingSameAsBilling) {
            setShippingAddress({ ...billingAddress });
        }
    }, [billingAddress, isShippingSameAsBilling]);

    // Track if we've auto-populated from initial sourceId
    const [hasInitiallyPopulated, setHasInitiallyPopulated] = useState(false);

    useEffect(() => {
        if (mode === "create" && !hasInitiallyPopulated && leads.length > 0 && source === ProposalSource.LEAD && sourceId) {
            const lead = leads.find(l => l.id === sourceId);
            if (lead) {
                setBillingAddress({
                    street: lead.streetAddress || "",
                    city: lead.city || "",
                    state: lead.state || "",
                    postalCode: lead.postalCode || "",
                    country: lead.country || "",
                });

                setGstNumber(lead.gstNumber || "");
                setCompanyName(lead.companyName || "");
                setCustomerName(`${lead.firstName || ""} ${lead.lastName || ""}`.trim());
                setCustomerEmail(lead.email || "");
                setCustomerPhone(lead.phone || lead.mobilePhone || "");
            }
            setHasInitiallyPopulated(true);
        }
    }, [mode, hasInitiallyPopulated, leads, source, sourceId]);

    interface FormLineItem extends LineItemDTO {
        productName?: string;
        unit?: string;
        hsnCode?: string;
    }

    // Line items state
    const [lineItems, setLineItems] = useState<FormLineItem[]>(
        initialData?.lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            description: item.description,
            productName: item.productName,
            unit: item.unit,
            hsnCode: item.hsnCode,
        })) || [
            {
                productId: "",
                quantity: 1,
                unitPrice: undefined,
                discountType: undefined,
                discountValue: undefined,
                description: "",
                productName: "",
                unit: "",
                hsnCode: "",
            },
        ]
    );

    // Track which line items have their description field expanded
    const [showDescriptions, setShowDescriptions] = useState<boolean[]>(
        (initialData?.lineItems || [{}]).map((item: any) => !!item.description)
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

    // GST state
    const [gstType, setGstType] = useState<GstType>(
        initialData?.gstType || GstType.NONE
    );
    const [gstNumber, setGstNumber] = useState(initialData?.gstNumber || "");

    // Milestones state
    interface FormPaymentMilestone {
        name: string;
        percentage: number;
    }

    const [paymentMilestones, setPaymentMilestones] = useState<FormPaymentMilestone[]>(
        initialData?.paymentMilestones || []
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
            const [productsData, leadsData, opportunitiesData, orgData] = await Promise.all([
                productsService.getAllProducts(),
                leadsService.getAllLeads(),
                opportunitiesService.getAllOpportunities(),
                organizationApi.getCurrent()
            ]);

            if (Array.isArray(productsData)) {
                setProducts(productsData);
            } else if (productsData && 'content' in productsData) {
                setProducts(productsData.content);
            }
            setLeads(leadsData);
            setOpportunities(opportunitiesData);

            // Populate defaults from organization settings if fields are empty
            if (orgData?.settings) {
                if (!paymentTerms || paymentTerms.trim() === "") setPaymentTerms(orgData.settings.defaultPaymentTerms || "");
                if (!deliveryTerms || deliveryTerms.trim() === "") setDeliveryTerms(orgData.settings.defaultDeliveryTerms || "");
                if (!notes || notes.trim() === "") setNotes(orgData.settings.defaultNotes || "");
            }
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
        setShowDescriptions([...showDescriptions, false]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length === 1) {
            showToast.error("At least one line item is required");
            return;
        }
        setLineItems(lineItems.filter((_, i) => i !== index));
        setShowDescriptions(showDescriptions.filter((_, i) => i !== index));
    };

    const toggleDescription = (index: number) => {
        const updated = [...showDescriptions];
        updated[index] = !updated[index];
        setShowDescriptions(updated);
    };

    const updateLineItem = (
        index: number,
        field: keyof FormLineItem,
        value: string | number | undefined
    ) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        if (field === "productId" && value) {
            const product = products.find((p) => p.id === value);
            if (product) {
                updated[index].unitPrice = product.basePrice;
            }
        }

        setLineItems(updated);
    };

    const addMilestone = () => {
        setPaymentMilestones([
            ...paymentMilestones,
            { name: "", percentage: 0 }
        ]);
    };

    const removeMilestone = (index: number) => {
        setPaymentMilestones(paymentMilestones.filter((_, i) => i !== index));
    };

    const updateMilestone = (index: number, field: keyof FormPaymentMilestone, value: string | number) => {
        const updated = [...paymentMilestones];
        updated[index] = { ...updated[index], [field]: value as never };
        setPaymentMilestones(updated);
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!sourceId && mode === "create") errors.push("Please select a source");
        if (!title.trim()) errors.push("Please enter a title");
        if (!validUntil) errors.push("Please select a valid until date");
        if (new Date(validUntil) <= new Date())
            errors.push("Valid until date must be in the future");

        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 12);
        if (new Date(validUntil) > maxDate)
            errors.push("Valid until date cannot be more than 12 months in the future");

        if (lineItems.some((item) => !item.productId && !item.productName?.trim()))
            errors.push("Please select a product or enter a product name for all line items");

        if (lineItems.some((item) => !item.productId && (item.unitPrice === undefined || item.unitPrice === null)))
            errors.push("Please enter a unit price for custom items");

        if (lineItems.some((item) => (item.quantity === undefined || item.quantity === null || item.quantity === 0)))
            errors.push("Quantity must be a non-zero number");

        if (hasOverallDiscount) {
            if (overallDiscountType === DiscountType.PERCENTAGE && overallDiscountValue > 100) {
                errors.push("Discount percentage cannot exceed 100%");
            }
        }

        if (paymentMilestones.length > 0) {
            const totalPercentage = paymentMilestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
            if (totalPercentage !== 100) {
                errors.push(`Payment Milestones must sum to exactly 100% (currently ${totalPercentage}%)`);
            }
            if (paymentMilestones.some(m => !m.name.trim())) {
                errors.push("All Payment Milestones must have a name");
            }
            if (paymentMilestones.some(m => Number(m.percentage) < 0 || Number(m.percentage) > 100)) {
                errors.push("Milestone percentage must be between 0 and 100");
            }
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            validationErrors.forEach((err) => showToast.error(err));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setErrors([]);

        let customProductId = "";

        const needsCustomProduct = lineItems.some(item => !item.productId);
        if (needsCustomProduct) {
            try {
                const customProduct = await productsService.getOrCreateCustomProduct();
                customProductId = customProduct.id;
            } catch (err) {
                console.error("Failed to get custom product", err);
                showToast.error("Failed to prepare custom items. Please try again.");
                return;
            }
        }

        const processedLineItems = lineItems.map((item) => {
            const isCustom = !item.productId || item.productId === customProductId;
            const finalProductId = item.productId || customProductId;

            let finalDescription = item.description;
            if (isCustom && item.productName) {
                finalDescription = `${item.productName}:::${item.description || ''}`;
            }

            return {
                productId: finalProductId,
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
                hsnCode: item.hsnCode,
                unitPrice: item.unitPrice,
                description: finalDescription,
                discountType: item.discountType,
                discountValue: item.discountValue,
            };
        });

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
                    companyName: companyName.trim() || undefined,
                    customerName: customerName.trim() || undefined,
                    customerEmail: customerEmail.trim() || undefined,
                    customerPhone: customerPhone.trim() || undefined,
                    billingAddress,
                    shippingAddress,
                    lineItems: processedLineItems,
                    discount,
                    gstType,
                    gstNumber: gstNumber.trim() || undefined,
                    paymentMilestones: paymentMilestones.length > 0 ? paymentMilestones : undefined,
                    paymentTerms: paymentTerms.trim() || undefined,
                    deliveryTerms: deliveryTerms.trim() || undefined,
                    notes: notes.trim() || undefined,
                };

                const created = await proposalsService.createProposal(request);
                showToast.success("Proposal created successfully");

                if (source === ProposalSource.LEAD && sourceId) {
                    try {
                        const { leadsService } = await import("@/lib/leads");
                        const { LeadStatus } = await import("@/types/lead");
                        await leadsService.updateLeadStatus(sourceId, LeadStatus.PROPOSAL_SENT);
                        showToast.success("Lead status updated to Proposal Sent");
                    } catch (error) {
                        console.error("Failed to update lead status", error);
                    }
                }

                router.push(`/proposals/${created.id}`);
            } else {
                if (!initialData?.id) return;

                const request: UpdateProposalRequest = {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    status: status,
                    validUntil,
                    companyName: companyName.trim() || undefined,
                    customerName: customerName.trim() || undefined,
                    customerEmail: customerEmail.trim() || undefined,
                    customerPhone: customerPhone.trim() || undefined,
                    billingAddress,
                    shippingAddress,
                    lineItems: processedLineItems,
                    discount,
                    gstType,
                    gstNumber: gstNumber.trim() || undefined,
                    paymentMilestones: paymentMilestones.length > 0 ? paymentMilestones : undefined,
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

    const isReadOnly =
        mode === "edit" &&
        (initialData?.status === ProposalStatus.ACCEPTED || initialData?.status === ProposalStatus.REJECTED);

    const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 text-sm";
    const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

    const milestoneTotal = paymentMilestones.reduce((s, m) => s + (Number(m.percentage) || 0), 0);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* Read-only warning */}
            {isReadOnly && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-start gap-3">
                    <svg className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-yellow-700">
                        This proposal is <strong>{status}</strong> and cannot be edited.
                    </p>
                </div>
            )}

            {/* Validation errors summary */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-red-700 mb-2">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {errors.map((err, i) => (
                            <li key={i} className="text-sm text-red-600">{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── ROW 1: Two columns — Proposal Details + Address ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* Card 1: Proposal Details */}
                <SectionCard
                    title="Proposal Details"
                    description="Basic information about this proposal"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                >
                    <div className="space-y-4">
                        {/* Source Type + Lead/Opportunity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>
                                    Source Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={source}
                                    onChange={(e) => {
                                        setSource(e.target.value as ProposalSource);
                                        setSourceId("");
                                    }}
                                    disabled={mode === "edit"}
                                    className={inputCls}
                                    required
                                >
                                    <option value={ProposalSource.LEAD}>Lead</option>
                                    <option value={ProposalSource.OPPORTUNITY}>Opportunity</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>
                                    Select {source === ProposalSource.LEAD ? "Lead" : "Opportunity"}{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={sourceId}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        setSourceId(selectedId);

                                        // Auto-populate address if it's a lead
                                        if (source === ProposalSource.LEAD && selectedId) {
                                            const lead = leads.find(l => l.id === selectedId);
                                            if (lead) {
                                                setBillingAddress({
                                                    street: lead.streetAddress || "",
                                                    city: lead.city || "",
                                                    state: lead.state || "",
                                                    postalCode: lead.postalCode || "",
                                                    country: lead.country || "",
                                                });
                                                setGstNumber(lead.gstNumber || "");
                                                setCompanyName(lead.companyName || "");
                                                setCustomerName(`${lead.firstName || ""} ${lead.lastName || ""}`.trim());
                                                setCustomerEmail(lead.email || "");
                                                setCustomerPhone(lead.phone || lead.mobilePhone || "");
                                            }
                                        }
                                    }}
                                    disabled={mode === "edit"}
                                    className={inputCls}
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
                        </div>

                        {/* Status (edit only) */}
                        {mode === "edit" && (
                            <div>
                                <label className={labelCls}>Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as ProposalStatus)}
                                    className={inputCls}
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

                        {/* Title */}
                        <div>
                            <label className={labelCls}>
                                Proposal Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Website Development Proposal"
                                className={inputCls}
                                required
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelCls}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of this proposal..."
                                rows={3}
                                className={inputCls}
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* Valid Until */}
                        <div>
                            <label className={labelCls}>
                                Valid Until <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className={inputCls}
                                required
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* Card 2: Contact & Address Information */}
                <SectionCard
                    title="Contact & Address Information"
                    description="Customer contact details and billing/shipping addresses"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                >
                    <div className="space-y-6">
                        {/* Customer Contact Information */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                        disabled={isReadOnly}
                                        placeholder="Company Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                        disabled={isReadOnly}
                                        placeholder="Name"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                        disabled={isReadOnly}
                                        placeholder="Email address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                        disabled={isReadOnly}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 w-full" />

                        {/* Addresses Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Billing Address */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing Address</h3>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Street Address</label>
                                    <textarea
                                        value={billingAddress.street || ""}
                                        onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                        disabled={isReadOnly}
                                        placeholder="House No, Street Name, Area"
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={billingAddress.city || ""}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">PIN Code</label>
                                        <input
                                            type="text"
                                            value={billingAddress.postalCode || ""}
                                            onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                            disabled={isReadOnly}
                                            placeholder="8XXXXX"
                                        />
                                    </div>
                                </div>
                                <CountryStateSelector
                                    countryValue={billingAddress.country || ""}
                                    stateValue={billingAddress.state || ""}
                                    onCountryChange={(val) => setBillingAddress(prev => ({ ...prev, country: val }))}
                                    onStateChange={(val) => setBillingAddress(prev => ({ ...prev, state: val }))}
                                    disabled={isReadOnly}
                                    labelClassName="block text-xs font-medium text-gray-500 mb-1"
                                />
                            </div>

                            {/* Shipping Address */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipping Address</h3>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isShippingSameAsBilling"
                                            checked={isShippingSameAsBilling}
                                            onChange={(e) => setIsShippingSameAsBilling(e.target.checked)}
                                            disabled={isReadOnly}
                                            className="h-3.5 w-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <label
                                            htmlFor="isShippingSameAsBilling"
                                            className="text-xs text-gray-600 font-medium cursor-pointer select-none"
                                        >
                                            Same as Billing
                                        </label>
                                    </div>
                                </div>

                                {!isShippingSameAsBilling && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Street Address</label>
                                            <textarea
                                                value={shippingAddress.street || ""}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                                disabled={isReadOnly}
                                                placeholder="House No, Street Name, Area"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                                                <input
                                                    type="text"
                                                    value={shippingAddress.city || ""}
                                                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">PIN Code</label>
                                                <input
                                                    type="text"
                                                    value={shippingAddress.postalCode || ""}
                                                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100"
                                                    disabled={isReadOnly}
                                                    placeholder="8XXXXX"
                                                />
                                            </div>
                                        </div>
                                        <CountryStateSelector
                                            countryValue={shippingAddress.country || ""}
                                            stateValue={shippingAddress.state || ""}
                                            onCountryChange={(val) => setShippingAddress(prev => ({ ...prev, country: val }))}
                                            onStateChange={(val) => setShippingAddress(prev => ({ ...prev, state: val }))}
                                            disabled={isReadOnly}
                                            labelClassName="block text-xs font-medium text-gray-500 mb-1"
                                        />
                                    </div>
                                )}

                                {isShippingSameAsBilling && (
                                    <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                                        <p className="text-center text-xs text-gray-500 italic">
                                            Shipping details will match your billing address.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* ── ROW 2: Line Items (full width) ── */}
            <SectionCard
                title="Line Items"
                description="Products or services included in this proposal"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                }
            >
                <div className="space-y-4">
                    {/* Column headers — px-3 matches the card's inner padding so labels align with inputs */}
                    <div className="hidden lg:flex gap-2 px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        <div className="flex-1 min-w-0">Product / Service</div>
                        <div className="w-32 flex-shrink-0">Qty</div>
                        <div className="w-16 flex-shrink-0">Unit</div>
                        <div className="w-24 flex-shrink-0">HSN</div>
                        <div className="w-36 flex-shrink-0">Unit Price (₹)</div>
                        <div className="w-36 flex-shrink-0">Discount</div>
                        <div className="w-24 flex-shrink-0">Disc. Val</div>
                        <div className="w-44 flex-shrink-0 text-right">Total (₹)</div>
                        <div className="w-8 flex-shrink-0" />
                        <div className="w-8 flex-shrink-0" />
                    </div>

                    {lineItems.map((item, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2"
                        >
                            {/* Main row */}
                            <div className="flex flex-col lg:flex-row items-start gap-2">
                                {/* Mobile label */}
                                <span className="lg:hidden text-xs font-semibold text-gray-500">Item #{index + 1}</span>

                                {/* Product Search */}
                                <div className="flex-1 min-w-0 w-full lg:w-auto">
                                    <CatalogProductSearch
                                        label=""
                                        initialValue={item.productName}
                                        allowCustom={true}
                                        onSelect={(product) => {
                                            setLineItems(prev => {
                                                const updated = [...prev];
                                                const currentItem = updated[index];

                                                const getAttr = (keys: string[]) => product.attributes.find(a => keys.includes(a.key.toLowerCase()));

                                                const nameAttr = getAttr(['productname', 'product_name', 'name']);
                                                const actualName = nameAttr?.value || product.displayName;

                                                const newUpdates: Partial<FormLineItem> = {
                                                    productId: product.id,
                                                    productName: actualName
                                                };

                                                const priceAttr = getAttr(['unitprice', 'unit_price', 'price', 'base_price', 'list_price']);
                                                if (priceAttr) {
                                                    if (priceAttr.numericValue != null) {
                                                        newUpdates.unitPrice = priceAttr.numericValue;
                                                    } else if (priceAttr.value) {
                                                        newUpdates.unitPrice = parseFloat(priceAttr.value);
                                                    }
                                                }

                                                const descAttr = getAttr(['description', 'desc']);
                                                newUpdates.description = descAttr?.value || "";

                                                const unitAttr = getAttr(['unit']);
                                                if (unitAttr?.value) newUpdates.unit = unitAttr.value;

                                                const hsnCodeAttr = getAttr(['hsncode', 'hsn_code', 'hsn']);
                                                if (hsnCodeAttr?.value) newUpdates.hsnCode = hsnCodeAttr.value;

                                                updated[index] = { ...currentItem, ...newUpdates };
                                                return updated;
                                            });
                                        }}
                                        onCustomSelect={(customName) => {
                                            setLineItems(prev => {
                                                const updated = [...prev];
                                                updated[index] = {
                                                    ...updated[index],
                                                    productId: "",
                                                    productName: customName
                                                };
                                                return updated;
                                            });
                                        }}
                                        required
                                        disabled={isReadOnly}
                                    />
                                </div>

                                {/* Qty */}
                                <div className="w-32 flex-shrink-0">
                                    <textarea
                                        value={item.quantity ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            updateLineItem(index, "quantity", val === "" ? undefined : parseInt(val));
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.height = 'auto';
                                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                        }}
                                        rows={1}
                                        placeholder="Qty"
                                        className={`${inputCls} resize-none overflow-hidden min-h-[40px]`}
                                        required
                                        disabled={isReadOnly}
                                    />
                                </div>

                                {/* Unit */}
                                <div className="w-16 flex-shrink-0">
                                    <textarea
                                        value={item.unit || ""}
                                        onChange={(e) => {
                                            updateLineItem(index, "unit", e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.height = 'auto';
                                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                        }}
                                        rows={1}
                                        placeholder="Unit"
                                        className={`${inputCls} resize-none overflow-hidden min-h-[40px]`}
                                        disabled={isReadOnly}
                                    />
                                </div>

                                {/* HSN Code */}
                                <div className="w-24 flex-shrink-0">
                                    <textarea
                                        value={item.hsnCode || ""}
                                        onChange={(e) => {
                                            updateLineItem(index, "hsnCode", e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.height = 'auto';
                                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                        }}
                                        rows={1}
                                        placeholder="HSN"
                                        className={`${inputCls} resize-none overflow-hidden min-h-[40px]`}
                                        disabled={isReadOnly}
                                    />
                                </div>

                                {/* Unit Price */}
                                <div className="w-36 flex-shrink-0">
                                    <textarea
                                        value={item.unitPrice || ""}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            updateLineItem(index, "unitPrice", val === "" ? undefined : parseFloat(val));
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.height = 'auto';
                                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                        }}
                                        rows={1}
                                        placeholder="₹ Price"
                                        className={`${inputCls} resize-none overflow-hidden min-h-[40px]`}
                                        disabled={isReadOnly}
                                    />
                                </div>

                                {/* Discount Type */}
                                <div className="w-36 flex-shrink-0">
                                    <select
                                        value={item.discountType || ""}
                                        onChange={(e) => updateLineItem(index, "discountType", e.target.value || undefined)}
                                        className={inputCls}
                                        disabled={isReadOnly}
                                    >
                                        <option value="">No Discount</option>
                                        <option value={DiscountType.PERCENTAGE}>% Off</option>
                                        <option value={DiscountType.FIXED_AMOUNT}>₹ Off</option>
                                    </select>
                                </div>

                                {/* Discount Value */}
                                <div className="w-24 flex-shrink-0">
                                    <textarea
                                        value={item.discountValue || ""}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            updateLineItem(index, "discountValue", val === "" ? undefined : parseFloat(val));
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.height = 'auto';
                                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                        }}
                                        rows={1}
                                        placeholder={item.discountType === DiscountType.PERCENTAGE ? "%" : "₹"}
                                        className={`${inputCls} ${!item.discountType ? "opacity-30 pointer-events-none" : ""} resize-none overflow-hidden min-h-[40px]`}
                                        disabled={isReadOnly || !item.discountType}
                                    />
                                </div>

                                {/* Line Item Total */}
                                <div className="w-44 flex-shrink-0">
                                    <div className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 text-right whitespace-normal break-all min-h-[40px]">
                                        {(() => {
                                            const qty = item.quantity || 0;
                                            const price = item.unitPrice || 0;
                                            const subtotal = qty * price;
                                            let total = subtotal;

                                            if (item.discountType === DiscountType.PERCENTAGE && item.discountValue) {
                                                total = subtotal * (1 - item.discountValue / 100);
                                            } else if (item.discountType === DiscountType.FIXED_AMOUNT && item.discountValue) {
                                                total = subtotal - item.discountValue;
                                            }

                                            return `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                        })()}
                                    </div>
                                </div>

                                {/* Description toggle */}
                                <button
                                    type="button"
                                    onClick={() => toggleDescription(index)}
                                    disabled={isReadOnly}
                                    title={showDescriptions[index] ? "Hide description" : "Add description"}
                                    className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${showDescriptions[index]
                                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                        : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>

                                {/* Remove */}
                                <button
                                    type="button"
                                    onClick={() => removeLineItem(index)}
                                    disabled={isReadOnly || lineItems.length === 1}
                                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Remove item"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Collapsible description row */}
                            {showDescriptions[index] && (
                                <div className="flex items-center gap-2 pl-1">
                                    <span className="text-xs text-gray-400 flex-shrink-0">Note:</span>
                                    <input
                                        type="text"
                                        value={item.description || ""}
                                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                                        placeholder="Product description or custom notes..."
                                        className={`${inputCls} flex-1`}
                                        autoFocus
                                        disabled={isReadOnly}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addLineItem}
                        disabled={isReadOnly}
                        className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        + Add Line Item
                    </button>
                </div>
            </SectionCard>

            {/* ── ROW 3: Three columns — Tax, Discount, Milestones ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Card: Tax Configuration */}
                <SectionCard
                    title="Tax Configuration"
                    description="GST settings for this proposal"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    }
                >
                    <div>
                        <label className={labelCls}>GST Type</label>
                        <select
                            value={gstType}
                            onChange={(e) => setGstType(e.target.value as GstType)}
                            className={inputCls}
                            disabled={isReadOnly}
                        >
                            <option value={GstType.NONE}>No GST</option>
                            <option value={GstType.IGST}>Inter-State — IGST (18%)</option>
                            <option value={GstType.CGST_SGST}>Intra-State — CGST (9%) + SGST (9%)</option>
                        </select>
                        <p className="mt-2 text-xs text-gray-500">
                            Selecting IGST or CGST+SGST applies 18% tax to all line items.
                        </p>
                    </div>
                    <div className="mt-4">
                        <label className={labelCls}>GST Number</label>
                        <input
                            type="text"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                            className={inputCls}
                            disabled={isReadOnly}
                            placeholder="e.g. 29ABCDE1234F1Z5"
                        />
                    </div>
                </SectionCard>

                {/* Card: Overall Discount */}
                <SectionCard
                    title="Overall Discount"
                    description="Apply a discount across the entire proposal"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    }
                >
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                id="hasDiscount"
                                checked={hasOverallDiscount}
                                onChange={(e) => setHasOverallDiscount(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:text-gray-400"
                                disabled={isReadOnly}
                            />
                            <span className="text-sm font-medium text-gray-700">Apply Overall Discount</span>
                        </label>

                        {hasOverallDiscount && (
                            <div className="space-y-3 pt-1">
                                <div>
                                    <label className={labelCls}>Discount Type</label>
                                    <select
                                        value={overallDiscountType}
                                        onChange={(e) => setOverallDiscountType(e.target.value as DiscountType)}
                                        className={inputCls}
                                        disabled={isReadOnly}
                                    >
                                        <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                                        <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Discount Value</label>
                                    <input
                                        type="number"
                                        value={overallDiscountValue}
                                        onChange={(e) => setOverallDiscountValue(parseFloat(e.target.value) || 0)}
                                        step="0.01"
                                        min="0"
                                        className={inputCls}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Reason</label>
                                    <input
                                        type="text"
                                        value={discountReason}
                                        onChange={(e) => setDiscountReason(e.target.value)}
                                        placeholder="e.g., Bulk order"
                                        className={inputCls}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Card: Payment Milestones */}
                <SectionCard
                    title="Payment Milestones"
                    description="Split payment into multiple stages"
                    icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                >
                    <div className="space-y-3">
                        {paymentMilestones.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Total allocation:</span>
                                    <span className={`font-semibold ${milestoneTotal === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                        {milestoneTotal}% {milestoneTotal === 100 ? '✓' : '(must be 100%)'}
                                    </span>
                                </div>
                                {paymentMilestones.map((milestone, index) => (
                                    <div key={index} className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            {index === 0 && <label className="block text-xs text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>}
                                            <input
                                                type="text"
                                                value={milestone.name}
                                                onChange={(e) => updateMilestone(index, "name", e.target.value)}
                                                placeholder="e.g. Advance"
                                                className={inputCls}
                                                required
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div className="w-24">
                                            {index === 0 && <label className="block text-xs text-gray-500 mb-1">% <span className="text-red-500">*</span></label>}
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={milestone.percentage || ""}
                                                    onChange={(e) => updateMilestone(index, "percentage", parseFloat(e.target.value) || 0)}
                                                    step="0.01"
                                                    max="100"
                                                    min="0"
                                                    className={inputCls}
                                                    required
                                                    disabled={isReadOnly}
                                                />
                                                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-xs">%</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMilestone(index)}
                                            disabled={isReadOnly}
                                            className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-400"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No milestones. Proposal is 100% upfront.</p>
                        )}

                        <button
                            type="button"
                            onClick={addMilestone}
                            disabled={isReadOnly}
                            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors text-sm disabled:opacity-50"
                        >
                            + Add Milestone
                        </button>
                    </div>
                </SectionCard>
            </div>

            {/* ── ROW 4: Terms & Conditions (full width, 3 columns) ── */}
            <SectionCard
                title="Terms & Conditions"
                description="Payment terms, delivery terms, and additional notes"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className={labelCls}>Payment Terms</label>
                        <textarea
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                            placeholder="e.g., 50% advance, 50% on delivery"
                            rows={4}
                            className={inputCls}
                            disabled={isReadOnly}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Delivery Terms</label>
                        <textarea
                            value={deliveryTerms}
                            onChange={(e) => setDeliveryTerms(e.target.value)}
                            placeholder="e.g., Delivery within 30 days"
                            rows={4}
                            className={inputCls}
                            disabled={isReadOnly}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Additional Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional notes or terms..."
                            rows={4}
                            className={inputCls}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pb-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || isReadOnly}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm"
                >
                    {loading
                        ? "Saving..."
                        : mode === "create"
                            ? "Create Proposal"
                            : "Update Proposal"}
                </button>
            </div>
        </form>
    );
}
