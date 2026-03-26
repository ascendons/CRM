import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Box, Card, CardContent, Typography } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend);

const CategoryDistributionChart = ({ categoryData }) => {
  // Default mock data if none provided
  const defaultData = {
    labels: ['Electronics', 'Furniture', 'Office Supplies', 'Raw Materials', 'Finished Goods', 'Consumables'],
    datasets: [
      {
        label: 'Product Count by Category',
        data: [45, 28, 62, 38, 55, 42],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartData = categoryData || defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} items (${percentage}%)`;
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
            Product Distribution by Category
          </Typography>
          <Typography variant="caption" color="warning.main" sx={{ bgcolor: 'warning.lighter', px: 1.5, py: 0.5, borderRadius: 1 }}>
            Sample Data
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Category distribution requires product categorization backend
        </Typography>
        <Box sx={{ height: 250, position: 'relative' }}>
          <Doughnut data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryDistributionChart;
