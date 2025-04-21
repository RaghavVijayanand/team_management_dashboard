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
  SelectChangeEvent,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  ExpandLess as ExpandLessIcon,
  Summarize as SummarizeIcon,
  Message as MessageIcon,
  Translate as TranslateIcon,
  Language as LanguageIcon,
  SmartToy as AIIcon,
  Call as CallIcon,
  CallEnd as CallEndIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
} from '@mui/icons-material';
import { Message, User, MessagePriority, Sentiment, FileAttachment, TeamSentimentAnalysis } from './types';
import api, { messagesApi, usersApi, fileAttachmentsService } from './services/api';
import translationService from './services/translationService';
import { useAuth } from './contexts/AuthContext';
import FileUploader from './components/FileUploader';
import FileAttachmentViewer from './components/FileAttachmentViewer';
import VideoCall from './components/VideoCall';
import VoiceCall from './components/VoiceCall';

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
  const [privateRecipientId, setPrivateRecipientId] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamSentiment, setTeamSentiment] = useState<TeamSentimentAnalysis | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [messageAttachments, setMessageAttachments] = useState<FileAttachment[]>([]);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [translatedMessages, setTranslatedMessages] = useState<{[key: number]: string}>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [directMessageUser, setDirectMessageUser] = useState<User | null>(null);
  const [directMessageUsers, setDirectMessageUsers] = useState<User[]>([]);
  const [aiMessages, setAiMessages] = useState<{text: string, isUser: boolean, timestamp: string}[]>([]);
  const [aiMessageText, setAiMessageText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentCallUser, setCurrentCallUser] = useState<string | null>(null);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');

  // Language options (unchanged)
  const languages = [
    { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' }, { code: 'zh', name: 'Chinese' }, { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }, { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiMessages]); // Scroll on AI messages too

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

  const fetchTeamSentiment = useCallback(async () => {
    try {
      const response = await messagesApi.getTeamSentiment();
      setTeamSentiment(response);
    } catch (err: any) {
      console.error('Failed to load team sentiment:', err);
      setTeamSentiment(null);
    }
  }, []);

  useEffect(() => {
    fetchTeamSentiment();
  }, [fetchTeamSentiment]);

  const handleFileUploaded = (file: FileAttachment) => {
    setMessageAttachments(prev => [...prev, file]);
  };

  const handleRemoveAttachment = (fileId: number) => {
    setMessageAttachments(prev => prev.filter(file => file.id !== fileId));
  };

  const toggleAttachmentPanel = () => {
    setAttachmentOpen(!attachmentOpen);
  };

  const fetchChatSummary = async () => {
    setIsSummaryLoading(true);
    setChatSummary(null);
    setIsSummaryDialogOpen(true);
    try {
      const response = await messagesApi.summarizeChat(filteredMessages);
      setChatSummary(response.summary);
    } catch (err: any) {
      console.error('Failed to fetch chat summary:', err);
      setChatSummary('Error generating summary. Please try again later.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() && messageAttachments.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const sentMessage = await messagesApi.sendMessage({
        content: messageText, isPrivate: isPrivate, priority: selectedPriority,
        tags: selectedTags, mentions: selectedMentions,
        searchKeywords: messageText.split(' ').filter(word => word.length > 3),
        recipientId: isPrivate ? privateRecipientId : null
      });
      if (messageAttachments.length > 0) {
        for (const attachment of messageAttachments) {
          await fileAttachmentsService.uploadFile({
            filename: attachment.filename, fileType: attachment.fileType,
            fileData: attachment.data || '', messageId: sentMessage.id
          });
        }
      }
      setMessages([...messages, sentMessage]);
      setMessageText(''); setSelectedTags([]); setSelectedMentions([]);
      setSelectedPriority('normal'); setIsPrivate(false); setPrivateRecipientId(null);
      setIsComposing(false); setMessageAttachments([]); setAttachmentOpen(false);
      fetchMessages(); // Refresh messages after sending
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !selectedTags.includes(tagInput)) {
      setSelectedTags(prev => [...prev, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleMentionUser = (userId: string) => {
    if (!selectedMentions.includes(userId)) {
      setSelectedMentions(prev => [...prev, userId]);
    } else {
      setSelectedMentions(prev => prev.filter(id => id !== userId));
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenSummaryDialog = () => {
    fetchChatSummary();
  };

  const handleCloseSummaryDialog = () => {
    setIsSummaryDialogOpen(false);
  };

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

  const sendAiMessage = async () => {
    if (!aiMessageText.trim() || isAiLoading) return;
    const userMessage = aiMessageText.trim();
    setAiMessageText('');
    setIsAiLoading(true);
    setAiMessages(prev => [...prev, { text: userMessage, isUser: true, timestamp: new Date().toISOString() }]);
    try {
      const response = await messagesApi.aiChat(userMessage);
      setAiMessages(prev => [...prev, { text: response.response, isUser: false, timestamp: response.timestamp }]);
    } catch (err: any) {
      setError(err.message || 'Failed to get AI response');
      // Add error message to AI chat for visibility
      setAiMessages(prev => [...prev, { text: `Error: ${err.message || 'Failed to get response'}`, isUser: false, timestamp: new Date().toISOString() }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filter messages (unchanged logic)
  const filteredMessages = messages.filter(message => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return message.content.toLowerCase().includes(searchLower) ||
             message.sender.name.toLowerCase().includes(searchLower) ||
             (message.tags && message.tags.some(tag => tag.toLowerCase().includes(searchLower)));
    }
    if (tabValue === 1) {
      if (directMessageUser) {
        return message.isPrivate &&
               ((message.sender.id === user?.id && message.recipientId === directMessageUser.id) ||
                (message.sender.id === directMessageUser.id && message.recipientId === user?.id));
      } else {
        return message.isPrivate &&
               (message.sender.id === user?.id || message.recipientId === user?.id);
      }
    } else if (tabValue === 2) {
      if (message.isPrivate) {
        return (message.recipientId === user?.id || message.sender.id === user?.id) &&
               message.mentions?.includes(user?.id || '');
      }
      return message.mentions?.includes(user?.id || '');
    } else if (tabValue === 3) {
      return false;
    } else {
      return !message.isPrivate;
    }
  });

  const toggleCompose = () => {
    setIsComposing(!isComposing);
  };

  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'important': return 'warning';
      case 'low': return 'success';
      default: return 'primary';
    }
  };

  const handleLanguageChange = async (event: SelectChangeEvent) => {
    const newLanguage = event.target.value as string;
    setSelectedLanguage(newLanguage);
    if (newLanguage !== 'en') {
      await translateMessages(newLanguage);
    } else {
      setTranslatedMessages({});
    }
  };

  const translateMessages = async (languageCode: string) => {
    if (languageCode === 'en' || filteredMessages.length === 0) return;
    setIsTranslating(true);
    try {
      const messagesToTranslate = filteredMessages.map(msg => ({ id: msg.id, content: msg.content }));
      const result = await translationService.translateWithFallback(messagesToTranslate, languageCode);
      setTranslatedMessages(result.translations);
      if (result.method === 'client') {
        setError('Using simplified dictionary-based translation. Some content may remain in English.');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('All translation methods failed:', err);
      setError('Failed to translate messages. Please try again later.');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (selectedLanguage !== 'en' && filteredMessages.length > 0) {
      translateMessages(selectedLanguage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, filteredMessages.length]); // Keep dependency on length to re-translate if filter changes

  const getMessageContent = (message: Message) => {
    if (selectedLanguage === 'en' || !translatedMessages[message.id]) {
      return message.content;
    }
    return translatedMessages[message.id];
  };

  const startDirectMessage = (selectedUser: User | { id: string; name: string; avatar?: string }) => {
    const fullUser = 'isOnline' in selectedUser ? selectedUser : users.find(u => u.id === selectedUser.id) || selectedUser;
    setDirectMessageUser(fullUser as User);
    setTabValue(1);
    setIsPrivate(true);
    setPrivateRecipientId(fullUser.id);
    if (!directMessageUsers.some(u => u.id === fullUser.id)) {
      setDirectMessageUsers(prev => [...prev, fullUser as User]);
    }
  };

  const clearDirectMessage = () => {
    setDirectMessageUser(null);
    setIsPrivate(false);
    setPrivateRecipientId(null);
  };

  useEffect(() => {
    if (messages.length > 0 && user) {
      const dmUsers = new Set<string>();
      messages.forEach(message => {
        if (message.isPrivate) {
          if (message.sender.id === user.id && message.recipientId) dmUsers.add(message.recipientId);
          else if (message.recipientId === user.id) dmUsers.add(message.sender.id);
        }
      });
      const dmUserObjects = users.filter(u => dmUsers.has(u.id));
      setDirectMessageUsers(dmUserObjects);
    }
  }, [messages, users, user]);

  // --- Call Handling (Support for both Voice and Video) ---
  const handleStartCall = (userId: string, type: 'voice' | 'video' = 'voice') => {
    console.log(`[Chat] Starting ${type} call with ${userId}`);
    setCurrentCallUser(userId);
    setCallType(type);
    setIsCallActive(true);
  };

  const handleEndCall = () => {
    console.log(`[Chat] ${callType} call ended.`);
    setIsCallActive(false);
    setCurrentCallUser(null);
    // Call components handle their own internal cleanup
  };

  // useEffect for call state - handles basic page visibility/unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isCallActive) {
        console.log(`[Chat] Page hidden, ending ${callType} call.`);
        handleEndCall();
      }
    };
    const handleBeforeUnload = () => {
      if (isCallActive) {
        console.log(`[Chat] Page unloading, ending ${callType} call.`);
        handleEndCall();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Ensure call state is reset if component unmounts while call is active
      if (isCallActive) {
        handleEndCall();
      }
    };
  }, [isCallActive]); // Only depends on isCallActive

  // --- Render Functions ---

  const renderMessageInput = () => (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      {isComposing ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} variant="outlined" />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Priority</InputLabel>
              <Select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value as MessagePriority)} label="Priority">
                <MenuItem value="urgent">Urgent</MenuItem> <MenuItem value="important">Important</MenuItem> <MenuItem value="normal">Normal</MenuItem> <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Visibility</InputLabel>
              <Select value={isPrivate ? 'private' : 'public'} onChange={(e) => setIsPrivate(e.target.value === 'private')} label="Visibility">
                <MenuItem value="public">Public</MenuItem> <MenuItem value="private">Private (Select User)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {isPrivate && (
            <Grid item xs={12} md={8}>
               <FormControl fullWidth variant="outlined" size="small">
                 <InputLabel>Send Privately To</InputLabel>
                 <Select value={privateRecipientId || ''} onChange={(e) => setPrivateRecipientId(e.target.value as string)} label="Send Privately To">
                   <MenuItem value="" disabled><em>Select a user</em></MenuItem>
                   {users.filter(u => u.id !== user?.id).map((u) => (
                     <MenuItem key={u.id} value={u.id}>
                       <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                         <Box sx={{ display: 'flex', alignItems: 'center' }}>
                           <Avatar src={u.avatar} sx={{ width: 24, height: 24, mr: 1 }}>{u.name[0]}</Avatar> {u.name}
                         </Box>
                         <Box sx={{ display: 'flex' }}>
                           <Tooltip title="Voice call">
                             <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleStartCall(u.id, 'voice'); }} sx={{ p: 0.5, color: 'primary.main', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}>
                               <CallIcon fontSize="small" sx={{ fontSize: '0.95rem' }} />
                             </IconButton>
                           </Tooltip>
                           <Tooltip title="Video call">
                             <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleStartCall(u.id, 'video'); }} sx={{ p: 0.5, color: 'primary.main', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}>
                               <VideocamIcon fontSize="small" sx={{ fontSize: '0.95rem' }} />
                             </IconButton>
                           </Tooltip>
                         </Box>
                       </Box>
                     </MenuItem>
                   ))}
                 </Select>
               </FormControl>
            </Grid>
          )}
           <Grid item xs={6} md={4}>
             <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
               <Button variant="outlined" color="primary" onClick={() => setIsComposing(false)} sx={{ mr: 1 }}>Cancel</Button>
               <Button variant="contained" color="primary" onClick={sendMessage} disabled={(!messageText.trim() && messageAttachments.length === 0) || isLoading || (isPrivate && !privateRecipientId)} endIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}>
                 Send {isPrivate ? 'Privately' : ''}
               </Button>
             </Box>
           </Grid>
           <Grid item xs={12}>
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
               <TextField fullWidth size="small" placeholder="Add a tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><TagIcon color="primary" /></InputAdornment>) }} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} />
               <Button variant="outlined" color="primary" onClick={handleAddTag} sx={{ ml: 1, whiteSpace: 'nowrap' }}>Add Tag</Button>
             </Box>
             {selectedTags.length > 0 && (<Box sx={{ mb: 2 }}>{selectedTags.map((tag) => (<Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} sx={{ mr: 1, mb: 1 }} color="primary" variant="outlined" />))}</Box>)}
           </Grid>
           <Grid item xs={12}>
             <Typography variant="subtitle2" sx={{ mb: 1 }}>Mention Users:</Typography>
             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
               {users.map((u) => (<Chip key={u.id} avatar={<Avatar src={u.avatar}>{u.name[0]}</Avatar>} label={u.name} onClick={() => handleMentionUser(u.id)} color={selectedMentions.includes(u.id) ? 'primary' : 'default'} variant={selectedMentions.includes(u.id) ? 'filled' : 'outlined'} onDelete={u.id !== user?.id ? () => startDirectMessage(u) : undefined} deleteIcon={u.id !== user?.id ? <PersonIcon fontSize="small" /> : undefined} />))}
             </Box>
           </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: 'flex' }}>
          <TextField fullWidth placeholder="Type a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} variant="outlined" onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
          <Button variant="contained" color="primary" onClick={toggleCompose} sx={{ ml: 1, whiteSpace: 'nowrap' }}>Advanced</Button>
          <IconButton color="primary" onClick={sendMessage} disabled={!messageText.trim() || isLoading} sx={{ ml: 1 }}>
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      {/* Header Paper (unchanged) */}
      <Paper sx={{ display: 'flex', p: 1, justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MessageIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">{directMessageUser ? `Chat with ${directMessageUser.name}` : 'Team Chat'}</Typography>
          {directMessageUser && (<IconButton size="small" onClick={clearDirectMessage} sx={{ ml: 1 }}><CloseIcon fontSize="small" /></IconButton>)}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
            <Select value={selectedLanguage} onChange={handleLanguageChange} displayEmpty variant="outlined" startAdornment={<InputAdornment position="start"><LanguageIcon fontSize="small" /></InputAdornment>} sx={{ height: 40 }}>
              {languages.map((lang) => (<MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>))}
            </Select>
          </FormControl>
          <Tooltip title="Summarize chat using AI">
            <IconButton onClick={handleOpenSummaryDialog} color="primary" disabled={isSummaryLoading}>
              {isSummaryLoading ? <CircularProgress size={24} /> : <SummarizeIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh messages">
            <IconButton onClick={fetchMessages} disabled={isLoading || isTranslating}>
              {isLoading || isTranslating ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Tabs and Search (unchanged structure, updated tooltips below) */}
      <Box sx={{ position: 'relative', bgcolor: 'background.paper' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" indicatorColor="primary" textColor="primary">
          <Tab label="All Messages" /> <Tab label="Private" /> <Tab label="Mentions" /> <Tab label="AI Chat" icon={<AIIcon />} iconPosition="start" />
        </Tabs>
        {tabValue === 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <Typography variant="subtitle2" sx={{ mr: 1, fontWeight: 600 }}>Conversations:</Typography>
            {directMessageUsers.length > 0 ? (
              directMessageUsers.map((dmUser) => (
                <Box key={dmUser.id} sx={{ display: 'flex', alignItems: 'center', mr: 1, mb: 1 }}>
                  <Chip avatar={<Avatar src={dmUser.avatar}>{dmUser.name[0]}</Avatar>} label={dmUser.name} onClick={() => startDirectMessage(dmUser)} color={directMessageUser?.id === dmUser.id ? 'primary' : 'default'} variant={directMessageUser?.id === dmUser.id ? 'filled' : 'outlined'} />
                  <Tooltip title="Start voice call">
                    <IconButton size="small" onClick={() => handleStartCall(dmUser.id)} sx={{ ml: 0.5, p: 0.5, color: 'primary.main', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}>
                      <CallIcon fontSize="small" sx={{ fontSize: '0.95rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))
            ) : (<Typography variant="body2" color="text.secondary">No direct message conversations yet</Typography>)}
            <Tooltip title="Start new conversation">
              <Chip 
                icon={<PersonIcon />} 
                label="New Message" 
                onClick={() => setIsComposing(true)} 
                color="primary" 
                variant="outlined" 
                sx={{ ml: 'auto', mr: 1 }} 
              />
            </Tooltip>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <TextField size="small" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ flexGrow: 1, mr: 1 }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }} />
        </Box>
      </Box>

      {/* Team Sentiment Banner (unchanged) */}
      {teamSentiment && ( <Card sx={{ mb: 2, p: 1, borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', background: 'linear-gradient(90deg, rgba(240,244,255,1) 0%, rgba(226,236,253,1) 100%)', overflow: 'visible', border: '1px solid rgba(63, 81, 181, 0.1)' }}> <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}> <Grid container spacing={1} alignItems="center"> <Grid item xs={12} sm={6}> <Box sx={{ display: 'flex', alignItems: 'center' }}> <InsightIcon sx={{ mr: 1, color: 'primary.main' }} /> <Typography variant="subtitle2" sx={{ fontWeight: 600 }}> Team Mood: {teamSentiment.overallSentiment} </Typography> </Box> </Grid> <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}> <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}> {getSentimentIcon(teamSentiment.overallSentiment as Sentiment)} <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}> Based on {teamSentiment.messageCount} messages </Typography> </Box> </Grid> </Grid> </CardContent> </Card> )}

      {/* Main Chat Interface Paper */}
      <Paper elevation={0} sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 'calc(100% - 72px)', position: 'relative' }}>
        {/* Messages List Box */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, backgroundColor: '#f8fafd' }}>
          {isLoading || isTranslating ? ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}> <CircularProgress /> <Typography variant="body2" sx={{ ml: 2 }}> {isTranslating ? 'Translating messages...' : 'Loading messages...'} </Typography> </Box>
          ) : error ? ( <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : tabValue === 3 ? ( /* AI Chat Tab */ <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}> {aiMessages.length === 0 ? ( <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary', textAlign: 'center', p: 3 }}> <AIIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} /> <Typography variant="h6" gutterBottom> AI Assistant </Typography> <Typography variant="body2" sx={{ maxWidth: 500 }}> Chat with our AI assistant powered by Gemini. Ask questions, get help, or just have a conversation. </Typography> </Box> ) : ( <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}> {aiMessages.map((msg, index) => ( <Box key={index} sx={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start', mb: 1 }}> <Paper elevation={0} sx={{ p: 2, maxWidth: '80%', borderRadius: 2, backgroundColor: msg.isUser ? 'primary.light' : 'background.paper', color: msg.isUser ? 'primary.contrastText' : 'text.primary', border: msg.isUser ? 'none' : '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}> <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}> {msg.text} </Typography> <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}> {formatTime(msg.timestamp)} </Typography> </Paper> </Box> ))} {isAiLoading && ( <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}> <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.paper', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}> <Box sx={{ display: 'flex', alignItems: 'center' }}> <CircularProgress size={20} sx={{ mr: 1 }} /> <Typography variant="body2">AI is thinking...</Typography> </Box> </Paper> </Box> )} </Box> )} </Box>
          ) : filteredMessages.length === 0 ? ( <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.7 }}> <MessageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} /> <Typography variant="body1" color="text.secondary"> No messages to display </Typography> <Typography variant="body2" color="text.secondary"> {searchQuery ? 'Try a different search term' : 'Start a conversation'} </Typography> </Box>
          ) : ( /* Regular Message List */
            <List sx={{ width: '100%', p: 0 }}>
              {filteredMessages.map((message, index) => {
                const isCurrentUser = message.sender.id === user?.id;
                const showSenderInfo = index === 0 || filteredMessages[index - 1]?.sender.id !== message.sender.id;
                return (
                  <React.Fragment key={message.id}>
                    {showSenderInfo && !isCurrentUser && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: index > 0 ? 2 : 0, ml: 2 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}> <Avatar src={message.sender.avatar} alt={message.sender.name} sx={{ width: 36, height: 36, bgcolor: 'primary.main', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}> {message.sender.name.charAt(0).toUpperCase()} </Avatar> </ListItemAvatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}> {message.sender.name} </Typography>
                        {message.sender.id !== user?.id && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Tooltip title="Send direct message">
                              <IconButton size="small" onClick={() => startDirectMessage(message.sender)} sx={{ ml: 1, p: 0.5, '&:hover': { color: 'primary.main', backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}>
                                <PersonIcon fontSize="small" sx={{ fontSize: '0.95rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Start voice call">
                              <IconButton size="small" onClick={() => handleStartCall(message.sender.id, 'voice')} sx={{ ml: 1, p: 0.5, '&:hover': { color: 'primary.main', backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}>
                                <CallIcon fontSize="small" sx={{ fontSize: '0.95rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Start video call">
                              <IconButton size="small" onClick={() => handleStartCall(message.sender.id, 'video')} sx={{ ml: 1, p: 0.5, '&:hover': { color: 'primary.main', backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}>
                                <VideocamIcon fontSize="small" sx={{ fontSize: '0.95rem' }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    )}
                    <ListItem alignItems="flex-start" sx={{ flexDirection: isCurrentUser ? 'row-reverse' : 'row', py: 1, px: 2, '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isCurrentUser ? 'flex-end' : 'flex-start', maxWidth: { xs: '90%', sm: '75%', md: '65%' }, width: '100%' }}>
                        {showSenderInfo && isCurrentUser && (<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, mr: 1, color: 'text.secondary', fontSize: '0.875rem' }}> You </Typography>)}
                        <Paper elevation={0} sx={{ py: 1.5, px: 2, borderRadius: isCurrentUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px', backgroundColor: isCurrentUser ? 'primary.main' : 'white', color: isCurrentUser ? 'white' : 'text.primary', border: isCurrentUser ? 'none' : '1px solid rgba(0,0,0,0.08)', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', wordBreak: 'break-word', transition: 'all 0.2s ease', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } }}>
                          {message.priority === 'urgent' && (<Chip size="small" label="Urgent" color="error" icon={<PriorityIcon fontSize="small" />} sx={{ position: 'absolute', top: -12, right: isCurrentUser ? 'auto' : 16, left: isCurrentUser ? 16 : 'auto', height: 24, '& .MuiChip-label': { px: 1, fontSize: '0.625rem' }, '& .MuiChip-icon': { fontSize: '0.75rem' } }} />)}
                          <Typography variant="body1"> {getMessageContent(message)} </Typography>
                          {selectedLanguage !== 'en' && translatedMessages[message.id] && (
                            <Tooltip title="Translated from original language">
                              <TranslateIcon 
                                fontSize="small" 
                                sx={{ ml: 1, fontSize: 16, verticalAlign: 'middle', opacity: 0.6, color: isCurrentUser ? 'white' : 'text.secondary' }} 
                              />
                            </Tooltip>
                          )}
                          {message.tags && message.tags.length > 0 && (<Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}> {message.tags.map(tag => (<Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderRadius: '12px', height: 20, backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', borderColor: isCurrentUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)', color: isCurrentUser ? 'white' : 'text.secondary', '& .MuiChip-label': { px: 1, fontSize: '0.625rem' } }} />))} </Box>)}
                          {message.attachments && message.attachments.length > 0 && (<Box sx={{ mt: 1 }}> <FileAttachmentViewer attachments={message.attachments} /> </Box>)}
                        </Paper>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, ml: isCurrentUser ? 0 : 1, mr: isCurrentUser ? 1 : 0, gap: 1 }}>
                          <Typography variant="caption" color={isCurrentUser ? 'text.secondary' : 'text.disabled'} sx={{ fontSize: '0.75rem', opacity: 0.8 }}> {formatTime(message.timestamp)} </Typography>
                          {message.sentiment && (
                            <Tooltip title={`Sentiment: ${message.sentiment}`}>
                              <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                                {getSentimentIcon(message.sentiment)}
                              </Box>
                            </Tooltip>
                          )}
                          {isCurrentUser && (
                            <Tooltip title="Delete message">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteMessage(message.id)} 
                                sx={{ ml: 1, p: 0.5, '&:hover': { color: 'error.main', backgroundColor: 'rgba(244, 67, 54, 0.08)' } }}
                              >
                                <DeleteIcon fontSize="small" sx={{ fontSize: '0.95rem' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>

        {/* Message Compose Area (unchanged structure) */}
        <Box sx={{ p: 2, backgroundColor: 'background.paper', borderTop: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 -2px 10px rgba(0,0,0,0.03)' }}>
          {tabValue === 3 ? ( /* AI Input */ <Box sx={{ display: 'flex', alignItems: 'center' }}> <TextField fullWidth size="medium" placeholder="Type a message to the AI..." value={aiMessageText} onChange={(e) => setAiMessageText(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }} disabled={isAiLoading} InputProps={{ endAdornment: (<InputAdornment position="end"> <IconButton color="primary" onClick={sendAiMessage} disabled={!aiMessageText.trim() || isAiLoading}> {isAiLoading ? <CircularProgress size={24} /> : <SendIcon />} </IconButton> </InputAdornment>) }} /> </Box>
          ) : ( /* Regular Input */ renderMessageInput() )}
        </Box>
      </Paper>

      {/* Summary Dialog (unchanged) */}
      <Dialog open={isSummaryDialogOpen} onClose={handleCloseSummaryDialog} maxWidth="md" fullWidth> <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}> <Box sx={{ display: 'flex', alignItems: 'center' }}> <SummarizeIcon sx={{ mr: 1 }} /> Chat Summary (Powered by Gemini AI) </Box> <IconButton onClick={handleCloseSummaryDialog}> <CloseIcon /> </IconButton> </DialogTitle> <DialogContent> {isSummaryLoading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}> <CircularProgress /> </Box> ) : chatSummary ? ( <Box> <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}> {chatSummary} </Typography> </Box> ) : ( <Typography color="text.secondary"> No summary available. There may not be enough messages to summarize. </Typography> )} </DialogContent> <DialogActions> <Button onClick={handleCloseSummaryDialog}>Close</Button> </DialogActions> </Dialog>

      {/* Call container */}
      {isCallActive && currentCallUser && (
        <Box sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          width: callType === 'video' ? '480px' : '320px',
          height: callType === 'video' ? '360px' : 'auto',
          minHeight: '150px',
          zIndex: 9999,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '36px',
            backgroundColor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2
          }}>
            <Typography variant="subtitle2">{callType === 'video' ? 'Video Call' : 'Voice Call'}</Typography>
            <IconButton size="small" onClick={handleEndCall} sx={{ color: 'white' }}>
              <CallEndIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ pt: '44px', pb: '8px', height: callType === 'video' ? 'calc(100% - 44px)' : 'auto' }}>
            {callType === 'video' ? (
              <VideoCall
                isOpen={isCallActive}
                onClose={handleEndCall}
                remoteUserId={currentCallUser}
                localUserId={user?.id || ''}
                onCallEnd={handleEndCall}
              />
            ) : (
              <VoiceCall
                isOpen={isCallActive}
                onClose={handleEndCall}
                remoteUserId={currentCallUser}
                localUserId={user?.id || ''}
                onCallEnd={handleEndCall}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Error Snackbar (unchanged) */}
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}
