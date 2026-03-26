import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  TrendingUp as TrendingIcon,
  Inventory as StockIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import inventoryApi from '../../services/inventoryApi';
import StockValuationReport from './StockValuationReport';
import LowStockReport from './LowStockReport';
import StockMovementSummary from './StockMovementSummary';
import WarehousePerformanceReport from './WarehousePerformanceReport';
import BatchExpiryReport from './BatchExpiryReport';

const InventoryReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalStockValue: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalWarehouses: 0,
    activeReservations: 0,
  });

  // Chart data
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        stockValueRes,
        productCountRes,
        lowStockRes,
        outOfStockRes,
        warehouseCountRes,
        reservationsRes,
      ] = await Promise.all([
        inventoryApi.stock.getTotalValue(),
        inventoryApi.stock.getTotalProductCount(),
        inventoryApi.stock.getLowStock(),
        inventoryApi.stock.getOutOfStock(),
        inventoryApi.warehouses.getCount(),
        inventoryApi.reservations.getActive(),
      ]);

      setStats({
        totalStockValue: stockValueRes.data.data || 0,
        totalProducts: productCountRes.data.data || 0,
        lowStockCount: lowStockRes.data.data?.length || 0,
        outOfStockCount: outOfStockRes.data.data?.length || 0,
        totalWarehouses: warehouseCountRes.data.data || 0,
        activeReservations: reservationsRes.data.data?.length || 0,
      });

      // Fetch stock data for charts
      const allStockRes = await inventoryApi.stock.getAll({ size: 1000 });
      setStockData(allStockRes.data.content || []);
    } catch (err) {
      setError('Failed to load dashboard stats: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportNames = [
      'Stock-Valuation',
      'Low-Stock-Alerts',
      'Stock-Movement-Summary',
      'Warehouse-Performance',
      'Batch-Expiry',
    ];

    const filename = `${reportNames[activeTab]}-Report-${new Date().toISOString().split('T')[0]}.csv`;

    // Simple CSV export for stock valuation
    if (activeTab === 0 && stockData.length > 0) {
      const headers = ['Product', 'Warehouse', 'Quantity On Hand', 'Unit Cost', 'Total Value', 'Costing Method'];
      const csvRows = [
        headers.join(','),
        ...stockData.map(stock => [
          `"${stock.productName || stock.productId}"`,
          `"${stock.warehouseName || stock.warehouseId}"`,
          stock.quantityOnHand || 0,
          stock.unitCost?.toFixed(2) || '0.00',
          stock.totalValue?.toFixed(2) || '0.00',
          stock.costingMethod || 'FIFO',
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
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
          <ReportIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Inventory Reports & Analytics
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportReport}
        >
          Export Report
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Dashboard */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                  }}
                >
                  <StockIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Stock Value
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ${stats.totalStockValue.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'success.light',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                  }}
                >
                  <TrendingIcon sx={{ fontSize: 32, color: 'success.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalProducts}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Across {stats.totalWarehouses} warehouses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'warning.light',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                  }}
                >
                  <WarningIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Stock Alerts
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {stats.lowStockCount + stats.outOfStockCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats.lowStockCount} low, {stats.outOfStockCount} out
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Reservations
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {stats.activeReservations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Stock Turnover Rate
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                -
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Coming soon
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Days of Inventory
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                -
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Coming soon
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Visual Analytics - Coming Soon */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ReportIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h6">
              Visual Analytics
            </Typography>
          </Box>
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'grey.300'
            }}
          >
            <TrendingIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced charts and visualizations for stock trends, movement analysis, and distribution insights
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Stock Valuation" />
          <Tab label="Low Stock Alerts" />
          <Tab label="Stock Movement Summary" />
          <Tab label="Warehouse Performance" />
          <Tab label="Batch Expiry Report" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <StockValuationReport />}
          {activeTab === 1 && <LowStockReport />}
          {activeTab === 2 && <StockMovementSummary />}
          {activeTab === 3 && <WarehousePerformanceReport />}
          {activeTab === 4 && <BatchExpiryReport />}
        </Box>
      </Card>
    </Box>
  );
};

export default InventoryReports;
