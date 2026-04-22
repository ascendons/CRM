import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import inventoryApi from "../../services/inventoryApi";

const ReceiveGoodsDialog = ({ open, onClose, po, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receivingData, setReceivingData] = useState([]);

  useEffect(() => {
    if (open && po) {
      // Initialize receiving data from PO items
      const items = (po.items || []).map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantityOrdered: item.quantityOrdered || item.quantity || 0,
        quantityReceived: item.quantityReceived || 0,
        quantityToReceive: 0,
        unitCost: item.unitCost || 0,
      }));
      setReceivingData(items);
    }
  }, [open, po]);

  const handleQuantityChange = (index, value) => {
    const newData = [...receivingData];
    const quantity = parseInt(value) || 0;
    const maxQuantity = newData[index].quantityOrdered - newData[index].quantityReceived;

    // Ensure quantity doesn't exceed remaining
    newData[index].quantityToReceive = Math.min(Math.max(0, quantity), maxQuantity);
    setReceivingData(newData);
  };

  const handleReceiveAll = () => {
    const newData = receivingData.map((item) => ({
      ...item,
      quantityToReceive: item.quantityOrdered - item.quantityReceived,
    }));
    setReceivingData(newData);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Filter items with quantity to receive
      const itemsToReceive = receivingData
        .filter((item) => item.quantityToReceive > 0)
        .map((item) => ({
          productId: item.productId,
          quantityReceived: item.quantityToReceive,
          unitCost: item.unitCost,
        }));

      if (itemsToReceive.length === 0) {
        setError("Please enter quantities to receive");
        return;
      }

      const receiveData = {
        items: itemsToReceive,
        receivedDate: new Date().toISOString(),
        notes: "",
      };

      await inventoryApi.purchaseOrders.receive(po.id, receiveData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError("Failed to receive goods: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReceivingData([]);
    setError(null);
    onClose();
  };

  const getTotalToReceive = () => {
    return receivingData.reduce((sum, item) => sum + item.quantityToReceive, 0);
  };

  if (!po) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6">Receive Goods</Typography>
          <Typography variant="body2" color="text.secondary">
            PO: {po.poNumber}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Enter quantities received for each item
          </Typography>
          <Button size="small" onClick={handleReceiveAll}>
            Receive All Remaining
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Ordered</TableCell>
                <TableCell align="right">Already Received</TableCell>
                <TableCell align="right">Remaining</TableCell>
                <TableCell align="right">Receive Now</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receivingData.map((item, index) => {
                const remaining = item.quantityOrdered - item.quantityReceived;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.productName || item.productId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {item.productId}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.quantityOrdered}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={item.quantityReceived > 0 ? "success.main" : "text.secondary"}
                      >
                        {item.quantityReceived}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={remaining > 0 ? "warning.main" : "success.main"}
                      >
                        {remaining}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantityToReceive}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        inputProps={{
                          min: 0,
                          max: remaining,
                        }}
                        sx={{ width: 100 }}
                        disabled={remaining === 0}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {getTotalToReceive() > 0 && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "primary.lighter",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Total items to receive: {getTotalToReceive()}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || getTotalToReceive() === 0}
        >
          {loading ? <CircularProgress size={24} /> : "Confirm Receipt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiveGoodsDialog;
