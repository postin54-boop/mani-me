import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  IconButton,
  InputAdornment,
  TablePagination,
  Skeleton,
  alpha,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Label printing state
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelImageUrl, setLabelImageUrl] = useState(null);
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelError, setLabelError] = useState(null);
    // Print label for shipment (PNG)
    const handlePrintLabel = async (order) => {
      setLabelDialogOpen(true);
      setLabelLoading(true);
      setLabelError(null);
      setLabelImageUrl(null);
      try {
        // Use shipment id for label endpoint
        const res = await api.get(`/labels/shipment/${order.id}`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        setLabelImageUrl(url);
      } catch (err) {
        setLabelError('Failed to load label.');
      } finally {
        setLabelLoading(false);
      }
    };

    // Download label PNG
    const handleDownloadLabel = () => {
      if (!labelImageUrl) return;
      const link = document.createElement('a');
      link.href = labelImageUrl;
      link.download = 'shipment-label.png';
      link.click();
    };

    // Print label
    const handlePrintLabelImage = () => {
      if (!labelImageUrl) return;
      const win = window.open('');
      win.document.write(`<img src='${labelImageUrl}' style='width:350px'/>`);
      win.print();
      win.close();
    };
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/admin/orders');
      // Handle both old format (array) and new format ({ orders, pagination })
      const ordersData = response.data.orders || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      logger.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
      });
      fetchOrders();
      handleCloseDialog();
    } catch (error) {
      logger.error('Error updating order status:', error);
    }
  };

  const handleUpdateWarehouseStatus = async (warehouseStatus) => {
    try {
      await api.put(`/shipments/warehouse/${selectedOrder.parcel_id || selectedOrder.id}/status`, {
        warehouse_status: warehouseStatus,
      });
      setSelectedOrder({ ...selectedOrder, warehouse_status: warehouseStatus });
      alert('Warehouse status updated successfully');
      fetchOrders();
    } catch (error) {
      logger.error('Error updating warehouse status:', error);
      alert(getErrorMessage(error));
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    const statusStyles = {
      pending: { bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' },
      'in-transit': { bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' },
      delivered: { bgcolor: alpha('#10b981', 0.1), color: '#10b981' },
      cancelled: { bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' },
      'parcel_collected': { bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6' },
    };
    return statusStyles[status] || { bgcolor: alpha('#666', 0.1), color: '#666' };
  };

  const filteredOrders = orders.filter(
    (order) => {
      const matchesSearch = 
        order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parcel_id_short?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }
  );

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 1, letterSpacing: '-0.5px' }}>
          Orders Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          View and manage all parcel orders
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap',
      }}>
        <TextField
          placeholder="Search orders..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#666' }} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            width: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in-transit">In Transit</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: 'none',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F5F7FA' }}>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Parcel ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tracking #</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sender</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Receiver</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pickup Date/Time</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Warehouse</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {[...Array(11)].map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
                    No orders found
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    Try adjusting your search or filters
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
              <TableRow 
                key={order.id}
                sx={{
                  '&:hover': { bgcolor: '#F5F7FA' },
                  transition: 'background-color 0.2s ease',
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#83C5FA' }}>
                    {order.parcel_id_short || order.parcel_id || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#1A1A1A' }}>
                    {order.tracking_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {order.sender_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {order.receiver_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#1A1A1A', fontWeight: 500 }}>
                      {order.pickup_date || 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      {order.pickup_time || ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {order.delivery_city}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    size="small"
                    sx={{
                      ...getStatusColor(order.status),
                      fontWeight: 600,
                      fontSize: 11,
                      borderRadius: 1.5,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.warehouse_status || 'not_arrived'}
                    size="small"
                    sx={{
                      bgcolor: order.warehouse_status === 'shipped' ? alpha('#10b981', 0.1) : alpha('#666', 0.1),
                      color: order.warehouse_status === 'shipped' ? '#10b981' : '#666',
                      fontWeight: 600,
                      fontSize: 11,
                      borderRadius: 1.5,
                      border: 'none',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.payment_status}
                    size="small"
                    sx={{
                      bgcolor: order.payment_status === 'paid' ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1),
                      color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b',
                      fontWeight: 600,
                      fontSize: 11,
                      borderRadius: 1.5,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                    £{order.price?.toFixed(2) || '0.00'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewOrder(order)}
                    sx={{
                      color: '#83C5FA',
                      '&:hover': { bgcolor: alpha('#83C5FA', 0.08) },
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handlePrintLabel(order)}
                    sx={{
                      color: '#0B1A33',
                      ml: 1,
                      '&:hover': { bgcolor: alpha('#0B1A33', 0.08) },
                    }}
                    title="Print Label"
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredOrders.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            borderTop: '1px solid #F5F7FA',
            '& .MuiTablePagination-select': {
              borderRadius: 1.5,
            },
          }}
        />
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1A1A1A', borderBottom: '1px solid #F5F7FA' }}>
          Order Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedOrder && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#F5F7FA', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600, fontSize: 10, letterSpacing: 0.5 }}>
                  Tracking Number
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                  {selectedOrder.tracking_number}
                </Typography>
              </Box>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600, fontSize: 10, letterSpacing: 0.5, mb: 1, display: 'block' }}>
                    Sender Information
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Name:</strong> {selectedOrder.sender_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Phone:</strong> {selectedOrder.sender_phone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Address:</strong> {selectedOrder.pickup_address}
                    </Typography>
                    <Typography variant="body2">
                      <strong>City:</strong> {selectedOrder.pickup_city}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600, fontSize: 10, letterSpacing: 0.5, mb: 1, display: 'block' }}>
                    Receiver Information
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Name:</strong> {selectedOrder.receiver_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Phone:</strong> {selectedOrder.receiver_phone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Address:</strong> {selectedOrder.delivery_address}
                    </Typography>
                    <Typography variant="body2">
                      <strong>City:</strong> {selectedOrder.delivery_city}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600, fontSize: 10, letterSpacing: 0.5, mb: 1, display: 'block' }}>
                  Parcel Identification
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Parcel ID:</strong> {selectedOrder.parcel_id || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Short ID:</strong> {selectedOrder.parcel_id_short || 'N/A'}
                      </Typography>
                    </Grid>
                    {selectedOrder.qr_code_url && (
                      <Grid item xs={12} md={4}>
                        <img 
                          src={selectedOrder.qr_code_url} 
                          alt="QR Code" 
                          style={{ width: '100%', maxWidth: 150, height: 'auto', borderRadius: 8 }} 
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600, fontSize: 10, letterSpacing: 0.5, mb: 1, display: 'block' }}>
                  Parcel Details
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={selectedOrder.parcel_image_url ? 8 : 12}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Type:</strong> {selectedOrder.parcel_type}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Size:</strong> {selectedOrder.parcel_size || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Weight:</strong> {selectedOrder.weight_kg || selectedOrder.parcel_weight} kg
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Price:</strong> £{selectedOrder.price?.toFixed(2)}
                      </Typography>
                      {selectedOrder.promo_code && (
                        <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600 }}>
                          Promo: {selectedOrder.promo_code} (-£{selectedOrder.discount_amount?.toFixed(2)})
                        </Typography>
                      )}
                    </Grid>
                    {selectedOrder.parcel_image_url && (
                      <Grid item xs={12} md={4}>
                        <img 
                          src={selectedOrder.parcel_image_url} 
                          alt="Parcel" 
                          style={{ width: '100%', maxWidth: 200, height: 'auto', objectFit: 'cover', borderRadius: 8 }} 
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600, fontSize: 10, letterSpacing: 0.5, mb: 1, display: 'block' }}>
                  Pickup Details
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Date:</strong> {selectedOrder.pickup_date || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Time:</strong> {selectedOrder.pickup_time || 'N/A'}
                  </Typography>
                  {selectedOrder.special_instructions && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Special Instructions:</strong><br />
                      {selectedOrder.special_instructions}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase', fontWeight: 600, fontSize: 10, letterSpacing: 0.5, mb: 1, display: 'block' }}>
                  Status Management
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Delivery Status</InputLabel>
                      <Select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        label="Delivery Status"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="parcel_collected">Parcel Collected</MenuItem>
                        <MenuItem value="in-transit">In Transit</MenuItem>
                        <MenuItem value="at-warehouse">At Warehouse</MenuItem>
                        <MenuItem value="customs-clearance">Customs Clearance</MenuItem>
                        <MenuItem value="out-for-delivery">Out for Delivery</MenuItem>
                        <MenuItem value="delivered">Delivered</MenuItem>
                        <MenuItem value="failed-delivery">Failed Delivery</MenuItem>
                        <MenuItem value="returned">Returned</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Warehouse Status</InputLabel>
                      <Select
                        value={selectedOrder.warehouse_status || 'not_arrived'}
                        onChange={(e) => handleUpdateWarehouseStatus(e.target.value)}
                        label="Warehouse Status"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="not_arrived">Not Arrived</MenuItem>
                        <MenuItem value="arrived">Arrived</MenuItem>
                        <MenuItem value="in_warehouse">In Warehouse</MenuItem>
                        <MenuItem value="ready_to_ship">Ready to Ship</MenuItem>
                        <MenuItem value="shipped">Shipped</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #F5F7FA' }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              textTransform: 'none',
              color: '#666',
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained"
            sx={{ 
              bgcolor: '#0B1A33',
              textTransform: 'none',
              px: 3,
              boxShadow: '0 4px 12px rgba(11, 26, 51, 0.3)',
              '&:hover': { 
                bgcolor: '#152847',
                boxShadow: '0 6px 16px rgba(11, 26, 51, 0.4)' 
              },
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
      {/* Label Print Dialog */}
      <Dialog open={labelDialogOpen} onClose={() => setLabelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1A1A1A', borderBottom: '1px solid #F5F7FA' }}>
          Print Shipment Label
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 220 }}>
          {labelLoading && <Typography sx={{ mt: 4 }}>Loading label...</Typography>}
          {labelError && <Typography color="error">{labelError}</Typography>}
          {labelImageUrl && (
            <img src={labelImageUrl} alt="Shipment Label" style={{ width: 320, margin: '16px 0', borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #F5F7FA' }}>
          <Button onClick={() => setLabelDialogOpen(false)} sx={{ color: '#666' }}>Close</Button>
          <Button onClick={handleDownloadLabel} startIcon={<DownloadIcon />} disabled={!labelImageUrl} sx={{ textTransform: 'none' }}>Download</Button>
          <Button onClick={handlePrintLabelImage} startIcon={<PrintIcon />} disabled={!labelImageUrl} variant="contained" sx={{ bgcolor: '#0B1A33', textTransform: 'none', '&:hover': { bgcolor: '#152847' } }}>Print</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Orders;
