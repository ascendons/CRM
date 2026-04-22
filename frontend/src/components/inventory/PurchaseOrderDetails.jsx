import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { format } from "date-fns";
import inventoryApi from "../../services/inventoryApi";

const PurchaseOrderDetails = ({ open, onClose, poId }) => {
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && poId) {
      fetchPODetails();
    }
  }, [open, poId]);

  const fetchPODetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryApi.purchaseOrders.getById(poId);
      setPo(response.data.data || response.data);
    } catch (err) {
      setError("Failed to load purchase order details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "default",
      SUBMITTED: "info",
      APPROVED: "success",
      RECEIVING: "warning",
      RECEIVED: "success",
      CANCELLED: "error",
      REJECTED: "error",
    };
    return colors[status] || "default";
  };

  if (loading || !po) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Purchase Order Details</Typography>
          <Chip label={po.status} color={getStatusColor(po.status)} />
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* PO Number & Dates */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              PO Number
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {po.poNumber}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Order Date
            </Typography>
            <Typography variant="body1">
              {po.orderDate ? format(new Date(po.orderDate), "MMM dd, yyyy") : "-"}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Supplier Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Supplier Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Supplier Name
              </Typography>
              <Typography variant="body2">{po.supplierName || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Contact Person
              </Typography>
              <Typography variant="body2">{po.supplierContact || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body2">{po.supplierEmail || "-"}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Delivery Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Delivery Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Warehouse
              </Typography>
              <Typography variant="body2">{po.warehouseName || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Expected Delivery Date
              </Typography>
              <Typography variant="body2">
                {po.expectedDeliveryDate
                  ? format(new Date(po.expectedDeliveryDate), "MMM dd, yyyy")
                  : "-"}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Payment Terms */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Payment Terms
              </Typography>
              <Typography variant="body2">{po.paymentTerms || "-"}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Notes
              </Typography>
              <Typography variant="body2">{po.notes || "-"}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Items */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Items
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Ordered</TableCell>
                  <TableCell align="right">Received</TableCell>
                  <TableCell align="right">Unit Cost</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(po.items || []).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.productName || item.productId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {item.productId}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.quantityOrdered || item.quantity}</TableCell>
                    <TableCell align="right">{item.quantityReceived || 0}</TableCell>
                    <TableCell align="right">${item.unitCost?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        $
                        {(
                          (item.quantityOrdered || item.quantity || 0) * (item.unitCost || 0)
                        ).toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Total */}
        <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Box sx={{ minWidth: 200 }}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight="bold">
                Grand Total:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                ${po.totalAmount?.toFixed(2) || "0.00"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseOrderDetails;
