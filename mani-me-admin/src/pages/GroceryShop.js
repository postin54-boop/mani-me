import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ShoppingCart, Inventory, Image as ImageIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../api';
import api from '../api';
import ImageUpload from '../components/ImageUpload';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

export default function GroceryShop() {
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'grocery',
    stock: '',
    unit: 'item',
    is_available: true,
    image_url: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/grocery/admin/items');
      setItems(response.data);
    } catch (error) {
      logger.error('Error fetching items:', error);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'grocery',
      stock: '',
      unit: 'item',
      is_available: true,
      image_url: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      stock: item.stock,
      unit: item.unit,
      is_available: item.is_available,
      image_url: item.image_url || ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingItem
        ? `/grocery/admin/items/${editingItem._id}`
        : '/grocery/admin/items';
      
      if (editingItem) {
        await api.put(url, formData);
      } else {
        await api.post(url, formData);
      }

      setAlert({ show: true, message: `Item ${editingItem ? 'updated' : 'added'} successfully`, severity: 'success' });
      setDialogOpen(false);
      fetchItems();
    } catch (error) {
      logger.error('Error saving item:', error);
      setAlert({ show: true, message: getErrorMessage(error), severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/grocery/admin/items/${id}`);
        setAlert({ show: true, message: 'Item deleted successfully', severity: 'success' });
        setItems(items.filter(item => item._id !== id));
      } catch (error) {
        logger.error('Error deleting item:', error);
        setAlert({ show: true, message: getErrorMessage(error), severity: 'error' });
      }
    }
  };

  const getTotalValue = () => {
    return items.reduce((total, item) => total + (item.price * item.stock), 0).toFixed(2);
  };

  const getTotalItems = () => {
    return items.length;
  };

  const getOutOfStock = () => {
    return items.filter(item => item.stock === 0).length;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'grocery': return '🛒';
      case 'electronics': return '💻';
      case 'household': return '🏠';
      default: return '📦';
    }
  };

  return (
    <Box>
      {alert.show && (
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, show: false })} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Grocery Shop Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add New Item
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2">Total Items</Typography>
                  <Typography variant="h4">{getTotalItems()}</Typography>
                </Box>
                <Inventory sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2">Total Value</Typography>
                  <Typography variant="h4">£{getTotalValue()}</Typography>
                </Box>
                <ShoppingCart sx={{ fontSize: 48, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" variant="body2">Out of Stock</Typography>
                  <Typography variant="h4">{getOutOfStock()}</Typography>
                </Box>
                <Typography sx={{ fontSize: 48 }}>⚠️</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <Avatar
                    src={item.image_url}
                    variant="rounded"
                    sx={{ width: 56, height: 56 }}
                  >
                    <ImageIcon />
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Chip label={`${getCategoryIcon(item.category)} ${item.category}`} size="small" />
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.description}
                </TableCell>
                <TableCell>£{item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={item.stock}
                    color={item.stock === 0 ? 'error' : item.stock < 20 ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  <Chip
                    label={item.is_available ? 'Available' : 'Unavailable'}
                    color={item.is_available ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(item)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(item._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                margin="normal"
              >
                <MenuItem value="grocery">🛒 Grocery</MenuItem>
                <MenuItem value="electronics">💻 Electronics</MenuItem>
                <MenuItem value="household">🏠 Household</MenuItem>
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Price (£)"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    margin="normal"
                    required
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    margin="normal"
                    placeholder="e.g., item, kg, litre"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.value })}
                    margin="normal"
                  >
                    <MenuItem value={true}>Available</MenuItem>
                    <MenuItem value={false}>Unavailable</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mt: 2 }}>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  label="Product Image"
                  width="100%"
                  height={200}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name || !formData.price || !formData.stock}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
