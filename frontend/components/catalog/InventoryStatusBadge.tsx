"use client";

import React, { useEffect, useState } from "react";
import { Package, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

interface InventoryStatusBadgeProps {
  productId: string;
  status?: InventoryStatus | null;
  compact?: boolean;
  showDetails?: boolean;
  bulkLoading?: boolean;
}

interface InventoryStatus {
  inventoryTracked: boolean;
  structuredProductId?: string;
  sku?: string;
  onHandStock?: number;
  reservedStock?: number;
  availableStock?: number;
  minStockLevel?: number;
  reorderLevel?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  needsReorder?: boolean;
  warehouseId?: string;
  warehouseName?: string;
  basePrice?: number;
  currency?: string;
  syncStatus?: string;
  lastSyncedAt?: string;
}

export default function InventoryStatusBadge({
  productId,
  status: providedStatus,
  compact = false,
  showDetails = false,
  bulkLoading = false,
}: InventoryStatusBadgeProps) {
  const [status, setStatus] = useState<InventoryStatus | null>(providedStatus || null);
  const [loading, setLoading] = useState(!providedStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providedStatus) {
      setStatus(providedStatus);
      setLoading(false);
    } else if (bulkLoading) {
      setLoading(true);
      // Don't fetch individually - wait for bulk data
    } else {
      fetchInventoryStatus();
    }
  }, [productId, providedStatus, bulkLoading]);

  const fetchInventoryStatus = async () => {
    try {
      setLoading(true);
      const data = await api.get<InventoryStatus>(`/catalog/${productId}/inventory/status`);
      if (data) {
        setStatus(data);
      } else {
        setStatus({ inventoryTracked: false } as InventoryStatus);
      }
    } catch (err) {
      console.error("Failed to fetch inventory status:", err);
      // Set as not tracked on error
      setStatus({ inventoryTracked: false } as InventoryStatus);
      setError(null); // Don't show error, just show as not tracked
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded text-xs text-gray-500">
        <Loader2 className="w-3 h-3 animate-spin mr-1" />
        {!compact && <span>Loading...</span>}
      </div>
    );
  }

  if (error || !status) {
    return null;
  }

  if (!status.inventoryTracked) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
        <Package className="w-3 h-3 mr-1" />
        {!compact && <span>Not Tracked</span>}
      </div>
    );
  }

  // Determine badge color and icon based on stock status
  const getBadgeStyle = () => {
    if (status.isOutOfStock) {
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
        label: "Out of Stock",
      };
    }
    if (status.isLowStock || status.needsReorder) {
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: AlertTriangle,
        label: "Low Stock",
      };
    }
    return {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-200",
      icon: CheckCircle,
      label: "In Stock",
    };
  };

  const badgeStyle = getBadgeStyle();
  const Icon = badgeStyle.icon;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
        title={`${badgeStyle.label}: ${status.availableStock} available`}
      >
        <Icon className="w-3 h-3" />
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col">
      <div
        className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-medium ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
      >
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        <span>{badgeStyle.label}</span>
        {status.availableStock !== undefined && (
          <span className="ml-1.5 font-semibold">({status.availableStock})</span>
        )}
      </div>

      {showDetails && status.availableStock !== undefined && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>SKU:</span>
            <span className="font-medium">{status.sku}</span>
          </div>
          <div className="flex justify-between">
            <span>On Hand:</span>
            <span className="font-medium">{status.onHandStock}</span>
          </div>
          <div className="flex justify-between">
            <span>Reserved:</span>
            <span className="font-medium">{status.reservedStock}</span>
          </div>
          <div className="flex justify-between">
            <span>Available:</span>
            <span className="font-medium text-green-600">{status.availableStock}</span>
          </div>
          {status.reorderLevel !== undefined && (
            <div className="flex justify-between">
              <span>Reorder Level:</span>
              <span className="font-medium">{status.reorderLevel}</span>
            </div>
          )}
          {status.warehouseName && (
            <div className="flex justify-between">
              <span>Warehouse:</span>
              <span className="font-medium">{status.warehouseName}</span>
            </div>
          )}
          {status.basePrice && (
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-medium">
                {status.currency} {status.basePrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
