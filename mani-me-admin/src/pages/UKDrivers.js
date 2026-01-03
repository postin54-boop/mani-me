import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Stack,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocalShipping,
  Assignment,
  CheckCircle,
  Map,
  Warehouse,
  Add,
  Delete,
  PersonAdd,
  Room,
  Phone,
  AccessTime,
} from '@mui/icons-material';
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

const UKDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [assignedPickups, setAssignedPickups] = useState([]);
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [newPickupDialogOpen, setNewPickupDialogOpen] = useState(false);
  const [newPickupData, setNewPickupData] = useState({
    sender_name: '',
    sender_phone: '',
    sender_email: '',
    pickup_address: '',
    pickup_postcode: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    parcel_description: '',
    parcel_weight: '',
    parcel_size: 'small'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel (api interceptor adds auth header automatically)
      const [driversRes, pendingRes, assignedRes, warehouseRes] = await Promise.all([
        api.get('/api/admin/drivers/uk'),
        api.get('/api/admin/pickups/pending'),
        api.get('/api/admin/pickups/assigned'),
        api.get('/api/parcels'),
      ]);

      setDrivers(driversRes.data);
      setPendingPickups(pendingRes.data);
      setAssignedPickups(assignedRes.data);
      setWarehouseInventory(warehouseRes.data);
    } catch (error) {
      logger.error('Failed to fetch data:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = (pickup) => {
    setSelectedPickup(pickup);
    setAssignDialogOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (selectedDriver && selectedPickup) {
      try {
        await api.put(
          `/admin/shipments/${selectedPickup.id}/assign-pickup-driver`,
          { driver_id: selectedDriver },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Refresh data
        await fetchData();
        setAssignDialogOpen(false);
        setSelectedPickup(null);
        setSelectedDriver('');
      } catch (error) {
        logger.error('Failed to assign driver:', error);
        setError(getErrorMessage(error));
      }
    }
  };

  const handleUnassign = async (shipmentId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await api.put(
        `/admin/shipments/${shipmentId}/assign-pickup-driver`,
        { driver_id: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch (error) {
      logger.error('Failed to unassign driver:', error);
      setError(getErrorMessage(error));
    }
  };

  const handleMarkWarehouseArrival = async (shipmentId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await api.put(
        `/admin/orders/${shipmentId}/status`,
        { status: 'in_transit' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchData();
    } catch (error) {
      logger.error('Failed to update status:', error);
      setError(getErrorMessage(error));
    }
  };

  const handleNewPickupClick = () => {
    setNewPickupDialogOpen(true);
  };

  const handleNewPickupClose = () => {
    setNewPickupDialogOpen(false);
    setNewPickupData({
      sender_name: '',
      sender_phone: '',
      sender_email: '',
      pickup_address: '',
      pickup_postcode: '',
      receiver_name: '',
      receiver_phone: '',
      receiver_address: '',
      parcel_description: '',
      parcel_weight: '',
      parcel_size: 'small'
    });
  };

  const handleNewPickupChange = (field, value) => {
    setNewPickupData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewPickupSubmit = async () => {
    try {
      await api.post('/api/admin/shipments', newPickupData);
      await fetchData();
      handleNewPickupClose();
    } catch (error) {
      logger.error('Failed to create pickup:', error);
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

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#071D33', mb: 1 }}>
          UK Pickup Drivers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage pickup assignments, monitor routes, and track parcels entering the warehouse
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
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
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Assignment sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {pendingPickups.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Pending Pickups
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircle sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {assignedPickups.filter((p) => p.status === 'in-progress').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    In Progress
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Warehouse sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {warehouseInventory.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    At Warehouse
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active Drivers */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#071D33' }}>
              Active Drivers
            </Typography>
            <List>
              {drivers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No drivers registered
                </Typography>
              ) : (
                drivers.map((driver) => (
                  <React.Fragment key={driver.id}>
                    <ListItem sx={{ px: 0 }}>
                      <Avatar sx={{ bgcolor: '#83C5FA', mr: 2 }}>
                        {(driver.fullName || driver.email || 'D').charAt(0).toUpperCase()}
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
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Pending Pickups */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#071D33' }}>
                Pending Pickups
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleNewPickupClick}
                sx={{
                  bgcolor: '#071D33',
                  '&:hover': { bgcolor: '#0a2a4a' },
                }}
              >
                New Pickup
              </Button>
            </Box>
            <List>
              {pendingPickups.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No pending pickups
                </Typography>
              ) : (
                pendingPickups.map((pickup) => (
                  <React.Fragment key={pickup.id}>
                    <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                              {pickup.user?.fullName || 'Customer'}
                            </Typography>
                            <Chip label={pickup.tracking_number || pickup.id} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Room sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {pickup.pickup_address || 'No address'}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {pickup.user?.phone || 'No phone'}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {pickup.pickup_date} {pickup.pickup_time}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {pickup.special_instructions || 'No special instructions'}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PersonAdd />}
                          onClick={() => handleAssignClick(pickup)}
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

        {/* Assigned Pickups */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#071D33' }}>
              Assigned Pickups & Route Monitoring
            </Typography>
            <List>
              {assignedPickups.map((pickup) => (
                <React.Fragment key={pickup.id}>
                  <ListItem sx={{ px: 0, alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                            {pickup.customer}
                          </Typography>
                          <Chip label={pickup.id} size="small" variant="outlined" sx={{ mr: 1 }} />
                          <Chip
                            label={pickup.status === 'in-progress' ? 'In Progress' : pickup.status}
                            size="small"
                            color={pickup.status === 'in-progress' ? 'primary' : 'success'}
                          />
                          <Chip
                            label={`Driver: ${pickup.driverName}`}
                            size="small"
                            sx={{ ml: 1, bgcolor: '#f0f0f0' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Room sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {pickup.address}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {pickup.timeSlot} • {pickup.parcelType}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Map />}
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.pickup_address)}`, '_blank')}
                        >
                          View Route
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          startIcon={<Warehouse />}
                          onClick={() => handleMarkWarehouseArrival(pickup.id)}
                          disabled={pickup.status === 'picked_up'}
                        >
                          At Warehouse
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleUnassign(pickup.id)}
                          disabled={pickup.status === 'picked_up'}
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {assignedPickups.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No assigned pickups
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Warehouse Inventory */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#071D33' }}>
              Warehouse Inventory - Parcels Entered
            </Typography>
            <List>
              {warehouseInventory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No parcels in warehouse
                </Typography>
              ) : (
                warehouseInventory.map((item) => (
                  <React.Fragment key={item._id || item.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                              {item.sender_name || item.customer || 'Unknown'}
                            </Typography>
                            <Chip 
                              label={item.tracking_number || item.id} 
                              size="small" 
                              variant="outlined" 
                              sx={{ mr: 1 }} 
                            />
                            <Chip
                              label={item.warehouse_status || item.status || 'Received'}
                              size="small"
                              color={
                                item.warehouse_status === 'shipped' ? 'success' :
                                item.warehouse_status === 'packed' ? 'info' :
                                item.warehouse_status === 'sorted' ? 'primary' :
                                'default'
                              }
                              sx={{ mr: 1 }}
                            />
                            {item.size && (
                              <Chip
                                label={`${item.size} - ${item.weight || 'N/A'} kg`}
                                size="small"
                                sx={{ bgcolor: '#f0f0f0' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              To: {item.receiver_name || 'Unknown'} • {item.receiver_address || 'No address'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Location: {item.warehouseLocation || 'UK Warehouse'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Assign Driver Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Pickup to Driver</DialogTitle>
        <DialogContent>
          {selectedPickup && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Pickup Details
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {selectedPickup.user?.fullName || 'Customer'} - {selectedPickup.tracking_number || selectedPickup.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPickup.pickup_address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPickup.pickup_date} {selectedPickup.pickup_time}
              </Typography>
            </Box>
          )}
          <FormControl fullWidth>
            <InputLabel>Select Driver</InputLabel>
            <Select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              label="Select Driver"
            >
              {drivers
                .filter((d) => d.is_active)
                .map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.fullName || driver.email}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignConfirm}
            variant="contained"
            disabled={!selectedDriver}
            sx={{ bgcolor: '#071D33', '&:hover': { bgcolor: '#0a2a4a' } }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Pickup Dialog */}
      <Dialog open={newPickupDialogOpen} onClose={handleNewPickupClose} maxWidth="md" fullWidth>
        <DialogTitle>Create New Pickup</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Sender Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sender Name"
                  value={newPickupData.sender_name}
                  onChange={(e) => handleNewPickupChange('sender_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sender Phone"
                  value={newPickupData.sender_phone}
                  onChange={(e) => handleNewPickupChange('sender_phone', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sender Email"
                  type="email"
                  value={newPickupData.sender_email}
                  onChange={(e) => handleNewPickupChange('sender_email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Pickup Address"
                  value={newPickupData.pickup_address}
                  onChange={(e) => handleNewPickupChange('pickup_address', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Postcode"
                  value={newPickupData.pickup_postcode}
                  onChange={(e) => handleNewPickupChange('pickup_postcode', e.target.value)}
                  required
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>Receiver Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Receiver Name"
                  value={newPickupData.receiver_name}
                  onChange={(e) => handleNewPickupChange('receiver_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Receiver Phone"
                  value={newPickupData.receiver_phone}
                  onChange={(e) => handleNewPickupChange('receiver_phone', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Receiver Address (Ghana)"
                  value={newPickupData.receiver_address}
                  onChange={(e) => handleNewPickupChange('receiver_address', e.target.value)}
                  required
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>Parcel Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Parcel Description"
                  multiline
                  rows={2}
                  value={newPickupData.parcel_description}
                  onChange={(e) => handleNewPickupChange('parcel_description', e.target.value)}
                  placeholder="e.g., Electronics, Clothing, Documents"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={newPickupData.parcel_weight}
                  onChange={(e) => handleNewPickupChange('parcel_weight', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Parcel Size</InputLabel>
                  <Select
                    value={newPickupData.parcel_size}
                    onChange={(e) => handleNewPickupChange('parcel_size', e.target.value)}
                    label="Parcel Size"
                  >
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewPickupClose}>Cancel</Button>
          <Button
            onClick={handleNewPickupSubmit}
            variant="contained"
            disabled={!newPickupData.sender_name || !newPickupData.sender_phone || !newPickupData.pickup_address}
            sx={{ bgcolor: '#071D33', '&:hover': { bgcolor: '#0a2a4a' } }}
          >
            Create Pickup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UKDrivers;
