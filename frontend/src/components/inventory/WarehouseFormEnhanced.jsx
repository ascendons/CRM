import React, { useEffect } from "react";
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
  Typography,
} from "@mui/material";
import { CheckCircle as SuccessIcon } from "@mui/icons-material";
import inventoryApi from "../../services/inventoryApi";
import useFormValidation from "../../hooks/useFormValidation";
import { required, minLength, maxLength, pattern, compose } from "../../utils/validation";

const WAREHOUSE_TYPES = ["MAIN", "BRANCH", "VIRTUAL", "TRANSIT"];

// Validation rules for warehouse form
const validationRules = {
  name: compose(required, minLength(2), maxLength(100)),
  code: compose(
    minLength(2),
    maxLength(20),
    pattern(/^[A-Z0-9-]*$/, "Code must contain only uppercase letters, numbers, and hyphens")
  ),
  type: required,
  "address.line1": compose(required, minLength(5), maxLength(200)),
  "address.city": compose(required, minLength(2), maxLength(100)),
  "address.state": compose(required, minLength(2), maxLength(100)),
  "address.postalCode": compose(required, minLength(3), maxLength(20)),
  "address.country": compose(required, minLength(2), maxLength(100)),
};

const WarehouseFormEnhanced = ({ open, warehouse, onClose }) => {
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);

  const initialValues = {
    code: "",
    name: "",
    type: "MAIN",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      landmark: "",
    },
    managerId: "",
    managerName: "",
    isActive: true,
    isDefault: false,
  };

  const handleFormSubmit = async (formData) => {
    try {
      setError(null);
      setSuccess(false);

      if (warehouse) {
        // Update existing warehouse
        await inventoryApi.warehouses.update(warehouse.id, formData);
      } else {
        // Create new warehouse
        await inventoryApi.warehouses.create(formData);
      }

      setSuccess(true);

      // Close after short delay to show success message
      setTimeout(() => {
        onClose(true);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save warehouse");
      throw err; // Re-throw to stop form submission
    }
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleNestedChange,
    handleBlur,
    handleSubmit,
    setFormValues,
    hasError,
    getError,
  } = useFormValidation(initialValues, validationRules, handleFormSubmit);

  // Load warehouse data when editing
  useEffect(() => {
    if (warehouse && open) {
      setFormValues({
        code: warehouse.code || "",
        name: warehouse.name || "",
        type: warehouse.type || "MAIN",
        address: warehouse.address || {
          line1: "",
          line2: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
          landmark: "",
        },
        managerId: warehouse.managerId || "",
        managerName: warehouse.managerName || "",
        isActive: warehouse.isActive ?? true,
        isDefault: warehouse.isDefault ?? false,
      });
    }
    setError(null);
    setSuccess(false);
  }, [warehouse, open, setFormValues]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isSubmitting}
    >
      <DialogTitle>{warehouse ? "Edit Warehouse" : "Create New Warehouse"}</DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<SuccessIcon />}>
              Warehouse {warehouse ? "updated" : "created"} successfully!
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="code"
                label="Warehouse Code"
                value={values.code}
                onChange={handleChange}
                onBlur={handleBlur}
                error={hasError("code")}
                helperText={
                  getError("code") ||
                  "Auto-generated if empty. Use uppercase letters, numbers, and hyphens only."
                }
                placeholder="WH-001"
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="name"
                label="Warehouse Name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={hasError("name")}
                helperText={getError("name") || "Descriptive name for the warehouse"}
                placeholder="Main Distribution Center"
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                select
                name="type"
                label="Warehouse Type"
                value={values.type}
                onChange={handleChange}
                onBlur={handleBlur}
                error={hasError("type")}
                helperText={getError("type") || "Select the type of warehouse"}
                disabled={isSubmitting}
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
                name="managerName"
                label="Manager Name"
                value={values.managerName}
                onChange={handleChange}
                onBlur={handleBlur}
                helperText="Name of warehouse manager (optional)"
                placeholder="John Doe"
                disabled={isSubmitting}
              />
            </Grid>

            {/* Address Section */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Address Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      name="address.line1"
                      label="Address Line 1"
                      value={values.address.line1}
                      onChange={handleNestedChange("address.line1")}
                      onBlur={handleBlur}
                      error={hasError("address.line1")}
                      helperText={getError("address.line1") || "Street address, P.O. box"}
                      placeholder="123 Main Street"
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="address.line2"
                      label="Address Line 2"
                      value={values.address.line2}
                      onChange={handleNestedChange("address.line2")}
                      helperText="Apartment, suite, unit, building, floor (optional)"
                      placeholder="Suite 100"
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      name="address.city"
                      label="City"
                      value={values.address.city}
                      onChange={handleNestedChange("address.city")}
                      onBlur={handleBlur}
                      error={hasError("address.city")}
                      helperText={getError("address.city")}
                      placeholder="New York"
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      name="address.state"
                      label="State / Province"
                      value={values.address.state}
                      onChange={handleNestedChange("address.state")}
                      onBlur={handleBlur}
                      error={hasError("address.state")}
                      helperText={getError("address.state")}
                      placeholder="NY"
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      name="address.country"
                      label="Country"
                      value={values.address.country}
                      onChange={handleNestedChange("address.country")}
                      onBlur={handleBlur}
                      error={hasError("address.country")}
                      helperText={getError("address.country")}
                      placeholder="United States"
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      name="address.postalCode"
                      label="Postal / ZIP Code"
                      value={values.address.postalCode}
                      onChange={handleNestedChange("address.postalCode")}
                      onBlur={handleBlur}
                      error={hasError("address.postalCode")}
                      helperText={getError("address.postalCode")}
                      placeholder="10001"
                      disabled={isSubmitting}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="address.landmark"
                      label="Landmark"
                      value={values.address.landmark}
                      onChange={handleNestedChange("address.landmark")}
                      helperText="Nearby landmark for easier location (optional)"
                      placeholder="Near Central Park"
                      disabled={isSubmitting}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Status Section */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status Settings
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isActive"
                    checked={values.isActive}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                }
                label="Active Warehouse"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Inactive warehouses cannot receive or dispatch stock
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isDefault"
                    checked={values.isDefault}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                }
                label="Set as Default Warehouse"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Default warehouse for new stock entries
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={20} />}
          >
            {isSubmitting ? "Saving..." : warehouse ? "Update Warehouse" : "Create Warehouse"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default WarehouseFormEnhanced;
