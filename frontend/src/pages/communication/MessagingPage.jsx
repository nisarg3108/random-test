import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Tag as TagIcon,
  FiberManualRecord as OnlineIcon
} from '@mui/icons-material';
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markConversationAsRead,
  addReaction,
  updateMessage,
  deleteMessage,
  setTypingStatus
} from '../../api/communication';
import { useMessagingWebSocket, useOnlineUsersWebSocket } from '../../hooks/useWebSocket';

const MessagingPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [openNewChat, setOpenNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // WebSocket hooks for real-time updates
  const { 
    isConnected, 
    newMessage, 
    typingUsers, 
    messageUpdates,
    clearNewMessage 
  } = useMessagingWebSocket(selectedConversation?.id);
  
  const { onlineUsers } = useOnlineUsersWebSocket();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle incoming real-time messages
  useEffect(() => {
    if (newMessage && selectedConversation) {
      // Add new message to the list if it's not already there
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      clearNewMessage();
      
      // Update conversation list
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessageAt: new Date(), messages: [newMessage] }
          : conv
      ));
    }
  }, [newMessage, selectedConversation, clearNewMessage]);
  
  // Handle message updates (edit/delete)
  useEffect(() => {
    if (messageUpdates) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageUpdates.id ? messageUpdates : msg
      ));
    }
  }, [messageUpdates]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await getMessages(conversationId, { limit: 100 });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };
  
  // Handle typing indicator
  const handleTyping = useCallback((e) => {
    setMessageInput(e.target.value);
    
    if (selectedConversation) {
      // Send typing status
      setTypingStatus(selectedConversation.id, true).catch(console.error);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(selectedConversation.id, false).catch(console.error);
      }, 2000);
    }
  }, [selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSending(true);
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTypingStatus(selectedConversation.id, false).catch(console.error);
      
      const response = await sendMessage(selectedConversation.id, {
        content: messageInput,
        type: 'TEXT'
      });
      
      // Only add to messages if WebSocket didn't already add it
      setMessages(prev => {
        if (prev.some(m => m.id === response.data.id)) return prev;
        return [...prev, response.data];
      });
      setMessageInput('');
      
      // Update conversation's last message
      const updatedConversations = conversations.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessageAt: new Date(), messages: [response.data] }
          : conv
      );
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewConversation = async (data) => {
    try {
      const response = await createConversation(data);
      setConversations([response.data, ...conversations]);
      setSelectedConversation(response.data);
      setOpenNewChat(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'DIRECT') {
      // Get other participant's name
      return 'Direct Message';
    }
    return 'Conversation';
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

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Messages
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewChat(true)}
          >
            New Chat
          </Button>
        </Box>
      </Box>

      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Conversations List */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            borderRight: { md: 1 },
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'auto',
            height: '100%'
          }}
        >
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {filteredConversations.map((conversation) => (
                <ListItem
                  key={conversation.id}
                  button
                  selected={selectedConversation?.id === conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  sx={{
                    borderLeft: 4,
                    borderColor:
                      selectedConversation?.id === conversation.id
                        ? 'primary.main'
                        : 'transparent'
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={conversation.type !== 'DIRECT'}
                    >
                      <Avatar>
                        {conversation.type === 'GROUP' ? <GroupIcon /> : <PersonIcon />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {getConversationName(conversation)}
                        </Typography>
                        {conversation.lastMessageAt && (
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(conversation.lastMessageAt)}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      conversation.messages?.[0] && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ mt: 0.5 }}
                        >
                          {conversation.messages[0].content}
                        </Typography>
                      )
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Grid>

        {/* Messages Area */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>
                    {selectedConversation.type === 'GROUP' ? <GroupIcon /> : <PersonIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {getConversationName(selectedConversation)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedConversation.participants?.length || 0} participants
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <MoreVertIcon />
                </IconButton>
              </Paper>

              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'grey.50',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId === localStorage.getItem('userId');
                  const showDate =
                    index === 0 ||
                    new Date(messages[index - 1].createdAt).toDateString() !==
                      new Date(message.createdAt).toDateString();

                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                          <Chip
                            label={new Date(message.createdAt).toLocaleDateString()}
                            size="small"
                          />
                        </Box>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                          mb: 1
                        }}
                      >
                        <Paper
                          sx={{
                            maxWidth: '70%',
                            p: 1.5,
                            bgcolor: isOwnMessage ? 'primary.main' : 'white',
                            color: isOwnMessage ? 'white' : 'text.primary'
                          }}
                        >
                          <Typography variant="body1">{message.content}</Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              opacity: 0.7,
                              textAlign: 'right'
                            }}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Paper>
                      </Box>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {typingUsers.length === 1 
                        ? 'Someone is typing...' 
                        : `${typingUsers.length} people are typing...`}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Message Input */}
              <Paper
                elevation={3}
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center'
                }}
              >
                <IconButton size="small">
                  <AttachFileIcon />
                </IconButton>
                <IconButton size="small">
                  <EmojiIcon />
                </IconButton>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleTyping}
                  disabled={sending}
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!messageInput.trim() || sending}
                >
                  {sending ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
              </Paper>
            </>
          ) : (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'text.secondary'
              }}
            >
              <SendIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6">Select a conversation to start messaging</Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* New Conversation Dialog */}
      <Dialog open={openNewChat} onClose={() => setOpenNewChat(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Feature coming soon: Select users to start a conversation
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewChat(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenNewChat(false)}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessagingPage;
