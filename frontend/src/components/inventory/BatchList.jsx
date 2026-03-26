import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  LocalShipping as BatchIcon,
} from '@mui/icons-material';
import inventoryApi from '../../services/inventoryApi';
import { format, differenceInDays } from 'date-fns';
import BatchForm from './BatchForm';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, expiring, expired, recalled

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [quarantineDialogOpen, setQuarantineDialogOpen] = useState(false);
  const [recallDialogOpen, setRecallDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Stats
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [recalledCount, setRecalledCount] = useState(0);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    filterBatches();
  }, [batches, searchTerm, filterType]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all batches (you'll need to implement this endpoint or fetch by products)
      // For now, let's fetch expiring soon and expired as examples
      const [expiringRes, expiredRes, recalledRes] = await Promise.all([
        inventoryApi.batches.getExpiringSoon(30),
        inventoryApi.batches.getExpired(),
        inventoryApi.batches.getRecalled(),
      ]);

      const allBatches = [
        ...expiringRes.data,
        ...expiredRes.data,
        ...recalledRes.data,
      ];

      // Remove duplicates
      const uniqueBatches = allBatches.filter(
        (batch, index, self) => index === self.findIndex((b) => b.id === batch.id)
      );

      setBatches(uniqueBatches);
      setExpiringSoonCount(expiringRes.data?.length || 0);
      setExpiredCount(expiredRes.data?.length || 0);
      setRecalledCount(recalledRes.data?.length || 0);
    } catch (err) {
      setError('Failed to load batches: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterBatches = () => {
    let filtered = batches;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (batch) =>
          batch.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.productId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    const today = new Date();
    if (filterType === 'expiring') {
      filtered = filtered.filter((batch) => {
        if (!batch.expiryDate) return false;
        const daysUntilExpiry = differenceInDays(new Date(batch.expiryDate), today);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      });
    } else if (filterType === 'expired') {
      filtered = filtered.filter(
        (batch) =>
          batch.status === 'EXPIRED' ||
          (batch.expiryDate && new Date(batch.expiryDate) < today)
      );
    } else if (filterType === 'recalled') {
      filtered = filtered.filter((batch) => batch.isRecalled);
    }

    setFilteredBatches(filtered);
  };

  const handleMenuOpen = (event, batch) => {
    setAnchorEl(event.currentTarget);
    setSelectedBatch(batch);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQuarantine = async () => {
    try {
      await inventoryApi.batches.quarantine(selectedBatch.id, reason);
      setQuarantineDialogOpen(false);
      setReason('');
      handleMenuClose();
      fetchBatches();
    } catch (err) {
      setError('Failed to quarantine batch: ' + err.message);
    }
  };

  const handleReleaseQuarantine = async () => {
    try {
      await inventoryApi.batches.releaseQuarantine(selectedBatch.id);
      handleMenuClose();
      fetchBatches();
    } catch (err) {
      setError('Failed to release batch: ' + err.message);
    }
  };

  const handleRecall = async () => {
    try {
      await inventoryApi.batches.recall(selectedBatch.id, reason);
      setRecallDialogOpen(false);
      setReason('');
      handleMenuClose();
      fetchBatches();
    } catch (err) {
      setError('Failed to recall batch: ' + err.message);
    }
  };

  const handleMarkExpired = async () => {
    try {
      await inventoryApi.batches.markExpired(selectedBatch.id);
      handleMenuClose();
      fetchBatches();
    } catch (err) {
      setError('Failed to mark batch as expired: ' + err.message);
    }
  };

  const getStatusChip = (batch) => {
    if (batch.isRecalled) {
      return <Chip label="RECALLED" color="error" size="small" icon={<BlockIcon />} />;
    }
    if (batch.status === 'QUARANTINE') {
      return <Chip label="QUARANTINE" color="warning" size="small" icon={<WarningIcon />} />;
    }
    if (batch.status === 'EXPIRED') {
      return <Chip label="EXPIRED" color="error" size="small" />;
    }

    const today = new Date();
    const daysUntilExpiry = batch.expiryDate
      ? differenceInDays(new Date(batch.expiryDate), today)
      : null;

    if (daysUntilExpiry !== null && daysUntilExpiry <= 0) {
      return <Chip label="EXPIRED" color="error" size="small" />;
    }
    if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
      return (
        <Chip
          label={`Expires in ${daysUntilExpiry}d`}
          color="warning"
          size="small"
          icon={<WarningIcon />}
        />
      );
    }
    return <Chip label="ACTIVE" color="success" size="small" icon={<CheckIcon />} />;
  };

  if (loading && batches.length === 0) {
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
          <BatchIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Batch Management
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          Add Batch
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, cursor: 'pointer' }} onClick={() => setFilterType('expiring')}>
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon color="warning" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Expiring Soon (30 days)
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {expiringSoonCount}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, cursor: 'pointer' }} onClick={() => setFilterType('expired')}>
            <Box display="flex" alignItems="center" gap={1}>
              <BlockIcon color="error" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Expired Batches
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  {expiredCount}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 2, cursor: 'pointer' }} onClick={() => setFilterType('recalled')}>
            <Box display="flex" alignItems="center" gap={1}>
              <BlockIcon color="error" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Recalled Batches
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  {recalledCount}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by batch number or product ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant={filterType === 'all' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                size="small"
                variant={filterType === 'expiring' ? 'contained' : 'outlined'}
                color="warning"
                onClick={() => setFilterType('expiring')}
              >
                Expiring Soon
              </Button>
              <Button
                size="small"
                variant={filterType === 'expired' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setFilterType('expired')}
              >
                Expired
              </Button>
              <Button
                size="small"
                variant={filterType === 'recalled' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setFilterType('recalled')}
              >
                Recalled
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Batch Number</TableCell>
                <TableCell>Product ID</TableCell>
                <TableCell>Warehouse ID</TableCell>
                <TableCell>Manufacturing Date</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow key={batch.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {batch.batchNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{batch.productId}</TableCell>
                  <TableCell>{batch.warehouseId}</TableCell>
                  <TableCell>
                    {batch.manufacturingDate
                      ? format(new Date(batch.manufacturingDate), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {batch.expiryDate
                      ? format(new Date(batch.expiryDate), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell align="right">{batch.quantity}</TableCell>
                  <TableCell align="right">{batch.quantityAvailable}</TableCell>
                  <TableCell>{getStatusChip(batch)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, batch)}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {filteredBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No batches found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            setSelectedBatch(selectedBatch);
            setFormOpen(true);
            handleMenuClose();
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>

        {selectedBatch?.status !== 'QUARANTINE' && !selectedBatch?.isRecalled && (
          <MenuItem
            onClick={() => {
              setQuarantineDialogOpen(true);
              handleMenuClose();
            }}
          >
            <WarningIcon sx={{ mr: 1 }} fontSize="small" />
            Quarantine
          </MenuItem>
        )}

        {selectedBatch?.status === 'QUARANTINE' && (
          <MenuItem onClick={handleReleaseQuarantine}>
            <CheckIcon sx={{ mr: 1 }} fontSize="small" />
            Release from Quarantine
          </MenuItem>
        )}

        {!selectedBatch?.isRecalled && selectedBatch?.status !== 'EXPIRED' && (
          <MenuItem onClick={handleMarkExpired}>
            <BlockIcon sx={{ mr: 1 }} fontSize="small" />
            Mark as Expired
          </MenuItem>
        )}

        {!selectedBatch?.isRecalled && (
          <MenuItem
            onClick={() => {
              setRecallDialogOpen(true);
              handleMenuClose();
            }}
          >
            <BlockIcon sx={{ mr: 1 }} fontSize="small" color="error" />
            Recall Batch
          </MenuItem>
        )}
      </Menu>

      {/* Batch Form Dialog */}
      <BatchForm open={formOpen} batch={selectedBatch} onClose={(saved) => {
        setFormOpen(false);
        setSelectedBatch(null);
        if (saved) fetchBatches();
      }} />

      {/* Quarantine Dialog */}
      <Dialog open={quarantineDialogOpen} onClose={() => setQuarantineDialogOpen(false)}>
        <DialogTitle>Quarantine Batch</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Quarantine Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuarantineDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleQuarantine} color="warning" variant="contained" disabled={!reason}>
            Quarantine
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recall Dialog */}
      <Dialog open={recallDialogOpen} onClose={() => setRecallDialogOpen(false)}>
        <DialogTitle>Recall Batch</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action will recall the entire batch and notify all stakeholders.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Recall Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecallDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecall} color="error" variant="contained" disabled={!reason}>
            Recall Batch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchList;
