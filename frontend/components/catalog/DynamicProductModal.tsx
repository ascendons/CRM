"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types/catalog";
import { X, Save, Package, Tag } from "lucide-react";

interface DynamicProductModalProps {
  product: Product | null;
  mode: "view" | "edit";
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { displayName: string; attributes: Product["attributes"] }) => void;
}

export default function DynamicProductModal({
  product,
  mode,
  open,
  saving,
  onClose,
  onSave,
}: DynamicProductModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [attributes, setAttributes] = useState<Product["attributes"]>([]);

  useEffect(() => {
    if (product) {
      setDisplayName(product.displayName);
      setAttributes([...product.attributes]);
    }
  }, [product]);

  const handleSave = () => {
    onSave({
      displayName,
      attributes,
    });
  };

  const handleAttributeChange = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = {
      ...newAttributes[index],
      value,
    };
    setAttributes(newAttributes);
  };

  if (!open || !product) return null;

  const isEditing = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit Product" : "Product Details"}
              </h2>
              <p className="text-xs text-slate-500">ID: {product.productId || product.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Display Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Product Name</label>
            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Enter product name"
              />
            ) : (
              <p className="text-base text-slate-900 font-medium">{displayName}</p>
            )}
          </div>

          {/* Category */}
          {product.category && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                <Tag className="w-4 h-4" />
                {product.category}
              </div>
            </div>
          )}

          {/* Attributes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Attributes ({attributes.length})
            </label>
            <div className="space-y-3">
              {attributes.map((attr, index) => (
                <div
                  key={`${attr.key}-${index}`}
                  className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        {attr.key}
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={attr.value}
                          onChange={(e) => handleAttributeChange(index, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 break-words">{attr.value}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white border border-slate-200 rounded text-slate-600">
                        {attr.type}
                      </span>
                    </div>
                  </div>
                  {attr.numericValue !== null && attr.numericValue !== undefined && (
                    <div className="mt-2 text-xs text-slate-500">
                      Numeric value:{" "}
                      <span className="font-medium text-slate-700">{attr.numericValue}</span>
                      {attr.unit && <span className="ml-1">{attr.unit}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Source Headers */}
          {product.sourceHeaders && Object.keys(product.sourceHeaders).length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Source Headers
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(product.sourceHeaders).map(([key, value], index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium"
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Created:</span>
                <span className="ml-2 text-slate-900 font-medium">
                  {product.createdAt ? new Date(product.createdAt).toLocaleString() : "N/A"}
                </span>
              </div>
              {product.createdBy && (
                <div>
                  <span className="text-slate-500">Created by:</span>
                  <span className="ml-2 text-slate-900 font-medium">{product.createdBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {isEditing ? "Cancel" : "Close"}
          </button>
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
