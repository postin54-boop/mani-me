import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
  Skeleton,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Store as PickupIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

const STATUS_COLORS = {
  pending: 'warning',
  processing: 'info',
  ready: 'success',
  delivered: 'success',
  completed: 'default',
  cancelled: 'error',
};

export default function PackagingOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({ status: '', payment_status: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage };
      const res = await api.get('/api/shop/orders', { params });
      const ordersData = res.data.orders || res.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setTotalCount(res.data.pagination?.total || ordersData.length || 0);
    } catch (error) {
      logger.error('Fetch orders error:', error);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = (order) => {
    setSelectedOrder(order);
    setUpdateData({
      status: order.status,
      payment_status: order.payment_status,
      notes: order.notes || ''
    });
    setDialogOpen(true);
  };

  const handleSaveUpdate = async () => {
    try {
      const res = await api.put(`/api/shop/orders/${selectedOrder._id}`, updateData);
      setOrders(orders.map(o => (o._id === res.data._id ? res.data : o)));
      setDialogOpen(false);
    } catch (error) {
      logger.error('Update order error:', error);
    }
  };

  const getTotalRevenue = () => {
    return orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total_amount, 0)
      .toFixed(2);
  };

  const getPendingOrders = () => {
    return orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Packaging Orders</Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{orders.length}</Typography>
            <Typography color="text.secondary">Total Orders</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{getPendingOrders()}</Typography>
            <Typography color="text.secondary">Pending Orders</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">£{getTotalRevenue()}</Typography>
            <Typography color="text.secondary">Total Revenue</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {[...Array(9)].map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">No orders found</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {order._id.slice(-8)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{order.user_id?.name || 'Unknown'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.user_id?.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">{(order.items || []).length} items</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {(order.items || []).map((item, idx) => (
                        <Typography key={idx} variant="caption" display="block">
                          {item.name} x{item.quantity} - £{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </Typography>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    £{(order.total_amount || 0).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {order.fulfillment_method === 'delivery' ? (
                    <Chip 
                      icon={<DeliveryIcon />} 
                      label="Delivery" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  ) : (
                    <Chip 
                      icon={<PickupIcon />} 
                      label="Pickup" 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  )}
                  {order.fulfillment_method === 'delivery' && order.delivery_address && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {order.delivery_address.city}, {order.delivery_address.postcode}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={order.status} 
                    size="small" 
                    color={STATUS_COLORS[order.status] || 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={order.payment_status} 
                    size="small" 
                    color={order.payment_status === 'paid' ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => handleUpdateOrder(order)}>
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Update Order Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Order</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Order ID: <strong>{selectedOrder._id.slice(-8)}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Customer: <strong>{selectedOrder.user_id?.name}</strong>
              </Typography>
              <TextField
                fullWidth
                select
                label="Order Status"
                value={updateData.status}
                onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                margin="normal"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="ready">Ready for Pickup/Delivery</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                label="Payment Status"
                value={updateData.payment_status}
                onChange={(e) => setUpdateData({ ...updateData, payment_status: e.target.value })}
                margin="normal"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={updateData.notes}
                onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUpdate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
