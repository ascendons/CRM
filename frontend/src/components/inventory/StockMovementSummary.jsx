import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import {
  TrendingUp as InIcon,
  TrendingDown as OutIcon,
  SwapHoriz as TransferIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const StockMovementSummary = () => {
  // Mock data - in real app, fetch from API
  const [summary] = useState({
    totalIn: 1250,
    totalOut: 980,
    totalTransfers: 45,
    netMovement: 270,
    lastUpdated: new Date().toISOString(),
  });

  const movements = [
    { type: 'IN', count: 45, description: 'Purchase Receipts', value: 125000 },
    { type: 'IN', count: 12, description: 'Returns from Customers', value: 8500 },
    { type: 'IN', count: 8, description: 'Stock Adjustments (IN)', value: 3200 },
    { type: 'OUT', count: 78, description: 'Sales Orders', value: 98000 },
    { type: 'OUT', count: 23, description: 'Damaged/Written Off', value: 4500 },
    { type: 'OUT', count: 15, description: 'Stock Adjustments (OUT)', value: 2800 },
    { type: 'TRANSFER', count: 45, description: 'Inter-warehouse Transfers', value: 0 },
  ];

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Stock Movement Summary shows the flow of inventory over a selected time period.
        This helps track inventory turnover and identify trends.
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.lighter', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'success.main',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                  }}
                >
                  <InIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Stock IN
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {summary.totalIn.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    units received
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.lighter', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'error.main',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                  }}
                >
                  <OutIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Stock OUT
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {summary.totalOut.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    units dispatched
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.lighter', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'info.main',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                  }}
                >
                  <TransferIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Transfers
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {summary.totalTransfers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    inter-warehouse
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.lighter', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    p: 1.5,
                    display: 'flex',
                  }}
                >
                  <RefreshIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Net Movement
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    +{summary.netMovement}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    net increase
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Movement Breakdown */}
      <Typography variant="h6" gutterBottom>
        Movement Breakdown
      </Typography>

      <Grid container spacing={2}>
        {movements.map((movement, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={2}>
                    {movement.type === 'IN' && (
                      <InIcon sx={{ color: 'success.main', fontSize: 28 }} />
                    )}
                    {movement.type === 'OUT' && (
                      <OutIcon sx={{ color: 'error.main', fontSize: 28 }} />
                    )}
                    {movement.type === 'TRANSFER' && (
                      <TransferIcon sx={{ color: 'info.main', fontSize: 28 }} />
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {movement.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {movement.count} transactions
                      </Typography>
                    </Box>
                  </Box>
                  {movement.value > 0 && (
                    <Typography variant="h6" fontWeight="bold">
                      ${movement.value.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mt={4}>
        <Button variant="outlined" startIcon={<RefreshIcon />}>
          Refresh Data
        </Button>
        <Button variant="outlined">View Detailed Transactions</Button>
        <Button variant="outlined">Export to Excel</Button>
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" mt={2}>
        Last updated: {new Date(summary.lastUpdated).toLocaleString()}
      </Typography>
    </Box>
  );
};

export default StockMovementSummary;
