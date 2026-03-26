import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import inventoryApi from '../../services/inventoryApi';

const PurchaseOrderForm = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    warehouseId: null,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    paymentTerms: 'NET_30',
    notes: '',
    items: [],
  });

  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  const fetchInitialData = async () => {
    try {
      const [warehousesRes, productsRes] = await Promise.all([
        inventoryApi.warehouses.getActive(),
        // Assuming there's a products API - adjust if needed
        fetch('/api/products/list').catch(() => ({ data: { data: [] } })),
      ]);

      setWarehouses(warehousesRes.data.data || []);
      // For products, you may need to adjust based on your API
      setProducts([]);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          productName: '',
          quantity: 0,
          unitCost: 0,
          discount: 0,
          tax: 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unitCost;
    const afterDiscount = subtotal - (subtotal * (item.discount || 0)) / 100;
    const total = afterDiscount + (afterDiscount * (item.tax || 0)) / 100;
    return total;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate
      if (!formData.supplierName.trim()) {
        setError('Supplier name is required');
        return;
      }

      if (!formData.warehouseId) {
        setError('Please select a warehouse');
        return;
      }

      if (formData.items.length === 0) {
        setError('Please add at least one item');
        return;
      }

      // Prepare data
      const poData = {
        ...formData,
        totalAmount: calculateGrandTotal(),
      };

      await inventoryApi.purchaseOrders.create(poData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError('Failed to create purchase order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      supplierName: '',
      supplierContact: '',
      supplierEmail: '',
      warehouseId: null,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      paymentTerms: 'NET_30',
      notes: '',
      items: [],
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create Purchase Order</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Supplier Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Supplier Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Supplier Name"
              required
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Contact Person"
              value={formData.supplierContact}
              onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.supplierEmail}
              onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
            />
          </Grid>

          {/* Order Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              Order Details
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => option.name || ''}
              value={warehouses.find((w) => w.id === formData.warehouseId) || null}
              onChange={(e, value) => setFormData({ ...formData, warehouseId: value?.id || null })}
              renderInput={(params) => (
                <TextField {...params} label="Warehouse" required />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Order Date"
              type="date"
              required
              value={formData.orderDate}
              onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Expected Delivery"
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) =>
                setFormData({ ...formData, expectedDeliveryDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="NET_30">Net 30</option>
              <option value="NET_60">Net 60</option>
              <option value="COD">Cash on Delivery</option>
              <option value="ADVANCE">Advance Payment</option>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Grid>

          {/* Items */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Items
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                size="small"
                variant="outlined"
              >
                Add Item
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product ID</TableCell>
                    <TableCell>Product Name</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Cost</TableCell>
                    <TableCell align="right">Discount %</TableCell>
                    <TableCell align="right">Tax %</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          placeholder="Product ID"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.productName}
                          onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                          placeholder="Product Name"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitCost}
                          onChange={(e) =>
                            handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)
                          }
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)
                          }
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.tax}
                          onChange={(e) =>
                            handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)
                          }
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          ${calculateItemTotal(item).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {formData.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" py={2}>
                          No items added. Click "Add Item" to add products.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {formData.items.length > 0 && (
              <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                <Box sx={{ minWidth: 200 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Grand Total:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ${calculateGrandTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Purchase Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseOrderForm;
