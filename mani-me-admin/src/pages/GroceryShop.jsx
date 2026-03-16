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
  TablePagination,
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
  Avatar,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ShoppingCart, Inventory, Image as ImageIcon, Search as SearchIcon } from '@mui/icons-material';
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
    brand: '',
    description: '',
    price: '',
    category: 'Grocery',
    subcategory: '',
    pack_size: '',
    stock: '',
    is_available: true,
    image_url: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchItems();
  }, [page, rowsPerPage, debouncedSearch, categoryFilter]);

  const fetchItems = async () => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(categoryFilter !== 'All' && { category: categoryFilter }),
      };
      const response = await api.get('/api/grocery/admin/items', { params });
      const data = response.data;
      if (data.items && data.pagination) {
        setItems(data.items);
        setTotalCount(data.pagination.total);
      } else {
        // Fallback for old API format
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        setTotalCount(arr.length);
      }
    } catch (error) {
      logger.error('Error fetching items:', error);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      brand: '',
      description: '',
      price: '',
      category: 'Grocery',
      subcategory: '',
      pack_size: '',
      stock: '',
      is_available: true,
      image_url: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      brand: item.brand || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || 'Grocery',
      subcategory: item.subcategory || '',
      pack_size: item.pack_size || '',
      stock: item.stock || '',
      is_available: item.is_available !== false,
      image_url: item.image_url || ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingItem
        ? `/api/grocery/admin/items/${editingItem._id}`
        : '/api/grocery/admin/items';
      
      console.log('=== GROCERY SAVE DEBUG ===');
      console.log('URL:', url);
      console.log('FormData:', JSON.stringify(formData, null, 2));
      console.log('image_url specifically:', formData.image_url);
      
      if (editingItem) {
        const response = await api.put(url, formData);
        console.log('Update response:', response.data);
      } else {
        const response = await api.post(url, formData);
        console.log('Create response:', response.data);
      }

      setAlert({ show: true, message: `Item ${editingItem ? 'updated' : 'added'} successfully`, severity: 'success' });
      setDialogOpen(false);
      fetchItems();
    } catch (error) {
      console.error('Save error:', error.response?.data || error.message);
      logger.error('Error saving item:', error);
      setAlert({ show: true, message: getErrorMessage(error), severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/api/grocery/admin/items/${id}`);
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
    return totalCount;
  };

  const getOutOfStock = () => {
    return items.filter(item => item.stock === 0).length;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Grocery': return '🛒';
      case 'Electronics': return '💻';
      case 'Household': return '🏠';
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add New Item
          </Button>
        </Box>
      </Box>

      {/* Category Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={categoryFilter}
          onChange={(e, newValue) => { setCategoryFilter(newValue); setPage(0); }}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab value="All" label="📦 All Items" />
          <Tab value="Grocery" label="🛒 Grocery" />
          <Tab value="Electronics" label="💻 Electronics" />
          <Tab value="Household" label="🏠 Household" />
        </Tabs>
      </Paper>

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
              <TableCell>Brand</TableCell>
              <TableCell>Pack Size</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
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
                <TableCell>{item.brand || '-'}</TableCell>
                <TableCell>{item.pack_size || '-'}</TableCell>
                <TableCell>£{(item.price || 0).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={item.stock}
                    color={item.stock === 0 ? 'error' : item.stock < 20 ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
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
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
                placeholder="e.g., Green Dragon Rice"
              />
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                margin="normal"
                placeholder="e.g., Green Dragon, Apple, Pampers"
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
                placeholder="Brief product description"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    margin="normal"
                  >
                    <MenuItem value="Grocery">🛒 Grocery</MenuItem>
                    <MenuItem value="Electronics">💻 Electronics</MenuItem>
                    <MenuItem value="Household">🏠 Household</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    margin="normal"
                    placeholder="e.g., Rice, Phones, Baby"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Pack Size"
                    value={formData.pack_size}
                    onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                    margin="normal"
                    placeholder="e.g., 10kg, 1 unit"
                  />
                </Grid>
                <Grid item xs={4}>
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
                <Grid item xs={4}>
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
              <TextField
                fullWidth
                select
                label="Availability"
                value={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.value })}
                margin="normal"
              >
                <MenuItem value={true}>✅ Available</MenuItem>
                <MenuItem value={false}>❌ Unavailable</MenuItem>
              </TextField>
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
