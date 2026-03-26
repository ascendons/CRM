import React, { useState } from 'react';
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
  Typography,
  Box,
  Divider,
} from '@mui/material';
import inventoryApi from '../../services/inventoryApi';

const StockAdjustDialog = ({ open, stock, onClose }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    direction: 'IN',
    reason: '',
    unitCost: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      await inventoryApi.stock.adjust({
        productId: stock.productId,
        warehouseId: stock.warehouseId,
        quantity: parseInt(formData.quantity),
        direction: formData.direction,
        reason: formData.reason,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
        notes: formData.notes,
      });

      onClose(true); // Refresh parent
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.quantity &&
      parseInt(formData.quantity) > 0 &&
      formData.direction &&
      formData.reason
    );
  };

  const handleClose = () => {
    setFormData({
      quantity: '',
      direction: 'IN',
      reason: '',
      unitCost: '',
      notes: '',
    });
    setError(null);
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adjust Stock</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stock Info */}
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 3 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Product ID
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {stock?.productId}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Warehouse ID
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {stock?.warehouseId}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                On Hand
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {stock?.quantityOnHand}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Reserved
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {stock?.quantityReserved}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">
                Available
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {stock?.quantityAvailable}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Adjustment Form */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label="Direction"
              value={formData.direction}
              onChange={(e) =>
                setFormData({ ...formData, direction: e.target.value })
              }
            >
              <MenuItem value="IN">Stock IN (Increase)</MenuItem>
              <MenuItem value="OUT">Stock OUT (Decrease)</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Quantity"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="e.g., Purchase receipt, Damaged goods, Correction"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Unit Cost (Optional)"
              value={formData.unitCost}
              onChange={(e) =>
                setFormData({ ...formData, unitCost: e.target.value })
              }
              inputProps={{ step: '0.01', min: 0 }}
              helperText="For stock IN, provide cost for weighted average calculation"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
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
          disabled={!isFormValid() || loading}
          color={formData.direction === 'IN' ? 'success' : 'error'}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : formData.direction === 'IN' ? (
            'Add Stock'
          ) : (
            'Remove Stock'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockAdjustDialog;
