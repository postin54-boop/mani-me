import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

/**
 * ImageUpload Component
 * 
 * A reusable component for uploading product images
 * Supports both file upload (with Firebase Storage) and manual URL input
 * 
 * @param {Object} props
 * @param {string} props.value - Current image URL
 * @param {Function} props.onChange - Callback when image URL changes
 * @param {string} props.label - Label for the component
 * @param {number} props.width - Preview width (default: 200)
 * @param {number} props.height - Preview height (default: 200)
 */
export default function ImageUpload({ value, onChange, label = 'Product Image', width = 200, height = 200 }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onChange(data.url);
        setError(null);
      } else if (data.fallback) {
        // Firebase Storage not configured - show helpful message
        setError('Image upload not configured. Please use "Paste Image URL" button instead.');
      } else {
        setError(data.message || 'Failed to upload image');
      }
    } catch (err) {
      logger.error('Upload error:', err);
      setError('Failed to upload image. You can still paste an image URL.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleClear = () => {
    onChange('');
    setError(null);
  };

  const handlePasteUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      onChange(url.trim());
      setError(null);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {label}
      </Typography>

      {/* Preview Box */}
      <Box
        sx={{
          width,
          height,
          border: dragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: dragOver ? '#e3f2fd' : '#f5f5f5',
          overflow: 'hidden',
          mb: 2,
          position: 'relative',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: dragOver ? '#e3f2fd' : '#ebebeb',
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading ? (
          <CircularProgress />
        ) : value ? (
          <>
            <img
              src={value}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.querySelector('.fallback-icon')?.style.setProperty('display', 'flex');
              }}
            />
            <Box
              className="fallback-icon"
              sx={{
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#999',
              }}
            >
              <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="caption">Image not found</Typography>
            </Box>
            {/* Delete button overlay */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#999',
              textAlign: 'center',
              p: 2,
            }}
          >
            <CloudUpload sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="caption" sx={{ mb: 0.5 }}>
              {dragOver ? 'Drop image here' : 'Click or drag image here'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Max 5MB, JPG/PNG/GIF
            </Typography>
          </Box>
        )}
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Choose File
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={handlePasteUrl}
          disabled={uploading}
        >
          Paste Image URL
        </Button>
        {value && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClear}
            disabled={uploading}
          >
            Remove
          </Button>
        )}
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
