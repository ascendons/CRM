"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { proposalsService } from "@/lib/proposals";
import { productsService } from "@/lib/products";
import { leadsService } from "@/lib/leads";
import { opportunitiesService } from "@/lib/opportunities";
import { authService } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import {
  CreateProposalRequest,
  LineItemDTO,
  DiscountDTO,
  ProposalSource,
  DiscountType,
  getDiscountTypeLabel,
} from "@/types/proposal";
import { ProductResponse } from "@/types/product";
import { Lead } from "@/types/lead";
import { Opportunity } from "@/types/opportunity";

export default function NewProposalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // Form state - pre-fill from URL params if available
  const [source, setSource] = useState<ProposalSource>(
    (searchParams.get("source") as ProposalSource) || ProposalSource.LEAD
  );
  const [sourceId, setSourceId] = useState(searchParams.get("sourceId") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [notes, setNotes] = useState("");

  // Line items state
  const [lineItems, setLineItems] = useState<LineItemDTO[]>([
    {
      productId: "",
      quantity: 1,
      unitPrice: undefined,
      discountType: undefined,
      discountValue: undefined,
    },
  ]);

  // Overall discount state
  const [hasOverallDiscount, setHasOverallDiscount] = useState(false);
  const [overallDiscountType, setOverallDiscountType] = useState<DiscountType>(
    DiscountType.PERCENTAGE
  );
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [productsData, leadsData, opportunitiesData] = await Promise.all([
        productsService.getAllProducts(),
        leadsService.getAllLeads(),
        opportunitiesService.getAllOpportunities(),
      ]);
      setProducts(productsData);
      setLeads(leadsData);
      setOpportunities(opportunitiesData);
    } catch (err) {
      showToast("Failed to load form data", "error");
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
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) {
      showToast("At least one line item is required", "error");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemDTO, value: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!sourceId) {
      showToast("Please select a source", "error");
      return;
    }
    if (!title.trim()) {
      showToast("Please enter a title", "error");
      return;
    }
    if (!validUntil) {
      showToast("Please select a valid until date", "error");
      return;
    }
    if (lineItems.some((item) => !item.productId)) {
      showToast("Please select a product for all line items", "error");
      return;
    }
    if (lineItems.some((item) => item.quantity < 1)) {
      showToast("Quantity must be at least 1", "error");
      return;
    }

    // Build request
    const request: CreateProposalRequest = {
      source,
      sourceId,
      title: title.trim(),
      description: description.trim() || undefined,
      validUntil,
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountType: item.discountType,
        discountValue: item.discountValue,
      })),
      paymentTerms: paymentTerms.trim() || undefined,
      deliveryTerms: deliveryTerms.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    // Add overall discount if enabled
    if (hasOverallDiscount && overallDiscountValue > 0) {
      request.discount = {
        overallDiscountType,
        overallDiscountValue,
        discountReason: discountReason.trim() || undefined,
      };
    }

    try {
      setLoading(true);
      const created = await proposalsService.createProposal(request);
      showToast("Proposal created successfully", "success");
      router.push(`/proposals/${created.id}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to create proposal",
        "error"
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

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product ? `${product.productName} (${product.sku})` : "";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Proposal
            </h1>
            <p className="text-gray-600 mt-1">
              Create a quotation for a lead or opportunity
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value as ProposalSource);
                    setSourceId(""); // Reset source selection
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Line Items */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Line Items
                </h2>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            updateLineItem(index, "productId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.productName} ({product.sku}) - ₹
                              {product.basePrice}
                            </option>
                          ))}
                        </select>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={DiscountType.PERCENTAGE}>
                        Percentage (%)
                      </option>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push("/proposals")}
                disabled={loading}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Proposal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
