import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TablePagination,
  Skeleton,
  InputAdornment,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users when pagination or search changes
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, debouncedSearch]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.get('/api/admin/users', { params });
      const usersData = response.data.users || response.data;
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTotalCount(response.data.pagination?.total || usersData.length || 0);
    } catch (error) {
      logger.error('Error fetching users:', error);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = useCallback((user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedUser(null);
  }, []);

  const handleToggleStatus = useCallback(async (userId, currentStatus) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, {
        is_active: !currentStatus,
      });
      // Update local state instead of re-fetching all users
      setUsers(prev => prev.map(u => 
        (u._id || u.id) === userId ? { ...u, is_active: !currentStatus } : u
      ));
    } catch (error) {
      logger.error('Error updating user status:', error);
    }
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Users Management</Typography>
        <TextField
          placeholder="Search users..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#666' }} />
              </InputAdornment>
            ),
          }}
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
            {loading ? (
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {[...Array(7)].map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
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
            )))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
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
