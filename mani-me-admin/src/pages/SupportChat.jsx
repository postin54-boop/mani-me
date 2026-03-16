import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Badge,
  Chip,
  Divider,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  SupportAgent as SupportAgentIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import api from '../api';

export default function SupportChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
    // Poll for new conversations every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when conversation selected and poll for updates
  useEffect(() => {
    if (!selectedConversation) return;

    // Fetch messages immediately
    fetchMessagesFromAPI(selectedConversation.user_id);
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetchMessagesFromAPI(selectedConversation.user_id);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/chat/support-conversations');
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesFromAPI = async (userId) => {
    try {
      const response = await api.get(`/api/chat/support/${userId}`);
      setMessages(response.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessagesFromAPI(conversation.user_id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await api.post('/api/chat/send', {
        shipment_id: null,
        chat_type: 'support',
        sender_id: 'admin',
        sender_role: 'admin',
        sender_name: 'Mani Me Support',
        message: newMessage.trim(),
        conversation_id: selectedConversation.conversation_id,
      });
      setNewMessage('');
      // Refresh messages after sending
      fetchMessagesFromAPI(selectedConversation.user_id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-GB', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter(conv => 
    conv.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ height: 'calc(100vh - 100px)' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Support Chat
      </Typography>

      <Grid container spacing={2} sx={{ height: 'calc(100% - 60px)' }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredConversations.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <SupportAgentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    No support conversations yet
                  </Typography>
                </Box>
              ) : (
                filteredConversations.map((conv) => (
                  <ListItem key={conv.conversation_id} disablePadding>
                    <ListItemButton
                      selected={selectedConversation?.conversation_id === conv.conversation_id}
                      onClick={() => handleSelectConversation(conv)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'primary.lighter',
                          borderLeft: 3,
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            !conv.read && (
                              <CircleIcon sx={{ fontSize: 12, color: 'error.main' }} />
                            )
                          }
                        >
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>
                              {conv.user_name || 'Customer'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(conv.last_timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ fontWeight: !conv.read ? 600 : 400 }}
                          >
                            {conv.last_message}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.main' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        {selectedConversation.user_name || 'Customer'}
                      </Typography>
                      <Chip
                        size="small"
                        label="Support Chat"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', height: 20 }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Messages Area */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
                  {messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        No messages in this conversation yet
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '70%',
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: isAdmin ? 'primary.main' : 'white',
                              color: isAdmin ? 'white' : 'text.primary',
                              boxShadow: 1,
                            }}
                          >
                            {!isAdmin && (
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                {msg.sender_name}
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {msg.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                textAlign: 'right',
                                opacity: 0.7,
                              }}
                            >
                              {formatTime(msg.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        '&.Mui-disabled': { bgcolor: 'grey.300' },
                      }}
                    >
                      {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                    </IconButton>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <SupportAgentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a conversation
                  </Typography>
                  <Typography color="text.secondary">
                    Choose a customer from the left to view their messages
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
