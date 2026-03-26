import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Button,
} from '@mui/material';
import { Warning as WarningIcon, ShoppingCart as OrderIcon } from '@mui/icons-material';
import inventoryApi from '../../services/inventoryApi';

const LowStockReport = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLowStockData();
  }, []);

  const fetchLowStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [lowStockRes, outOfStockRes] = await Promise.all([
        inventoryApi.stock.getLowStock(),
        inventoryApi.stock.getOutOfStock(),
      ]);

      setLowStockItems(lowStockRes.data.data || []);
      setOutOfStockItems(outOfStockRes.data.data || []);
    } catch (err) {
      setError('Failed to load low stock data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStockLevel = (stock) => {
    if (!stock.reorderPoint || stock.reorderPoint === 0) return 100;
    return Math.min(100, (stock.quantityAvailable / stock.reorderPoint) * 100);
  };

  const getStockLevelColor = (percentage) => {
    if (percentage === 0) return 'error';
    if (percentage <= 50) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={3}>
        <Box
          sx={{
            flex: 1,
            bgcolor: 'warning.light',
            p: 2,
            borderRadius: 1,
            border: 2,
            borderColor: 'warning.main',
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6" fontWeight="bold">
              {lowStockItems.length}
            </Typography>
          </Box>
          <Typography variant="body2">Low Stock Items</Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            bgcolor: 'error.light',
            p: 2,
            borderRadius: 1,
            border: 2,
            borderColor: 'error.main',
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="error" />
            <Typography variant="h6" fontWeight="bold">
              {outOfStockItems.length}
            </Typography>
          </Box>
          <Typography variant="body2">Out of Stock</Typography>
        </Box>
      </Box>

      {/* Out of Stock Items */}
      {outOfStockItems.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom color="error">
            Out of Stock Items (Critical)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="right">Reserved</TableCell>
                  <TableCell align="right">Reorder Point</TableCell>
                  <TableCell align="right">Reorder Qty</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outOfStockItems.map((stock) => (
                  <TableRow key={stock.id} sx={{ bgcolor: 'error.lighter' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {stock.productName || 'Unknown Product'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stock.productId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {stock.warehouseName || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label="0" color="error" size="small" />
                    </TableCell>
                    <TableCell align="right">{stock.quantityReserved}</TableCell>
                    <TableCell align="right">{stock.reorderPoint || '-'}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {stock.reorderQuantity || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<OrderIcon />}
                      >
                        Order Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom color="warning.main">
            Low Stock Items
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="right">Reorder Point</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell align="right">Reorder Qty</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockItems.map((stock) => {
                  const stockLevel = getStockLevel(stock);
                  return (
                    <TableRow key={stock.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {stock.productName || 'Unknown Product'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stock.productId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {stock.warehouseName || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="warning.main">
                          {stock.quantityAvailable}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{stock.reorderPoint || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={stockLevel}
                              color={getStockLevelColor(stockLevel)}
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {stockLevel.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {stock.reorderQuantity || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<OrderIcon />}
                        >
                          Reorder
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {lowStockItems.length === 0 && outOfStockItems.length === 0 && (
        <Alert severity="success">
          <Typography variant="body2">
            All stock levels are healthy! No items require reordering at this time.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default LowStockReport;
