// Import necessary dependencies
import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { TaskAlt as TaskIcon, Summarize as SummarizeIcon, AssignmentTurnedIn as ActionItemIcon, Close as CloseIcon } from '@mui/icons-material';
import { messagesApi } from '../services/api';
import { Message } from '../types';

interface AssistantPanelProps {
  onClose?: () => void;
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({ onClose }) => {
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const handleSummarize = async () => {
    setIsSummaryLoading(true);
    try {
      const messages: Message[] = [
        {
          id: 1,
          content: 'Hello',
          sender: { 
            id: '1', 
            name: 'User1', 
            avatar: undefined 
          },
          timestamp: new Date().toISOString(),
          isPrivate: false,
          priority: 'normal',
          tags: [],
          mentions: [],
          readBy: [],
          searchKeywords: [],
          sentiment: undefined
        },
        {
          id: 2,
          content: 'Hi',
          sender: { 
            id: '2', 
            name: 'User2', 
            avatar: undefined 
          },
          timestamp: new Date().toISOString(),
          isPrivate: false,
          priority: 'normal',
          tags: [],
          mentions: [],
          readBy: [],
          searchKeywords: [],
          sentiment: undefined
        }
      ];

      const response = await messagesApi.summarizeChat(messages);
      setSummary(response.summary ?? '');
    } catch (error) {
      console.error('Error summarizing chat:', error);
      setSummary('Error summarizing chat');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleFindActions = () => {
    console.log("Find action items");
  };

  const handleViewTasks = () => {
    console.log("View tasks/reminders");
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: '1px solid rgba(0,0,0,0.08)',
        minWidth: '280px',
        maxWidth: '320px',
        position: 'relative',
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          AI Assistant
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Summarization Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
          <SummarizeIcon sx={{ mr: 1, color: 'primary.main' }} /> Summarization
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleSummarize}
          fullWidth
          disabled={isSummaryLoading}
        >
          {isSummaryLoading ? 'Summarizing...' : 'Summarize Chat'}
        </Button>

        <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, minHeight: '50px' }}>
          {isSummaryLoading ? (
            <Typography variant="caption" color="text.secondary">Summarizing...</Typography>
          ) : summary ? (
            <Typography variant="caption">{summary}</Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">Summary will appear here...</Typography>
          )}
        </Box>
      </Box>

      {/* Action Items Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
          <ActionItemIcon sx={{ mr: 1, color: 'primary.main' }} /> Action Items
        </Typography>
        <Button variant="outlined" size="small" onClick={handleFindActions} fullWidth>
          Suggest Action Items
        </Button>
        <List dense sx={{ maxHeight: '150px', overflowY: 'auto', mt: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <ListItem>
            <ListItemText primary="Placeholder: Follow up on report" secondary="From: User A" />
          </ListItem>
           <ListItem>
            <ListItemText primary="Placeholder: Schedule team meeting" secondary="From: User B" />
          </ListItem>
        </List>
      </Box>

      {/* Task Reminders Section */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
          <TaskIcon sx={{ mr: 1, color: 'primary.main' }} /> Task Reminders
        </Typography>
        <Button variant="outlined" size="small" onClick={handleViewTasks} fullWidth sx={{ mb: 1 }}>
          View All Tasks
        </Button>
        <List dense sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'action.hover', borderRadius: 1 }}>
          <ListItem>
            <ListItemText primary="Placeholder: Submit proposal" secondary="Due: Tomorrow" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Placeholder: Review design mockups" secondary="Due: Today 4 PM" />
          </ListItem>
        </List>
      </Box>

    </Paper>
  );
};

export default AssistantPanel;
