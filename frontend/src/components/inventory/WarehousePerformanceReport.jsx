import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Warehouse as WarehouseIcon,
  Inventory as StockIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import inventoryApi from '../../services/inventoryApi';

const WarehousePerformanceReport = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseStats, setWarehouseStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWarehousePerformance();
  }, []);

  const fetchWarehousePerformance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all warehouses
      const warehousesRes = await inventoryApi.warehouses.getAll({ size: 100 });
      const warehouseList = warehousesRes.data.content || [];
      setWarehouses(warehouseList);

      // Fetch stock data for each warehouse
      const statsPromises = warehouseList.map(async (warehouse) => {
        try {
          const stockRes = await inventoryApi.stock.getByWarehouse(warehouse.id);
          const stockItems = stockRes.data.data || [];

          const totalValue = stockItems.reduce((sum, item) => sum + (item.totalValue || 0), 0);
          const totalQuantity = stockItems.reduce((sum, item) => sum + (item.quantityOnHand || 0), 0);
          const lowStockItems = stockItems.filter(item =>
            item.reorderPoint && item.quantityAvailable <= item.reorderPoint
          ).length;

          return {
            id: warehouse.id,
            stats: {
              totalItems: stockItems.length,
              totalValue,
              totalQuantity,
              lowStockItems,
              utilizationRate: warehouse.capacity ? (totalQuantity / warehouse.capacity) * 100 : 0,
            },
          };
        } catch (err) {
          return {
            id: warehouse.id,
            stats: {
              totalItems: 0,
              totalValue: 0,
              totalQuantity: 0,
              lowStockItems: 0,
              utilizationRate: 0,
            },
          };
        }
      });

      const stats = await Promise.all(statsPromises);
      const statsMap = {};
      stats.forEach(({ id, stats }) => {
        statsMap[id] = stats;
      });
      setWarehouseStats(statsMap);
    } catch (err) {
      setError('Failed to load warehouse performance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (rate) => {
    if (rate >= 90) return 'error';
    if (rate >= 70) return 'warning';
    return 'success';
  };

  const getTotalStats = () => {
    const total = {
      warehouses: warehouses.length,
      totalValue: 0,
      totalItems: 0,
      totalQuantity: 0,
      lowStockItems: 0,
    };

    Object.values(warehouseStats).forEach((stats) => {
      total.totalValue += stats.totalValue;
      total.totalItems += stats.totalItems;
      total.totalQuantity += stats.totalQuantity;
      total.lowStockItems += stats.lowStockItems;
    });

    return total;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  const totalStats = getTotalStats();

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <WarehouseIcon color="primary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Warehouses
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {totalStats.warehouses}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <StockIcon color="success" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Stock Value
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ${totalStats.totalValue.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingIcon color="info" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Stock Items
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {totalStats.totalItems}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock Alerts
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {totalStats.lowStockItems}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Warehouse Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Warehouse Performance Details
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Stock Items</TableCell>
                  <TableCell align="right">Total Quantity</TableCell>
                  <TableCell align="right">Stock Value</TableCell>
                  <TableCell align="right">Low Stock</TableCell>
                  <TableCell>Utilization</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouses.map((warehouse) => {
                  const stats = warehouseStats[warehouse.id] || {};
                  const utilizationColor = getUtilizationColor(stats.utilizationRate || 0);

                  return (
                    <TableRow key={warehouse.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {warehouse.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {warehouse.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {warehouse.address || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {stats.totalItems || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {(stats.totalQuantity || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ${(stats.totalValue || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {stats.lowStockItems > 0 ? (
                          <Chip
                            label={stats.lowStockItems}
                            color="warning"
                            size="small"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 120 }}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography variant="caption">
                              {(stats.utilizationRate || 0).toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(stats.utilizationRate || 0, 100)}
                            color={utilizationColor}
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={warehouse.active ? 'Active' : 'Inactive'}
                          color={warehouse.active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {warehouses.length === 0 && (
            <Box py={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No warehouses found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WarehousePerformanceReport;
