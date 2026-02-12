import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Archive as ArchiveIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { getFileUrl } from '../../api/communication';

const FilePreview = ({ attachments, onDelete, showDelete = false, compact = false }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype) => {
    if (!mimetype) return <FileIcon />;
    
    const type = mimetype.split('/')[0];
    
    switch (type) {
      case 'image':
        return <ImageIcon color="primary" />;
      case 'video':
        return <VideoIcon color="secondary" />;
      case 'audio':
        return <AudioIcon color="info" />;
      default:
        if (mimetype.includes('pdf') || mimetype.includes('document') || 
            mimetype.includes('sheet') || mimetype.includes('presentation') ||
            mimetype.includes('text')) {
          return <DocumentIcon color="warning" />;
        }
        if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) {
          return <ArchiveIcon color="success" />;
        }
        return <FileIcon />;
    }
  };

  const handleDownload = (attachment) => {
    const url = getFileUrl(attachment.filename);
    window.open(url, '_blank');
  };

  const handlePreview = (attachment) => {
    if (attachment.mimetype?.startsWith('image/')) {
      setPreviewFile(attachment);
      setPreviewOpen(true);
    } else {
      handleDownload(attachment);
    }
  };

  const handleDelete = (attachment) => {
    if (onDelete) {
      onDelete(attachment);
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        {attachments.map((attachment, index) => (
          <Chip
            key={index}
            icon={getFileIcon(attachment.mimetype)}
            label={attachment.originalName || attachment.filename}
            size="small"
            onClick={() => handlePreview(attachment)}
            onDelete={showDelete ? () => handleDelete(attachment) : undefined}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {attachments.map((attachment, index) => {
          const isImage = attachment.mimetype?.startsWith('image/');
          
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {isImage ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={getFileUrl(attachment.filename)}
                    alt={attachment.originalName}
                    onClick={() => handlePreview(attachment)}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    onClick={() => handlePreview(attachment)}
                    sx={{
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'action.hover'
                    }}
                  >
                    <Box sx={{ fontSize: 64, color: 'text.secondary' }}>
                      {getFileIcon(attachment.mimetype)}
                    </Box>
                  </Box>
                )}
                
                <CardContent sx={{ p: 1.5 }}>
                  <Tooltip title={attachment.originalName || attachment.filename}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      {attachment.originalName || attachment.filename}
                    </Typography>
                  </Tooltip>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(attachment.size)}
                    </Typography>
                    
                    <Box>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(attachment);
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {showDelete && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(attachment);
                            }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.default' }
            }}
          >
            <CloseIcon />
          </IconButton>
          
          {previewFile && (
            <img
              src={getFileUrl(previewFile.filename)}
              alt={previewFile.originalName}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          )}
        </DialogContent>
        
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => previewFile && handleDownload(previewFile)}
          >
            Download
          </Button>
          <Button onClick={() => setPreviewOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FilePreview;
