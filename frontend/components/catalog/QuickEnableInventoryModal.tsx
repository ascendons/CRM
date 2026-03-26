"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Zap, Settings } from 'lucide-react';
import { api } from '@/lib/api-client';

interface QuickEnableInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Array<{
    id: string;
    displayName: string;
    attributes?: Array<{ key: string; value: string }>;
  }>;
  onSuccess: () => void;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
  isDefault?: boolean;
}

export default function QuickEnableInventoryModal({
  isOpen,
  onClose,
  products,
  onSuccess
}: QuickEnableInventoryModalProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState({
    warehouseId: '',
    initialStock: 0,
    minStockLevel: 10,
    reorderLevel: 20,
    currency: 'INR',
    taxRate: 18,
    autoSyncEnabled: true,
    autoGenerateSKU: true
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchWarehouses();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchWarehouses = async () => {
    try {
      const data = await api.get<Warehouse[]>('/inventory/warehouses/list');
      const warehouseList = Array.isArray(data) ? data : [];
      setWarehouses(warehouseList);

      // Auto-select default warehouse
      const defaultWarehouse = warehouseList.find((w: any) => w.isDefault === true) || warehouseList[0];
      if (defaultWarehouse) {
        setFormData(prev => ({ ...prev, warehouseId: defaultWarehouse.id }));
      }

      if (warehouseList.length === 0) {
        setError('No warehouses found. Please create a warehouse first.');
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
      setWarehouses([]);
      setError('Failed to load warehouses. Please try again.');
    }
  };

  const extractPriceFromAttributes = (attributes?: Array<{ key: string; value: string }>) => {
    if (!attributes) return null;

    const priceAttr = attributes.find(attr =>
      attr.key.toLowerCase().includes('price') ||
      attr.key.toLowerCase().includes('unitprice')
    );

    if (priceAttr) {
      const cleaned = priceAttr.value.replace(/[^0-9.]/g, '');
      const price = parseFloat(cleaned);
      return isNaN(price) ? null : price;
    }

    return null;
  };

  const generateSKU = (productName: string, index: number) => {
    const prefix = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const timestamp = Date.now().toString().slice(-6);
    const seq = (index + 1).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${seq}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const results = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        // Auto-extract price from UnitPrice attribute
        const extractedPrice = extractPriceFromAttributes(product.attributes);

        const payload = {
          sku: formData.autoGenerateSKU ? generateSKU(product.displayName, i) : `SKU-${Date.now()}-${i}`,
          warehouseId: formData.warehouseId,
          initialStock: formData.initialStock,
          minStockLevel: formData.minStockLevel,
          reorderLevel: formData.reorderLevel,
          basePrice: extractedPrice, // Use extracted price from UnitPrice attribute
          currency: formData.currency,
          taxRate: formData.taxRate,
          taxType: 'GST',
          autoSyncEnabled: formData.autoSyncEnabled
        };

        try {
          await api.post(`/catalog/${product.id}/inventory/enable`, payload);
          results.push({ id: product.id, success: true });
        } catch (err: any) {
          console.error(`Failed to enable inventory for ${product.displayName}:`, err);
          results.push({ id: product.id, success: false, error: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        onSuccess();
        onClose();
        resetForm();
      }

      if (failCount > 0) {
        setError(`Successfully enabled ${successCount} products. Failed: ${failCount}`);
      }
    } catch (err: any) {
      console.error('Bulk enable failed:', err);
      setError(err.message || 'Failed to enable inventory tracking');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      warehouseId: '',
      initialStock: 0,
      minStockLevel: 10,
      reorderLevel: 20,
      currency: 'INR',
      taxRate: 18,
      autoSyncEnabled: true,
      autoGenerateSKU: true
    });
    setError(null);
    setShowAdvanced(false);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      style={{ margin: 0 }}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quick Enable Inventory</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {products.length} product{products.length > 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">✨ Smart Defaults Applied</p>
                <ul className="space-y-1 text-xs">
                  <li>• SKU auto-generated for each product</li>
                  <li>• <strong>UnitPrice automatically mapped to Base Price</strong></li>
                  <li>• Default warehouse selected automatically</li>
                  <li>• Currency & Tax set to INR/GST 18%</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Essential Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse *
              </label>
              <select
                required
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                    {warehouse.isDefault && ' - Default'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.initialStock}
                onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Settings className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={formData.autoSyncEnabled}
                  onChange={(e) => setFormData({ ...formData, autoSyncEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoSync" className="ml-2 text-sm text-gray-700">
                  Enable automatic synchronization
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.warehouseId}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enabling...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Enable for {products.length} Product{products.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
