import React, { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react';
import {
  Box,
  Paper,
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
  CircularProgress,
  Checkbox,
  ListItemButton
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
  Tag as TagIcon
} from '@mui/icons-material';
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markConversationAsRead,
  deleteConversation,
  addReaction,
  updateMessage,
  deleteMessage,
  setTypingStatus,
  getMessagingUsers
} from '../../api/communication';
import { useMessagingWebSocket, useOnlineUsersWebSocket } from '../../hooks/useWebSocket';
import { getUserFromToken } from '../../store/auth.store';
import Layout from '../../components/layout/Layout';
import FileUpload from '../../components/communication/FileUpload';
import FilePreview from '../../components/communication/FilePreview';

const MessagingPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [openNewChat, setOpenNewChat] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [conversationName, setConversationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [showConversationSearch, setShowConversationSearch] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserId = getUserFromToken()?.userId || getUserFromToken()?.id || null;
  const effectiveUserId = currentUserId || localStorage.getItem('userId');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredUsersSearch = useDeferredValue(usersSearch);
  
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
    loadMessagingUsers();
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
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

  useEffect(() => {
    if (!openNewChat) return;

    setUsersSearch('');
    setSelectedUserIds([]);
    setConversationName('');
    loadMessagingUsers();
  }, [openNewChat]);
  
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

  const loadMessagingUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await getMessagingUsers();
      const fetchedUsers = response.data || [];
      setUsers(currentUserId ? fetchedUsers.filter(u => u.id !== currentUserId) : fetchedUsers);
    } catch (error) {
      console.error('Error loading messaging users:', error);
    } finally {
      setUsersLoading(false);
    }
  };
  
  // Handle typing indicator
  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    
    if (window.confirm('Are you sure you want to delete this conversation? All messages will be permanently deleted.')) {
      try {
        await deleteConversation(selectedConversation.id);
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
      
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
      setMessages([]);
      setSelectedConversation(null);
      setAnchorEl(null);
    }
  };

  const handleViewProfile = () => {
    if (selectedConversation?.type === 'DIRECT') {
      const participantId = getDirectParticipantId(selectedConversation);
      alert(`View profile for user: ${participantId}`);
    } else {
      alert('Group conversation details');
    }
    setAnchorEl(null);
  };

  const handleSearchInConversation = () => {
    setShowConversationSearch(true);
    setAnchorEl(null);
  };

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

  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setEmojiAnchorEl(null);
  };

  const handleSendMessage = async (e, attachmentsToSend = null) => {
    if (e) e.preventDefault();
    
    const hasContent = messageInput.trim();
    const hasAttachments = attachmentsToSend || pendingAttachments.length > 0;
    
    if (!hasContent && !hasAttachments) return;
    if (!selectedConversation) return;

    try {
      setSending(true);
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTypingStatus(selectedConversation.id, false).catch(console.error);
      
      const attachments = attachmentsToSend || pendingAttachments;
      
      const response = await sendMessage(selectedConversation.id, {
        content: messageInput || '',
        type: attachments.length > 0 ? 'FILE' : 'TEXT',
        attachments: attachments
      });
      
      // Only add to messages if WebSocket didn't already add it
      setMessages(prev => {
        if (prev.some(m => m.id === response.data.id)) return prev;
        return [...prev, response.data];
      });
      setMessageInput('');
      setPendingAttachments([]);
      
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
      
      // Check if conversation already exists in the list (for existing DMs)
      const existingIndex = conversations.findIndex(conv => conv.id === response.data.id);
      
      if (existingIndex !== -1) {
        // If it already exists, just select it
        setSelectedConversation(response.data);
      } else {
        // If new conversation, add it to the list
        setConversations([response.data, ...conversations]);
        setSelectedConversation(response.data);
      }
      
      setOpenNewChat(false);
      setSelectedUserIds([]);
      setConversationName('');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateConversation = async () => {
    if (selectedUserIds.length === 0) return;

    const isGroup = selectedUserIds.length > 1;
    const payload = {
      type: isGroup ? 'GROUP' : 'DIRECT',
      participantIds: selectedUserIds,
      ...(isGroup && conversationName.trim() ? { name: conversationName.trim() } : {})
    };

    await handleNewConversation(payload);
  };

  const getUserLabel = (user) => {
    if (!user) return 'Unknown User';
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const getConversationInitials = (conversation) => {
    const name = getConversationName(conversation);
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getDirectParticipantUser = (conversation) => {
    const otherParticipant = conversation?.participants?.find(
      (p) => p.userId !== currentUserId
    );
    return users.find((u) => u.id === otherParticipant?.userId) || null;
  };

  const getDirectParticipantId = (conversation) => {
    const otherParticipant = conversation?.participants?.find(
      (p) => p.userId !== currentUserId
    );
    return otherParticipant?.userId || getDirectParticipantUser(conversation)?.id || null;
  };

  const getConversationName = (conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'DIRECT') {
      const otherParticipant = conversation.participants?.find(
        (p) => p.userId !== currentUserId
      );
      const matchedUser = users.find((u) => u.id === otherParticipant?.userId);
      return getUserLabel(matchedUser);
    }
    return 'Conversation';
  };

  const getUserById = (userId) => users.find((u) => u.id === userId) || null;

  const getSenderLabel = (senderId) => getUserLabel(getUserById(senderId));

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

  const filteredConversations = useMemo(() => (
    conversations.filter((conv) =>
      getConversationName(conv).toLowerCase().includes(deferredSearchQuery.toLowerCase())
    )
  ), [conversations, deferredSearchQuery, users]);

  const filteredUsers = useMemo(() => (
    users.filter((user) =>
      user.email?.toLowerCase().includes(deferredUsersSearch.toLowerCase())
    )
  ), [users, deferredUsersSearch]);

  const displayMessages = useMemo(() => {
    if (!conversationSearchQuery.trim()) return messages;
    return messages.filter(msg => 
      msg.content?.toLowerCase().includes(conversationSearchQuery.toLowerCase())
    );
  }, [messages, conversationSearchQuery]);

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Messages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect and collaborate with your team
        </Typography>
      </Box>
      
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          height: 'calc(100vh - 280px)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Conversations List */}
        <Box
          sx={{
            width: { xs: '100%', md: '350px' },
            borderRight: { md: 1 },
            borderColor: 'divider',
            bgcolor: 'grey.50',
            overflow: 'auto',
            height: '100%'
          }}
        >
          <Box
            sx={{
              p: 2.5,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'white'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Chats
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewChat(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              New
            </Button>
          </Box>
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'white'
                }
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ px: 1.5 }}>
              {filteredConversations.map((conversation) => (
                <ListItemButton
                  key={conversation.id}
                  selected={selectedConversation?.id === conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  sx={{
                    borderRadius: 3,
                    mb: 1,
                    bgcolor: selectedConversation?.id === conversation.id
                      ? 'primary.main'
                      : 'white',
                    color: selectedConversation?.id === conversation.id
                      ? 'white'
                      : 'text.primary',
                    boxShadow: selectedConversation?.id === conversation.id
                      ? '0 2px 8px rgba(25, 118, 210, 0.3)'
                      : '0 1px 3px rgba(0,0,0,0.05)',
                    '&:hover': {
                      bgcolor: selectedConversation?.id === conversation.id
                        ? 'primary.dark'
                        : 'grey.100',
                      transform: 'translateY(-1px)',
                      boxShadow: selectedConversation?.id === conversation.id
                        ? '0 4px 12px rgba(25, 118, 210, 0.4)'
                        : '0 2px 6px rgba(0,0,0,0.1)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="success"
                      variant="dot"
                      overlap="circular"
                      invisible={conversation.type !== 'DIRECT'}
                    >
                      <Avatar sx={{ 
                        bgcolor: selectedConversation?.id === conversation.id ? 'white' : 'primary.main',
                        color: selectedConversation?.id === conversation.id ? 'primary.main' : 'white',
                        fontWeight: 700
                      }}>
                        {conversation.type === 'GROUP'
                          ? <GroupIcon />
                          : getConversationInitials(conversation)}
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
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>

        {/* Messages Area */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: 'white'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 48, height: 48 }}>
                    {selectedConversation.type === 'GROUP'
                      ? <GroupIcon />
                      : getConversationInitials(selectedConversation)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {getConversationName(selectedConversation)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {selectedConversation.type === 'DIRECT'
                        ? (
                          <>
                            <Box component="span" sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: onlineUsers.includes(getDirectParticipantId(selectedConversation)) ? 'success.main' : 'grey.400',
                              display: 'inline-block'
                            }} />
                            {onlineUsers.includes(getDirectParticipantId(selectedConversation)) ? 'Online' : 'Offline'}
                          </>
                        )
                        : `${selectedConversation.participants?.length || 0} participants`}
                    </Typography>
                  </Box>
                  {showConversationSearch && (
                    <TextField
                      size="small"
                      placeholder="Search messages..."
                      value={conversationSearchQuery}
                      onChange={(e) => setConversationSearchQuery(e.target.value)}
                      sx={{ mr: 1, width: 200 }}
                      InputProps={{
                        endAdornment: (
                          <IconButton size="small" onClick={() => {
                            setShowConversationSearch(false);
                            setConversationSearchQuery('');
                          }}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        )
                      }}
                    />
                  )}
                </Box>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <MoreVertIcon />
                </IconButton>
              </Paper>
              
              {/* Conversation Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleViewProfile}>
                  <PersonIcon sx={{ mr: 1 }} /> View Profile
                </MenuItem>
                <MenuItem onClick={handleSearchInConversation}>
                  <SearchIcon sx={{ mr: 1 }} /> Search in Conversation
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteConversation} sx={{ color: 'error.main' }}>
                  <DeleteIcon sx={{ mr: 1 }} /> Delete Conversation
                </MenuItem>
              </Menu>

              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: 3,
                  bgcolor: '#f5f7fa',
                  backgroundImage: 'linear-gradient(to bottom, #f5f7fa 0%, #e8ecf1 100%)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {messages.length === 0 && (
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      color: 'text.secondary',
                      py: 6
                    }}
                  >
                    <SendIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                    <Typography variant="body2">No messages yet. Say hello!</Typography>
                  </Box>
                )}
                {displayMessages.map((message, index) => {
                  const isOwnMessage = message.senderId === effectiveUserId;
                  const showDate =
                    index === 0 ||
                    new Date(displayMessages[index - 1].createdAt).toDateString() !==
                      new Date(message.createdAt).toDateString();

                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                          <Chip
                            label={new Date(message.createdAt).toLocaleDateString()}
                            size="small"
                            sx={{ bgcolor: 'white' }}
                          />
                        </Box>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                          mb: 1.5
                        }}
                      >
                        <Paper
                          sx={{
                            maxWidth: '70%',
                            p: 1.5,
                            bgcolor: isOwnMessage ? 'primary.main' : 'white',
                            color: isOwnMessage ? 'white' : 'text.primary',
                            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        >
                          {selectedConversation?.type === 'GROUP' && !isOwnMessage && (
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', opacity: 0.9, mb: 0.5, fontWeight: 600 }}
                            >
                              {getSenderLabel(message.senderId)}
                            </Typography>
                          )}
                          {message.content && (
                            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{message.content}</Typography>
                          )}
                          {/* Display attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <FilePreview 
                              attachments={message.attachments} 
                              compact={false}
                            />
                          )}
                                                    <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              opacity: isOwnMessage ? 0.9 : 0.7,
                              textAlign: 'right',
                              fontSize: '0.7rem'
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
                elevation={0}
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: 'white'
                }}
              >
                <Tooltip title="Attach files">
                  <IconButton 
                    size="medium"
                    onClick={() => setUploadDialogOpen(true)}
                    sx={{ 
                      bgcolor: 'grey.100',
                      '&:hover': { bgcolor: 'grey.200' }
                    }}
                  >
                    <AttachFileIcon />
                    {pendingAttachments.length > 0 && (
                      <Chip 
                        label={pendingAttachments.length} 
                        size="small" 
                        color="primary"
                        sx={{ position: 'absolute', top: -8, right: -8, height: 18, minWidth: 18 }}
                      />
                    )}
                  </IconButton>
                </Tooltip>
                <IconButton 
                  size="medium"
                  onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                  sx={{ 
                    bgcolor: 'grey.100',
                    '&:hover': { bgcolor: 'grey.200' }
                  }}
                >
                  <EmojiIcon />
                </IconButton>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={handleTyping}
                  disabled={sending}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: 'grey.50'
                    }
                  }}
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={(!messageInput.trim() && pendingAttachments.length === 0) || sending}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&:disabled': { bgcolor: 'grey.300' }
                  }}
                >
                  {sending ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <SendIcon />}
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
        </Box>
      </Box>

      {/* New Conversation Dialog */}
      <Dialog open={openNewChat} onClose={() => setOpenNewChat(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={usersSearch}
            onChange={(e) => setUsersSearch(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />

          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List sx={{ maxHeight: 280, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {filteredUsers.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No users found" />
                </ListItem>
              ) : (
                filteredUsers.map((user) => (
                  <ListItem disablePadding key={user.id}>
                    <ListItemButton onClick={() => handleToggleUser(user.id)}>
                      <ListItemAvatar>
                        <Avatar>{user.email?.charAt(0)?.toUpperCase() || 'U'}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.email}
                        secondary={user.department?.name || user.role}
                      />
                      <Checkbox edge="end" checked={selectedUserIds.includes(user.id)} />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          )}

          {selectedUserIds.length > 1 && (
            <TextField
              fullWidth
              size="small"
              label="Group name (optional)"
              value={conversationName}
              onChange={(e) => setConversationName(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewChat(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateConversation}
            disabled={selectedUserIds.length === 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* File Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Upload Files
          <IconButton
            onClick={() => setUploadDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FileUpload
            onFilesUploaded={(attachments) => {
              setPendingAttachments(prev => [...prev, ...attachments]);
              setUploadDialogOpen(false);
              // Send immediately
              handleSendMessage(null, attachments);
            }}
            maxFiles={5}
          />
          
          {pendingAttachments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Pending Attachments
              </Typography>
              <FilePreview
                attachments={pendingAttachments}
                showDelete={true}
                onDelete={(attachment) => {
                  setPendingAttachments(prev =>
                    prev.filter(a => a.filename !== attachment.filename)
                  );
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Emoji Picker Menu */}
      <Menu
        anchorEl={emojiAnchorEl}
        open={Boolean(emojiAnchorEl)}
        onClose={() => setEmojiAnchorEl(null)}
        PaperProps={{
          sx: { p: 1, maxWidth: 320 }
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
          {['😀', '😂', '😍', '🥰', '😎', '🤔', '😊', '😢', '😭', '😡', '👍', '👎', '❤️', '🎉', '🔥', '✅', '❌', '⭐', '💯', '👏'].map((emoji) => (
            <IconButton key={emoji} onClick={() => handleEmojiSelect(emoji)} size="large">
              <Typography variant="h5">{emoji}</Typography>
            </IconButton>
          ))}
        </Box>
      </Menu>
      </Paper>
    </Layout>
  );
};

export default MessagingPage;
