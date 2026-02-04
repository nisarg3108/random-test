import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert
} from '@mui/material';
import { folderAPI } from '../../api/documents';

const FolderDialog = ({ open, onClose, onSuccess, parentId = null, folder = null }) => {
  const [name, setName] = useState(folder?.name || '');
  const [description, setDescription] = useState(folder?.description || '');
  const [color, setColor] = useState(folder?.color || '#1976d2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = {
        name: name.trim(),
        description: description.trim(),
        color,
        parentId
      };

      if (folder) {
        await folderAPI.updateFolder(folder.id, data);
      } else {
        await folderAPI.createFolder(data);
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error saving folder:', err);
      setError(err.response?.data?.error || 'Failed to save folder');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setDescription('');
      setColor('#1976d2');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{folder ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Folder Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <Box>
            <TextField
              type="color"
              label="Folder Color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={loading}
              sx={{ width: 120 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {folder ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolderDialog;
