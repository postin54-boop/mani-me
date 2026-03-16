import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  LocalOffer as PromoIcon,
  Notifications as NotificationIcon,
  Send as SendIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../api';
import logger from '../utils/logger';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Marketing() {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ==================== BROADCASTS STATE ====================
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);
  const [broadcastForm, setBroadcastForm] = useState({
    type: 'marketing',
    title: '',
    message: '',
    promoCode: '',
    discount: '',
    expiresAt: '',
    targetScreen: 'Home',
  });

  // ==================== PROMO CODES STATE ====================
  const [promoCodes, setPromoCodes] = useState([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [promoStats, setPromoStats] = useState({ totalActive: 0, totalUsage: 0, totalDiscountGiven: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    description: '',
    expiryDate: '',
    usageLimit: '',
    minOrderValue: '',
    maxDiscount: '',
  });

  // ==================== BROADCASTS FUNCTIONS ====================
  const fetchUserCount = async () => {
    try {
      const response = await api.get('/api/admin/users?limit=1');
      setUserCount(response.data.pagination?.total || response.data.users?.length || 0);
    } catch (error) {
      logger.error('Failed to fetch user count', error);
    }
  };

  const fetchRecentBroadcasts = async () => {
    try {
      const response = await api.get('/api/notifications?limit=10');
      const broadcasts = (response.data.notifications || []).filter(
        n => n.data?.type === 'promo' || n.data?.type === 'marketing'
      );
      setRecentBroadcasts(broadcasts.slice(0, 5));
    } catch (error) {
      logger.error('Failed to fetch recent broadcasts', error);
    }
  };

  const handleBroadcastInputChange = (field) => (event) => {
    setBroadcastForm({ ...broadcastForm, [field]: event.target.value });
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      setSnackbar({ open: true, message: 'Title and message are required', severity: 'error' });
      return;
    }

    if (broadcastForm.type === 'promo' && !broadcastForm.promoCode.trim()) {
      setSnackbar({ open: true, message: 'Promo code is required for promotional notifications', severity: 'error' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to send this notification to all ${userCount} users?\n\nTitle: ${broadcastForm.title}\nMessage: ${broadcastForm.message}`
    );

    if (!confirmed) return;

    setBroadcastLoading(true);
    try {
      const payload = {
        title: broadcastForm.title,
        message: broadcastForm.message,
        type: broadcastForm.type,
        targetScreen: broadcastForm.targetScreen,
      };

      if (broadcastForm.type === 'promo') {
        payload.promoCode = broadcastForm.promoCode;
        payload.discount = broadcastForm.discount;
        if (broadcastForm.expiresAt) {
          payload.expiresAt = broadcastForm.expiresAt;
        }
      }

      const response = await api.post('/api/notifications/broadcast', payload);
      
      setSnackbar({ 
        open: true, 
        message: `Broadcast sent successfully! ${response.data.results?.sent || 0} users notified.`, 
        severity: 'success' 
      });

      setBroadcastForm({
        type: 'marketing',
        title: '',
        message: '',
        promoCode: '',
        discount: '',
        expiresAt: '',
        targetScreen: 'Home',
      });

      fetchRecentBroadcasts();
    } catch (error) {
      logger.error('Failed to send broadcast', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to send broadcast', 
        severity: 'error' 
      });
    } finally {
      setBroadcastLoading(false);
    }
  };

  const templates = [
    { name: 'New Promo', type: 'promo', title: '🎉 Special Offer!', message: 'Use code {CODE} to get {DISCOUNT} off your next booking!', promoCode: 'SAVE20', discount: '20%' },
    { name: 'Free Shipping', type: 'promo', title: '🚚 Free Shipping Weekend!', message: 'Book this weekend and enjoy FREE shipping on all parcels to Ghana!', promoCode: 'FREESHIP', discount: 'Free Shipping' },
    { name: 'Holiday Sale', type: 'promo', title: '🎄 Holiday Special!', message: 'Send love home this holiday season! Get {DISCOUNT} off with code {CODE}', promoCode: 'HOLIDAY25', discount: '25%' },
    { name: 'General Update', type: 'marketing', title: '📦 Service Update', message: 'We have exciting news! Check out our latest features in the app.' },
    { name: 'New Feature', type: 'marketing', title: '✨ New Feature Alert!', message: 'Track your parcels in real-time with our new live tracking feature!' },
  ];

  const applyTemplate = (template) => {
    setBroadcastForm({
      ...broadcastForm,
      type: template.type,
      title: template.title,
      message: template.message,
      promoCode: template.promoCode || '',
      discount: template.discount || '',
    });
  };

  // ==================== PROMO CODES FUNCTIONS ====================
  const fetchPromoCodes = useCallback(async () => {
    try {
      setPromoLoading(true);
      const response = await api.get('/api/promo-codes', {
        params: { page: page + 1, limit: rowsPerPage }
      });
      setPromoCodes(response.data.promoCodes || []);
      setTotalCount(response.data.pagination?.total || response.data.total || 0);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
      setSnackbar({ open: true, message: 'Failed to load promo codes', severity: 'error' });
    } finally {
      setPromoLoading(false);
    }
  }, [page, rowsPerPage]);

  const fetchPromoStats = useCallback(async () => {
    try {
      const response = await api.get('/api/promo-codes/stats/overview');
      setPromoStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const handleOpenDialog = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoForm({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        description: promo.description || '',
        expiryDate: promo.expiryDate ? promo.expiryDate.split('T')[0] : '',
        usageLimit: promo.usageLimit,
        minOrderValue: promo.minOrderValue || 0,
        maxDiscount: promo.maxDiscount || '',
      });
    } else {
      setEditingPromo(null);
      setPromoForm({
        code: '',
        type: 'percentage',
        value: '',
        description: '',
        expiryDate: '',
        usageLimit: '',
        minOrderValue: '',
        maxDiscount: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPromo(null);
  };

  const handleSavePromo = async () => {
    try {
      setSaving(true);
      const payload = {
        code: promoForm.code.toUpperCase(),
        type: promoForm.type,
        value: Number(promoForm.value),
        description: promoForm.description,
        expiryDate: promoForm.expiryDate,
        usageLimit: Number(promoForm.usageLimit),
        minOrderValue: Number(promoForm.minOrderValue) || 0,
        maxDiscount: promoForm.maxDiscount ? Number(promoForm.maxDiscount) : null,
      };

      if (editingPromo) {
        await api.put(`/api/promo-codes/${editingPromo._id}`, payload);
        setSnackbar({ open: true, message: 'Promo code updated successfully', severity: 'success' });
      } else {
        await api.post('/api/promo-codes', payload);
        setSnackbar({ open: true, message: 'Promo code created successfully', severity: 'success' });
      }
      handleCloseDialog();
      fetchPromoCodes();
      fetchPromoStats();
    } catch (err) {
      console.error('Error saving promo code:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to save promo code', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromo = async (id) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await api.delete(`/api/promo-codes/${id}`);
        setSnackbar({ open: true, message: 'Promo code deleted', severity: 'success' });
        fetchPromoCodes();
        fetchPromoStats();
      } catch (err) {
        console.error('Error deleting promo code:', err);
        setSnackbar({ open: true, message: 'Failed to delete promo code', severity: 'error' });
      }
    }
  };

  const handleToggleStatus = async (promo) => {
    try {
      const newStatus = promo.status === 'active' ? 'inactive' : 'active';
      await api.put(`/api/promo-codes/${promo._id}`, { status: newStatus });
      setSnackbar({ open: true, message: `Promo code ${newStatus}`, severity: 'success' });
      fetchPromoCodes();
      fetchPromoStats();
    } catch (err) {
      console.error('Error toggling status:', err);
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchUserCount();
    fetchRecentBroadcasts();
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      fetchPromoCodes();
      fetchPromoStats();
    }
  }, [tabValue, fetchPromoCodes, fetchPromoStats]);

  // ==================== RENDER ====================
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Marketing & Promotions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage broadcasts, promo codes, and marketing campaigns
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<CampaignIcon />} 
            iconPosition="start" 
            label="Broadcasts" 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<PromoIcon />} 
            iconPosition="start" 
            label="Promo Codes" 
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Paper>

      {/* ==================== BROADCASTS TAB ==================== */}
      <TabPanel value={tabValue} index={0}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{userCount}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Users</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <CampaignIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{recentBroadcasts.length}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Recent Broadcasts</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <NotificationIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>Instant</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Delivery Speed</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Broadcast Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SendIcon color="primary" />
                Create Broadcast
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Notification Type</InputLabel>
                    <Select
                      value={broadcastForm.type}
                      label="Notification Type"
                      onChange={handleBroadcastInputChange('type')}
                    >
                      <MenuItem value="marketing">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CampaignIcon fontSize="small" color="primary" />
                          Marketing / Announcement
                        </Box>
                      </MenuItem>
                      <MenuItem value="promo">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PromoIcon fontSize="small" color="success" />
                          Promotional / Promo Code
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Open Screen on Tap</InputLabel>
                    <Select
                      value={broadcastForm.targetScreen}
                      label="Open Screen on Tap"
                      onChange={handleBroadcastInputChange('targetScreen')}
                    >
                      <MenuItem value="Home">Home Screen</MenuItem>
                      <MenuItem value="BookingScreen">Booking Screen</MenuItem>
                      <MenuItem value="TrackingScreen">Tracking Screen</MenuItem>
                      <MenuItem value="GroceryShop">Grocery Shop</MenuItem>
                      <MenuItem value="Profile">Profile</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notification Title"
                    value={broadcastForm.title}
                    onChange={handleBroadcastInputChange('title')}
                    placeholder="e.g., 🎉 Special Offer!"
                    helperText="Use emojis to make it eye-catching!"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Message"
                    value={broadcastForm.message}
                    onChange={handleBroadcastInputChange('message')}
                    placeholder="Write your notification message here..."
                    helperText={`${broadcastForm.message.length}/200 characters recommended`}
                  />
                </Grid>

                {broadcastForm.type === 'promo' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Promo Code"
                        value={broadcastForm.promoCode}
                        onChange={handleBroadcastInputChange('promoCode')}
                        placeholder="e.g., SAVE20"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Discount"
                        value={broadcastForm.discount}
                        onChange={handleBroadcastInputChange('discount')}
                        placeholder="e.g., 20% off"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Expires At"
                        value={broadcastForm.expiresAt}
                        onChange={handleBroadcastInputChange('expiresAt')}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => setBroadcastForm({
                        type: 'marketing',
                        title: '',
                        message: '',
                        promoCode: '',
                        discount: '',
                        expiresAt: '',
                        targetScreen: 'Home',
                      })}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={broadcastLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                      onClick={handleSendBroadcast}
                      disabled={broadcastLoading || !broadcastForm.title || !broadcastForm.message}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        px: 4,
                      }}
                    >
                      {broadcastLoading ? 'Sending...' : `Send to ${userCount} Users`}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Preview Card */}
            <Paper sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: '#f8f9fa' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                📱 Preview (how it will appear on user's phone)
              </Typography>
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: 2,
                  p: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                  maxWidth: 400,
                }}
              >
                <Avatar sx={{ bgcolor: '#0B1A33', width: 40, height: 40 }}>
                  <img src="/logo.png" alt="Mani Me" style={{ width: 24, height: 24 }} onError={(e) => e.target.style.display = 'none'} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {broadcastForm.title || 'Notification Title'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {broadcastForm.message || 'Your message will appear here...'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    now
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Templates & History */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PromoIcon color="success" />
                Quick Templates
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {templates.map((template, index) => (
                  <Chip
                    key={index}
                    label={template.name}
                    onClick={() => applyTemplate(template)}
                    color={template.type === 'promo' ? 'success' : 'primary'}
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="info" />
                Recent Broadcasts
              </Typography>
              <Divider sx={{ my: 2 }} />
              {recentBroadcasts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                  No recent broadcasts
                </Typography>
              ) : (
                <List dense>
                  {recentBroadcasts.map((broadcast, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {broadcast.data?.type === 'promo' ? (
                          <PromoIcon color="success" fontSize="small" />
                        ) : (
                          <CampaignIcon color="primary" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={broadcast.title}
                        secondary={new Date(broadcast.createdAt).toLocaleDateString()}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* ==================== PROMO CODES TAB ==================== */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>Manage Promo Codes</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { fetchPromoCodes(); fetchPromoStats(); }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Promo Code
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Active Promos</Typography>
                    <Typography variant="h4">{promoStats.totalActive || 0}</Typography>
                  </Box>
                  <PromoIcon sx={{ fontSize: 40, color: '#2196F3' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Total Usage</Typography>
                    <Typography variant="h4">{promoStats.totalUsage || 0}</Typography>
                  </Box>
                  <TrendingIcon sx={{ fontSize: 40, color: '#4CAF50' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>Discount Given</Typography>
                    <Typography variant="h4">£{(promoStats.totalDiscountGiven || 0).toFixed(2)}</Typography>
                  </Box>
                  <PromoIcon sx={{ fontSize: 40, color: '#FF9800' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Promo Codes Table */}
        {promoLoading && promoCodes.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Discount</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Expiry</strong></TableCell>
                  <TableCell><strong>Usage</strong></TableCell>
                  <TableCell><strong>Min Order</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo._id}>
                    <TableCell>
                      <Chip 
                        label={promo.code} 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={promo.type} 
                        size="small"
                        color={promo.type === 'percentage' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <strong>
                        {promo.type === 'percentage' ? `${promo.value}%` : `£${promo.value}`}
                      </strong>
                    </TableCell>
                    <TableCell>{promo.description}</TableCell>
                    <TableCell>{new Date(promo.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${promo.usedCount || 0}/${promo.usageLimit}`}
                        size="small"
                        color={(promo.usedCount || 0) >= promo.usageLimit ? 'error' : 'success'}
                      />
                    </TableCell>
                    <TableCell>£{promo.minOrderValue || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={promo.status}
                        size="small"
                        color={promo.status === 'active' ? 'success' : 'default'}
                        onClick={() => handleToggleStatus(promo)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog(promo)} size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeletePromo(promo._id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </TableContainer>
        )}
      </TabPanel>

      {/* Promo Code Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Promo Code"
              fullWidth
              value={promoForm.code}
              onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g., WELCOME10"
              helperText="Use uppercase letters and numbers"
            />

            <FormControl fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={promoForm.type}
                label="Discount Type"
                onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount (£)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={promoForm.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount (£)'}
              type="number"
              fullWidth
              value={promoForm.value}
              onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })}
              placeholder={promoForm.type === 'percentage' ? '10' : '5'}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={promoForm.description}
              onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
              placeholder="Brief description of the offer"
            />

            <TextField
              label="Expiry Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={promoForm.expiryDate}
              onChange={(e) => setPromoForm({ ...promoForm, expiryDate: e.target.value })}
            />

            <TextField
              label="Usage Limit"
              type="number"
              fullWidth
              value={promoForm.usageLimit}
              onChange={(e) => setPromoForm({ ...promoForm, usageLimit: e.target.value })}
              placeholder="Maximum number of uses"
            />

            <TextField
              label="Minimum Order Value (£)"
              type="number"
              fullWidth
              value={promoForm.minOrderValue}
              onChange={(e) => setPromoForm({ ...promoForm, minOrderValue: e.target.value })}
              placeholder="Minimum order amount to use this code"
            />

            {promoForm.type === 'percentage' && (
              <TextField
                label="Max Discount (£)"
                type="number"
                fullWidth
                value={promoForm.maxDiscount}
                onChange={(e) => setPromoForm({ ...promoForm, maxDiscount: e.target.value })}
                placeholder="Optional: Cap the maximum discount"
                helperText="Leave empty for no cap"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button 
            onClick={handleSavePromo} 
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {editingPromo ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
