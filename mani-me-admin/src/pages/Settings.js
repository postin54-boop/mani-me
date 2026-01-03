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
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

function Settings() {
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/warehouse_pickup_address');
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
      await api.put('/settings/warehouse_pickup_address', {
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
    </Box>
  );
}

export default Settings;
