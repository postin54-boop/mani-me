import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import api from '../api';
import logger from '../utils/logger';

const PARCEL_TYPES = [
  // Box Types
  { type: 'small_box', label: 'Small Box', category: 'Boxes' },
  { type: 'medium_box', label: 'Medium Box', category: 'Boxes' },
  { type: 'large_box', label: 'Large Box', category: 'Boxes' },
  { type: 'extra_large_box', label: 'Extra-Large Box', category: 'Boxes' },
  { type: 'barrel', label: 'Barrel / Drum', category: 'Boxes' },
  // Custom Item Sizes
  { type: 'custom_small', label: 'Custom Item - Small (up to 5kg)', category: 'Custom Items' },
  { type: 'custom_medium', label: 'Custom Item - Medium (5-15kg)', category: 'Custom Items' },
  { type: 'custom_large', label: 'Custom Item - Large (15-30kg)', category: 'Custom Items' },
  { type: 'custom_extra_large', label: 'Custom Item - Extra Large (30kg+)', category: 'Custom Items' },
];

export default function ParcelPrices() {
  const [prices, setPrices] = useState([]);
  const [editedPrices, setEditedPrices] = useState({}); // Track edited prices locally
  const [loading, setLoading] = useState(false);
  const [savingType, setSavingType] = useState(null); // Track which type is being saved
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/parcel-prices');
      setPrices(res.data);
      setEditedPrices({}); // Clear edited prices after fetch
    } catch (err) {
      logger.error('Error fetching prices:', err);
      setSnackbar({ open: true, message: 'Failed to load prices', severity: 'error' });
    }
    setLoading(false);
  };

  const handlePriceChange = (type, value) => {
    setEditedPrices(prev => ({ ...prev, [type]: value }));
  };

  const handleSave = async (type, label) => {
    const price = editedPrices[type];
    if (price === undefined || price === '') {
      setSnackbar({ open: true, message: 'Please enter a price first', severity: 'warning' });
      return;
    }
    
    setSavingType(type);
    try {
      await api.post('/api/parcel-prices', { 
        type, 
        label, 
        price: parseFloat(price) 
      });
      setSnackbar({ open: true, message: `${label} price updated to £${price}`, severity: 'success' });
      // Update local state instead of refetching everything
      setPrices(prev => {
        const existing = prev.find(p => p.type === type);
        if (existing) {
          return prev.map(p => p.type === type ? { ...p, price: parseFloat(price) } : p);
        } else {
          return [...prev, { type, label, price: parseFloat(price) }];
        }
      });
      // Clear the edited price for this type
      setEditedPrices(prev => {
        const { [type]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      logger.error('Error updating price:', err);
      setSnackbar({ open: true, message: 'Error updating price', severity: 'error' });
    }
    setSavingType(null);
  };

  // Merge default types with loaded prices, showing edited value if available
  const mergedPrices = PARCEL_TYPES.map(pt => {
    const found = prices.find(p => p.type === pt.type);
    const currentPrice = editedPrices[pt.type] !== undefined ? editedPrices[pt.type] : (found ? found.price : '');
    const hasChanges = editedPrices[pt.type] !== undefined;
    return { ...pt, price: currentPrice, hasChanges };
  });

  // Group by category
  const categories = [...new Set(PARCEL_TYPES.map(pt => pt.category))];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 800 }}>Parcel Pricing</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        categories.map(category => (
          <Paper key={category} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
              {category}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Price (£)</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mergedPrices.filter(row => row.category === category).map(row => (
                    <TableRow key={row.type}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={row.price}
                          onChange={e => handlePriceChange(row.type, e.target.value)}
                          size="small"
                          sx={{ width: 120 }}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color={row.hasChanges ? "primary" : "inherit"}
                          onClick={() => handleSave(row.type, row.label)}
                          disabled={savingType === row.type || !row.hasChanges}
                          size="small"
                        >
                          {savingType === row.type ? <CircularProgress size={16} /> : 'Save'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))
      )}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
