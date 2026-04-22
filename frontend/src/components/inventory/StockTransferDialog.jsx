import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Divider,
  Autocomplete,
} from "@mui/material";
import inventoryApi from "../../services/inventoryApi";

const StockTransferDialog = ({ open, stock, onClose }) => {
  const [formData, setFormData] = useState({
    toWarehouseId: "",
    quantity: "",
    reason: "",
    notes: "",
  });

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchWarehouses();
    }
  }, [open]);

  const fetchWarehouses = async () => {
    try {
      const response = await inventoryApi.warehouses.getActive();
      // Filter out current warehouse
      setWarehouses(response.data.filter((w) => w.id !== stock.warehouseId));
    } catch (err) {
      console.error("Failed to load warehouses:", err);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      await inventoryApi.stock.transfer({
        productId: stock.productId,
        fromWarehouseId: stock.warehouseId,
        toWarehouseId: formData.toWarehouseId,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        notes: formData.notes,
      });

      onClose(true); // Refresh parent
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to transfer stock");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.toWarehouseId &&
      formData.quantity &&
      parseInt(formData.quantity) > 0 &&
      parseInt(formData.quantity) <= stock.quantityAvailable &&
      formData.reason
    );
  };

  const handleClose = () => {
    setFormData({
      toWarehouseId: "",
      quantity: "",
      reason: "",
      notes: "",
    });
    setError(null);
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer Stock</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stock Info */}
        <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1, mb: 3 }}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Product ID
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {stock?.productId}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                From Warehouse
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {stock?.warehouseId}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Available to Transfer
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {stock?.quantityAvailable} units
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Transfer Form */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={warehouses.find((w) => w.id === formData.toWarehouseId) || null}
              onChange={(e, newValue) =>
                setFormData({ ...formData, toWarehouseId: newValue?.id || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="To Warehouse"
                  placeholder="Select destination warehouse"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              type="number"
              label="Quantity to Transfer"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              inputProps={{
                min: 1,
                max: stock?.quantityAvailable || 0,
              }}
              helperText={`Max available: ${stock?.quantityAvailable || 0} units`}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Branch replenishment, Warehouse consolidation"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isFormValid() || loading}>
          {loading ? <CircularProgress size={24} /> : "Transfer Stock"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockTransferDialog;
