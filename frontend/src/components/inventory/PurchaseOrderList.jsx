import React, { useState, useEffect } from 'react';
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
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Inventory as ReceiveIcon,
  Description as POIcon,
} from '@mui/icons-material';
import inventoryApi from '../../services/inventoryApi';
import { format } from 'date-fns';

const PurchaseOrderList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, [page, rowsPerPage]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.purchaseOrders.getAll({
        page,
        size: rowsPerPage,
        sort: 'createdAt,desc',
      });

      setPurchaseOrders(response.data.content || []);
      setTotalCount(response.data.totalElements || 0);
    } catch (err) {
      setError('Failed to load purchase orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, po) => {
    setAnchorEl(event.currentTarget);
    setSelectedPO(po);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSubmitForApproval = async () => {
    try {
      await inventoryApi.purchaseOrders.submit(selectedPO.id);
      handleMenuClose();
      fetchPurchaseOrders();
    } catch (err) {
      setError('Failed to submit PO: ' + err.message);
    }
  };

  const handleApprovePO = async () => {
    try {
      await inventoryApi.purchaseOrders.approve(selectedPO.id);
      handleMenuClose();
      fetchPurchaseOrders();
    } catch (err) {
      setError('Failed to approve PO: ' + err.message);
    }
  };

  const handleRejectPO = async () => {
    try {
      await inventoryApi.purchaseOrders.reject(selectedPO.id, reason);
      setRejectDialogOpen(false);
      setReason('');
      handleMenuClose();
      fetchPurchaseOrders();
    } catch (err) {
      setError('Failed to reject PO: ' + err.message);
    }
  };

  const handleCancelPO = async () => {
    try {
      await inventoryApi.purchaseOrders.cancel(selectedPO.id, reason);
      setCancelDialogOpen(false);
      setReason('');
      handleMenuClose();
      fetchPurchaseOrders();
    } catch (err) {
      setError('Failed to cancel PO: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      APPROVED: 'success',
      RECEIVING: 'warning',
      RECEIVED: 'success',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  if (loading && purchaseOrders.length === 0) {
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
          <POIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Purchase Orders
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => console.log('Create PO')}
        >
          Create PO
        </Button>
      </Box>

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
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Expected Delivery</TableCell>
                <TableCell align="right">Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {po.poNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{po.supplierName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {po.supplierContact}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{po.warehouseName}</Typography>
                  </TableCell>
                  <TableCell>
                    {po.orderDate ? format(new Date(po.orderDate), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {po.expectedDeliveryDate
                      ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      ${po.totalAmount?.toFixed(2) || '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={po.status}
                      color={getStatusColor(po.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, po)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {purchaseOrders.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No purchase orders found. Click "Create PO" to create one.
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
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => console.log('View PO')}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>

        {selectedPO?.status === 'DRAFT' && (
          <MenuItem onClick={handleSubmitForApproval}>
            <ApproveIcon sx={{ mr: 1 }} fontSize="small" />
            Submit for Approval
          </MenuItem>
        )}

        {selectedPO?.status === 'SUBMITTED' && (
          <>
            <MenuItem onClick={handleApprovePO}>
              <ApproveIcon sx={{ mr: 1 }} fontSize="small" />
              Approve
            </MenuItem>
            <MenuItem onClick={() => {
              setRejectDialogOpen(true);
              handleMenuClose();
            }}>
              <RejectIcon sx={{ mr: 1 }} fontSize="small" />
              Reject
            </MenuItem>
          </>
        )}

        {(selectedPO?.status === 'APPROVED' || selectedPO?.status === 'RECEIVING') && (
          <MenuItem onClick={() => console.log('Receive goods')}>
            <ReceiveIcon sx={{ mr: 1 }} fontSize="small" />
            Receive Goods
          </MenuItem>
        )}

        {selectedPO?.status !== 'RECEIVED' && selectedPO?.status !== 'CANCELLED' && (
          <MenuItem onClick={() => {
            setCancelDialogOpen(true);
            handleMenuClose();
          }}>
            <RejectIcon sx={{ mr: 1 }} fontSize="small" color="error" />
            Cancel PO
          </MenuItem>
        )}
      </Menu>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Purchase Order</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectPO}
            color="error"
            variant="contained"
            disabled={!reason}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Purchase Order</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleCancelPO}
            color="error"
            variant="contained"
            disabled={!reason}
          >
            Cancel PO
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrderList;
