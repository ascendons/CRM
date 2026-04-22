import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  TablePagination,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
  CheckCircle as DefaultIcon,
} from "@mui/icons-material";
import inventoryApi from "../../services/inventoryApi";
import WarehouseFormEnhanced from "./WarehouseFormEnhanced";
import StorageLocationDialog from "./StorageLocationDialog";
import ConfirmationDialog from "../common/ConfirmationDialog";

/**
 * Enhanced Warehouse List with Confirmation Dialogs
 * Demonstrates usage of ConfirmationDialog for destructive actions
 */
const WarehouseListWithConfirmation = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [storageDialogOpen, setStorageDialogOpen] = useState(false);

  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  const [defaultConfirmOpen, setDefaultConfirmOpen] = useState(false);
  const [warehouseToSetDefault, setWarehouseToSetDefault] = useState(null);

  // Context menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuWarehouse, setMenuWarehouse] = useState(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.warehouses.getAll();
      setWarehouses(response.data || []);
    } catch (err) {
      setError("Failed to load warehouses: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, warehouse) => {
    setAnchorEl(event.currentTarget);
    setMenuWarehouse(warehouse);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuWarehouse(null);
  };

  const handleAdd = () => {
    setSelectedWarehouse(null);
    setFormOpen(true);
  };

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = (warehouse) => {
    setWarehouseToDelete(warehouse);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await inventoryApi.warehouses.delete(warehouseToDelete.id);
      await fetchWarehouses();
      setDeleteConfirmOpen(false);
      setWarehouseToDelete(null);
    } catch (err) {
      setError(`Failed to delete warehouse: ${err.message}`);
      setDeleteConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultClick = (warehouse) => {
    setWarehouseToSetDefault(warehouse);
    setDefaultConfirmOpen(true);
    handleMenuClose();
  };

  const handleSetDefaultConfirm = async () => {
    try {
      setLoading(true);
      await inventoryApi.warehouses.setDefault(warehouseToSetDefault.id);
      await fetchWarehouses();
      setDefaultConfirmOpen(false);
      setWarehouseToSetDefault(null);
    } catch (err) {
      setError(`Failed to set default warehouse: ${err.message}`);
      setDefaultConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStorageLocations = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setStorageDialogOpen(true);
    handleMenuClose();
  };

  const handleFormClose = (saved) => {
    setFormOpen(false);
    setSelectedWarehouse(null);
    if (saved) {
      fetchWarehouses();
    }
  };

  const handleStorageDialogClose = () => {
    setStorageDialogOpen(false);
    setSelectedWarehouse(null);
  };

  // Filter and pagination
  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedWarehouses = filteredWarehouses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && warehouses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Warehouses
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={loading}>
          Add Warehouse
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Search warehouses by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedWarehouses.map((warehouse) => (
              <TableRow key={warehouse.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {warehouse.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{warehouse.name}</Typography>
                    {warehouse.isDefault && (
                      <Chip
                        label="Default"
                        size="small"
                        color="primary"
                        sx={{ mt: 0.5, height: 20 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{warehouse.type}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {warehouse.address?.city}, {warehouse.address?.state}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {warehouse.address?.country}
                  </Typography>
                </TableCell>
                <TableCell>{warehouse.managerName || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={warehouse.isActive ? "Active" : "Inactive"}
                    color={warehouse.isActive ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, warehouse)}
                    disabled={loading}
                  >
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredWarehouses.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleEdit(menuWarehouse)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleStorageLocations(menuWarehouse)}>
          <ListItemIcon>
            <StorageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Storage Locations</ListItemText>
        </MenuItem>

        {!menuWarehouse?.isDefault && (
          <MenuItem onClick={() => handleSetDefaultClick(menuWarehouse)}>
            <ListItemIcon>
              <DefaultIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Set as Default</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => handleDeleteClick(menuWarehouse)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Warehouse Form Dialog */}
      <WarehouseFormEnhanced
        open={formOpen}
        warehouse={selectedWarehouse}
        onClose={handleFormClose}
      />

      {/* Storage Location Dialog */}
      {selectedWarehouse && (
        <StorageLocationDialog
          open={storageDialogOpen}
          warehouse={selectedWarehouse}
          onClose={handleStorageDialogClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Warehouse"
        message={`Are you sure you want to delete warehouse "${warehouseToDelete?.name}"?`}
        details="This action cannot be undone. All associated storage locations will also be deleted. Any stock in this warehouse will become orphaned."
        confirmText="Delete Warehouse"
        cancelText="Cancel"
        severity="error"
        loading={loading}
      />

      {/* Set Default Confirmation Dialog */}
      <ConfirmationDialog
        open={defaultConfirmOpen}
        onClose={() => setDefaultConfirmOpen(false)}
        onConfirm={handleSetDefaultConfirm}
        title="Set Default Warehouse"
        message={`Set "${warehouseToSetDefault?.name}" as the default warehouse?`}
        details="The current default warehouse will be replaced. New stock entries will automatically use this warehouse unless specified otherwise."
        confirmText="Set as Default"
        cancelText="Cancel"
        severity="question"
        confirmColor="primary"
        loading={loading}
      />
    </Box>
  );
};

export default WarehouseListWithConfirmation;
