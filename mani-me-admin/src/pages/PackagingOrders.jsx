import React, { useState, useEffect, useRef } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Store as PickupIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Print as PrintIcon,
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
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', payment_status: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const printRef = useRef();

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

  const handlePrintLabel = (order) => {
    setPrintOrder(order);
    setPrintDialogOpen(true);
  };

  const executePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Label - ${printOrder._id.slice(-8)}</title>
          <style>
            @page { size: 4in 6in; margin: 0; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 16px;
              width: 4in;
              height: 6in;
              box-sizing: border-box;
            }
            .label-container {
              border: 2px solid #000;
              padding: 12px;
              height: calc(100% - 4px);
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .logo { font-size: 24px; font-weight: bold; }
            .order-id { font-size: 14px; margin-top: 4px; }
            .section { margin-bottom: 12px; }
            .section-title { 
              font-size: 10px; 
              font-weight: bold; 
              text-transform: uppercase; 
              color: #666;
              margin-bottom: 4px;
            }
            .address {
              font-size: 14px;
              line-height: 1.4;
            }
            .customer-name { font-size: 18px; font-weight: bold; }
            .items-section {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 8px 0;
              margin: 8px 0;
              flex-grow: 1;
            }
            .item { font-size: 11px; margin: 2px 0; }
            .barcode {
              text-align: center;
              margin-top: auto;
              padding-top: 8px;
              border-top: 2px solid #000;
            }
            .barcode-text { 
              font-family: 'Courier New', monospace; 
              font-size: 16px; 
              letter-spacing: 2px;
            }
            .total { font-weight: bold; font-size: 14px; margin-top: 4px; }
            .method { font-size: 12px; font-weight: bold; color: #333; margin-top: 4px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    setPrintDialogOpen(false);
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
                  <Typography variant="body2">{order.user_id?.fullName || 'Unknown'}</Typography>
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
                  <Tooltip title="Print Label">
                    <IconButton 
                      size="small" 
                      onClick={() => handlePrintLabel(order)}
                      color="primary"
                    >
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
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

      {/* Print Label Dialog */}
      <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PrintIcon /> Print Shipping Label
          </Box>
        </DialogTitle>
        <DialogContent>
          {printOrder && (
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <div ref={printRef}>
                <div className="label-container">
                  <div className="header">
                    <div className="logo">MANI ME</div>
                    <div className="order-id">Order: #{printOrder._id.slice(-8)}</div>
                  </div>
                  
                  <div className="section">
                    <div className="section-title">Customer:</div>
                    <div className="customer-name">{printOrder.user_id?.name || 'Customer'}</div>
                    {printOrder.user_id?.email && <div className="address">{printOrder.user_id.email}</div>}
                    {printOrder.user_id?.phone && <div className="address">Tel: {printOrder.user_id.phone}</div>}
                  </div>

                  {printOrder.fulfillment_method === 'delivery' && printOrder.delivery_address && (
                    <div className="section">
                      <div className="section-title">Ship To:</div>
                      <div className="address">
                        {printOrder.delivery_address.street && <div>{printOrder.delivery_address.street}</div>}
                        {printOrder.delivery_address.city && <div>{printOrder.delivery_address.city}, {printOrder.delivery_address.postcode || ''}</div>}
                        {printOrder.delivery_address.country && <div><strong>{printOrder.delivery_address.country}</strong></div>}
                      </div>
                    </div>
                  )}
                  
                  <div className="items-section">
                    <div className="section-title">Contents ({(printOrder.items || []).length} items):</div>
                    {(printOrder.items || []).slice(0, 8).map((item, idx) => (
                      <div className="item" key={idx}>• {item.name} x{item.quantity}</div>
                    ))}
                    {(printOrder.items || []).length > 8 && (
                      <div className="item">... and {printOrder.items.length - 8} more items</div>
                    )}
                    <div className="total">Total: £{(printOrder.total_amount || 0).toFixed(2)}</div>
                    <div className="method">Method: {printOrder.fulfillment_method === 'delivery' ? 'DELIVERY' : 'PICKUP'}</div>
                  </div>
                  
                  <div className="barcode">
                    <div className="section-title">Order Reference</div>
                    <div className="barcode-text">{printOrder._id.slice(-12).toUpperCase()}</div>
                  </div>
                </div>
              </div>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
          <Button onClick={executePrint} variant="contained" startIcon={<PrintIcon />}>
            Print Label
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
