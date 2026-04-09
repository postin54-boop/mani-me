import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

function Settings() {
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // 2FA State
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [totpCode, setTotpCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableTotpCode, setDisableTotpCode] = useState('');

  useEffect(() => {
    fetchSettings();
    fetch2FAStatus();
  }, []);
  
  const fetch2FAStatus = async () => {
    try {
      const response = await api.get('/api/admin/2fa/status');
      setTwoFAEnabled(response.data.enabled);
    } catch (error) {
      logger.error('Error fetching 2FA status:', error);
    }
  };
  
  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    try {
      const response = await api.post('/api/admin/2fa/setup');
      setQrCodeUrl(response.data.qrCodeUrl);
      setBackupCodes(response.data.backupCodes || []);
      setSetupDialogOpen(true);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setTwoFALoading(false);
    }
  };
  
  const handleVerify2FA = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }
    setTwoFALoading(true);
    try {
      await api.post('/api/admin/2fa/verify', { totpCode });
      setTwoFAEnabled(true);
      setSetupDialogOpen(false);
      setTotpCode('');
      setMessage({ type: 'success', text: '2FA enabled successfully! Your account is now more secure.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setTwoFALoading(false);
    }
  };
  
  const handleDisable2FA = async () => {
    if (!disablePassword || !disableTotpCode) {
      setMessage({ type: 'error', text: 'Please enter both password and 2FA code' });
      return;
    }
    setTwoFALoading(true);
    try {
      await api.post('/api/admin/2fa/disable', { 
        password: disablePassword, 
        totpCode: disableTotpCode 
      });
      setTwoFAEnabled(false);
      setDisableDialogOpen(false);
      setDisablePassword('');
      setDisableTotpCode('');
      setMessage({ type: 'success', text: '2FA has been disabled.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setTwoFALoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings/warehouse_pickup_address');
      setWarehouseAddress(response.data.value);
    } catch (error) {
      logger.error('Error fetching settings:', error);
      if (error.response?.status === 404) {
        // Setting doesn't exist yet, use default
        setWarehouseAddress('London Warehouse, E1 6AN');
      } else {
        setMessage({ type: 'error', text: getErrorMessage(error) });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!warehouseAddress.trim()) {
      setMessage({ type: 'error', text: 'Warehouse address cannot be empty' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/api/settings/warehouse_pickup_address', {
        value: warehouseAddress.trim(),
        description: 'Warehouse pickup address shown to customers'
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      logger.error('Error saving settings:', error);
      setMessage({ 
        type: 'error', 
        text: getErrorMessage(error)
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#0B1A33' }}>
        Settings
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
        Configure system-wide settings for the application
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ maxWidth: 800 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarehouseIcon sx={{ color: '#0B1A33', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#0B1A33' }}>
                Warehouse Pickup Address
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                This address will be shown to customers when they select pickup option
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <TextField
            fullWidth
            label="Warehouse Address"
            value={warehouseAddress}
            onChange={(e) => setWarehouseAddress(e.target.value)}
            placeholder="e.g., London Warehouse, E1 6AN"
            multiline
            rows={2}
            helperText="Include the full address with postcode"
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={fetchSettings}
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                bgcolor: '#0B1A33',
                '&:hover': {
                  bgcolor: '#071D33',
                },
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4, p: 2, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #E5E7EB' }}>
        <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
          <strong>Note:</strong> Changes will be immediately reflected in the mobile app after saving.
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Customers will see this address when selecting the "Pickup from warehouse" option in the packaging shop.
        </Typography>
      </Box>
      
      {/* Two-Factor Authentication Section */}
      <Card sx={{ maxWidth: 800, mt: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: twoFAEnabled ? '#DCFCE7' : '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SecurityIcon sx={{ color: twoFAEnabled ? '#16A34A' : '#D97706', fontSize: 28 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0B1A33' }}>
                  Two-Factor Authentication (2FA)
                </Typography>
                <Chip 
                  size="small" 
                  icon={twoFAEnabled ? <CheckCircleIcon /> : <WarningIcon />}
                  label={twoFAEnabled ? 'Enabled' : 'Disabled'}
                  color={twoFAEnabled ? 'success' : 'warning'}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Add an extra layer of security to your admin account
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
            {twoFAEnabled 
              ? 'Your account is protected with two-factor authentication. You will need to enter a code from your authenticator app when logging in.'
              : 'Enable two-factor authentication to require a code from an authenticator app (like Google Authenticator or Authy) when signing in.'}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {twoFAEnabled ? (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDisableDialogOpen(true)}
                disabled={twoFALoading}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSetup2FA}
                disabled={twoFALoading}
                startIcon={twoFALoading ? <CircularProgress size={20} /> : <SecurityIcon />}
                sx={{
                  bgcolor: '#0B1A33',
                  '&:hover': { bgcolor: '#071D33' },
                }}
              >
                {twoFALoading ? 'Setting up...' : 'Enable 2FA'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
      
      {/* 2FA Setup Dialog */}
      <Dialog open={setupDialogOpen} onClose={() => setSetupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </Typography>
          {qrCodeUrl && (
            <Box sx={{ textAlign: 'center', my: 2, p: 2, bgcolor: '#fff', borderRadius: 2 }}>
              <img src={qrCodeUrl} alt="2FA QR Code" style={{ maxWidth: 200 }} />
            </Box>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            2. Enter the 6-digit code from your authenticator app to verify:
          </Typography>
          <TextField
            fullWidth
            label="6-Digit Code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' } }}
            sx={{ mb: 2 }}
          />
          {backupCodes.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Save these backup codes in a safe place:
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                {backupCodes.map((code, i) => (
                  <span key={i}>{code}{i < backupCodes.length - 1 ? ' • ' : ''}</span>
                ))}
              </Box>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                You can use these codes if you lose access to your authenticator app.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleVerify2FA} 
            variant="contained" 
            disabled={twoFALoading || totpCode.length !== 6}
            sx={{ bgcolor: '#0B1A33', '&:hover': { bgcolor: '#071D33' } }}
          >
            {twoFALoading ? <CircularProgress size={20} /> : 'Verify & Enable'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Disable 2FA Dialog */}
      <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Disabling 2FA will make your account less secure. Are you sure?
          </Alert>
          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="2FA Code (or backup code)"
            value={disableTotpCode}
            onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="000000"
            inputProps={{ maxLength: 8 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDisable2FA} 
            variant="contained" 
            color="error"
            disabled={twoFALoading}
          >
            {twoFALoading ? <CircularProgress size={20} /> : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Settings;
