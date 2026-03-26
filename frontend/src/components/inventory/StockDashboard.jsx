import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Skeleton,
  Checkbox,
  Paper,
  ButtonGroup,
  Drawer,
  Slider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  SwapHoriz as TransferIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import inventoryApi from '../../services/inventoryApi';
import { api } from '../../../lib/api-client';
import StockAdjustDialog from './StockAdjustDialog';
import StockTransferDialog from './StockTransferDialog';
import EditStockDialog from './EditStockDialog';

const StockDashboard = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Dashboard stats
  const [totalValue, setTotalValue] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  // Dialogs
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Catalog product view
  const [catalogProductId, setCatalogProductId] = useState(null);
  const [catalogProduct, setCatalogProduct] = useState(null);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [loadingCatalogProduct, setLoadingCatalogProduct] = useState(false);

  // Actions menu
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState(null);
  const [menuStock, setMenuStock] = useState(null);

  // Keyboard shortcuts
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = React.useRef(null);

  // Export menu
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // Bulk selection
  const [selectedStockIds, setSelectedStockIds] = useState(new Set());

  // Advanced filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState([]);
  const [stockRange, setStockRange] = useState([0, 1000]);
  const [valueRange, setValueRange] = useState({ min: '', max: '' });

  useEffect(() => {
    fetchDashboardData();
    fetchWarehouses();
  }, [activeTab]);

  const fetchWarehouses = async () => {
    try {
      const response = await inventoryApi.warehouses.getAll({ size: 100 });
      setWarehouses(response.data.content || []);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            fetchDashboardData();
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(true);
          break;
        case 'escape':
          setSearchTerm('');
          searchInputRef.current?.blur();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch different data based on active tab
      let stockResponse;
      if (activeTab === 0) {
        // All stock
        stockResponse = await inventoryApi.stock.getAll({ size: 100 });
        setStockData(stockResponse.data.content || []);
      } else if (activeTab === 1) {
        // Low stock
        stockResponse = await inventoryApi.stock.getLowStock();
        setStockData(stockResponse.data || []);
      } else if (activeTab === 2) {
        // Out of stock
        stockResponse = await inventoryApi.stock.getOutOfStock();
        setStockData(stockResponse.data || []);
      }

      // Fetch dashboard stats
      const [valueRes, productCountRes, lowStockRes, outOfStockRes] = await Promise.all([
        inventoryApi.stock.getTotalValue(),
        inventoryApi.stock.getTotalProductCount(),
        inventoryApi.stock.getLowStock(),
        inventoryApi.stock.getOutOfStock(),
      ]);

      setTotalValue(valueRes.data || 0);
      setTotalProducts(productCountRes.data || 0);
      setLowStockCount(lowStockRes.data?.length || 0);
      setOutOfStockCount(outOfStockRes.data?.length || 0);
    } catch (err) {
      setError('Failed to load stock data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (stock) => {
    setSelectedStock(stock);
    setAdjustDialogOpen(true);
  };

  const handleTransferStock = (stock) => {
    setSelectedStock(stock);
    setTransferDialogOpen(true);
  };

  const handleEditStock = (stock) => {
    setSelectedStock(stock);
    setEditDialogOpen(true);
  };

  const handleDialogClose = (refresh) => {
    setAdjustDialogOpen(false);
    setTransferDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedStock(null);
    if (refresh) {
      fetchDashboardData();
    }
  };

  const handleViewCatalogProduct = async (productId) => {
    console.log('Fetching catalog product:', productId);
    try {
      setLoadingCatalogProduct(true);
      setCatalogModalOpen(true);
      // Fetch catalog product details using the configured API client
      const data = await api.get(`/catalog/${productId}`);
      console.log('Product data:', data);
      setCatalogProduct(data);
    } catch (err) {
      console.error('Failed to load catalog product:', err);
      setError(`Failed to load product details: ${err.message}`);
      setCatalogModalOpen(false);
    } finally {
      setLoadingCatalogProduct(false);
    }
  };

  const handleCloseCatalogModal = () => {
    setCatalogModalOpen(false);
    setCatalogProduct(null);
  };

  const handleOpenActionsMenu = (event, stock) => {
    setActionsMenuAnchor(event.currentTarget);
    setMenuStock(stock);
  };

  const handleCloseActionsMenu = () => {
    setActionsMenuAnchor(null);
    setMenuStock(null);
  };

  const handleMenuAction = (action) => {
    if (menuStock) {
      switch (action) {
        case 'edit':
          handleEditStock(menuStock);
          break;
        case 'adjust':
          handleAdjustStock(menuStock);
          break;
        case 'transfer':
          handleTransferStock(menuStock);
          break;
        case 'view':
          if (menuStock.catalogProductId) {
            handleViewCatalogProduct(menuStock.catalogProductId);
          }
          break;
        default:
          break;
      }
    }
    handleCloseActionsMenu();
  };

  const getStockStatus = (stock) => {
    if (stock.quantityAvailable === 0) {
      return { label: 'Out of Stock', color: 'error' };
    }
    if (stock.reorderPoint && stock.quantityAvailable <= stock.reorderPoint) {
      return { label: 'Low Stock', color: 'warning' };
    }
    return { label: 'In Stock', color: 'success' };
  };

  // Export handlers
  const handleOpenExportMenu = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportMenuAnchor(null);
  };

  const exportToCSV = (data, filename) => {
    // Create CSV content
    const headers = [
      'Product Name',
      'Product ID',
      'Warehouse',
      'Warehouse Code',
      'On Hand',
      'Reserved',
      'Available',
      'Reorder Point',
      'Reorder Qty',
      'Unit Cost',
      'Total Value',
      'Status',
      'Last Restocked',
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(stock => {
        const status = getStockStatus(stock);
        return [
          `"${stock.productName || 'Unknown'}"`,
          stock.productId || '',
          `"${stock.warehouseName || 'Unknown'}"`,
          stock.warehouseCode || '',
          stock.quantityOnHand || 0,
          stock.quantityReserved || 0,
          stock.quantityAvailable || 0,
          stock.reorderPoint || '',
          stock.reorderQuantity || '',
          stock.unitCost || '',
          stock.totalValue || '',
          status.label,
          stock.lastRestockedAt ? new Date(stock.lastRestockedAt).toLocaleDateString() : '',
        ].join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const filename = `stock-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filteredStock, filename);
    handleCloseExportMenu();
  };

  const handleExportExcel = () => {
    // For now, export as CSV with .xlsx extension
    // In production, you'd use a library like xlsx or exceljs
    const filename = `stock-inventory-${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToCSV(filteredStock, filename);
    handleCloseExportMenu();
  };

  // Bulk selection handlers
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = new Set(filteredStock.map(stock => stock.id));
      setSelectedStockIds(allIds);
    } else {
      setSelectedStockIds(new Set());
    }
  };

  const handleSelectOne = (stockId) => {
    const newSelected = new Set(selectedStockIds);
    if (newSelected.has(stockId)) {
      newSelected.delete(stockId);
    } else {
      newSelected.add(stockId);
    }
    setSelectedStockIds(newSelected);
  };

  const handleBulkExport = () => {
    const selectedData = filteredStock.filter(stock => selectedStockIds.has(stock.id));
    const filename = `selected-stock-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(selectedData, filename);
    setSelectedStockIds(new Set());
  };

  const handleClearSelection = () => {
    setSelectedStockIds(new Set());
  };

  // Filter handlers
  const handleToggleFilters = () => {
    setFilterDrawerOpen(!filterDrawerOpen);
  };

  const handleClearFilters = () => {
    setSelectedWarehouses([]);
    setStockRange([0, 1000]);
    setValueRange({ min: '', max: '' });
  };

  const handleApplyQuickFilter = (filterType) => {
    switch (filterType) {
      case 'outOfStock':
        setStockRange([0, 0]);
        break;
      case 'lowStock':
        setStockRange([1, 50]);
        break;
      case 'highValue':
        setValueRange({ min: '1000', max: '' });
        break;
      default:
        break;
    }
  };

  const filteredStock = stockData.filter((stock) => {
    // Search term filter
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      stock.productId?.toLowerCase().includes(term) ||
      stock.productName?.toLowerCase().includes(term) ||
      stock.warehouseName?.toLowerCase().includes(term) ||
      stock.warehouseCode?.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    // Warehouse filter
    if (selectedWarehouses.length > 0) {
      const warehouseMatch = selectedWarehouses.some(
        wh => wh.id === stock.warehouseId
      );
      if (!warehouseMatch) return false;
    }

    // Stock range filter
    const available = stock.quantityAvailable || 0;
    if (available < stockRange[0] || available > stockRange[1]) {
      return false;
    }

    // Value range filter
    const totalValue = stock.totalValue || 0;
    if (valueRange.min && totalValue < parseFloat(valueRange.min)) {
      return false;
    }
    if (valueRange.max && totalValue > parseFloat(valueRange.max)) {
      return false;
    }

    return true;
  });

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <InventoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Stock Management
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleToggleFilters}
            color={filterDrawerOpen ? 'primary' : 'inherit'}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleOpenExportMenu}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Dashboard Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Stock Value
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                ${totalValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Products
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {totalProducts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <WarningIcon color="warning" />
                <Typography color="text.secondary" variant="body2">
                  Low Stock Items
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {lowStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <WarningIcon color="error" />
                <Typography color="text.secondary" variant="body2">
                  Out of Stock
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {outOfStockCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs and Search */}
      <Card sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="All Stock" />
            <Tab label={`Low Stock (${lowStockCount})`} />
            <Tab label={`Out of Stock (${outOfStockCount})`} />
          </Tabs>

          <Box display="flex" gap={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search by product, warehouse, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              inputRef={searchInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 350 }}
            />
            <Tooltip title="Keyboard shortcuts (?)">
              <IconButton
                size="small"
                onClick={() => setShowShortcuts(true)}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Card>

      {/* Stock Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedStockIds.size > 0 && selectedStockIds.size === filteredStock.length}
                    indeterminate={selectedStockIds.size > 0 && selectedStockIds.size < filteredStock.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell align="right">
                  <Tooltip title="Physical stock count in warehouse">
                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                      On Hand
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Stock held for orders/quotes">
                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                      Reserved
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Available = On Hand - Reserved">
                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                      Available
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Trigger alert when stock falls below this level">
                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                      Reorder Point
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Cost per unit (weighted average)">
                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                      Unit Cost
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="On Hand × Unit Cost">
                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                      Total Value
                      <InfoIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && stockData.length === 0 ? (
                // Loading skeletons
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Skeleton variant="circular" width={24} height={24} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Skeleton variant="rounded" width={48} height={48} />
                        <Box>
                          <Skeleton width={150} />
                          <Skeleton width={100} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Skeleton width={120} />
                    </TableCell>
                    <TableCell align="right"><Skeleton width={40} /></TableCell>
                    <TableCell align="right"><Skeleton width={40} /></TableCell>
                    <TableCell align="right"><Skeleton width={100} /></TableCell>
                    <TableCell align="right"><Skeleton width={40} /></TableCell>
                    <TableCell align="right"><Skeleton width={60} /></TableCell>
                    <TableCell align="right"><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell align="right"><Skeleton width={40} /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredStock.map((stock) => {
                const status = getStockStatus(stock);
                const isSelected = selectedStockIds.has(stock.id);
                return (
                  <TableRow key={stock.id} hover selected={isSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectOne(stock.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            fontSize: '1.2rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {(stock.productName || 'U')[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            sx={{
                              cursor: stock.catalogProductId ? 'pointer' : 'default',
                              color: stock.catalogProductId ? 'primary.main' : 'text.primary',
                              '&:hover': stock.catalogProductId ? {
                                textDecoration: 'underline'
                              } : {}
                            }}
                            onClick={() => stock.catalogProductId && handleViewCatalogProduct(stock.catalogProductId)}
                          >
                            {stock.productName || 'Unknown Product'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {stock.productId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {stock.warehouseName || 'Unknown Warehouse'}
                        </Typography>
                        {stock.warehouseCode && (
                          <Chip
                            label={stock.warehouseCode}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{stock.quantityOnHand}</TableCell>
                    <TableCell align="right">{stock.quantityReserved}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ minWidth: 100 }}>
                        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1} mb={0.5}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={status.color + '.main'}
                          >
                            {stock.quantityAvailable}
                          </Typography>
                          {stock.reorderPoint && (
                            <Typography variant="caption" color="text.secondary">
                              / {stock.reorderPoint}
                            </Typography>
                          )}
                        </Box>
                        {stock.reorderPoint && (
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((stock.quantityAvailable / stock.reorderPoint) * 100, 100)}
                            color={status.color}
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {stock.reorderPoint || '-'}
                    </TableCell>
                    <TableCell align="right">
                      ${stock.unitCost?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell align="right">
                      ${stock.totalValue?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenActionsMenu(e, stock)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
              )}

              {filteredStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Box py={8}>
                      {searchTerm ? (
                        <>
                          <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            No results found
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            No stock items match "{searchTerm}"
                          </Typography>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => setSearchTerm('')}
                            sx={{ mt: 2 }}
                          >
                            Clear search
                          </Button>
                        </>
                      ) : (
                        <>
                          <InventoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            No stock items yet
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Get started by enabling inventory tracking for your catalog products
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => window.location.href = '/catalog'}
                            sx={{ mt: 2 }}
                          >
                            Go to Catalog
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Floating Action Bar for Bulk Operations */}
      {selectedStockIds.size > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 1000,
            minWidth: 400,
          }}
        >
          <Typography variant="body1" fontWeight="medium">
            {selectedStockIds.size} item{selectedStockIds.size > 1 ? 's' : ''} selected
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={handleBulkExport} startIcon={<DownloadIcon />}>
              Export
            </Button>
            <Button onClick={handleClearSelection}>
              Clear
            </Button>
          </ButtonGroup>
        </Paper>
      )}

      {/* Advanced Filters Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={handleToggleFilters}
        sx={{
          '& .MuiDrawer-paper': {
            width: 320,
            p: 3,
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Filters
          </Typography>
          <IconButton size="small" onClick={handleToggleFilters}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={3}>
          {/* Warehouse Filter */}
          <FormControl fullWidth>
            <Autocomplete
              multiple
              options={warehouses}
              getOptionLabel={(option) => option.name || ''}
              value={selectedWarehouses}
              onChange={(event, newValue) => setSelectedWarehouses(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Warehouses"
                  placeholder="Select warehouses"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />
          </FormControl>

          <Divider />

          {/* Stock Range Slider */}
          <Box>
            <Typography gutterBottom>
              Stock Level Range
            </Typography>
            <Slider
              value={stockRange}
              onChange={(e, newValue) => setStockRange(newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={1000}
              marks={[
                { value: 0, label: '0' },
                { value: 500, label: '500' },
                { value: 1000, label: '1000' },
              ]}
            />
            <Typography variant="caption" color="text.secondary">
              {stockRange[0]} - {stockRange[1]} units
            </Typography>
          </Box>

          <Divider />

          {/* Value Range */}
          <Box>
            <Typography gutterBottom>
              Total Value Range
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                label="Min Value"
                type="number"
                size="small"
                value={valueRange.min}
                onChange={(e) => setValueRange({ ...valueRange, min: e.target.value })}
                InputProps={{ startAdornment: '$' }}
              />
              <TextField
                label="Max Value"
                type="number"
                size="small"
                value={valueRange.max}
                onChange={(e) => setValueRange({ ...valueRange, max: e.target.value })}
                InputProps={{ startAdornment: '$' }}
              />
            </Box>
          </Box>

          <Divider />

          {/* Quick Filters */}
          <Box>
            <Typography gutterBottom fontWeight="medium">
              Quick Filters
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip
                label="Out of Stock"
                onClick={() => handleApplyQuickFilter('outOfStock')}
                color="error"
                variant="outlined"
                size="small"
              />
              <Chip
                label="Low Stock"
                onClick={() => handleApplyQuickFilter('lowStock')}
                color="warning"
                variant="outlined"
                size="small"
              />
              <Chip
                label="High Value"
                onClick={() => handleApplyQuickFilter('highValue')}
                color="success"
                variant="outlined"
                size="small"
              />
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Box display="flex" gap={1} mt={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleToggleFilters}
            >
              Apply
            </Button>
          </Box>
        </Stack>
      </Drawer>

      {/* Dialogs */}
      {selectedStock && (
        <>
          <EditStockDialog
            open={editDialogOpen}
            stock={selectedStock}
            onClose={() => setEditDialogOpen(false)}
            onSuccess={() => handleDialogClose(true)}
          />
          <StockAdjustDialog
            open={adjustDialogOpen}
            stock={selectedStock}
            onClose={handleDialogClose}
          />
          <StockTransferDialog
            open={transferDialogOpen}
            stock={selectedStock}
            onClose={handleDialogClose}
          />
        </>
      )}

      {/* Catalog Product View Modal */}
      <Dialog
        open={catalogModalOpen}
        onClose={handleCloseCatalogModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Product Details
        </DialogTitle>
        <DialogContent dividers>
          {loadingCatalogProduct ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : catalogProduct ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {catalogProduct.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Product ID: {catalogProduct.productId || catalogProduct.id}
                  </Typography>
                </Grid>

                {catalogProduct.category && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Category
                    </Typography>
                    <Chip label={catalogProduct.category} size="small" sx={{ mt: 0.5 }} />
                  </Grid>
                )}

                {catalogProduct.attributes && catalogProduct.attributes.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Attributes
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Attribute</strong></TableCell>
                            <TableCell><strong>Value</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {catalogProduct.attributes.map((attr, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {attr.displayKey || attr.key}
                              </TableCell>
                              <TableCell>
                                {attr.value}
                                {attr.unit && ` ${attr.unit}`}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}

                {catalogProduct.createdAt && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(catalogProduct.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <Typography color="text.secondary">No product details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCatalogModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={actionsMenuAnchor}
        open={Boolean(actionsMenuAnchor)}
        onClose={handleCloseActionsMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menuStock?.catalogProductId && (
          <MenuItem onClick={() => handleMenuAction('view')}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Unit Cost</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuAction('adjust')}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Adjust Stock</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('transfer')}>
          <ListItemIcon>
            <TransferIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Transfer Stock</ListItemText>
        </MenuItem>
      </Menu>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleCloseExportMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleExportCSV}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportExcel}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as Excel</ListItemText>
        </MenuItem>
      </Menu>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Keyboard Shortcuts</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body1">Refresh data</Typography>
              <Chip label="R" size="small" variant="outlined" />
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body1">Focus search</Typography>
              <Chip label="Ctrl + F" size="small" variant="outlined" />
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body1">Show shortcuts</Typography>
              <Chip label="?" size="small" variant="outlined" />
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body1">Clear search</Typography>
              <Chip label="Escape" size="small" variant="outlined" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShortcuts(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockDashboard;
