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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      'in-transit': 'info',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Orders Management</Typography>
        <TextField
          label="Search orders"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tracking #</TableCell>
              <TableCell>Sender</TableCell>
              <TableCell>Receiver</TableCell>
              <TableCell>Pickup Location</TableCell>
              <TableCell>Delivery Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.tracking_number}</TableCell>
                <TableCell>{order.sender_name}</TableCell>
                <TableCell>{order.receiver_name}</TableCell>
                <TableCell>{order.pickup_city}</TableCell>
                <TableCell>{order.delivery_city}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.payment_status}
                    color={order.payment_status === 'paid' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>GH₵{order.price?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewOrder(order)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Tracking Number: {selectedOrder.tracking_number}
              </Typography>

              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Sender Information
                </Typography>
                <Typography>Name: {selectedOrder.sender_name}</Typography>
                <Typography>Phone: {selectedOrder.sender_phone}</Typography>
                <Typography>Address: {selectedOrder.pickup_address}</Typography>
                <Typography>City: {selectedOrder.pickup_city}</Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Receiver Information
                </Typography>
                <Typography>Name: {selectedOrder.receiver_name}</Typography>
                <Typography>Phone: {selectedOrder.receiver_phone}</Typography>
                <Typography>Address: {selectedOrder.delivery_address}</Typography>
                <Typography>City: {selectedOrder.delivery_city}</Typography>
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Parcel Details
                </Typography>
                <Typography>Type: {selectedOrder.parcel_type}</Typography>
                <Typography>Size: {selectedOrder.parcel_size}</Typography>
                <Typography>Weight: {selectedOrder.parcel_weight} kg</Typography>
                <Typography>Price: GH₵{selectedOrder.price?.toFixed(2)}</Typography>
              </Box>

              <Box mt={3}>
                <FormControl fullWidth>
                  <InputLabel>Update Status</InputLabel>
                  <Select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    label="Update Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in-transit">In Transit</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Orders;
