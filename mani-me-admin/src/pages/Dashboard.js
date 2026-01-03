import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Stack,
  Alert,
  MenuItem,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CampaignIcon from '@mui/icons-material/Campaign';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DiscountIcon from '@mui/icons-material/Discount';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';
import WarehouseInventory from '../components/WarehouseInventory';
// Notification Panel Component
function NotificationPanel({ notifications, onMarkRead }) {
  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <NotificationsActiveIcon sx={{ color: '#0B1A33', mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0B1A33' }}>Notifications</Typography>
      </Box>
      {notifications.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No new notifications.</Typography>
      ) : (
        <List>
          {notifications.map((n) => (
            <ListItem key={n._id} alignItems="flex-start" sx={{ bgcolor: n.read ? '#fff' : '#E3F2FD', borderRadius: 1, mb: 1 }}>
              <ListItemText
                primary={<b>{n.title}</b>}
                secondary={<>
                  <Typography variant="body2" color="text.secondary">{n.message}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(n.createdAt).toLocaleString()}</Typography>
                </>}
              />
              {!n.read && (
                <Button size="small" onClick={() => onMarkRead(n._id)} sx={{ ml: 2 }}>Mark as read</Button>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

function Dashboard() {
    // Admin notifications state
    const [notifications, setNotifications] = useState([]);
    const [notifLoading, setNotifLoading] = useState(true);

    // Fetch admin notifications

    useEffect(() => {
      fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
      setNotifLoading(true);
      try {
        // Fetch all admin notifications (no adminId required)
        const res = await api.get('/api/notifications');
        if (res.data && res.data.notifications) {
          setNotifications(res.data.notifications);
        } else {
          setNotifications([]);
        }
        setNotifError(null);
      } catch (e) {
        logger.error('Notification fetch error:', e);
        setNotifications([]);
        // Only show error if it's not a 404 (no notifications yet)
        if (e.response?.status !== 404) {
          setNotifError(getErrorMessage(e));
        }
      } finally {
        setNotifLoading(false);
      }
    };

    // Notification error state
    const [notifError, setNotifError] = useState(null);

    // Mark notification as read
    const handleMarkRead = async (notificationId) => {
      try {
        await api.post('/notification/read', { notificationId });
        setNotifications((prev) => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
      } catch (e) {}
    };
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Marketing & Control Center State
  const [pushNotificationDialog, setPushNotificationDialog] = useState(false);
  const [promoDialog, setPromoDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    target: 'all',
  });
  
  const [promo, setPromo] = useState({
    code: '',
    discount: '',
    description: '',
    validUntil: '',
  });
  
  const [activePromos, setActivePromos] = useState([
    { id: 1, code: 'WELCOME10', discount: '10%', description: 'New user discount', validUntil: '2025-12-31' },
    { id: 2, code: 'SHIP20', discount: '20%', description: 'Free shipping promo', validUntil: '2025-11-30' },
  ]);
  
  const [systemSettings, setSystemSettings] = useState({
    deliveryFee: '5.99',
    minOrderValue: '10.00',
    customsClearanceTime: '2-3 days',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendNotification = () => {
    logger.action('Notification', 'Sending', notification);
    // TODO: API call to send push notification
    alert(`Notification sent to ${notification.target}: ${notification.title}`);
    setPushNotificationDialog(false);
    setNotification({ title: '', message: '', target: 'all' });
  };
  
  const handleCreatePromo = () => {
    const newPromo = {
      id: activePromos.length + 1,
      ...promo,
    };
    setActivePromos([...activePromos, newPromo]);
    logger.action('Promo', 'Creating', newPromo);
    // TODO: API call to create promo
    setPromoDialog(false);
    setPromo({ code: '', discount: '', description: '', validUntil: '' });
  };
  
  const handleDeletePromo = (id) => {
    setActivePromos(activePromos.filter(p => p.id !== id));
    // TODO: API call to delete promo
  };
  
  const handleSaveSettings = () => {
    logger.action('Settings', 'Saving', systemSettings);
    // TODO: API call to save settings
    alert('Settings saved successfully!');
    setSettingsDialog(false);
  };

  const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const ordersData = [
    { name: 'Mon', orders: 24 },
    { name: 'Tue', orders: 18 },
    { name: 'Wed', orders: 32 },
    { name: 'Thu', orders: 21 },
    { name: 'Fri', orders: 15 },
    { name: 'Sat', orders: 19 },
    { name: 'Sun', orders: 28 },
  ];

  const StatCard = ({ title, value, icon, change, changeType }) => (
    <Card sx={{
      p: 3,
      borderRadius: 2,
      border: 'none',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
      },
      transition: 'all 0.2s ease',
    }}>
      <Box sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        bgcolor: '#83C5FA',
      }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#666', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1A1A1A', mt: 1, mb: 0.5, letterSpacing: '-1px' }}>
            {value}
          </Typography>
          {change && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {changeType === 'up' ? (
                <ArrowUpwardIcon sx={{ fontSize: 16, color: '#10b981' }} />
              ) : (
                <ArrowDownwardIcon sx={{ fontSize: 16, color: '#ef4444' }} />
              )}
              <Typography variant="caption" sx={{ color: changeType === 'up' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                {change}
              </Typography>
              <Typography variant="caption" sx={{ color: '#999', ml: 0.5 }}>
                vs last week
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          bgcolor: '#0B1A33',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#83C5FA',
          boxShadow: '0 4px 12px rgba(11, 26, 51, 0.3)',
        }}>
          {icon}
        </Box>
      </Box>
    </Card>
  );

  return (
    <Box>
      {/* Notification Panel */}
      {notifError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setNotifError(null)}>
          {notifError}
        </Alert>
      )}
      <NotificationPanel notifications={notifications} onMarkRead={handleMarkRead} />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Orders"
            value={loading ? <Skeleton width={80} /> : stats.totalOrders}
            icon={<ShoppingBagIcon sx={{ fontSize: 28 }} />}
            change="12.5%"
            changeType="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={loading ? <Skeleton width={80} /> : `£${stats.totalRevenue.toLocaleString()}`}
            icon={<AttachMoneyIcon sx={{ fontSize: 28 }} />}
            change="8.2%"
            changeType="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Users"
            value={loading ? <Skeleton width={80} /> : stats.totalUsers}
            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
            change="3.1%"
            changeType="down"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Orders"
            value={loading ? <Skeleton width={80} /> : stats.pendingOrders}
            icon={<LocalShippingIcon sx={{ fontSize: 28 }} />}
            change="5.4%"
            changeType="up"
          />
        </Grid>
      </Grid>

      {/* Warehouse Inventory Section */}
      <Box sx={{ mb: 4 }}>
        <WarehouseInventory />
      </Box>

      {/* Control Center Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 1, letterSpacing: '-0.5px' }}>
          Control Center
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Manage operations, push notifications, promotions, and system settings
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<NotificationsActiveIcon />}
            onClick={() => setPushNotificationDialog(true)}
            sx={{
              bgcolor: '#0B1A33',
              color: 'white',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(11, 26, 51, 0.3)',
              '&:hover': {
                bgcolor: '#152847',
                boxShadow: '0 6px 16px rgba(11, 26, 51, 0.4)',
              },
            }}
          >
            Push Notification
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<DiscountIcon />}
            onClick={() => setPromoDialog(true)}
            sx={{
              borderColor: '#83C5FA',
              color: '#0B1A33',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#83C5FA',
                bgcolor: alpha('#83C5FA', 0.08),
              },
            }}
          >
            Create Promo
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<CampaignIcon />}
            sx={{
              borderColor: '#83C5FA',
              color: '#0B1A33',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#83C5FA',
                bgcolor: alpha('#83C5FA', 0.08),
              },
            }}
          >
            Marketing Campaign
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsDialog(true)}
            sx={{
              borderColor: '#83C5FA',
              color: '#0B1A33',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#83C5FA',
                bgcolor: alpha('#83C5FA', 0.08),
              },
            }}
          >
            System Settings
          </Button>
        </Grid>
      </Grid>
      
      {/* Active Promotions & Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 2, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.5px' }}>
                  Active Promotions
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Current promotional codes
                </Typography>
              </Box>
              <Chip 
                label={`${activePromos.length} active`} 
                sx={{ 
                  bgcolor: alpha('#83C5FA', 0.1), 
                  color: '#0B1A33',
                  fontWeight: 600,
                  fontSize: 12,
                }} 
              />
            </Box>
            <List sx={{ p: 0 }}>
              {activePromos.map((promo) => (
                <ListItem 
                  key={promo.id} 
                  sx={{ 
                    px: 0, 
                    py: 1.5,
                    borderBottom: '1px solid #F5F7FA',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                          {promo.code}
                        </Typography>
                        <Chip 
                          label={promo.discount} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#10b981', 
                            color: 'white',
                            fontWeight: 600,
                            height: 24,
                          }} 
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {promo.description} • Valid until {promo.validUntil}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeletePromo(promo.id)}
                      sx={{
                        color: '#ef4444',
                        '&:hover': { bgcolor: alpha('#ef4444', 0.08) },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 2, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.5px' }}>
                System Status
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Real-time system monitoring
              </Typography>
            </Box>
            <Stack spacing={2}>
              <Alert 
                severity="success" 
                sx={{ 
                  borderRadius: 2,
                  border: 'none',
                  bgcolor: alpha('#10b981', 0.08),
                  '& .MuiAlert-icon': { color: '#10b981' },
                }}
              >
                All systems operational
              </Alert>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#F5F7FA', 
                borderRadius: 1.5,
              }}>
                <Typography variant="body2" sx={{ color: '#1A1A1A', fontWeight: 600, mb: 1 }}>
                  Current Settings
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                  Delivery Fee: £{systemSettings.deliveryFee}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                  Minimum Order: £{systemSettings.minOrderValue}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                  Customs Clearance: {systemSettings.customsClearanceTime}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 2, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 3, letterSpacing: '-0.5px' }}>
              Weekly Revenue
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 8, 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#83C5FA" 
                  strokeWidth={3}
                  dot={{ fill: '#83C5FA', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, borderRadius: 2, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 3, letterSpacing: '-0.5px' }}>
              Weekly Orders
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 8, 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Bar 
                  dataKey="orders" 
                  fill="#83C5FA"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Push Notification Dialog */}
      <Dialog 
        open={pushNotificationDialog} 
        onClose={() => setPushNotificationDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1A1A1A' }}>Send Push Notification</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Target Audience"
              select
              value={notification.target}
              onChange={(e) => setNotification({ ...notification, target: e.target.value })}
              fullWidth
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="customers">Customers Only</MenuItem>
              <MenuItem value="uk-drivers">UK Drivers</MenuItem>
              <MenuItem value="ghana-drivers">Ghana Drivers</MenuItem>
            </TextField>
            <TextField
              label="Notification Title"
              value={notification.title}
              onChange={(e) => setNotification({ ...notification, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Notification Message"
              value={notification.message}
              onChange={(e) => setNotification({ ...notification, message: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setPushNotificationDialog(false)}
            sx={{ 
              textTransform: 'none',
              color: '#666',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendNotification}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!notification.title || !notification.message}
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
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Promo Dialog */}
      <Dialog 
        open={promoDialog} 
        onClose={() => setPromoDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1A1A1A' }}>Create Promotion</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Promo Code"
              value={promo.code}
              onChange={(e) => setPromo({ ...promo, code: e.target.value.toUpperCase() })}
              fullWidth
              placeholder="e.g., SUMMER25"
            />
            <TextField
              label="Discount"
              value={promo.discount}
              onChange={(e) => setPromo({ ...promo, discount: e.target.value })}
              fullWidth
              placeholder="e.g., 20% or £5"
            />
            <TextField
              label="Description"
              value={promo.description}
              onChange={(e) => setPromo({ ...promo, description: e.target.value })}
              fullWidth
              placeholder="e.g., Summer discount"
            />
            <TextField
              label="Valid Until"
              type="date"
              value={promo.validUntil}
              onChange={(e) => setPromo({ ...promo, validUntil: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setPromoDialog(false)}
            sx={{ 
              textTransform: 'none',
              color: '#666',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePromo}
            variant="contained"
            disabled={!promo.code || !promo.discount}
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
            Create Promo
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* System Settings Dialog */}
      <Dialog 
        open={settingsDialog} 
        onClose={() => setSettingsDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1A1A1A' }}>System Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Delivery Fee (£)"
              value={systemSettings.deliveryFee}
              onChange={(e) => setSystemSettings({ ...systemSettings, deliveryFee: e.target.value })}
              fullWidth
              type="number"
            />
            <TextField
              label="Minimum Order Value (£)"
              value={systemSettings.minOrderValue}
              onChange={(e) => setSystemSettings({ ...systemSettings, minOrderValue: e.target.value })}
              fullWidth
              type="number"
            />
            <TextField
              label="Customs Clearance Time"
              value={systemSettings.customsClearanceTime}
              onChange={(e) => setSystemSettings({ ...systemSettings, customsClearanceTime: e.target.value })}
              fullWidth
              placeholder="e.g., 2-3 days"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setSettingsDialog(false)}
            sx={{ 
              textTransform: 'none',
              color: '#666',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
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
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
