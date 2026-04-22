import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import inventoryApi from "../../services/inventoryApi";

const REFERENCE_TYPES = ["QUOTE", "PROPOSAL", "ORDER", "MANUAL"];

const CreateReservationDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    productId: "",
    warehouseId: "",
    quantity: "",
    referenceType: "QUOTE",
    referenceId: "",
    referenceNumber: "",
    expiryDays: 7,
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
      setWarehouses(response.data || []);
    } catch (err) {
      console.error("Failed to load warehouses:", err);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      await inventoryApi.reservations.create({
        ...formData,
        quantity: parseInt(formData.quantity),
        expiryDays: parseInt(formData.expiryDays),
      });

      // Reset form
      setFormData({
        productId: "",
        warehouseId: "",
        quantity: "",
        referenceType: "QUOTE",
        referenceId: "",
        referenceNumber: "",
        expiryDays: 7,
        notes: "",
      });

      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create reservation");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.productId &&
      formData.warehouseId &&
      formData.quantity &&
      parseInt(formData.quantity) > 0 &&
      formData.referenceType &&
      formData.referenceId
    );
  };

  const handleClose = () => {
    setFormData({
      productId: "",
      warehouseId: "",
      quantity: "",
      referenceType: "QUOTE",
      referenceId: "",
      referenceNumber: "",
      expiryDays: 7,
      notes: "",
    });
    setError(null);
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Stock Reservation</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Product and Warehouse */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Product ID"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              placeholder="Enter product ID"
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={warehouses}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={warehouses.find((w) => w.id === formData.warehouseId) || null}
              onChange={(e, newValue) =>
                setFormData({ ...formData, warehouseId: newValue?.id || "" })
              }
              renderInput={(params) => (
                <TextField {...params} required label="Warehouse" placeholder="Select warehouse" />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Expiry Days"
              value={formData.expiryDays}
              onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
              inputProps={{ min: 1, max: 90 }}
              helperText="Auto-release after days"
            />
          </Grid>

          {/* Reference Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label="Reference Type"
              value={formData.referenceType}
              onChange={(e) => setFormData({ ...formData, referenceType: e.target.value })}
            >
              {REFERENCE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Reference ID"
              value={formData.referenceId}
              onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
              placeholder="Quote/Proposal/Order ID"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reference Number (Optional)"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="e.g., QT-2024-001"
            />
          </Grid>

          {/* Notes */}
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
          {loading ? <CircularProgress size={24} /> : "Create Reservation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateReservationDialog;
