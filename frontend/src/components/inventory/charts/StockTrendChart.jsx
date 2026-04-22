import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Box, Card, CardContent, Typography } from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StockTrendChart = ({ trendData }) => {
  // Default mock data if none provided
  const defaultData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Stock Value",
        data: [
          125000, 132000, 128000, 145000, 152000, 148000, 165000, 172000, 168000, 185000, 192000,
          198000,
        ],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Stock Quantity",
        data: [8500, 8800, 8600, 9200, 9500, 9300, 10000, 10300, 10100, 10800, 11200, 11500],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.1)",
        fill: true,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const chartData = trendData || defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            if (label === "Stock Value") {
              return `${label}: $${value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            }
            return `${label}: ${value.toLocaleString()} units`;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return "$" + value.toLocaleString();
          },
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
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
          <Typography variant="h6">Stock Value & Quantity Trends</Typography>
          <Typography
            variant="caption"
            color="warning.main"
            sx={{ bgcolor: "warning.lighter", px: 1.5, py: 0.5, borderRadius: 1 }}
          >
            Sample Data
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Historical trend tracking requires backend implementation
        </Typography>
        <Box sx={{ height: 300, position: "relative" }}>
          <Line data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockTrendChart;
