"use client";

import React, { useState } from "react";
import { Product } from "@/types/catalog";
import InventoryStatusBadge from "./InventoryStatusBadge";
import EnableInventoryModal from "./EnableInventoryModal";
import { Eye, Edit, Trash2, Package } from "lucide-react";

interface DynamicProductTableProps {
  products: Product[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function DynamicProductTable({
  products,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
}: DynamicProductTableProps) {
  const [enableInventoryModalOpen, setEnableInventoryModalOpen] = useState(false);
  const [selectedProductForInventory, setSelectedProductForInventory] = useState<Product | null>(
    null
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(new Set(products.map((p) => p.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    onSelectionChange(newSelection);
  };

  const handleEnableInventory = (product: Product) => {
    setSelectedProductForInventory(product);
    setEnableInventoryModalOpen(true);
  };

  const handleInventorySuccess = () => {
    // Refresh the table to show updated inventory status
    window.location.reload();
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Products Found</h3>
        <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Inventory Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Attributes
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {product.displayName}
                      </span>
                      <span className="text-xs text-slate-500">
                        ID: {product.productId || product.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {product.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <InventoryStatusBadge productId={product.id} />
                      <button
                        onClick={() => handleEnableInventory(product)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        title="Enable inventory tracking"
                      >
                        Enable
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-slate-600">
                      {product.attributes?.length || 0} attributes
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(product)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enable Inventory Modal */}
      {selectedProductForInventory && (
        <EnableInventoryModal
          isOpen={enableInventoryModalOpen}
          onClose={() => {
            setEnableInventoryModalOpen(false);
            setSelectedProductForInventory(null);
          }}
          productId={selectedProductForInventory.id}
          productName={selectedProductForInventory.displayName}
          onSuccess={handleInventorySuccess}
        />
      )}
    </>
  );
}
