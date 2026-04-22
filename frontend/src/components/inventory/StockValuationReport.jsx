import React, { useState, useEffect } from "react";
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
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import inventoryApi from "../../services/inventoryApi";

const StockValuationReport = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStockValuation();
  }, []);

  const fetchStockValuation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventoryApi.stock.getAll({ size: 1000 });
      setStockData(response.data.content || []);
    } catch (err) {
      setError("Failed to load stock valuation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = stockData.filter(
    (stock) =>
      stock.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.warehouseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValuation = filteredStock.reduce((sum, stock) => sum + (stock.totalValue || 0), 0);

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

      {/* Summary */}
      <Box sx={{ bgcolor: "primary.light", p: 2, borderRadius: 1, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Total Stock Valuation: $
          {totalValuation.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Based on {filteredStock.length} stock items
        </Typography>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search by product ID or warehouse..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Quantity On Hand</TableCell>
              <TableCell align="right">Unit Cost</TableCell>
              <TableCell align="right">Total Value</TableCell>
              <TableCell>Costing Method</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStock.map((stock) => (
              <TableRow key={stock.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {stock.productName || "Unknown Product"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {stock.productId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {stock.warehouseName || "Unknown Warehouse"}
                  </Typography>
                  {stock.warehouseCode && (
                    <Typography variant="caption" color="text.secondary">
                      {stock.warehouseCode}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{stock.quantityOnHand}</TableCell>
                <TableCell align="right">${stock.unitCost?.toFixed(2) || "0.00"}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    ${stock.totalValue?.toFixed(2) || "0.00"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={stock.costingMethod || "Not Set"}
                    size="small"
                    variant="outlined"
                    color={stock.costingMethod ? "default" : "warning"}
                  />
                </TableCell>
              </TableRow>
            ))}

            {filteredStock.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No stock data available.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StockValuationReport;
