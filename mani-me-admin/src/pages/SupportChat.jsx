import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  SupportAgent as SupportAgentIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  QuickreplyOutlined as QuickReplyIcon,
  ExpandMore as ExpandMoreIcon,
  MarkChatRead as MarkReadIcon,
  PriorityHigh as PriorityIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import api from '../api';

// Quick reply templates for common responses
const QUICK_REPLIES = [
  { id: 1, label: 'Greeting', text: 'Hello! Thank you for contacting Mani Me Support. How can I help you today?' },
  { id: 2, label: 'Tracking', text: 'I can help you track your parcel. Could you please provide your tracking number or order ID?' },
  { id: 3, label: 'Delivery Time', text: 'Standard delivery to Ghana via sea shipping typically takes 4-5 weeks. Express air shipping is 7-14 business days.' },
  { id: 4, label: 'Pricing', text: 'Our pricing is based on parcel weight and size. You can get an instant quote in the app by entering your parcel details.' },
  { id: 5, label: 'Pickup Info', text: 'Our UK drivers will contact you before pickup. Please ensure someone is available at the pickup address.' },
  { id: 6, label: 'Customs', text: 'All parcels go through customs clearance in Ghana. This typically takes 1-3 business days. We handle all paperwork for you.' },
  { id: 7, label: 'Refund', text: 'I understand you\'d like a refund. Let me look into this for you. Could you please provide your order details?' },
  { id: 8, label: 'Closing', text: 'Is there anything else I can help you with today? If not, feel free to reach out anytime!' },
  { id: 9, label: 'Resolved', text: 'Great! I\'m glad I could help. Your issue has been resolved. Have a wonderful day!' },
  { id: 10, label: 'Escalate', text: 'I\'m escalating your request to our senior team. They will contact you within 24 hours.' },
];

export default function SupportChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, open, resolved
  const [quickReplyAnchor, setQuickReplyAnchor] = useState(null);
  const [markingResolved, setMarkingResolved] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Pagination state for conversations
  const [convPage, setConvPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Fetch conversations with pagination
  useEffect(() => {
    fetchConversations();
    // Poll for new conversations every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [convPage, lastRefresh]);

  // Fetch messages when conversation selected and poll for updates
  useEffect(() => {
    if (!selectedConversation) return;

    // Fetch messages immediately
    fetchMessagesFromAPI(selectedConversation.user_id);
    
    // Focus input field
    setTimeout(() => inputRef.current?.focus(), 100);
    
    // Poll for new messages every 10 seconds when conversation is active
    const interval = setInterval(() => {
      fetchMessagesFromAPI(selectedConversation.user_id);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/chat/support-conversations', {
        params: { page: convPage, limit: 50, status: statusFilter !== 'all' ? statusFilter : undefined }
      });
      const data = response.data;
      setConversations(data.conversations || []);
      setHasMoreConversations(data.hasMore || (data.conversations?.length === 50));
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
    // Mark as read in local state
    setConversations(prev => prev.map(c => 
      c.conversation_id === conversation.conversation_id ? { ...c, read: true } : c
    ));
    fetchMessagesFromAPI(conversation.user_id);
  };

  const handleSendMessage = async (messageText = newMessage) => {
    const text = messageText.trim();
    if (!text || !selectedConversation) return;

    setSending(true);
    try {
      await api.post('/api/chat/send', {
        shipment_id: null,
        chat_type: 'support',
        sender_id: 'admin',
        sender_role: 'admin',
        sender_name: 'Mani Me Support',
        message: text,
        conversation_id: selectedConversation.conversation_id,
      });
      setNewMessage('');
      // Refresh messages after sending
      fetchMessagesFromAPI(selectedConversation.user_id);
      // Update last message in conversation list
      setConversations(prev => prev.map(c => 
        c.conversation_id === selectedConversation.conversation_id 
          ? { ...c, last_message: text, last_timestamp: new Date().toISOString() } 
          : c
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickReply = (reply) => {
    setNewMessage(reply.text);
    setQuickReplyAnchor(null);
    inputRef.current?.focus();
  };

  const handleMarkResolved = async () => {
    if (!selectedConversation) return;
    setMarkingResolved(true);
    try {
      await api.put(`/api/chat/conversations/${selectedConversation.conversation_id}/status`, {
        status: 'resolved'
      });
      // Update local state
      setConversations(prev => prev.map(c => 
        c.conversation_id === selectedConversation.conversation_id 
          ? { ...c, status: 'resolved' } 
          : c
      ));
      setSelectedConversation(prev => prev ? { ...prev, status: 'resolved' } : null);
    } catch (error) {
      // If endpoint doesn't exist, just update locally
      setConversations(prev => prev.map(c => 
        c.conversation_id === selectedConversation.conversation_id 
          ? { ...c, status: 'resolved' } 
          : c
      ));
      setSelectedConversation(prev => prev ? { ...prev, status: 'resolved' } : null);
    } finally {
      setMarkingResolved(false);
    }
  };

  const handleReopenConversation = async () => {
    if (!selectedConversation) return;
    setConversations(prev => prev.map(c => 
      c.conversation_id === selectedConversation.conversation_id 
        ? { ...c, status: 'open' } 
        : c
    ));
    setSelectedConversation(prev => prev ? { ...prev, status: 'open' } : null);
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
    // Regular Enter to send (no shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRefresh = () => {
    setLastRefresh(Date.now());
    if (selectedConversation) {
      fetchMessagesFromAPI(selectedConversation.user_id);
    }
  };

  const formatTime = useCallback((timestamp) => {
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
  }, []);

  // Memoize filtered and sorted conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.user_name?.toLowerCase().includes(lowerSearch) ||
        conv.last_message?.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => (conv.status || 'open') === statusFilter);
    }
    
    // Sort: unread first, then by timestamp (newest first)
    return [...filtered].sort((a, b) => {
      // Unread conversations first
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;
      // Then by timestamp
      return new Date(b.last_timestamp || 0) - new Date(a.last_timestamp || 0);
    });
  }, [conversations, searchTerm, statusFilter]);

  // Count unread conversations
  const unreadCount = useMemo(() => 
    conversations.filter(c => !c.read).length
  , [conversations]);

  const getStatusChip = (status) => {
    if (status === 'resolved') {
      return <Chip size="small" icon={<CheckCircleIcon />} label="Resolved" color="success" sx={{ height: 20, '& .MuiChip-icon': { fontSize: 14 } }} />;
    }
    return <Chip size="small" icon={<ScheduleIcon />} label="Open" color="warning" sx={{ height: 20, '& .MuiChip-icon': { fontSize: 14 } }} />;
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)' }}>
      {/* Header with stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Support Chat</Typography>
          {unreadCount > 0 && (
            <Chip 
              icon={<PriorityIcon />} 
              label={`${unreadCount} unread`} 
              color="error" 
              size="small"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              startAdornment={<FilterIcon sx={{ mr: 1, fontSize: 18, color: 'action.active' }} />}
            >
              <MenuItem value="all">All Chats</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

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
                    {statusFilter === 'resolved' ? 'No resolved conversations' : 
                     statusFilter === 'open' ? 'No open conversations' : 
                     'No support conversations yet'}
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
                        opacity: conv.status === 'resolved' ? 0.7 : 1,
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
                          <Avatar sx={{ 
                            bgcolor: conv.status === 'resolved' ? 'success.main' : 'primary.main' 
                          }}>
                            {conv.status === 'resolved' ? <CheckCircleIcon /> : <PersonIcon />}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="subtitle2" 
                              noWrap 
                              sx={{ 
                                maxWidth: 120, 
                                fontWeight: !conv.read ? 700 : 500 
                              }}
                            >
                              {conv.user_name || 'Customer'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(conv.last_timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ fontWeight: !conv.read ? 600 : 400 }}
                            >
                              {conv.last_message}
                            </Typography>
                          </Box>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {selectedConversation.user_name || 'Customer'}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {getStatusChip(selectedConversation.status || 'open')}
                        </Stack>
                      </Box>
                    </Box>
                    <Box>
                      {(selectedConversation.status || 'open') === 'open' ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={handleMarkResolved}
                          disabled={markingResolved}
                          sx={{ 
                            bgcolor: 'success.main', 
                            '&:hover': { bgcolor: 'success.dark' },
                            color: 'white'
                          }}
                        >
                          Mark Resolved
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ScheduleIcon />}
                          onClick={handleReopenConversation}
                          sx={{ 
                            borderColor: 'white', 
                            color: 'white',
                            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                          }}
                        >
                          Reopen
                        </Button>
                      )}
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

                {/* Quick Replies Bar */}
                <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mr: 1, whiteSpace: 'nowrap' }}>
                      <QuickReplyIcon sx={{ fontSize: 16, mr: 0.5 }} /> Quick:
                    </Typography>
                    {QUICK_REPLIES.slice(0, 5).map((reply) => (
                      <Chip
                        key={reply.id}
                        label={reply.label}
                        size="small"
                        variant="outlined"
                        onClick={() => handleQuickReply(reply)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' }
                        }}
                      />
                    ))}
                    <Chip
                      label="More..."
                      size="small"
                      variant="outlined"
                      onClick={(e) => setQuickReplyAnchor(e.currentTarget)}
                      icon={<ExpandMoreIcon />}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Stack>
                </Box>

                {/* Quick Reply Menu */}
                <Menu
                  anchorEl={quickReplyAnchor}
                  open={Boolean(quickReplyAnchor)}
                  onClose={() => setQuickReplyAnchor(null)}
                  PaperProps={{ sx: { maxHeight: 300, width: 350 } }}
                >
                  {QUICK_REPLIES.map((reply) => (
                    <MenuItem 
                      key={reply.id} 
                      onClick={() => handleQuickReply(reply)}
                      sx={{ whiteSpace: 'normal' }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="primary">
                          {reply.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {reply.text.substring(0, 60)}...
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>

                {/* Input Area */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      inputRef={inputRef}
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                    />
                    <IconButton
                      color="primary"
                      onClick={() => handleSendMessage()}
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
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Press Enter to send • Shift+Enter for new line
                  </Typography>
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
                  {unreadCount > 0 && (
                    <Chip 
                      icon={<PriorityIcon />}
                      label={`${unreadCount} conversations need attention`}
                      color="warning"
                      sx={{ mt: 2 }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
