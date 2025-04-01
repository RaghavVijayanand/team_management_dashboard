import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  TextField, 
  IconButton, 
  Tabs, 
  Tab, 
  Divider,
  MenuItem,
  Badge,
  Grid,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Tooltip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  InputAdornment,
  Snackbar,
  Collapse
} from '@mui/material';
import { 
  Send as SendIcon, 
  Group as GroupIcon, 
  Person as PersonIcon,
  Close as CloseIcon,
  FiberManualRecord as OnlineIcon,
  SentimentSatisfied as PositiveIcon,
  SentimentNeutral as NeutralIcon,
  SentimentDissatisfied as NegativeIcon,
  Lightbulb as InsightIcon,
  Tag as TagIcon,
  PriorityHigh as PriorityIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  AttachFile as AttachIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { Message, User, MessagePriority, Sentiment, FileAttachment, TeamSentimentAnalysis } from './types';
import api, { messagesApi, usersApi, fileAttachmentsService } from './services/api';
import { useAuth } from './contexts/AuthContext';
import FileUploader from './components/FileUploader';
import FileAttachmentViewer from './components/FileAttachmentViewer';

// Get sentiment icon
function getSentimentIcon(sentiment: Sentiment) {
  switch (sentiment) {
    case 'positive':
      return <PositiveIcon sx={{ color: 'success.main' }} />;
    case 'negative':
      return <NegativeIcon sx={{ color: 'error.main' }} />;
    default:
      return <NeutralIcon sx={{ color: 'info.main' }} />;
  }
}

// Format timestamp
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<MessagePriority>('normal');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamSentiment, setTeamSentiment] = useState<TeamSentimentAnalysis | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [messageAttachments, setMessageAttachments] = useState<FileAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await messagesApi.getMessages();
      setMessages(response.data.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers();
      setUsers(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    }
  };

  // Fetch team sentiment data
  const fetchTeamSentiment = useCallback(async () => {
    try {
      const response = await messagesApi.getTeamSentiment();
      setTeamSentiment(response);
    } catch (err: any) {
      console.error('Failed to load team sentiment:', err);
      setTeamSentiment(null);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchTeamSentiment();
  }, [fetchTeamSentiment]);

  // Add file attachment to message
  const handleFileUploaded = (file: FileAttachment) => {
    setMessageAttachments(prev => [...prev, file]);
  };
  
  // Remove file attachment
  const handleRemoveAttachment = (fileId: number) => {
    setMessageAttachments(prev => prev.filter(file => file.id !== fileId));
  };
  
  // Toggle attachment panel
  const toggleAttachmentPanel = () => {
    setAttachmentOpen(!attachmentOpen);
  };

  // Send message function
  const sendMessage = async () => {
    if (!messageText.trim() && messageAttachments.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const sentMessage = await messagesApi.sendMessage({
        content: messageText,
        isPrivate: isPrivate,
        priority: selectedPriority,
        tags: selectedTags,
        mentions: selectedMentions,
        searchKeywords: messageText.split(' ').filter(word => word.length > 3)
      });
      
      // Add attachments to message if there are any
      if (messageAttachments.length > 0) {
        // Update each attachment with the message ID
        for (const attachment of messageAttachments) {
          await fileAttachmentsService.uploadFile({
            filename: attachment.filename,
            fileType: attachment.fileType,
            fileData: attachment.data || '',
            messageId: sentMessage.id
          });
        }
      }
      
      setMessages([...messages, sentMessage]);
      setMessageText('');
      setSelectedTags([]);
      setSelectedMentions([]);
      setSelectedPriority('normal');
      setIsPrivate(false);
      setIsComposing(false);
      setMessageAttachments([]);
      setAttachmentOpen(false);
      fetchMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tag input
  const handleAddTag = () => {
    if (tagInput && !selectedTags.includes(tagInput)) {
      setSelectedTags(prev => [...prev, tagInput]);
      setTagInput('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  // Handle user selection for mentions
  const handleMentionUser = (userId: string) => {
    if (!selectedMentions.includes(userId)) {
      setSelectedMentions(prev => [...prev, userId]);
    } else {
      setSelectedMentions(prev => prev.filter(id => id !== userId));
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await messagesApi.deleteMessage(messageId);
      fetchMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to delete message');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter messages based on tab and search
  const filteredMessages = messages.filter(message => {
    // First apply tab filter
    if (tabValue === 1 && !message.isPrivate) return false;
    if (tabValue === 2 && message.priority !== 'urgent') return false;
    
    // Then apply search filter if search query exists
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        message.content.toLowerCase().includes(lowerQuery) ||
        message.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        message.mentions.some(mention => {
          const user = users.find(u => u.id === mention);
          return user?.name.toLowerCase().includes(lowerQuery);
        })
      );
    }
    
    return true;
  });

  // Toggle message composition mode
  const toggleCompose = () => {
    setIsComposing(!isComposing);
  };

  // Get priority color
  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'important':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'primary';
    }
  };

  // Render the message input area
  const renderMessageInput = () => (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      {isComposing ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as MessagePriority)}
                label="Priority"
              >
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="important">Important</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Visibility</InputLabel>
              <Select
                value={isPrivate ? 'private' : 'public'}
                onChange={(e) => setIsPrivate(e.target.value === 'private')}
                label="Visibility"
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setIsComposing(false)}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={sendMessage}
                disabled={!messageText.trim() || isLoading}
                endIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
              >
                Send
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagIcon color="primary" />
                    </InputAdornment>
                  )
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleAddTag}
                sx={{ ml: 1, whiteSpace: 'nowrap' }}
              >
                Add Tag
              </Button>
            </Box>
            {selectedTags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {selectedTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{ mr: 1, mb: 1 }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Mention Users:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {users.map((user) => (
                <Chip
                  key={user.id}
                  avatar={<Avatar src={user.avatar}>{user.name[0]}</Avatar>}
                  label={user.name}
                  onClick={() => handleMentionUser(user.id)}
                  color={selectedMentions.includes(user.id) ? 'primary' : 'default'}
                  variant={selectedMentions.includes(user.id) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: 'flex' }}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            variant="outlined"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={toggleCompose}
            sx={{ ml: 1, whiteSpace: 'nowrap' }}
          >
            Advanced
          </Button>
          <IconButton 
            color="primary" 
            onClick={sendMessage}
            disabled={!messageText.trim() || isLoading}
            sx={{ ml: 1 }}
          >
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 0 }}>
        {/* Chat header with tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="chat tabs">
            <Tab icon={<GroupIcon />} label="All Messages" />
            <Tab icon={<PersonIcon />} label="Private" />
            <Tab icon={<Badge badgeContent={messages.filter(m => m.priority === 'urgent').length} color="error">
              <span>Urgent</span>
            </Badge>} label="Urgent" />
          </Tabs>
        </Box>
        
        {/* Search bar */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search messages..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <IconButton color="primary" onClick={fetchMessages} sx={{ ml: 1 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
        
        {/* Team sentiment analysis box */}
        {teamSentiment && teamSentiment.data && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <InsightIcon color="primary" fontSize="large" />
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1" fontWeight="bold">
                  Team Sentiment: {teamSentiment.sentiment}
                </Typography>
                <Typography variant="body2">{teamSentiment.insight}</Typography>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Positive">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <PositiveIcon color="success" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{teamSentiment.data.positive || 0}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Neutral">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <NeutralIcon color="info" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{teamSentiment.data.neutral || 0}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Negative">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <NegativeIcon color="error" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">{teamSentiment.data.negative || 0}</Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
            <IconButton size="small" onClick={() => setError(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Alert>
        )}
        
        {/* Message list */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {isLoading && messages.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : filteredMessages.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No messages found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchQuery ? 'Try a different search query' : 'Start a conversation by sending a message'}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredMessages.map((message) => {
                const isSentByCurrentUser = message.sender.id === user?.id;
                const mentionedUsers = message.mentions.map(userId => 
                  users.find(user => user.id === userId)?.name || userId
                );
                
                return (
                  <ListItem 
                    key={message.id} 
                    alignItems="flex-start"
                    sx={{
                      flexDirection: 'column',
                      alignItems: isSentByCurrentUser ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex',
                        flexDirection: isSentByCurrentUser ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        width: '100%'
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            getSentimentIcon(message.sentiment || 'neutral')
                          }
                        >
                          <Avatar alt={message.sender.name} src={`https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=random`} />
                        </Badge>
                      </ListItemAvatar>
                      <Box 
                        sx={{ 
                          maxWidth: '70%',
                          bgcolor: isSentByCurrentUser 
                            ? 'primary.main' 
                            : 'background.paper',
                          color: isSentByCurrentUser 
                            ? 'primary.contrastText' 
                            : 'text.primary',
                          p: 2,
                          borderRadius: 2,
                          boxShadow: 1
                        }}
                      >
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            component="span"
                            color={isSentByCurrentUser ? 'inherit' : 'primary'}
                          >
                            {message.sender.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            component="span"
                            color={isSentByCurrentUser ? 'inherit' : 'text.secondary'}
                          >
                            {formatTime(message.timestamp)}
                          </Typography>
                        </Box>

                        <Typography 
                          variant="body1" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {message.content}
                        </Typography>

                        {/* Message meta information */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mt: 1,
                            flexWrap: 'wrap',
                            gap: 0.5
                          }}
                        >
                          {message.isPrivate && (
                            <Chip 
                              label="Private" 
                              size="small" 
                              color="default" 
                              variant="outlined"
                            />
                          )}
                          
                          {message.priority !== 'normal' && (
                            <Chip 
                              icon={<PriorityIcon />}
                              label={message.priority} 
                              size="small" 
                              color={getPriorityColor(message.priority)}
                              variant="outlined"
                            />
                          )}
                          
                          {message.sentiment && (
                            <Tooltip title={`Sentiment: ${message.sentiment}`}>
                              <Chip 
                                icon={getSentimentIcon(message.sentiment)}
                                label={message.sentiment} 
                                size="small" 
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                          
                          {message.tags.map(tag => (
                            <Chip 
                              key={tag}
                              label={tag} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                        
                        {mentionedUsers.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Mentions: {mentionedUsers.join(', ')}
                          </Typography>
                        )}
                      </Box>
                      
                      {isSentByCurrentUser && (
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteMessage(message.id)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                );
              })}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>
        
        {/* Message input */}
        {renderMessageInput()}
      </Paper>
    </Box>
  );
}
