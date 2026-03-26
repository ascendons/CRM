import api from './api';

/**
 * Inventory API Service
 * All API calls for the inventory management system
 */

const inventoryApi = {
  // ==================== WAREHOUSE APIs ====================

  warehouses: {
    // Get all warehouses (paginated)
    getAll: (params) => api.get('/inventory/warehouses', { params }),

    // Get all warehouses as list
    getList: () => api.get('/inventory/warehouses/list'),

    // Get active warehouses
    getActive: () => api.get('/inventory/warehouses/active'),

    // Get default warehouse
    getDefault: () => api.get('/inventory/warehouses/default'),

    // Get warehouse by ID
    getById: (id) => api.get(`/inventory/warehouses/${id}`),

    // Create warehouse
    create: (data) => api.post('/inventory/warehouses', data),

    // Update warehouse
    update: (id, data) => api.put(`/inventory/warehouses/${id}`, data),

    // Delete warehouse
    delete: (id) => api.delete(`/inventory/warehouses/${id}`),

    // Add storage location
    addLocation: (warehouseId, data) =>
      api.post(`/inventory/warehouses/${warehouseId}/locations`, data),

    // Remove storage location
    removeLocation: (warehouseId, locationId) =>
      api.delete(`/inventory/warehouses/${warehouseId}/locations/${locationId}`),

    // Get warehouse count
    getCount: () => api.get('/inventory/warehouses/count'),
  },

  // ==================== STOCK APIs ====================

  stock: {
    // Get stock by product and warehouse
    get: (productId, warehouseId) =>
      api.get('/inventory/stock', { params: { productId, warehouseId } }),

    // Get stock by product (all warehouses)
    getByProduct: (productId) => api.get(`/inventory/stock/product/${productId}`),

    // Get stock by warehouse
    getByWarehouse: (warehouseId) =>
      api.get(`/inventory/stock/warehouse/${warehouseId}`),

    // Get all stock (paginated)
    getAll: (params) => api.get('/inventory/stock/all', { params }),

    // Adjust stock
    adjust: (data) => api.post('/inventory/stock/adjust', data),

    // Transfer stock
    transfer: (data) => api.post('/inventory/stock/transfer', data),

    // Get low stock alerts
    getLowStock: () => api.get('/inventory/stock/alerts/low-stock'),

    // Get out of stock items
    getOutOfStock: () => api.get('/inventory/stock/out-of-stock'),

    // Update stock thresholds
    updateThresholds: (params) => api.put('/inventory/stock/thresholds', null, { params }),

    // Physical stock count
    physicalCount: (params) => api.post('/inventory/stock/physical-count', null, { params }),

    // Get total product count
    getTotalProductCount: () => api.get('/inventory/stock/count/products'),

    // Get total stock value
    getTotalValue: () => api.get('/inventory/stock/value/total'),

    // Update unit cost directly
    updateUnitCost: (productId, warehouseId, unitCost, reason) =>
      api.put('/inventory/stock/unit-cost', null, {
        params: { productId, warehouseId, unitCost, reason }
      }),
  },

  // ==================== PURCHASE ORDER APIs ====================

  purchaseOrders: {
    // Get all purchase orders (paginated)
    getAll: (params) => api.get('/inventory/purchase-orders', { params }),

    // Get purchase order by ID
    getById: (id) => api.get(`/inventory/purchase-orders/${id}`),

    // Get purchase order by number
    getByNumber: (poNumber) =>
      api.get(`/inventory/purchase-orders/number/${poNumber}`),

    // Get purchase orders by status
    getByStatus: (status) =>
      api.get(`/inventory/purchase-orders/status/${status}`),

    // Create purchase order
    create: (data) => api.post('/inventory/purchase-orders', data),

    // Update purchase order
    update: (id, data) => api.put(`/inventory/purchase-orders/${id}`, data),

    // Submit for approval
    submit: (id) => api.post(`/inventory/purchase-orders/${id}/submit`),

    // Approve purchase order
    approve: (id) => api.post(`/inventory/purchase-orders/${id}/approve`),

    // Reject purchase order
    reject: (id, reason) =>
      api.post(`/inventory/purchase-orders/${id}/reject`, null, { params: { reason } }),

    // Receive goods
    receive: (id, data) => api.post(`/inventory/purchase-orders/${id}/receive`, data),

    // Cancel purchase order
    cancel: (id, reason) =>
      api.post(`/inventory/purchase-orders/${id}/cancel`, null, { params: { reason } }),

    // Get overdue purchase orders
    getOverdue: () => api.get('/inventory/purchase-orders/overdue'),
  },

  // ==================== RESERVATION APIs ====================

  reservations: {
    // Get all active reservations
    getActive: () => api.get('/inventory/reservations/active'),

    // Get reservation by ID
    getById: (id) => api.get(`/inventory/reservations/${id}`),

    // Get reservations by reference
    getByReference: (referenceType, referenceId) =>
      api.get('/inventory/reservations/reference', {
        params: { referenceType, referenceId }
      }),

    // Get active reservations by product
    getByProduct: (productId) =>
      api.get(`/inventory/reservations/product/${productId}/active`),

    // Create reservation
    create: (data) => api.post('/inventory/reservations', data),

    // Release reservation
    release: (id) => api.post(`/inventory/reservations/${id}/release`),

    // Fulfill reservation
    fulfill: (id) => api.post(`/inventory/reservations/${id}/fulfill`),

    // Cancel reservation
    cancel: (id, reason) =>
      api.post(`/inventory/reservations/${id}/cancel`, null, { params: { reason } }),

    // Extend reservation
    extend: (id, additionalDays) =>
      api.post(`/inventory/reservations/${id}/extend`, null, {
        params: { additionalDays }
      }),

    // Get total reserved quantity
    getTotalReserved: (productId) =>
      api.get(`/inventory/reservations/product/${productId}/total-reserved`),
  },

  // ==================== BATCH APIs ====================

  batches: {
    // Get all batches by product
    getByProduct: (productId) => api.get(`/inventory/batches/product/${productId}`),

    // Get available batches by product
    getAvailable: (productId) =>
      api.get(`/inventory/batches/product/${productId}/available`),

    // Get batch by ID
    getById: (id) => api.get(`/inventory/batches/${id}`),

    // Get batch by number
    getByNumber: (productId, batchNumber) =>
      api.get(`/inventory/batches/product/${productId}/number/${batchNumber}`),

    // Create batch
    create: (data) => api.post('/inventory/batches', data),

    // Update batch quantity
    updateQuantity: (batchId, quantityChange, increase) =>
      api.put(`/inventory/batches/${batchId}/quantity`, null, {
        params: { quantityChange, increase }
      }),

    // Reserve batch quantity
    reserve: (batchId, quantity) =>
      api.post(`/inventory/batches/${batchId}/reserve`, null, { params: { quantity } }),

    // Release batch reservation
    releaseReservation: (batchId, quantity) =>
      api.post(`/inventory/batches/${batchId}/release`, null, { params: { quantity } }),

    // Get batches expiring soon
    getExpiringSoon: (daysThreshold = 30) =>
      api.get('/inventory/batches/expiring-soon', { params: { daysThreshold } }),

    // Get expired batches
    getExpired: () => api.get('/inventory/batches/expired'),

    // Mark batch as expired
    markExpired: (batchId) =>
      api.post(`/inventory/batches/${batchId}/mark-expired`),

    // Quarantine batch
    quarantine: (batchId, reason) =>
      api.post(`/inventory/batches/${batchId}/quarantine`, null, { params: { reason } }),

    // Release from quarantine
    releaseQuarantine: (batchId) =>
      api.post(`/inventory/batches/${batchId}/release-quarantine`),

    // Recall batch
    recall: (batchId, reason) =>
      api.post(`/inventory/batches/${batchId}/recall`, null, { params: { reason } }),

    // Get recalled batches
    getRecalled: () => api.get('/inventory/batches/recalled'),

    // Get batch count by product
    getCountByProduct: (productId) =>
      api.get(`/inventory/batches/product/${productId}/count`),

    // Get active batch count
    getActiveCount: () => api.get('/inventory/batches/count/active'),
  },
};

export default inventoryApi;
