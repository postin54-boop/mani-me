import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  LocalOffer as PromoIcon,
  Notifications as NotificationIcon,
  Send as SendIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import api from '../api';
import logger from '../utils/logger';

export default function Broadcasts() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  const [userCount, setUserCount] = useState(0);
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'marketing',
    title: '',
    message: '',
    promoCode: '',
    discount: '',
    expiresAt: '',
    targetScreen: 'Home',
  });

  // Fetch user count on mount
  useEffect(() => {
    fetchUserCount();
    fetchRecentBroadcasts();
  }, []);

  const fetchUserCount = async () => {
    try {
      const response = await api.get('/api/users?role=user&limit=1');
      // Estimate user count from response
      setUserCount(response.data.total || response.data.users?.length || 0);
    } catch (error) {
      logger.error('Failed to fetch user count', error);
    }
  };

  const fetchRecentBroadcasts = async () => {
    try {
      const response = await api.get('/api/notifications?limit=10');
      // Filter for broadcast-type notifications
      const broadcasts = (response.data.notifications || []).filter(
        n => n.data?.type === 'promo' || n.data?.type === 'marketing'
      );
      setRecentBroadcasts(broadcasts.slice(0, 5));
    } catch (error) {
      logger.error('Failed to fetch recent broadcasts', error);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSendBroadcast = async () => {
    // Validation
    if (!formData.title.trim() || !formData.message.trim()) {
      setAlert({ show: true, message: 'Title and message are required', severity: 'error' });
      return;
    }

    if (formData.type === 'promo' && !formData.promoCode.trim()) {
      setAlert({ show: true, message: 'Promo code is required for promotional notifications', severity: 'error' });
      return;
    }

    // Confirmation
    const confirmed = window.confirm(
      `Are you sure you want to send this notification to all ${userCount} users?\n\nTitle: ${formData.title}\nMessage: ${formData.message}`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetScreen: formData.targetScreen,
      };

      if (formData.type === 'promo') {
        payload.promoCode = formData.promoCode;
        payload.discount = formData.discount;
        if (formData.expiresAt) {
          payload.expiresAt = formData.expiresAt;
        }
      }

      const response = await api.post('/api/notifications/broadcast', payload);
      
      setAlert({ 
        show: true, 
        message: `Broadcast sent successfully! ${response.data.results?.sent || 0} users notified.`, 
        severity: 'success' 
      });

      // Reset form
      setFormData({
        type: 'marketing',
        title: '',
        message: '',
        promoCode: '',
        discount: '',
        expiresAt: '',
        targetScreen: 'Home',
      });

      // Refresh recent broadcasts
      fetchRecentBroadcasts();
    } catch (error) {
      logger.error('Failed to send broadcast', error);
      setAlert({ 
        show: true, 
        message: error.response?.data?.error || 'Failed to send broadcast', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    {
      name: 'New Promo',
      type: 'promo',
      title: '🎉 Special Offer!',
      message: 'Use code {CODE} to get {DISCOUNT} off your next booking!',
      promoCode: 'SAVE20',
      discount: '20%',
    },
    {
      name: 'Free Shipping',
      type: 'promo',
      title: '🚚 Free Shipping Weekend!',
      message: 'Book this weekend and enjoy FREE shipping on all parcels to Ghana!',
      promoCode: 'FREESHIP',
      discount: 'Free Shipping',
    },
    {
      name: 'Holiday Sale',
      type: 'promo',
      title: '🎄 Holiday Special!',
      message: 'Send love home this holiday season! Get {DISCOUNT} off with code {CODE}',
      promoCode: 'HOLIDAY25',
      discount: '25%',
    },
    {
      name: 'General Update',
      type: 'marketing',
      title: '📦 Service Update',
      message: 'We have exciting news! Check out our latest features in the app.',
    },
    {
      name: 'New Feature',
      type: 'marketing', 
      title: '✨ New Feature Alert!',
      message: 'Track your parcels in real-time with our new live tracking feature!',
    },
  ];

  const applyTemplate = (template) => {
    setFormData({
      ...formData,
      type: template.type,
      title: template.title,
      message: template.message,
      promoCode: template.promoCode || '',
      discount: template.discount || '',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Broadcast Notifications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Send push notifications to all users for promos, announcements, and marketing campaigns
        </Typography>
      </Box>

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
              {/* Type Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Notification Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Notification Type"
                    onChange={handleInputChange('type')}
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

              {/* Target Screen */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Open Screen on Tap</InputLabel>
                  <Select
                    value={formData.targetScreen}
                    label="Open Screen on Tap"
                    onChange={handleInputChange('targetScreen')}
                  >
                    <MenuItem value="Home">Home Screen</MenuItem>
                    <MenuItem value="BookingScreen">Booking Screen</MenuItem>
                    <MenuItem value="TrackingScreen">Tracking Screen</MenuItem>
                    <MenuItem value="GroceryShop">Grocery Shop</MenuItem>
                    <MenuItem value="Profile">Profile</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notification Title"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  placeholder="e.g., 🎉 Special Offer!"
                  helperText="Use emojis to make it eye-catching!"
                />
              </Grid>

              {/* Message */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Message"
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  placeholder="Write your notification message here..."
                  helperText={`${formData.message.length}/200 characters recommended`}
                />
              </Grid>

              {/* Promo Fields (conditional) */}
              {formData.type === 'promo' && (
                <>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Promo Code"
                      value={formData.promoCode}
                      onChange={handleInputChange('promoCode')}
                      placeholder="e.g., SAVE20"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Discount"
                      value={formData.discount}
                      onChange={handleInputChange('discount')}
                      placeholder="e.g., 20% off"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Expires At"
                      value={formData.expiresAt}
                      onChange={handleInputChange('expiresAt')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              {/* Send Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setFormData({
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
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    onClick={handleSendBroadcast}
                    disabled={loading || !formData.title || !formData.message}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      px: 4,
                    }}
                  >
                    {loading ? 'Sending...' : `Send to ${userCount} Users`}
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
                  {formData.title || 'Notification Title'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.message || 'Your message will appear here...'}
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
          {/* Quick Templates */}
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

          {/* Recent Broadcasts */}
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

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, show: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, show: false })} 
          severity={alert.severity}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
