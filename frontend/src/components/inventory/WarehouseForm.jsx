import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import inventoryApi from '../../services/inventoryApi';

const WAREHOUSE_TYPES = ['MAIN', 'BRANCH', 'VIRTUAL', 'TRANSIT'];

const WarehouseForm = ({ open, warehouse, onClose }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'MAIN',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      landmark: '',
    },
    managerId: '',
    managerName: '',
    isActive: true,
    isDefault: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (warehouse) {
      setFormData({
        code: warehouse.code || '',
        name: warehouse.name || '',
        type: warehouse.type || 'MAIN',
        address: warehouse.address || {
          line1: '',
          line2: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          landmark: '',
        },
        managerId: warehouse.managerId || '',
        managerName: warehouse.managerName || '',
        isActive: warehouse.isActive ?? true,
        isDefault: warehouse.isDefault ?? false,
      });
    } else {
      // Reset form for new warehouse
      setFormData({
        code: '',
        name: '',
        type: 'MAIN',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          landmark: '',
        },
        managerId: '',
        managerName: '',
        isActive: true,
        isDefault: false,
      });
    }
    setError(null);
  }, [warehouse, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (warehouse) {
        // Update existing warehouse
        await inventoryApi.warehouses.update(warehouse.id, formData);
      } else {
        // Create new warehouse
        await inventoryApi.warehouses.create(formData);
      }

      onClose(true); // Pass true to indicate save was successful
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name &&
      formData.type &&
      formData.address.line1 &&
      formData.address.city &&
      formData.address.state &&
      formData.address.country &&
      formData.address.postalCode
    );
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {warehouse ? 'Edit Warehouse' : 'Create New Warehouse'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Warehouse Code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Auto-generated if empty"
              helperText="Leave empty for auto-generation"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Warehouse Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label="Type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {WAREHOUSE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manager Name"
              value={formData.managerName}
              onChange={(e) => handleChange('managerName', e.target.value)}
            />
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Address Line 1"
                    value={formData.address.line1}
                    onChange={(e) => handleAddressChange('line1', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    value={formData.address.line2}
                    onChange={(e) => handleAddressChange('line2', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="City"
                    value={formData.address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="State"
                    value={formData.address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Country"
                    value={formData.address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Postal Code"
                    value={formData.address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Landmark"
                    value={formData.address.landmark}
                    onChange={(e) => handleAddressChange('landmark', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Status */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
              }
              label="Active"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) => handleChange('isDefault', e.target.checked)}
                />
              }
              label="Set as Default Warehouse"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid() || loading}
        >
          {loading ? <CircularProgress size={24} /> : warehouse ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarehouseForm;
