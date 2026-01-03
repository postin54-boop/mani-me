import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Stack,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import api from '../api';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

export default function CashReconciliation() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? {} : { status: filter };
      const response = await api.get('/cash-reconciliation', { params });
      setReports(response.data.reports || response.data || []);
    } catch (error) {
      logger.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleOpenAction = (report, type) => {
    setSelectedReport(report);
    setActionType(type);
    setNotes('');
    setActionDialog(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedReport) return;

    setSubmitting(true);
    try {
      await api.patch(`/cash-reconciliation/${selectedReport.id}/approve`, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        notes: notes.trim(),
        admin_id: localStorage.getItem('adminId') || 'admin_user_id',
      });

      setActionDialog(false);
      setDialogOpen(false);
      fetchReports();
      alert(`Report ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      logger.error('Error updating report:', error);
      alert(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const totalPending = reports
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="700" color="#071D33">
          Cash Reconciliation
        </Typography>
        <Button variant="outlined" onClick={fetchReports} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #FFA726 0%, #FF7043 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <TimeIcon fontSize="large" sx={{ color: '#fff' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="700" color="#fff">
                    {pendingCount}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Pending Reports
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <MoneyIcon fontSize="large" sx={{ color: '#fff' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="700" color="#fff">
                    £{totalPending.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Pending Amount
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #42A5F5 0%, #1E88E5 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <PersonIcon fontSize="large" sx={{ color: '#fff' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="700" color="#fff">
                    {reports.length}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Total Reports
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip
          label="All"
          onClick={() => setFilter('all')}
          color={filter === 'all' ? 'primary' : 'default'}
          sx={{ fontWeight: filter === 'all' ? 700 : 400 }}
        />
        <Chip
          label="Pending"
          onClick={() => setFilter('pending')}
          color={filter === 'pending' ? 'warning' : 'default'}
          sx={{ fontWeight: filter === 'pending' ? 700 : 400 }}
        />
        <Chip
          label="Approved"
          onClick={() => setFilter('approved')}
          color={filter === 'approved' ? 'success' : 'default'}
          sx={{ fontWeight: filter === 'approved' ? 700 : 400 }}
        />
        <Chip
          label="Rejected"
          onClick={() => setFilter('rejected')}
          color={filter === 'rejected' ? 'error' : 'default'}
          sx={{ fontWeight: filter === 'rejected' ? 700 : 400 }}
        />
      </Stack>

      {/* Reports Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Driver</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Shift Date</strong></TableCell>
              <TableCell><strong>Submitted</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No reports found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Stack>
                      <Typography fontWeight={600}>{report.driver?.name || 'Unknown'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {report.driver?.email}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="primary">
                      £{report.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(report.shiftDate)}</TableCell>
                  <TableCell>{formatDate(report.submittedAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={report.status.toUpperCase()}
                      color={getStatusColor(report.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleViewReport(report)}
                      >
                        <ViewIcon />
                      </IconButton>
                      {report.status === 'pending' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenAction(report, 'approve')}
                          >
                            <ApproveIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenAction(report, 'reject')}
                          >
                            <RejectIcon />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Report Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>Cash Report Details</Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="textSecondary">Driver</Typography>
                <Typography variant="h6" fontWeight={600}>
                  {selectedReport.driver?.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedReport.driver?.email}
                </Typography>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Amount</Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    £{selectedReport.amount.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedReport.status.toUpperCase()}
                      color={getStatusColor(selectedReport.status)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="caption" color="textSecondary">Shift Date</Typography>
                <Typography variant="body1">{formatDate(selectedReport.shiftDate)}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary">Submitted At</Typography>
                <Typography variant="body1">{formatDate(selectedReport.submittedAt)}</Typography>
              </Box>

              {selectedReport.reviewedAt && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Reviewed At</Typography>
                  <Typography variant="body1">{formatDate(selectedReport.reviewedAt)}</Typography>
                </Box>
              )}

              {selectedReport.notes && (
                <Box>
                  <Typography variant="caption" color="textSecondary">Notes</Typography>
                  <Typography variant="body1">{selectedReport.notes}</Typography>
                </Box>
              )}

              {selectedReport.photoUrl && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                    Receipt Photo
                  </Typography>
                  <img
                    src={selectedReport.photoUrl}
                    alt="Receipt"
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #ddd' }}
                  />
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        {selectedReport?.status === 'pending' && (
          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleOpenAction(selectedReport, 'reject')}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleOpenAction(selectedReport, 'approve')}
            >
              Approve
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Action Dialog (Approve/Reject) */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Report' : 'Reject Report'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {actionType === 'approve'
              ? 'Approve this cash report? Driver will be notified.'
              : 'Reject this cash report? Please provide a reason.'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={actionType === 'approve' ? 'Notes (optional)' : 'Reason for rejection'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes..."
            required={actionType === 'reject'}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActionDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitAction}
            disabled={submitting || (actionType === 'reject' && !notes.trim())}
          >
            {submitting ? <CircularProgress size={24} /> : actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
