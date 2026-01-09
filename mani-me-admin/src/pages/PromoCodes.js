import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as OfferIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import api from '../api';

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalActive: 0, totalUsage: 0, totalDiscountGiven: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    description: '',
    expiryDate: '',
    usageLimit: '',
    minOrderValue: '',
    maxDiscount: '',
  });

  // Fetch promo codes from API
  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/promo-codes', {
        params: { page: page + 1, limit: rowsPerPage }
      });
      setPromoCodes(response.data.promoCodes || []);
      setTotalCount(response.data.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
      setError('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/promo-codes/stats/overview');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
    fetchStats();
  }, [fetchPromoCodes, fetchStats]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
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
      setFormData({
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        description: formData.description,
        expiryDate: formData.expiryDate,
        usageLimit: Number(formData.usageLimit),
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      };

      if (editingPromo) {
        await api.put(`/promo-codes/${editingPromo._id}`, payload);
        setSnackbar({ open: true, message: 'Promo code updated successfully', severity: 'success' });
      } else {
        await api.post('/promo-codes', payload);
        setSnackbar({ open: true, message: 'Promo code created successfully', severity: 'success' });
      }
      handleCloseDialog();
      fetchPromoCodes();
      fetchStats();
    } catch (err) {
      console.error('Error saving promo code:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'Failed to save promo code', 
        severity: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await api.delete(`/promo-codes/${id}`);
        setSnackbar({ open: true, message: 'Promo code deleted', severity: 'success' });
        fetchPromoCodes();
        fetchStats();
      } catch (err) {
        console.error('Error deleting promo code:', err);
        setSnackbar({ open: true, message: 'Failed to delete promo code', severity: 'error' });
      }
    }
  };

  const handleToggleStatus = async (promo) => {
    try {
      const newStatus = promo.status === 'active' ? 'inactive' : 'active';
      await api.put(`/promo-codes/${promo._id}`, { status: newStatus });
      setSnackbar({ open: true, message: `Promo code ${newStatus}`, severity: 'success' });
      fetchPromoCodes();
      fetchStats();
    } catch (err) {
      console.error('Error toggling status:', err);
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && promoCodes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Promo Codes</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { fetchPromoCodes(); fetchStats(); }}
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Promos
                  </Typography>
                  <Typography variant="h4">{stats.totalActive || 0}</Typography>
                </Box>
                <OfferIcon sx={{ fontSize: 40, color: '#2196F3' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Usage
                  </Typography>
                  <Typography variant="h4">{stats.totalUsage || 0}</Typography>
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
                  <Typography color="textSecondary" gutterBottom>
                    Discount Given
                  </Typography>
                  <Typography variant="h4">£{(stats.totalDiscountGiven || 0).toFixed(2)}</Typography>
                </Box>
                <OfferIcon sx={{ fontSize: 40, color: '#FF9800' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Promo Codes Table */}
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
                    label={`${promo.usedCount}/${promo.usageLimit}`}
                    size="small"
                    color={promo.usedCount >= promo.usageLimit ? 'error' : 'success'}
                  />
                </TableCell>
                <TableCell>£{promo.minOrderValue}</TableCell>
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
                  <IconButton onClick={() => handleDelete(promo._id)} size="small" color="error">
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
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Promo Code"
              fullWidth
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., WELCOME10"
              helperText="Use uppercase letters and numbers"
            />

            <FormControl fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={formData.type}
                label="Discount Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount (£)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={formData.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount (£)'}
              type="number"
              fullWidth
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={formData.type === 'percentage' ? '10' : '5'}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the offer"
            />

            <TextField
              label="Expiry Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />

            <TextField
              label="Usage Limit"
              type="number"
              fullWidth
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Maximum number of uses"
            />

            <TextField
              label="Minimum Order Value (£)"
              type="number"
              fullWidth
              value={formData.minOrderValue}
              onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
              placeholder="Minimum order amount to use this code"
            />

            {formData.type === 'percentage' && (
              <TextField
                label="Max Discount (£)"
                type="number"
                fullWidth
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                placeholder="Optional: Cap the maximum discount"
                helperText="Leave empty for no cap"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {editingPromo ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
