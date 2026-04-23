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
  Box,
  Typography,
  Divider,
} from "@mui/material";
import inventoryApi from "../../services/inventoryApi";

const BatchForm = ({ open, batch, onClose }) => {
  const [formData, setFormData] = useState({
    productId: "",
    warehouseId: "",
    batchNumber: "",
    manufacturingDate: null,
    expiryDate: null,
    quantity: "",
    supplierId: "",
    supplierName: "",
    qcStatus: "",
    qcNotes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (batch) {
      setFormData({
        productId: batch.productId || "",
        warehouseId: batch.warehouseId || "",
        batchNumber: batch.batchNumber || "",
        manufacturingDate: batch.manufacturingDate ? new Date(batch.manufacturingDate) : null,
        expiryDate: batch.expiryDate ? new Date(batch.expiryDate) : null,
        quantity: batch.quantity || "",
        supplierId: batch.supplierId || "",
        supplierName: batch.supplierName || "",
        qcStatus: batch.qcStatus || "",
        qcNotes: batch.qcNotes || "",
      });
    } else {
      // Reset for new batch
      setFormData({
        productId: "",
        warehouseId: "",
        batchNumber: "",
        manufacturingDate: null,
        expiryDate: null,
        quantity: "",
        supplierId: "",
        supplierName: "",
        qcStatus: "",
        qcNotes: "",
      });
    }
    setError(null);
  }, [batch, open]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        manufacturingDate: formData.manufacturingDate
          ? formData.manufacturingDate.toISOString().split("T")[0]
          : null,
        expiryDate: formData.expiryDate ? formData.expiryDate.toISOString().split("T")[0] : null,
      };

      if (batch) {
        // Update existing batch (if update endpoint exists)
        // await inventoryApi.batches.update(batch.id, payload);
        console.log("Update not implemented yet");
      } else {
        // Create new batch
        await inventoryApi.batches.create(payload);
      }

      onClose(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save batch");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.productId && formData.warehouseId && formData.batchNumber && formData.expiryDate
    );
  };

  const handleClose = () => {
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{batch ? "Batch Details" : "Create New Batch"}</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {batch && (
          <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1, mb: 3 }}>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {batch.status}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Quantity
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {batch.quantity}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  Available
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {batch.quantityAvailable}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <Grid container spacing={2}>
          {/* Basic Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Product ID"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              disabled={!!batch}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Warehouse ID"
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              disabled={!!batch}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Batch Number"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              disabled={!!batch}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              disabled={!!batch}
            />
          </Grid>

          {/* Dates */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Manufacturing Date"
              value={
                formData.manufacturingDate
                  ? new Date(formData.manufacturingDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  manufacturingDate: e.target.value ? new Date(e.target.value) : null,
                })
              }
              disabled={!!batch}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="date"
              label="Expiry Date"
              value={
                formData.expiryDate ? new Date(formData.expiryDate).toISOString().split("T")[0] : ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  expiryDate: e.target.value ? new Date(e.target.value) : null,
                })
              }
              disabled={!!batch}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Supplier Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Supplier ID"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Supplier Name"
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            />
          </Grid>

          {/* QC Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="QC Status"
              value={formData.qcStatus}
              onChange={(e) => setFormData({ ...formData, qcStatus: e.target.value })}
              placeholder="e.g., PASSED, PENDING"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="QC Notes"
              value={formData.qcNotes}
              onChange={(e) => setFormData({ ...formData, qcNotes: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {batch ? "Close" : "Cancel"}
        </Button>
        {!batch && (
          <Button onClick={handleSubmit} variant="contained" disabled={!isFormValid() || loading}>
            {loading ? <CircularProgress size={24} /> : "Create Batch"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchForm;
