import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  useTheme,
  alpha,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  InputBase,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { gradients } from '../theme';

const drawerWidth = 280;

function Layout({ children, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    onLogout();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', badge: null },
    { text: 'Orders', icon: <ShoppingBagIcon />, path: '/orders', badge: '24' },
    { text: 'Users', icon: <PeopleIcon />, path: '/users', badge: null },
    { text: 'UK Drivers', icon: <LocalShippingIcon />, path: '/uk-drivers', badge: null },
    { text: 'Ghana Drivers', icon: <FlightLandIcon />, path: '/ghana-drivers', badge: null },
    { text: 'Cash Reports', icon: <AccountBalanceWalletIcon />, path: '/cash-reconciliation', badge: null },
    { text: 'Grocery Shop', icon: <StorefrontIcon />, path: '/grocery-shop', badge: null },
    { text: 'Packaging Shop', icon: <InventoryIcon />, path: '/packaging-shop', badge: null },
    { text: 'Packaging Orders', icon: <ReceiptLongIcon />, path: '/packaging-orders', badge: null },
    { text: 'Parcel Prices', icon: <InventoryIcon />, path: '/parcel-prices', badge: null },
    { text: 'Parcel Items', icon: <InventoryIcon />, path: '/parcel-items', badge: null },
    { text: 'Promo Codes', icon: <LocalOfferIcon />, path: '/promo-codes', badge: null },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings', badge: null },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FAFAFA' }}>
      {/* Logo Section */}
      <Box 
        sx={{ 
          p: 3, 
          bgcolor: 'white', 
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
              p: 0.5,
            }}
          >
            <img 
              src="/logo.png" 
              alt="Mani Me Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18, color: '#0B1A33', letterSpacing: '-0.5px' }}>
              Mani Me
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 500 }}>
              Admin Dashboard
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Menu Items */}
      <List sx={{ px: 2, py: 2, flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&.Mui-selected': {
                    bgcolor: '#0B1A33',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(11, 26, 51, 0.4)',
                    '&:hover': {
                      bgcolor: '#1a2d4a',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#83C5FA',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      bgcolor: '#83C5FA',
                      borderRadius: '0 4px 4px 0',
                    },
                  },
                  '&:hover': {
                    bgcolor: alpha('#83C5FA', 0.08),
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: isSelected ? 'white' : 'text.secondary',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: 14,
                  }}
                />
                {item.badge && (
                  <Chip 
                    label={item.badge} 
                    size="small" 
                    sx={{ 
                      height: 22,
                      fontSize: 11,
                      fontWeight: 700,
                      bgcolor: isSelected ? 'rgba(131, 197, 250, 0.2)' : 'rgba(131, 197, 250, 0.15)',
                      color: isSelected ? '#83C5FA' : '#0B1A33',
                      borderRadius: 1.5,
                    }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom Profile Section */}
      <Box 
        sx={{ 
          p: 2, 
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
        }}
      >
        <Box 
          sx={{ 
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
          onClick={handleProfileMenuOpen}
        >
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36,
              background: gradients.primary,
              fontWeight: 600,
            }}
          >
            A
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              Admin User
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              admin@manime.com
            </Typography>
          </Box>
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Search Bar */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                bgcolor: 'grey.50',
                borderRadius: 2.5,
                px: 2,
                py: 1,
                width: 300,
                transition: 'all 0.2s',
                '&:focus-within': {
                  bgcolor: 'white',
                  boxShadow: '0 0 0 3px rgba(131, 197, 250, 0.2)',
                },
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <InputBase
                placeholder="Search..."
                sx={{ flex: 1, fontSize: '0.875rem' }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                onClick={handleNotificationMenuOpen}
                size="large"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Menu */}
            <Tooltip title="Profile">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="small"
                sx={{
                  ml: 1,
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    background: gradients.primary,
                    fontWeight: 600,
                  }}
                >
                  A
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 360,
            maxHeight: 480,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
        </Box>
        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
          <MenuItem onClick={handleNotificationMenuClose} sx={{ py: 2, px: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                New Order #12345
              </Typography>
              <Typography variant="caption" color="text.secondary">
                A customer just placed a new order
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                2 minutes ago
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleNotificationMenuClose} sx={{ py: 2, px: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Driver Assigned
              </Typography>
              <Typography variant="caption" color="text.secondary">
                John Smith assigned to pickup #12344
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                15 minutes ago
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleNotificationMenuClose} sx={{ py: 2, px: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Delivery Completed
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Shipment #12340 delivered successfully
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                1 hour ago
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleNotificationMenuClose} sx={{ py: 2, px: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Low Stock Alert
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Packaging item "Medium Box" is running low
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                3 hours ago
              </Typography>
            </Box>
          </MenuItem>
        </Box>
        <Divider />
        <MenuItem 
          onClick={() => { handleNotificationMenuClose(); navigate('/'); }}
          sx={{ py: 1.5, justifyContent: 'center', color: 'primary.main', fontWeight: 600 }}
        >
          View All Notifications
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
