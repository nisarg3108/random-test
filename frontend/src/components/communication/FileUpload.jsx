import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Alert
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Archive as ArchiveIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { uploadFiles } from '../../api/communication';

const FileUpload = ({ onFilesUploaded, maxFiles = 5, acceptedTypes, disabled = false }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const getFileIcon = (file) => {
    const type = file.type.split('/')[0];
    
    switch (type) {
      case 'image':
        return <ImageIcon color="primary" />;
      case 'video':
        return <VideoIcon color="secondary" />;
      case 'audio':
        return <AudioIcon color="info" />;
      default:
        if (file.type.includes('pdf') || file.type.includes('document') || 
            file.type.includes('sheet') || file.type.includes('presentation') ||
            file.type.includes('text')) {
          return <DocumentIcon color="warning" />;
        }
        if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) {
          return <ArchiveIcon color="success" />;
        }
        return <FileIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setError(null);

    // Validate file count
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const invalidFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      setError(`Files must be smaller than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    
    // Clear input value to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await uploadFiles(selectedFiles);
      
      setUploadProgress(100);
      
      // Call parent callback with uploaded file metadata
      if (onFilesUploaded) {
        onFilesUploaded(response.data.attachments);
      }
      
      // Clear selected files
      setSelectedFiles([]);
      setUploadProgress(0);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    if (fileInputRef.current) {
      // Create a new FileList-like object
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
      
      handleFileSelect({ target: { files: dataTransfer.files } });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept={acceptedTypes || '*'}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drag & Drop Zone */}
      <Paper
        variant="outlined"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          p: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'background.default',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s',
          '&:hover': !disabled && {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Drag & drop files here or click to browse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Max {maxFiles} files, up to {formatFileSize(MAX_FILE_SIZE)} each
        </Typography>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({selectedFiles.length}/{maxFiles})
          </Typography>
          <List dense>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={index}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <Box sx={{ mr: 2 }}>
                  {getFileIcon(file)}
                </Box>
                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploading}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {/* Upload Button */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              startIcon={<AttachFileIcon />}
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
