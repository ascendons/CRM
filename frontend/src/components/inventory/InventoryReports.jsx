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
import {
  StockValueChart,
  StockMovementChart,
  StockTrendChart,
  CategoryDistributionChart,
} from './charts';

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
        totalStockValue: stockValueRes.data || 0,
        totalProducts: productCountRes.data || 0,
        lowStockCount: lowStockRes.data?.length || 0,
        outOfStockCount: outOfStockRes.data?.length || 0,
        totalWarehouses: warehouseCountRes.data || 0,
        activeReservations: reservationsRes.data?.length || 0,
      });
    } catch (err) {
      setError('Failed to load dashboard stats: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // TODO: Implement export functionality
    console.log('Export report for tab:', activeTab);
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

      {/* Visual Analytics Charts */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Visual Analytics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <StockTrendChart />
          </Grid>
          <Grid item xs={12} lg={6}>
            <StockMovementChart />
          </Grid>
          <Grid item xs={12} lg={6}>
            <StockValueChart stockData={[]} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <CategoryDistributionChart />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

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
          {activeTab === 3 && (
            <Typography variant="body2" color="text.secondary">
              Warehouse Performance Report - Coming Soon
            </Typography>
          )}
          {activeTab === 4 && (
            <Typography variant="body2" color="text.secondary">
              Batch Expiry Report - Coming Soon
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default InventoryReports;
