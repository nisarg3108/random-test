import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { documentAPI, shareAPI } from '../../api/documents';
import { formatBytes, formatDate } from '../../utils/format';

const DocumentDetailsDialog = ({ open, onClose, document, onDownload, onDelete, onUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [versions, setVersions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [changeLog, setChangeLog] = useState('');

  useEffect(() => {
    if (open && document) {
      loadTabData(activeTab);
    }
  }, [open, document, activeTab]);

  const loadTabData = async (tabIndex) => {
    if (!document) return;

    try {
      setLoading(true);
      setError(null);

      switch (tabIndex) {
        case 1: // Versions
          const versionsRes = await documentAPI.getVersions(document.id);
          setVersions(versionsRes.data || []);
          break;
        case 2: // Activity
          const activitiesRes = await documentAPI.getActivities(document.id);
          setActivities(activitiesRes.data || []);
          break;
        case 3: // Sharing
          const sharesRes = await shareAPI.listShares(document.id);
          setShares(sharesRes.data || []);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleNewVersion = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingVersion(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('changeLog', changeLog);

      await documentAPI.createVersion(document.id, formData);
      setChangeLog('');
      loadTabData(1);
      onUpdate();
    } catch (err) {
      console.error('Error creating version:', err);
      setError('Failed to create new version');
    } finally {
      setUploadingVersion(false);
    }
  };

  const handleDownloadVersion = async (version) => {
    try {
      const response = await documentAPI.downloadVersion(document.id, version.versionNumber);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', version.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading version:', err);
      setError('Failed to download version');
    }
  };

  const handleRevertVersion = async (version) => {
    try {
      await documentAPI.revertToVersion(document.id, version.versionNumber);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error reverting version:', err);
      setError('Failed to revert to version');
    }
  };

  const handleCreateShare = async () => {
    try {
      await shareAPI.createShare(document.id, {
        shareType: 'LINK',
        canView: true,
        canDownload: true
      });
      loadTabData(3);
    } catch (err) {
      console.error('Error creating share:', err);
      setError('Failed to create share');
    }
  };

  const handleRevokeShare = async (shareId) => {
    try {
      await shareAPI.revokeShare(shareId);
      loadTabData(3);
    } catch (err) {
      console.error('Error revoking share:', err);
      setError('Failed to revoke share');
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{document.name}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab icon={<InfoIcon />} label="Details" />
          <Tab icon={<HistoryIcon />} label="Versions" />
          <Tab icon={<CommentIcon />} label="Activity" />
          <Tab icon={<ShareIcon />} label="Sharing" />
        </Tabs>

        {/* Details Tab */}
        {activeTab === 0 && (
          <Box>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                File Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    File Name
                  </Typography>
                  <Typography variant="body2">{document.fileName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body2">{formatBytes(document.fileSize)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body2">{document.mimeType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="body2">v{document.version}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">{formatDate(document.createdAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Updated
                  </Typography>
                  <Typography variant="body2">{formatDate(document.updatedAt)}</Typography>
                </Box>
              </Box>
            </Paper>

            {document.description && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2">{document.description}</Typography>
              </Paper>
            )}

            {document.tags && document.tags.length > 0 && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  {document.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              </Paper>
            )}

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Statistics
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Views
                  </Typography>
                  <Typography variant="h6">{document.viewCount || 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Downloads
                  </Typography>
                  <Typography variant="h6">{document.downloadCount || 0}</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Versions Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                disabled={uploadingVersion}
              >
                Upload New Version
                <input type="file" hidden onChange={handleNewVersion} />
              </Button>
              <TextField
                size="small"
                placeholder="Change log (optional)"
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {versions.map((version, index) => (
                  <React.Fragment key={version.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton onClick={() => handleDownloadVersion(version)}>
                            <DownloadIcon />
                          </IconButton>
                          {version.versionNumber !== document.version && (
                            <Button
                              size="small"
                              onClick={() => handleRevertVersion(version)}
                            >
                              Revert
                            </Button>
                          )}
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              Version {version.versionNumber}
                            </Typography>
                            {version.versionNumber === document.version && (
                              <Chip label="Current" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              {formatDate(version.createdAt)} • {formatBytes(version.fileSize)}
                            </Typography>
                            {version.changeLog && (
                              <Typography variant="caption" display="block">
                                {version.changeLog}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Activity Tab */}
        {activeTab === 2 && (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : activities.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No activity yet
              </Typography>
            ) : (
              <List>
                {activities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={activity.action}
                        secondary={formatDate(activity.createdAt)}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Sharing Tab */}
        {activeTab === 3 && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleCreateShare}
              sx={{ mb: 2 }}
            >
              Create Share Link
            </Button>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : shares.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No active shares
              </Typography>
            ) : (
              <List>
                {shares.map((share, index) => (
                  <React.Fragment key={share.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRevokeShare(share.id)}
                        >
                          Revoke
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={share.shareType}
                        secondary={
                          <>
                            {share.shareToken && (
                              <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
                                Token: {share.shareToken}
                              </Typography>
                            )}
                            <Typography variant="caption" display="block">
                              Created: {formatDate(share.createdAt)}
                            </Typography>
                            {share.expiresAt && (
                              <Typography variant="caption" display="block">
                                Expires: {formatDate(share.expiresAt)}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button startIcon={<DownloadIcon />} onClick={() => onDownload(document)}>
          Download
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          onClick={() => {
            onDelete(document);
            onClose();
          }}
        >
          Delete
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentDetailsDialog;
