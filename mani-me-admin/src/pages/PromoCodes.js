import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as OfferIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState([
    {
      id: 1,
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      description: 'Welcome offer for new customers',
      expiryDate: '2025-12-31',
      usageLimit: 100,
      usedCount: 23,
      minOrderValue: 20,
      status: 'active'
    },
    {
      id: 2,
      code: 'FESTIVE25',
      type: 'percentage',
      value: 25,
      description: 'Festive season special',
      expiryDate: '2025-12-25',
      usageLimit: 50,
      usedCount: 8,
      minOrderValue: 50,
      status: 'active'
    },
    {
      id: 3,
      code: 'FLAT5',
      type: 'fixed',
      value: 5,
      description: 'Flat £5 off on all orders',
      expiryDate: '2026-01-31',
      usageLimit: 200,
      usedCount: 145,
      minOrderValue: 15,
      status: 'active'
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    description: '',
    expiryDate: '',
    usageLimit: '',
    minOrderValue: '',
  });

  const handleOpenDialog = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        description: promo.description,
        expiryDate: promo.expiryDate,
        usageLimit: promo.usageLimit,
        minOrderValue: promo.minOrderValue,
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
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPromo(null);
  };

  const handleSave = () => {
    if (editingPromo) {
      setPromoCodes(
        promoCodes.map((p) =>
          p.id === editingPromo.id
            ? { ...p, ...formData }
            : p
        )
      );
    } else {
      const newPromo = {
        id: promoCodes.length + 1,
        ...formData,
        usedCount: 0,
        status: 'active',
      };
      setPromoCodes([...promoCodes, newPromo]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      setPromoCodes(promoCodes.filter((p) => p.id !== id));
    }
  };

  const handleToggleStatus = (id) => {
    setPromoCodes(
      promoCodes.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' }
          : p
      )
    );
  };

  const totalRevenue = promoCodes.reduce((sum, p) => {
    if (p.type === 'percentage') {
      return sum + (p.usedCount * 25 * p.value / 100); // Assuming avg order £25
    } else {
      return sum + (p.usedCount * p.value);
    }
  }, 0);

  const totalUsage = promoCodes.reduce((sum, p) => sum + p.usedCount, 0);
  const activePromos = promoCodes.filter(p => p.status === 'active').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Promo Codes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Promo Code
        </Button>
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
                  <Typography variant="h4">{activePromos}</Typography>
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
                  <Typography variant="h4">{totalUsage}</Typography>
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
                  <Typography variant="h4">£{totalRevenue.toFixed(2)}</Typography>
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
              <TableRow key={promo.id}>
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
                    onClick={() => handleToggleStatus(promo.id)}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(promo)} size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(promo.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingPromo ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
