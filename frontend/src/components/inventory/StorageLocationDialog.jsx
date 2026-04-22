import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Divider,
  Alert,
  MenuItem,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import inventoryApi from "../../services/inventoryApi";

const LOCATION_TYPES = ["BIN", "PALLET", "SHELF", "FLOOR", "RACK"];

const StorageLocationDialog = ({ open, warehouse, onClose }) => {
  const [newLocation, setNewLocation] = useState({
    code: "",
    name: "",
    type: "BIN",
    capacity: "",
    isActive: true,
  });
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const handleAddLocation = async () => {
    try {
      setError(null);
      setAdding(true);

      const locationData = {
        ...newLocation,
        capacity: newLocation.capacity ? parseInt(newLocation.capacity) : null,
      };

      await inventoryApi.warehouses.addLocation(warehouse.id, locationData);

      // Reset form
      setNewLocation({
        code: "",
        name: "",
        type: "BIN",
        capacity: "",
        isActive: true,
      });

      // Refresh the dialog by closing and reopening
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add location");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      setError(null);
      await inventoryApi.warehouses.removeLocation(warehouse.id, locationId);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove location");
    }
  };

  const isFormValid = () => {
    return newLocation.name && newLocation.type;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Storage Locations - {warehouse?.name}</Typography>
          <Chip
            label={`${warehouse?.locations?.length || 0} Locations`}
            color="primary"
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Add New Location Form */}
        <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add New Location
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Code"
                placeholder="e.g., A-01-01"
                value={newLocation.code}
                onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                size="small"
                label="Name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                select
                size="small"
                label="Type"
                value={newLocation.type}
                onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
              >
                {LOCATION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Capacity"
                type="number"
                placeholder="Max units"
                value={newLocation.capacity}
                onChange={(e) => setNewLocation({ ...newLocation, capacity: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddLocation}
                disabled={!isFormValid() || adding}
                fullWidth
              >
                Add Location
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Existing Locations List */}
        <Typography variant="subtitle2" gutterBottom>
          Existing Locations
        </Typography>

        {warehouse?.locations?.length > 0 ? (
          <List>
            {warehouse.locations.map((location) => (
              <ListItem
                key={location.id}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1" fontWeight="medium">
                        {location.name}
                      </Typography>
                      {location.code && (
                        <Chip label={location.code} size="small" variant="outlined" />
                      )}
                      <Chip label={location.type} size="small" color="primary" />
                      {!location.isActive && <Chip label="Inactive" size="small" color="default" />}
                    </Box>
                  }
                  secondary={
                    location.capacity ? `Capacity: ${location.capacity} units` : "No capacity limit"
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteLocation(location.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              color: "text.secondary",
            }}
          >
            <Typography variant="body2">
              No storage locations yet. Add one using the form above.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StorageLocationDialog;
