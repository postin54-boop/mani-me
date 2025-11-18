import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../api';

function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, {
        is_active: !currentStatus,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Users Management</Typography>
        <TextField
          label="Search users"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.region || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Active' : 'Inactive'}
                    color={user.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewUser(user)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {selectedUser.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {selectedUser.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Phone:</strong> {selectedUser.phone}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Region:</strong> {selectedUser.region || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>City:</strong> {selectedUser.city || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Address:</strong> {selectedUser.address || 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Joined:</strong>{' '}
                {new Date(selectedUser.createdAt).toLocaleString()}
              </Typography>

              <Box mt={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedUser.is_active}
                      onChange={() =>
                        handleToggleStatus(selectedUser.id, selectedUser.is_active)
                      }
                    />
                  }
                  label={selectedUser.is_active ? 'Active' : 'Inactive'}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Users;
