import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  Badge,
  Tab,
  Tabs
} from '@mui/material';
import {
  Chat as ChatIcon,
  Campaign as CampaignIcon,
  ArrowForward as ArrowForwardIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getConversations, getAnnouncements } from '../../api/communication';

const CommunicationWidget = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [convResponse, announcementResponse] = await Promise.all([
        getConversations(),
        getAnnouncements({ page: 1, limit: 5 })
      ]);
      
      // Get only recent conversations with messages
      const recentConversations = convResponse.data
        .filter(conv => conv.lastMessageAt)
        .slice(0, 5);
      
      setConversations(recentConversations);
      setAnnouncements(announcementResponse.data.announcements || []);
    } catch (error) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getConversationName = (conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'DIRECT') return 'Direct Message';
    return 'Conversation';
  };

  const priorityColors = {
    LOW: 'default',
    NORMAL: 'info',
    HIGH: 'warning',
    URGENT: 'error'
  };

  const unreadMessagesCount = conversations.filter(conv => {
    const participant = conv.participants?.find(p => p.userId === localStorage.getItem('userId'));
    return conv.lastMessageAt && (!participant?.lastReadAt || 
      new Date(conv.lastMessageAt) > new Date(participant.lastReadAt));
  }).length;

  const unreadAnnouncementsCount = announcements.filter(ann => 
    !ann.reads || ann.reads.length === 0
  ).length;

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Communication
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Badge badgeContent={unreadMessagesCount} color="primary">
            <ChatIcon color="action" />
          </Badge>
          <Badge badgeContent={unreadAnnouncementsCount} color="error">
            <CampaignIcon color="action" />
          </Badge>
        </Box>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Messages" />
        <Tab label="Announcements" />
      </Tabs>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : tabValue === 0 ? (
          // Messages Tab
          conversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No recent messages
              </Typography>
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => navigate('/communication/messages')}
              >
                Start Messaging
              </Button>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {conversations.map((conversation, index) => {
                const lastMessage = conversation.messages?.[0];
                const participant = conversation.participants?.find(
                  p => p.userId === localStorage.getItem('userId')
                );
                const isUnread = conversation.lastMessageAt && 
                  (!participant?.lastReadAt || 
                    new Date(conversation.lastMessageAt) > new Date(participant.lastReadAt));

                return (
                  <React.Fragment key={conversation.id}>
                    <ListItem
                      button
                      onClick={() => navigate('/communication/messages')}
                      sx={{
                        bgcolor: isUnread ? 'action.hover' : 'transparent'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge color="primary" variant="dot" invisible={!isUnread}>
                          <Avatar>
                            {conversation.type === 'GROUP' ? <GroupIcon /> : <ChatIcon />}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: isUnread ? 600 : 400 }}
                            >
                              {getConversationName(conversation)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimestamp(conversation.lastMessageAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          lastMessage && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ mt: 0.5 }}
                            >
                              {lastMessage.content}
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                    {index < conversations.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          )
        ) : (
          // Announcements Tab
          announcements.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CampaignIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No announcements
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {announcements.map((announcement, index) => {
                const isUnread = !announcement.reads || announcement.reads.length === 0;

                return (
                  <React.Fragment key={announcement.id}>
                    <ListItem
                      button
                      onClick={() => navigate('/communication/announcements')}
                      sx={{
                        bgcolor: isUnread ? 'action.hover' : 'transparent',
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box sx={{ display: 'flex', width: '100%', mb: 0.5 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isUnread && (
                              <Badge color="primary" variant="dot" sx={{ mr: 0.5 }} />
                            )}
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: isUnread ? 600 : 400 }}
                            >
                              {announcement.title}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={announcement.priority}
                          size="small"
                          color={priorityColors[announcement.priority]}
                          sx={{ height: 20 }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%'
                        }}
                      >
                        {announcement.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {formatTimestamp(announcement.publishedAt)}
                      </Typography>
                    </ListItem>
                    {index < announcements.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )
        )}
      </Box>

      <Divider />
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Button
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(
            tabValue === 0 ? '/communication/messages' : '/communication/announcements'
          )}
        >
          View All
        </Button>
      </Box>
    </Paper>
  );
};

export default CommunicationWidget;
