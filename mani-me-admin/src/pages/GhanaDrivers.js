
import React, { useState, useEffect } from "react";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

import {
  LocalShipping,
  Warehouse,
  DirectionsCar,
  CheckCircle,
  PersonAdd,
} from "@mui/icons-material";

const GhanaDrivers = () => {
  // Stat dialog state
  const [statDialog, setStatDialog] = useState({ open: false, type: '' });

  // Snackbar state for feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Card click handler with feedback
  const handleStatCardClick = (type, label) => {
    setStatDialog({ open: true, type });
    setSnackbar({ open: true, message: `${label} details opened`, severity: 'info' });
  };

  /* -------------------- STATE -------------------- */

  const [drivers, setDrivers] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch Ghana drivers and pending deliveries
      const [driversRes, deliveriesRes] = await Promise.all([
        api.get('/api/admin/drivers/ghana', config),
        api.get('/api/admin/deliveries/pending', config),
      ]);

      setDrivers(driversRes.data);
      setPendingDeliveries(deliveriesRes.data);
    } catch (error) {
      logger.error('Failed to fetch data:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = (delivery) => {
    setSelectedDelivery(delivery);
    setAssignDialogOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (selectedDriver && selectedDelivery) {
      try {
        const token = localStorage.getItem('adminToken');
        await api.put(
          `/admin/shipments/${selectedDelivery.id}/assign-delivery-driver`,
          { driver_id: selectedDriver },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Refresh data
        await fetchData();
        setAssignDialogOpen(false);
        setSelectedDelivery(null);
        setSelectedDriver('');
        setSnackbar({ open: true, message: 'Delivery driver assigned successfully', severity: 'success' });
      } catch (error) {
        logger.error('Failed to assign driver:', error);
        setError(getErrorMessage(error));
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Stat card logic (must be after warehouseParcels, assignedDeliveries, completedDeliveries)
  const totalRevenue = 12500; // Example: $12,500
  const totalActiveUsers = 87; // Example: 87 users
  const totalOrders = drivers.reduce((sum, d) => sum + (d.completedDeliveries || 0), 0);
  const pendingOrders = pendingDeliveries.length;
  const marketingCampaigns = [
    { name: 'Holiday Promo', status: 'Active', reach: 1200 },
    { name: 'Refer a Friend', status: 'Completed', reach: 800 },
  ];

  const statLogic = {
    totalRevenue: {
      title: 'Total Revenue',
      description: 'Sum of all completed deliveries. (Dummy value, replace with real calculation.)',
      render: () => (
        <Typography variant="h5" color="primary">${totalRevenue.toLocaleString()}</Typography>
      )
    },
    totalActiveUsers: {
      title: 'Total Active Users',
      description: 'Number of users who have placed orders or are currently active. (Dummy value, replace with real calculation.)',
      render: () => (
        <Typography variant="h5" color="primary">{totalActiveUsers}</Typography>
      )
    },
    totalOrders: {
      title: 'Total Orders',
      description: 'Sum of all orders (warehouse, assigned, and completed).',
      render: () => (
        <Typography variant="h5" color="primary">{totalOrders}</Typography>
      )
    },
    pendingOrders: {
      title: 'Pending Orders',
      description: 'Orders in warehouse not yet cleared for delivery.',
      render: () => (
        <Typography variant="body2" color="textSecondary">No warehouse logic present.</Typography>
      )
    },
    marketing: {
      title: 'Marketing Campaigns',
      description: 'Current and past marketing campaigns.',
      render: () => (
        <List>
          {marketingCampaigns.map((c, i) => (
            <ListItem key={c.name + i}>
              <ListItemText primary={c.name} secondary={`Status: ${c.status} • Reach: ${c.reach}`} />
              <Chip label={c.status} color={c.status === 'Active' ? 'success' : 'default'} />
            </ListItem>
          ))}
        </List>
      )
    }
  };

  const currentStat = statDialog.type ? statLogic[statDialog.type] : null;

  /* -------------------- HANDLERS -------------------- */

  const handleMarkDelivered = async (shipmentId) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/admin/orders/${shipmentId}/status`,
        { status: 'delivered' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
      setSnackbar({ open: true, message: 'Delivery marked as completed', severity: 'success' });
    } catch (error) {
      logger.error('Failed to mark as delivered:', error);
      setError(getErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  /* -------------------- CATEGORY HANDLER -------------------- */
  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert('Category already exists.');
      return;
    }
    setCatLoading(true);
    setCatError('');
    try {
      const res = await api.post('/categories', { name: trimmed });
      setCategories([res.data.name, ...categories]);
      setNewCategory('');
    } catch (err) {
      setCatError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setCatLoading(false);
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <Box p={3}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" fontWeight={700} mb={3}>
        Ghana Driver & Warehouse
      </Typography>

      {/* DASHBOARD STATS */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <LocalShipping sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {drivers.filter((d) => d.is_active).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Active Drivers
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Warehouse sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {pendingDeliveries.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Pending Deliveries
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircle sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {drivers.reduce((sum, d) => sum + (d.completedDeliveries || 0), 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Completed Today
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PENDING DELIVERIES */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#071D33' }}>
              Ghana Drivers
            </Typography>
            <List>
              {drivers.map((driver) => (
                <React.Fragment key={driver.id}>
                  <ListItem sx={{ px: 0 }}>
                    <Avatar sx={{ mr: 2, bgcolor: driver.is_active ? '#83C5FA' : '#CCC' }}>
                      {driver.fullName?.charAt(0) || 'D'}
                    </Avatar>
                    <ListItemText
                      primary={driver.fullName || driver.email}
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip
                            label={driver.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={driver.is_active ? 'success' : 'default'}
                            sx={{ height: 20 }}
                          />
                          <Chip
                            label={driver.phone || 'No phone'}
                            size="small"
                            sx={{ height: 20 }}
                          />
                        </Stack>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {drivers.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No drivers found
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#071D33' }}>
              Pending Deliveries (Cleared Customs)
            </Typography>
            <List>
              {pendingDeliveries.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No pending deliveries
                </Typography>
              ) : (
                pendingDeliveries.map((delivery) => (
                  <React.Fragment key={delivery.id}>
                    <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                              {delivery.user?.fullName || 'Customer'}
                            </Typography>
                            <Chip label={delivery.tracking_number || delivery.id} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Delivery Address: {delivery.delivery_address || 'Not provided'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Phone: {delivery.user?.phone || 'Not provided'}
                            </Typography>
                            <Chip 
                              label={`Status: ${delivery.status}`} 
                              size="small" 
                              color="warning" 
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PersonAdd />}
                          onClick={() => handleAssignClick(delivery)}
                          sx={{
                            bgcolor: '#83C5FA',
                            color: '#071D33',
                            '&:hover': { bgcolor: '#6ab3e8' },
                          }}
                        >
                          Assign
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* SNACKBAR FEEDBACK */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert elevation={6} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>


      {/* STAT DIALOG */}
      <Dialog open={statDialog.open} onClose={() => setStatDialog({ open: false, type: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>{currentStat?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            {currentStat?.description}
          </Typography>
          {currentStat?.render ? currentStat.render() : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatDialog({ open: false, type: '' })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* DRIVERS */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" mb={2}>
          Drivers
        </Typography>
        {loading ? (
          <Typography>Loading drivers...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <List>
            {drivers.map((driver) => (
              <ListItem key={driver.id}>
                <Avatar sx={{ mr: 2 }}>{(driver.fullName || driver.email || 'D').charAt(0).toUpperCase()}</Avatar>
                <ListItemText
                  primary={driver.fullName || driver.email}
                  secondary={`${driver.phone || 'No phone'}`}
                />
                <Chip
                  label={driver.is_active ? "Active" : "Inactive"}
                  color={driver.is_active ? "success" : "default"}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>



      {/* ASSIGN DIALOG */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Delivery Driver</DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Delivery Details
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {selectedDelivery.user?.fullName || 'Customer'} - {selectedDelivery.tracking_number || selectedDelivery.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDelivery.delivery_address || 'No delivery address'}
              </Typography>
            </Box>
          )}
          <FormControl fullWidth>
            <InputLabel>Select Driver</InputLabel>
            <Select
              value={selectedDriver}
              label="Select Driver"
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              {drivers
                .filter((d) => d.is_active)
                .map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.fullName || d.email}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAssignConfirm}
            disabled={!selectedDriver}
            sx={{ bgcolor: '#071D33', '&:hover': { bgcolor: '#0a2a4a' } }}
          >
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GhanaDrivers;


