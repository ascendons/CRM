import React, { useState, useEffect } from "react";
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
  Tabs,
  Tab,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as OkIcon,
} from "@mui/icons-material";
import inventoryApi from "../../services/inventoryApi";

const BatchExpiryReport = () => {
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [expired, setExpired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchBatchExpiryData();
  }, []);

  const fetchBatchExpiryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [expiringSoonRes, expiredRes] = await Promise.all([
        inventoryApi.batches.getExpiringSoon(30),
        inventoryApi.batches.getExpired(),
      ]);

      setExpiringSoon(expiringSoonRes.data.data || []);
      setExpired(expiredRes.data.data || []);
    } catch (err) {
      setError("Failed to load batch expiry data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryChip = (daysUntilExpiry) => {
    if (daysUntilExpiry < 0) {
      return <Chip label="Expired" color="error" size="small" icon={<ErrorIcon />} />;
    } else if (daysUntilExpiry <= 7) {
      return (
        <Chip label={`${daysUntilExpiry} days`} color="error" size="small" icon={<WarningIcon />} />
      );
    } else if (daysUntilExpiry <= 30) {
      return (
        <Chip
          label={`${daysUntilExpiry} days`}
          color="warning"
          size="small"
          icon={<WarningIcon />}
        />
      );
    }
    return <Chip label={`${daysUntilExpiry} days`} color="success" size="small" />;
  };

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

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: "error.lighter", borderLeft: 4, borderColor: "error.main" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ErrorIcon color="error" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Expired Batches
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {expired.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requires immediate action
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: "warning.lighter", borderLeft: 4, borderColor: "warning.main" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <WarningIcon color="warning" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Expiring Soon
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {expiringSoon.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Within 30 days
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: "success.lighter", borderLeft: 4, borderColor: "success.main" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <OkIcon color="success" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Batches Tracked
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {expired.length + expiringSoon.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Batch tracking active
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Batch Tables */}
      <Card>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label={`Expiring Soon (${expiringSoon.length})`} />
          <Tab label={`Expired (${expired.length})`} />
        </Tabs>

        <CardContent>
          {activeTab === 0 && (
            <>
              <Typography variant="h6" gutterBottom color="warning.main">
                Batches Expiring Within 30 Days
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Batch Number</TableCell>
                      <TableCell>Product ID</TableCell>
                      <TableCell align="right">Quantity Available</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Days Until Expiry</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expiringSoon.map((batch) => {
                      const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
                      return (
                        <TableRow key={batch.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {batch.batchNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{batch.productId}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {batch.quantityAvailable}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                          <TableCell>{getExpiryChip(daysUntilExpiry)}</TableCell>
                          <TableCell>
                            <Chip
                              label={batch.status || "Active"}
                              size="small"
                              color={batch.status === "QUARANTINED" ? "error" : "default"}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {expiringSoon.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" py={4}>
                            No batches expiring soon
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {activeTab === 1 && (
            <>
              <Typography variant="h6" gutterBottom color="error">
                Expired Batches (Requires Action)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Batch Number</TableCell>
                      <TableCell>Product ID</TableCell>
                      <TableCell align="right">Quantity Remaining</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Days Expired</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expired.map((batch) => {
                      const daysExpired = Math.abs(getDaysUntilExpiry(batch.expiryDate));
                      return (
                        <TableRow key={batch.id} sx={{ bgcolor: "error.lighter" }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {batch.batchNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{batch.productId}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="error">
                              {batch.quantityAvailable}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${daysExpired} days ago`}
                              color="error"
                              size="small"
                              icon={<ErrorIcon />}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={batch.status || "Expired"} size="small" color="error" />
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {expired.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box py={4}>
                            <OkIcon sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                              No expired batches found. All batches are within date!
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default BatchExpiryReport;
