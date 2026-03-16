import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  Avatar,
  Stack,
  Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const ModernTable = ({ 
  columns, 
  data, 
  onView, 
  onEdit, 
  onDelete,
  emptyMessage = 'No data available',
  hideActions = false,
}) => {
  const getStatusColor = (status) => {
    const statusMap = {
      completed: 'success',
      delivered: 'success',
      active: 'success',
      pending: 'warning',
      booked: 'info',
      in_transit: 'info',
      picked_up: 'info',
      cancelled: 'error',
      failed: 'error',
      inactive: 'default',
    };
    return statusMap[status?.toLowerCase()] || 'default';
  };

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: 3,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell 
                key={index}
                align={column.align || 'left'}
                sx={{ 
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  bgcolor: 'grey.50',
                  borderBottom: '2px solid',
                  borderColor: 'grey.200',
                  py: 2,
                }}
              >
                {column.label}
              </TableCell>
            ))}
            {!hideActions && (
              <TableCell 
                align="right"
                sx={{ 
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  bgcolor: 'grey.50',
                  borderBottom: '2px solid',
                  borderColor: 'grey.200',
                  py: 2,
                }}
              >
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{
                '&:hover': {
                  bgcolor: 'grey.50',
                },
                '&:last-child td': {
                  borderBottom: 0,
                },
              }}
            >
              {columns.map((column, colIndex) => {
                const value = row[column.field];
                
                return (
                  <TableCell key={colIndex} align={column.align || 'left'}>
                    {column.render ? (
                      column.render(row)
                    ) : column.type === 'status' ? (
                      <Chip
                        label={value}
                        color={getStatusColor(value)}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'capitalize',
                        }}
                      />
                    ) : column.type === 'avatar' ? (
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: 'primary.main',
                            fontSize: '0.875rem',
                          }}
                        >
                          {value?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {value}
                        </Typography>
                      </Stack>
                    ) : column.type === 'currency' ? (
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        £{parseFloat(value || 0).toFixed(2)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.primary">
                        {value || '-'}
                      </Typography>
                    )}
                  </TableCell>
                );
              })}
              {!hideActions && (
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    {onView && (
                      <Tooltip title="View">
                        <IconButton 
                          size="small" 
                          onClick={() => onView(row)}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.50' },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onEdit && (
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={() => onEdit(row)}
                          sx={{ 
                            color: 'info.main',
                            '&:hover': { bgcolor: 'info.50' },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          onClick={() => onDelete(row)}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.50' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ModernTable;
