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
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  CheckCircle as FulfillIcon,
  Cancel as CancelIcon,
  Schedule as ExtendIcon,
  Bookmark as ReservationIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import inventoryApi from "../../services/inventoryApi";
import { format, formatDistanceToNow } from "date-fns";
import CreateReservationDialog from "./CreateReservationDialog";

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [extendDays, setExtendDays] = useState(7);

  // Stats
  const [activeCount, setActiveCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);

  useEffect(() => {
    fetchReservations();
  }, [filterStatus]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventoryApi.reservations.getActive();
      const allReservations = response.data || [];

      // Filter by status
      let filtered = allReservations;
      if (filterStatus !== "ALL") {
        filtered = allReservations.filter((r) => r.status === filterStatus);
      }

      setReservations(filtered);
      setActiveCount(allReservations.filter((r) => r.status === "ACTIVE").length);

      // Count expiring soon (within 24 hours)
      const now = new Date();
      const expiringThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setExpiringCount(
        allReservations.filter(
          (r) => r.status === "ACTIVE" && r.expiresAt && new Date(r.expiresAt) <= expiringThreshold
        ).length
      );
    } catch (err) {
      setError("Failed to load reservations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, reservation) => {
    setAnchorEl(event.currentTarget);
    setSelectedReservation(reservation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFulfill = async () => {
    try {
      await inventoryApi.reservations.fulfill(selectedReservation.id);
      handleMenuClose();
      fetchReservations();
    } catch (err) {
      setError("Failed to fulfill reservation: " + err.message);
    }
  };

  const handleRelease = async () => {
    try {
      await inventoryApi.reservations.release(selectedReservation.id);
      handleMenuClose();
      fetchReservations();
    } catch (err) {
      setError("Failed to release reservation: " + err.message);
    }
  };

  const handleCancel = async () => {
    try {
      await inventoryApi.reservations.cancel(selectedReservation.id, cancelReason);
      setCancelDialogOpen(false);
      setCancelReason("");
      handleMenuClose();
      fetchReservations();
    } catch (err) {
      setError("Failed to cancel reservation: " + err.message);
    }
  };

  const handleExtend = async () => {
    try {
      await inventoryApi.reservations.extend(selectedReservation.id, extendDays);
      setExtendDialogOpen(false);
      setExtendDays(7);
      handleMenuClose();
      fetchReservations();
    } catch (err) {
      setError("Failed to extend reservation: " + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "success",
      FULFILLED: "info",
      EXPIRED: "error",
      CANCELLED: "default",
      RELEASED: "warning",
    };
    return colors[status] || "default";
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
    return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
  };

  if (loading && reservations.length === 0) {
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
          <ReservationIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Stock Reservations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Reservation
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Active Reservations
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              {activeCount}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 2, borderLeft: 4, borderColor: "warning.main" }}>
            <Typography variant="body2" color="text.secondary">
              Expiring Soon (24h)
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="warning.main">
              {expiringCount}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2, p: 2 }}>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant={filterStatus === "ACTIVE" ? "contained" : "outlined"}
            onClick={() => setFilterStatus("ACTIVE")}
          >
            Active
          </Button>
          <Button
            size="small"
            variant={filterStatus === "FULFILLED" ? "contained" : "outlined"}
            onClick={() => setFilterStatus("FULFILLED")}
          >
            Fulfilled
          </Button>
          <Button
            size="small"
            variant={filterStatus === "EXPIRED" ? "contained" : "outlined"}
            onClick={() => setFilterStatus("EXPIRED")}
          >
            Expired
          </Button>
          <Button
            size="small"
            variant={filterStatus === "CANCELLED" ? "contained" : "outlined"}
            onClick={() => setFilterStatus("CANCELLED")}
          >
            Cancelled
          </Button>
          <Button
            size="small"
            variant={filterStatus === "ALL" ? "contained" : "outlined"}
            onClick={() => setFilterStatus("ALL")}
          >
            All
          </Button>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product ID</TableCell>
                <TableCell>Warehouse ID</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {reservation.productId}
                    </Typography>
                  </TableCell>
                  <TableCell>{reservation.warehouseId}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {reservation.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{reservation.referenceType}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reservation.referenceNumber || reservation.referenceId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {reservation.createdAt
                        ? formatDistanceToNow(new Date(reservation.createdAt), {
                            addSuffix: true,
                          })
                        : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {reservation.expiresAt ? (
                      <Box>
                        <Typography
                          variant="caption"
                          color={
                            isExpiringSoon(reservation.expiresAt)
                              ? "warning.main"
                              : "text.secondary"
                          }
                        >
                          {formatDistanceToNow(new Date(reservation.expiresAt), {
                            addSuffix: true,
                          })}
                        </Typography>
                        {isExpiringSoon(reservation.expiresAt) && (
                          <Chip label="Expiring Soon" color="warning" size="small" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={reservation.status}
                      color={getStatusColor(reservation.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, reservation)}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {reservations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No reservations found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => console.log("View details")}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>

        {selectedReservation?.status === "ACTIVE" && (
          <>
            <MenuItem onClick={handleFulfill}>
              <FulfillIcon sx={{ mr: 1 }} fontSize="small" />
              Fulfill
            </MenuItem>
            <MenuItem onClick={handleRelease}>
              <CancelIcon sx={{ mr: 1 }} fontSize="small" />
              Release
            </MenuItem>
            <MenuItem
              onClick={() => {
                setExtendDialogOpen(true);
                handleMenuClose();
              }}
            >
              <ExtendIcon sx={{ mr: 1 }} fontSize="small" />
              Extend Expiry
            </MenuItem>
            <MenuItem
              onClick={() => {
                setCancelDialogOpen(true);
                handleMenuClose();
              }}
            >
              <CancelIcon sx={{ mr: 1 }} fontSize="small" color="error" />
              Cancel
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Create Reservation Dialog */}
      <CreateReservationDialog
        open={createDialogOpen}
        onClose={(created) => {
          setCreateDialogOpen(false);
          if (created) fetchReservations();
        }}
      />

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Close</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={!cancelReason}>
            Cancel Reservation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={extendDialogOpen} onClose={() => setExtendDialogOpen(false)}>
        <DialogTitle>Extend Reservation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Additional Days"
            value={extendDays}
            onChange={(e) => setExtendDays(parseInt(e.target.value))}
            inputProps={{ min: 1, max: 90 }}
            sx={{ mt: 2 }}
            helperText="Extend reservation by how many days?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtendDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExtend} variant="contained">
            Extend
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationList;
