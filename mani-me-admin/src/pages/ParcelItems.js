import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, CircularProgress, Snackbar, Alert, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import api from '../api';

const PARCEL_TYPES = [
  { type: 'small_box', label: 'Small Box' },
  { type: 'medium_box', label: 'Medium Box' },
  { type: 'large_box', label: 'Large Box' },
  { type: 'tv', label: 'TV' },
  { type: 'drum', label: 'Drum' },
];

const WAREHOUSE_LOCATIONS = [
  { value: 'UK', label: 'UK' },
  { value: 'Ghana', label: 'Ghana' },
];

export default function ParcelItems() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    booking_id: '',
    item_type: '',
    label_code: '',
    weight: '',
    size: '',
    warehouseLocation: '',
  });

  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/parcels');
      setParcels(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load parcels', severity: 'error' });
    }
    setLoading(false);
  };

  const handleOpenDialog = () => {
    setForm({ booking_id: '', item_type: '', label_code: '', weight: '', size: '', warehouseLocation: '' });
    setDialogOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/api/parcels', form);
      setSnackbar({ open: true, message: 'Parcel item added', severity: 'success' });
      setDialogOpen(false);
      fetchParcels();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add parcel item', severity: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 800 }}>Parcel Items</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={handleOpenDialog}>Add Parcel Item</Button>
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Label Code</TableCell>
                <TableCell>Weight</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parcels.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.booking_id}</TableCell>
                  <TableCell>{row.item_type}</TableCell>
                  <TableCell>{row.label_code}</TableCell>
                  <TableCell>{row.weight}</TableCell>
                  <TableCell>{row.size}</TableCell>
                  <TableCell>{row.warehouseLocation}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {loading && <CircularProgress sx={{ mt: 2 }} />}
      </Paper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add Parcel Item</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            label="Booking ID"
            name="booking_id"
            value={form.booking_id}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="normal"
            select
            label="Type"
            name="item_type"
            value={form.item_type}
            onChange={handleChange}
            fullWidth
          >
            {PARCEL_TYPES.map(opt => (
              <MenuItem key={opt.type} value={opt.type}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            margin="normal"
            label="Label Code"
            name="label_code"
            value={form.label_code}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Weight"
            name="weight"
            type="number"
            value={form.weight}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Size"
            name="size"
            value={form.size}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="normal"
            select
            label="Warehouse Location"
            name="warehouseLocation"
            value={form.warehouseLocation}
            onChange={handleChange}
            fullWidth
          >
            {WAREHOUSE_LOCATIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
