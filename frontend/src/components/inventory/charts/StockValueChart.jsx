import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Box, Card, CardContent, Typography } from "@mui/material";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

const StockValueChart = ({ stockData = [] }) => {
  // Group stock by warehouse and calculate total value
  const warehouseData = stockData.reduce((acc, stock) => {
    const warehouseName = stock.warehouseName || stock.warehouseId || "Unknown";
    if (!acc[warehouseName]) {
      acc[warehouseName] = { value: 0, count: 0 };
    }
    acc[warehouseName].value += stock.totalValue || 0;
    acc[warehouseName].count += 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(warehouseData),
    datasets: [
      {
        label: "Stock Value by Warehouse",
        data: Object.values(warehouseData).map((d) => d.value),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 20,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: $${value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Stock Value Distribution by Warehouse
        </Typography>
        <Box sx={{ height: 300, position: "relative" }}>
          <Pie data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default StockValueChart;
