import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import inventoryApi from '../../services/inventoryApi';

/**
 * Dialog for editing stock unit cost directly
 * Used when price adjustments are needed without stock movement
 */
const EditStockDialog = ({ open, onClose, stock, onSuccess }) => {
  const [formData, setFormData] = useState({
    unitCost: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && stock) {
      setFormData({
        unitCost: stock.unitCost?.toString() || '0',
        reason: '',
      });
      setError('');
    }
  }, [open, stock]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.unitCost || isNaN(parseFloat(formData.unitCost))) {
      setError('Please enter a valid unit cost');
      return;
    }

    const unitCost = parseFloat(formData.unitCost);
    if (unitCost < 0) {
      setError('Unit cost cannot be negative');
      return;
    }

    setLoading(true);

    try {
      await inventoryApi.stock.updateUnitCost(
        stock.productId,
        stock.warehouseId,
        unitCost,
        formData.reason || 'Price adjustment'
      );

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to update unit cost:', err);
      setError(err.response?.data?.message || 'Failed to update unit cost');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!stock) return null;

  const currentValue = stock.unitCost || 0;
  const newValue = parseFloat(formData.unitCost) || 0;
  const difference = newValue - currentValue;
  const percentageChange = currentValue > 0 ? ((difference / currentValue) * 100).toFixed(2) : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Edit Unit Cost
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Update pricing without changing stock quantity
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Product ID
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stock.productId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Warehouse ID
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stock.warehouseId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Current Stock
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stock.quantityOnHand} units
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Current Unit Cost
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${currentValue.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="number"
                label="New Unit Cost"
                value={formData.unitCost}
                onChange={(e) =>
                  setFormData({ ...formData, unitCost: e.target.value })
                }
                inputProps={{ step: '0.01', min: 0 }}
                helperText="Enter the new selling price per unit"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason (Optional)"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                multiline
                rows={2}
                placeholder="e.g., Promotional discount, Market adjustment, Clearance sale"
              />
            </Grid>
          </Grid>

          {/* Price change summary */}
          {formData.unitCost && !isNaN(parseFloat(formData.unitCost)) && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: difference < 0 ? 'error.lighter' : 'success.lighter',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Price Change Summary
              </Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Current:
                  </Typography>
                  <Typography variant="body2">${currentValue.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    New:
                  </Typography>
                  <Typography variant="body2">${newValue.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Difference:
                  </Typography>
                  <Typography
                    variant="body2"
                    color={difference < 0 ? 'error.main' : 'success.main'}
                  >
                    {difference >= 0 ? '+' : ''}${difference.toFixed(2)} ({percentageChange}%)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    New Total Value:
                  </Typography>
                  <Typography variant="body2">
                    ${(newValue * stock.quantityOnHand).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            💡 This will update the unit cost and automatically sync the price to the catalog
            (UnitPrice attribute). No stock quantity will be changed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.unitCost}
          >
            {loading ? 'Updating...' : 'Update Unit Cost'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditStockDialog;
