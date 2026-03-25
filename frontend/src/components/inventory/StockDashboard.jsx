import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  SwapHoriz as TransferIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import inventoryApi from '../../services/inventoryApi';
import StockAdjustDialog from './StockAdjustDialog';
import StockTransferDialog from './StockTransferDialog';
import EditStockDialog from './EditStockDialog';

const StockDashboard = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Dashboard stats
  const [totalValue, setTotalValue] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  // Dialogs
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch different data based on active tab
      let stockResponse;
      if (activeTab === 0) {
        // All stock
        stockResponse = await inventoryApi.stock.getAll({ size: 100 });
        setStockData(stockResponse.data.content || []);
      } else if (activeTab === 1) {
        // Low stock
        stockResponse = await inventoryApi.stock.getLowStock();
        setStockData(stockResponse.data || []);
      } else if (activeTab === 2) {
        // Out of stock
        stockResponse = await inventoryApi.stock.getOutOfStock();
        setStockData(stockResponse.data || []);
      }

      // Fetch dashboard stats
      const [valueRes, productCountRes, lowStockRes, outOfStockRes] = await Promise.all([
        inventoryApi.stock.getTotalValue(),
        inventoryApi.stock.getTotalProductCount(),
        inventoryApi.stock.getLowStock(),
        inventoryApi.stock.getOutOfStock(),
      ]);

      setTotalValue(valueRes.data || 0);
      setTotalProducts(productCountRes.data || 0);
      setLowStockCount(lowStockRes.data?.length || 0);
      setOutOfStockCount(outOfStockRes.data?.length || 0);
    } catch (err) {
      setError('Failed to load stock data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (stock) => {
    setSelectedStock(stock);
    setAdjustDialogOpen(true);
  };

  const handleTransferStock = (stock) => {
    setSelectedStock(stock);
    setTransferDialogOpen(true);
  };

  const handleEditStock = (stock) => {
    setSelectedStock(stock);
    setEditDialogOpen(true);
  };

  const handleDialogClose = (refresh) => {
    setAdjustDialogOpen(false);
    setTransferDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedStock(null);
    if (refresh) {
      fetchDashboardData();
    }
  };

  const getStockStatus = (stock) => {
    if (stock.quantityAvailable === 0) {
      return { label: 'Out of Stock', color: 'error' };
    }
    if (stock.reorderPoint && stock.quantityAvailable <= stock.reorderPoint) {
      return { label: 'Low Stock', color: 'warning' };
    }
    return { label: 'In Stock', color: 'success' };
  };

  const filteredStock = stockData.filter((stock) =>
    stock.productId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && stockData.length === 0) {
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
          <InventoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Stock Management
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {/* Dashboard Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Stock Value
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                ${totalValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Products
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {totalProducts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <WarningIcon color="warning" />
                <Typography color="text.secondary" variant="body2">
                  Low Stock Items
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {lowStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <WarningIcon color="error" />
                <Typography color="text.secondary" variant="body2">
                  Out of Stock
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {outOfStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs and Search */}
      <Card sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="All Stock" />
            <Tab label={`Low Stock (${lowStockCount})`} />
            <Tab label={`Out of Stock (${outOfStockCount})`} />
          </Tabs>

          <TextField
            size="small"
            placeholder="Search by product ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>
      </Card>

      {/* Stock Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product ID</TableCell>
                <TableCell>Warehouse ID</TableCell>
                <TableCell align="right">On Hand</TableCell>
                <TableCell align="right">Reserved</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Reorder Point</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
                <TableCell align="right">Total Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStock.map((stock) => {
                const status = getStockStatus(stock);
                return (
                  <TableRow key={stock.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {stock.productId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {stock.warehouseId}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{stock.quantityOnHand}</TableCell>
                    <TableCell align="right">{stock.quantityReserved}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={status.color + '.main'}
                      >
                        {stock.quantityAvailable}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {stock.reorderPoint || '-'}
                    </TableCell>
                    <TableCell align="right">
                      ${stock.unitCost?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell align="right">
                      ${stock.totalValue?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Unit Cost">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditStock(stock)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Adjust Stock">
                        <IconButton
                          size="small"
                          onClick={() => handleAdjustStock(stock)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Transfer Stock">
                        <IconButton
                          size="small"
                          onClick={() => handleTransferStock(stock)}
                        >
                          <TransferIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      {searchTerm
                        ? 'No stock found matching your search.'
                        : 'No stock data available.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialogs */}
      {selectedStock && (
        <>
          <EditStockDialog
            open={editDialogOpen}
            stock={selectedStock}
            onClose={() => setEditDialogOpen(false)}
            onSuccess={() => handleDialogClose(true)}
          />
          <StockAdjustDialog
            open={adjustDialogOpen}
            stock={selectedStock}
            onClose={handleDialogClose}
          />
          <StockTransferDialog
            open={transferDialogOpen}
            stock={selectedStock}
            onClose={handleDialogClose}
          />
        </>
      )}
    </Box>
  );
};

export default StockDashboard;
