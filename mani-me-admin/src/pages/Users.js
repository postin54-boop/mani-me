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
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

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
      const response = await api.get('/api/admin/users');
      // Handle both old format (array) and new format ({ users, pagination })
      const usersData = response.data.users || response.data;
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      logger.error('Error fetching users:', error);
      setUsers([]);
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
      await api.put(`/api/admin/users/${userId}/status`, {
        is_active: !currentStatus,
      });
      fetchUsers();
    } catch (error) {
      logger.error('Error updating user status:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id || user.id}>
                <TableCell>{user.fullName || user.name || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>{user.phone || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role || 'CUSTOMER'}
                    color={user.role === 'ADMIN' ? 'error' : user.role?.includes('DRIVER') ? 'primary' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active !== false ? 'Active' : 'Inactive'}
                    color={user.is_active !== false ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
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
                <TableCell colSpan={7} align="center">
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
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {selectedUser.fullName || selectedUser.name || 'N/A'}
                </Typography>
                <Chip
                  label={selectedUser.role || 'CUSTOMER'}
                  color={selectedUser.role === 'ADMIN' ? 'error' : selectedUser.role?.includes('DRIVER') ? 'primary' : 'default'}
                  size="small"
                />
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#666' }}>
                CONTACT INFORMATION
              </Typography>
              <Box sx={{ mb: 3, pl: 1 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {selectedUser.email || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Phone:</strong> {selectedUser.phone || 'N/A'}
                </Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#666' }}>
                ACCOUNT DETAILS
              </Typography>
              <Box sx={{ mb: 3, pl: 1 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>User ID:</strong> {selectedUser._id || selectedUser.id || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Role:</strong> {selectedUser.role || 'CUSTOMER'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Country:</strong> {selectedUser.country || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Joined:</strong>{' '}
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Last Updated:</strong>{' '}
                  {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>

              {(selectedUser.role?.includes('DRIVER') || selectedUser.driver_type) && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#666' }}>
                    DRIVER INFORMATION
                  </Typography>
                  <Box sx={{ mb: 3, pl: 1 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Driver Type:</strong> {selectedUser.driver_type || 'N/A'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Vehicle Number:</strong> {selectedUser.vehicle_number || 'N/A'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Driver License:</strong> {selectedUser.driver_license || 'N/A'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Verified:</strong>{' '}
                      <Chip
                        label={selectedUser.is_verified ? 'Yes' : 'No'}
                        color={selectedUser.is_verified ? 'success' : 'warning'}
                        size="small"
                      />
                    </Typography>
                  </Box>
                </>
              )}

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#666' }}>
                ACCOUNT STATUS
              </Typography>
              <Box mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedUser.is_active !== false}
                      onChange={() =>
                        handleToggleStatus(selectedUser._id || selectedUser.id, selectedUser.is_active)
                      }
                    />
                  }
                  label={selectedUser.is_active !== false ? 'Active' : 'Inactive'}
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
