import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import ImageUpload from '../components/ImageUpload';
import api from '../api';

// Packaging Materials
const PACKAGING_CATEGORIES = ['Boxes', 'Tape', 'Protective', 'Labels', 'Drums'];

export default function PackagingShop() {
  const [items, setItems] = useState([]);

  // Fetch items from backend using the api instance (includes auth header)
  useEffect(() => {
    api.get('/api/shop/packaging')
      .then(res => setItems(Array.isArray(res.data) ? res.data : (res.data?.items || [])))
      .catch(() => setItems([]));
  }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Boxes',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
  });
  // Inline price editing state
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [inlinePrice, setInlinePrice] = useState('');

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'Boxes', description: '', price: '', stock: '', imageUrl: '' });
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      stock: item.stock,
      imageUrl: item.imageUrl || '',
    });
    setDialogOpen(true);
  };

  // Inline price edit handlers
  const handleInlinePriceEdit = (item) => {
    setEditingPriceId(item._id);
    setInlinePrice((item.price || 0).toString());
  };
  const handleInlinePriceCancel = () => {
    setEditingPriceId(null);
    setInlinePrice('');
  };
  const handleInlinePriceSave = async (item) => {
    try {
      const res = await api.put(`/api/shop/packaging/${item._id}`, {
        ...item, price: parseFloat(inlinePrice)
      });
      setItems(items.map(i => (i._id === res.data._id ? res.data : i)));
    } catch (e) { /* ignore */ }
    setEditingPriceId(null);
    setInlinePrice('');
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        const res = await api.put(`/api/shop/packaging/${editingItem._id}`, {
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        });
        setItems(items.map(item => (item._id === res.data._id ? res.data : item)));
      } else {
        const res = await api.post('/api/shop/packaging', {
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        });
        setItems([...items, res.data]);
      }
    } catch (e) { /* ignore */ }
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/api/shop/packaging/${id}`);
        setItems(items.filter(item => item._id !== id));
      } catch (e) { /* ignore */ }
    }
  };

  const getTotalValue = () => {
    return items.reduce((total, item) => total + (item.price * item.stock), 0).toFixed(2);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Packaging Materials Shop</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add New Item
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4">{items.length}</Typography>
            <Typography color="text.secondary">Total Items</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <ShoppingCartIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4">{items.reduce((sum, i) => sum + i.stock, 0)}</Typography>
            <Typography color="text.secondary">Total Stock</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">£{getTotalValue()}</Typography>
            <Typography color="text.secondary">Inventory Value</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Items Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <Box 
                    component="img" 
                    src={item.imageUrl || 'https://via.placeholder.com/60x60?text=No+Image'} 
                    alt={item.name}
                    sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <Chip label={item.category} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell align="right">
                  {editingPriceId === item._id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={inlinePrice}
                        onChange={e => setInlinePrice(e.target.value)}
                        sx={{ width: 80 }}
                      />
                      <IconButton size="small" color="success" onClick={() => handleInlinePriceSave(item)}>
                        <SaveIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={handleInlinePriceCancel}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                      £{(item.price || 0).toFixed(2)}
                      <IconButton size="small" onClick={() => handleInlinePriceEdit(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Chip 
                    label={item.stock} 
                    size="small" 
                    color={item.stock < 50 ? 'error' : 'success'}
                  />
                </TableCell>
                <TableCell align="right">£{((item.price || 0) * (item.stock || 0)).toFixed(2)}</TableCell>
                <TableCell align="right">
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Item Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            {PACKAGING_CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
          <Box sx={{ mt: 3, mb: 2 }}>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              label="Product Image"
              width={200}
              height={200}
            />
          </Box>
          <TextField
            fullWidth
            label="Price (£)"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Stock Quantity"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
