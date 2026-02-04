import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  ExitToApp as LeaveIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import {
  getChannels,
  createChannel,
  updateChannel,
  joinChannel,
  leaveChannel
} from '../../api/communication';

const ChannelsPage = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PUBLIC',
    departmentId: '',
    projectId: ''
  });

  useEffect(() => {
    loadChannels();
  }, [tabValue]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const type = tabValue === 0 ? 'PUBLIC' : 'PRIVATE';
      const response = await getChannels({ type });
      setChannels(response.data);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (channel = null) => {
    if (channel) {
      setSelectedChannel(channel);
      setFormData({
        name: channel.name,
        description: channel.description || '',
        type: channel.type,
        departmentId: channel.departmentId || '',
        projectId: channel.projectId || ''
      });
    } else {
      setSelectedChannel(null);
      setFormData({
        name: '',
        description: '',
        type: 'PUBLIC',
        departmentId: '',
        projectId: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedChannel(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedChannel) {
        await updateChannel(selectedChannel.id, formData);
      } else {
        await createChannel(formData);
      }
      loadChannels();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving channel:', error);
    }
  };

  const handleJoinChannel = async (channelId) => {
    try {
      await joinChannel(channelId);
      loadChannels();
    } catch (error) {
      console.error('Error joining channel:', error);
    }
  };

  const handleLeaveChannel = async (channelId) => {
    if (window.confirm('Are you sure you want to leave this channel?')) {
      try {
        await leaveChannel(channelId);
        loadChannels();
      } catch (error) {
        console.error('Error leaving channel:', error);
      }
    }
  };

  const isMember = (channel) => {
    const userId = localStorage.getItem('userId');
    return channel.members?.some(m => m.userId === userId);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <GroupIcon sx={{ mr: 2, fontSize: 40 }} />
          Team Channels
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Channel
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Public Channels" icon={<PublicIcon />} iconPosition="start" />
          <Tab label="Private Channels" icon={<LockIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Channels Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : channels.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            No channels found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new channel to start team collaboration
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {channels.map((channel) => (
            <Grid item xs={12} sm={6} md={4} key={channel.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {channel.type === 'PUBLIC' ? <PublicIcon /> : <LockIcon />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        #{channel.name}
                      </Typography>
                      <Chip
                        label={channel.type}
                        size="small"
                        color={channel.type === 'PUBLIC' ? 'success' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  
                  {channel.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, minHeight: 40 }}
                    >
                      {channel.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                      {channel.members?.map((member, index) => (
                        <Avatar key={index} sx={{ width: 32, height: 32 }}>
                          {member.userId.charAt(0).toUpperCase()}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                    <Typography variant="caption" color="text.secondary">
                      {channel._count?.members || 0} members
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  {isMember(channel) ? (
                    <>
                      <Button size="small" variant="outlined">
                        Open
                      </Button>
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenDialog(channel)}>
                          <SettingsIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleLeaveChannel(channel.id)}
                        >
                          <LeaveIcon />
                        </IconButton>
                      </Box>
                    </>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      fullWidth
                      onClick={() => handleJoinChannel(channel.id)}
                      disabled={channel.type === 'PRIVATE'}
                    >
                      {channel.type === 'PRIVATE' ? 'Private' : 'Join Channel'}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedChannel ? 'Edit Channel' : 'Create New Channel'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Channel Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., general, random, team-updates"
            />
            
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this channel about?"
            />
            
            <TextField
              label="Channel Type"
              fullWidth
              select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="PUBLIC">Public - Anyone can join</MenuItem>
              <MenuItem value="PRIVATE">Private - Invitation only</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name}
          >
            {selectedChannel ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChannelsPage;
