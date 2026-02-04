import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Badge,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  PushPin as PinIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Campaign as CampaignIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead
} from '../../api/communication';
import { useAnnouncementsWebSocket } from '../../hooks/useWebSocket';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [newAnnouncementSnackbar, setNewAnnouncementSnackbar] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    targetType: 'ALL',
    isPinned: false,
    expiresAt: ''
  });

  // WebSocket for real-time announcements
  const { newAnnouncement } = useAnnouncementsWebSocket();

  const priorityColors = {
    LOW: 'default',
    NORMAL: 'info',
    HIGH: 'warning',
    URGENT: 'error'
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Handle real-time announcements
  useEffect(() => {
    if (newAnnouncement) {
      setAnnouncements(prev => {
        // Check if announcement already exists
        if (prev.some(a => a.id === newAnnouncement.id)) return prev;
        // Add new announcement at the top (or sorted position if pinned)
        const updatedAnnouncements = [newAnnouncement, ...prev];
        // Re-sort: pinned first, then by date
        return updatedAnnouncements.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
      setNewAnnouncementSnackbar(true);
    }
  }, [newAnnouncement]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await getAnnouncements({ active: true });
      setAnnouncements(response.data.announcements);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setSelectedAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        targetType: announcement.targetType,
        isPinned: announcement.isPinned,
        expiresAt: announcement.expiresAt
          ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
          : ''
      });
    } else {
      setSelectedAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        priority: 'NORMAL',
        targetType: 'ALL',
        isPinned: false,
        expiresAt: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAnnouncement(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
      };

      if (selectedAnnouncement) {
        await updateAnnouncement(selectedAnnouncement.id, data);
      } else {
        await createAnnouncement(data);
      }

      loadAnnouncements();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        loadAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleView = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialog(true);
    
    // Mark as read
    try {
      await markAnnouncementAsRead(announcement.id);
      // Update local state
      setAnnouncements(announcements.map(a =>
        a.id === announcement.id
          ? { ...a, reads: [{ readAt: new Date() }] }
          : a
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const isUnread = (announcement) => {
    return !announcement.reads || announcement.reads.length === 0;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <CampaignIcon sx={{ mr: 2, fontSize: 40 }} />
          Announcements
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Announcement
        </Button>
      </Box>

      {/* Announcements List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : sortedAnnouncements.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CampaignIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            No announcements yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first announcement to inform your team
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sortedAnnouncements.map((announcement) => (
            <Grid item xs={12} key={announcement.id}>
              <Card
                sx={{
                  position: 'relative',
                  borderLeft: 4,
                  borderColor: `${priorityColors[announcement.priority]}.main`,
                  bgcolor: isUnread(announcement) ? 'action.hover' : 'background.paper'
                }}
              >
                {announcement.isPinned && (
                  <Chip
                    icon={<PinIcon />}
                    label="Pinned"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16
                    }}
                  />
                )}
                
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {isUnread(announcement) && (
                          <Badge color="primary" variant="dot" sx={{ mr: 1 }} />
                        )}
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {announcement.title}
                        </Typography>
                        <Chip
                          label={announcement.priority}
                          color={priorityColors[announcement.priority]}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Published {formatDate(announcement.publishedAt)}
                        {announcement.expiresAt && (
                          <> • Expires {formatDate(announcement.expiresAt)}</>
                        )}
                      </Typography>
                      
                      <Typography
                        variant="body1"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {announcement.content}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={`${announcement._count?.reads || 0} reads`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={announcement.targetType}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleView(announcement)}
                  >
                    View
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(announcement)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            
            <TextField
              label="Content"
              fullWidth
              required
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Priority"
                  fullWidth
                  select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Audience"
                  fullWidth
                  select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                >
                  <MenuItem value="ALL">All Users</MenuItem>
                  <MenuItem value="DEPARTMENT">Department</MenuItem>
                  <MenuItem value="ROLE">Role</MenuItem>
                  <MenuItem value="SPECIFIC_USERS">Specific Users</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            
            <TextField
              label="Expires At"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
              >
                Add Attachment
              </Button>
              
              <Button
                variant={formData.isPinned ? 'contained' : 'outlined'}
                startIcon={<PinIcon />}
                onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
              >
                {formData.isPinned ? 'Pinned' : 'Pin This'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.title || !formData.content}
          >
            {selectedAnnouncement ? 'Update' : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnnouncement && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedAnnouncement.title}
                <Chip
                  label={selectedAnnouncement.priority}
                  color={priorityColors[selectedAnnouncement.priority]}
                  size="small"
                />
              </Box>
              <IconButton onClick={() => setViewDialog(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                Published {formatDate(selectedAnnouncement.publishedAt)}
                {selectedAnnouncement.expiresAt && (
                  <> • Expires {formatDate(selectedAnnouncement.expiresAt)}</>
                )}
              </Alert>
              
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedAnnouncement.content}
              </Typography>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Chip
                  label={`${selectedAnnouncement._count?.reads || 0} reads`}
                  variant="outlined"
                />
                <Chip
                  label={selectedAnnouncement.targetType}
                  variant="outlined"
                />
                {selectedAnnouncement.isPinned && (
                  <Chip
                    icon={<PinIcon />}
                    label="Pinned"
                    color="primary"
                  />
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* New Announcement Notification */}
      <Snackbar
        open={newAnnouncementSnackbar}
        autoHideDuration={5000}
        onClose={() => setNewAnnouncementSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNewAnnouncementSnackbar(false)} 
          severity="info"
          variant="filled"
        >
          New announcement received!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnnouncementsPage;
