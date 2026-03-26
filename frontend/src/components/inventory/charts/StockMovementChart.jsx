import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Box, Card, CardContent, Typography } from '@mui/material';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StockMovementChart = () => {
  // Mock data - in real app, fetch from API
  const chartData = {
    labels: ['Purchase', 'Returns', 'Adj IN', 'Sales', 'Damaged', 'Adj OUT', 'Transfer'],
    datasets: [
      {
        label: 'Stock IN',
        data: [1250, 120, 80, 0, 0, 0, 0],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      },
      {
        label: 'Stock OUT',
        data: [0, 0, 0, 980, 45, 60, 0],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
      },
      {
        label: 'Transfers',
        data: [0, 0, 0, 0, 0, 0, 145],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value.toLocaleString()} units`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Stock Movement Analysis
          </Typography>
          <Typography variant="caption" color="warning.main" sx={{ bgcolor: 'warning.lighter', px: 1.5, py: 0.5, borderRadius: 1 }}>
            Sample Data
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Movement tracking requires transaction logging backend
        </Typography>
        <Box sx={{ height: 300, position: 'relative' }}>
          <Bar data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockMovementChart;
