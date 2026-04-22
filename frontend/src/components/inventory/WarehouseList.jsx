import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Warehouse as WarehouseIcon,
} from "@mui/icons-material";
import inventoryApi from "../../services/inventoryApi";
import WarehouseForm from "./WarehouseForm";
import StorageLocationDialog from "./StorageLocationDialog";

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [openForm, setOpenForm] = useState(false);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);

  useEffect(() => {
    fetchWarehouses();
  }, [page, rowsPerPage]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.warehouses.getAll({
        page,
        size: rowsPerPage,
        sort: "createdAt,desc",
      });

      setWarehouses(response.data.content || []);
      setTotalCount(response.data.totalElements || 0);
    } catch (err) {
      setError("Failed to load warehouses: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedWarehouse(null);
    setOpenForm(true);
  };

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setOpenForm(true);
  };

  const handleDelete = (warehouse) => {
    setWarehouseToDelete(warehouse);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await inventoryApi.warehouses.delete(warehouseToDelete.id);
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
      fetchWarehouses();
    } catch (err) {
      setError("Failed to delete warehouse: " + err.message);
      setDeleteDialogOpen(false);
    }
  };

  const handleManageLocations = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setOpenLocationDialog(true);
  };

  const handleFormClose = (saved) => {
    setOpenForm(false);
    setSelectedWarehouse(null);
    if (saved) {
      fetchWarehouses();
    }
  };

  const handleLocationDialogClose = () => {
    setOpenLocationDialog(false);
    setSelectedWarehouse(null);
    fetchWarehouses();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
        <Box display="flex" alignItems="center" gap={1}>
          <WarehouseIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Warehouse Management
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Add Warehouse
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Storage Locations</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {warehouse.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {warehouse.isDefault && <Chip label="Default" color="primary" size="small" />}
                      <Typography variant="body2">{warehouse.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={warehouse.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {warehouse.address?.city}, {warehouse.address?.state}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{warehouse.managerName || "-"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={warehouse.locations?.length || 0}
                      size="small"
                      icon={<LocationIcon />}
                      onClick={() => handleManageLocations(warehouse)}
                      clickable
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={warehouse.isActive ? "Active" : "Inactive"}
                      color={warehouse.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(warehouse)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Manage Locations">
                      <IconButton size="small" onClick={() => handleManageLocations(warehouse)}>
                        <LocationIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(warehouse)}
                        disabled={warehouse.isDefault}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {warehouses.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No warehouses found. Click "Add Warehouse" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Warehouse Form Dialog */}
      <WarehouseForm open={openForm} warehouse={selectedWarehouse} onClose={handleFormClose} />

      {/* Storage Location Dialog */}
      {selectedWarehouse && (
        <StorageLocationDialog
          open={openLocationDialog}
          warehouse={selectedWarehouse}
          onClose={handleLocationDialogClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete warehouse "{warehouseToDelete?.name}"? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarehouseList;
