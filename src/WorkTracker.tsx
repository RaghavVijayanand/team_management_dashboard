import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Stack,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Autocomplete,
  SelectChangeEvent,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Label as LabelIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { WorkItem, User, WorkItemStatus, WorkItemPriority, FileAttachment } from './types';
import { useAuth } from './contexts/AuthContext';
import api, { workItemsService, usersApi, fileAttachmentsService } from './services/api';
import FileUploader from './components/FileUploader';
import FileAttachmentViewer from './components/FileAttachmentViewer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function WorkTracker() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<WorkItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [tagInput, setTagInput] = useState('');
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [workItemAttachments, setWorkItemAttachments] = useState<FileAttachment[]>([]);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);

  const fetchWorkItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await workItemsService.getAll();
      setWorkItems(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch work items');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersApi.getUsers();
      setUsers(response);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to fetch users');
    }
  }, []);

  useEffect(() => {
    fetchWorkItems();
    fetchUsers();
  }, [fetchWorkItems, fetchUsers]);

  const handleOpenDialog = (item?: WorkItem) => {
    if (item) {
      setEditingItem(item);
      if (item.id) {
        fetchWorkItemAttachments(item.id);
      }
    } else {
      setEditingItem({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignedTo: null,
        tags: []
      });
      setWorkItemAttachments([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormErrors({});
    setError('');
    setWorkItemAttachments([]);
    setAttachmentsOpen(false);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!editingItem?.title) errors.title = 'Title is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name && editingItem) {
      setEditingItem(prev => ({ ...prev!, [name]: value }));
      
      // Clear error for this field if it exists
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput && editingItem) {
      setEditingItem(prev => ({
        ...prev!,
        tags: [...(prev!.tags || []), tagInput]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    if (editingItem && editingItem.tags) {
      setEditingItem(prev => ({
        ...prev!,
        tags: prev!.tags?.filter((_, i) => i !== index)
      }));
    }
  };

  const handleFileUpload = async (file: File): Promise<void> => {
    if (!file) {
      console.error('No file provided');
      throw new Error('No file provided');
    }
    
    try {
      // Convert file to base64
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async () => {
          try {
            const base64data = reader.result as string;
            const fileData = {
              filename: file.name,
              fileType: file.type,
              fileData: base64data,
              workItemId: editingItem?.id
            };
            
            console.log('Uploading file:', fileData.filename, 'for work item:', fileData.workItemId);
            
            await fileAttachmentsService.uploadFile(fileData);
            
            if (editingItem?.id) {
              await fetchWorkItemAttachments(editingItem.id);
            }
            
            resolve();
          } catch (error) {
            console.error('Error in file upload:', error);
            reject(error);
          }
        };
        
        reader.onerror = (event) => {
          console.error('FileReader error:', event);
          reject(new Error('Failed to read file'));
        };
        
        // Start reading the file
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file');
      throw err;
    }
  };

  const fetchWorkItemAttachments = async (workItemId: number) => {
    try {
      const attachments = await fileAttachmentsService.getWorkItemFiles(workItemId);
      setWorkItemAttachments(attachments);
    } catch (err) {
      console.error('Error fetching work item attachments:', err);
    }
  };

  const handleSaveWorkItem = async () => {
    if (!validateForm() || !editingItem) return;
    
    try {
      setLoading(true);
      
      // Create a copy of the work item with correctly formatted data
      const workItemToSave = {
        ...editingItem,
        // If assignedTo is a full user object, extract the ID
        assignedTo: editingItem.assignedTo?.id || null
      };
      
      let savedWorkItem;
      
      if ('id' in editingItem && editingItem.id) {
        // Update existing work item
        const response = await workItemsService.update(editingItem.id, workItemToSave);
        savedWorkItem = response.data;
      } else {
        // Create new work item
        const response = await workItemsService.create(workItemToSave);
        savedWorkItem = response.data;
      }
      
      fetchWorkItems();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save work item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkItem = async (id: number) => {
    try {
      setLoading(true);
      await workItemsService.delete(id);
      
      fetchWorkItems();
    } catch (err: any) {
      setError(err.message || 'Failed to delete work item');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: WorkItemStatus) => {
    switch (status) {
      case 'todo':
        return 'info';
      case 'in-progress':
        return 'warning';
      case 'review':
        return 'secondary';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: WorkItemPriority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Group work items by status
  const groupedWorkItems = workItems.reduce((acc, item) => {
    if (!acc[item.status]) {
      acc[item.status] = [];
    }
    acc[item.status].push(item);
    return acc;
  }, {} as Record<string, WorkItem[]>);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const filterItemsByStatus = (status: string) => {
    return workItems.filter(item => item.status === status);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name && editingItem) {
      setEditingItem(prev => ({ ...prev!, [name]: value }));
      
      // Clear error for this field if it exists
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleAssigneeChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    if (editingItem) {
      const assignedUser = value ? users.find(u => u.id === value) : null;
      setEditingItem(prev => ({ ...prev!, assignedTo: assignedUser }));
    }
  };

  const handleTagsChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    if (editingItem) {
      setEditingItem(prev => ({ ...prev!, tags: newValue }));
    }
  };

  const handleDeleteAttachment = async (fileId: number): Promise<void> => {
    try {
      await fileAttachmentsService.deleteFile(fileId);
      if (editingItem?.id) {
        await fetchWorkItemAttachments(editingItem.id);
      }
    } catch (err) {
      console.error('Error deleting attachment:', err);
      setError('Failed to delete attachment');
      throw err;
    }
  };

  const toggleAttachments = () => {
    setAttachmentsOpen(!attachmentsOpen);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Work Tracker</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Work Item
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <IconButton size="small" onClick={() => setError('')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Alert>
        )}

        {loading && !workItems.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : workItems.length === 0 ? (
          <Alert severity="info">No work items found. Click "Add Work Item" to create one.</Alert>
        ) : (
          <Tabs value={tabValue} onChange={handleTabChange}>
            {(['todo', 'in-progress', 'review', 'done'] as WorkItemStatus[]).map((status, index) => (
              <Tab key={index} label={status.replace('-', ' ')} />
            ))}
          </Tabs>
        )}
      </Paper>

      {/* Tab panels for work items by status */}
      {!loading && workItems.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {(['todo', 'in-progress', 'review', 'done'] as WorkItemStatus[]).map((status, index) => (
            <TabPanel key={index} value={tabValue} index={index}>
              <Grid container spacing={2}>
                {filterItemsByStatus(status).map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        position: 'relative'
                      }}
                    >
                      {item.attachments && item.attachments.length > 0 && (
                        <Badge 
                          badgeContent={item.attachments.length} 
                          color="primary"
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8 
                          }}
                        >
                          <AttachFileIcon fontSize="small" />
                        </Badge>
                      )}
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" gutterBottom noWrap>
                          {item.title}
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                          <Chip 
                            label={item.status.replace('-', ' ')} 
                            size="small" 
                            color={getStatusColor(item.status)} 
                            sx={{ mr: 1, mb: 1 }}
                          />
                          <Chip 
                            label={item.priority} 
                            size="small" 
                            color={getPriorityColor(item.priority)} 
                            sx={{ mb: 1 }}
                          />
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2, 
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.description || 'No description provided.'}
                        </Typography>
                        
                        {item.assignedTo && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {item.assignedTo.name}
                            </Typography>
                          </Box>
                        )}
                        
                        {item.dueDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {new Date(item.dueDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                        
                        {item.tags && item.tags.length > 0 && (
                          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <Chip key={idx} label={tag} size="small" variant="outlined" />
                            ))}
                            {item.tags.length > 3 && (
                              <Chip 
                                label={`+${item.tags.length - 3}`} 
                                size="small" 
                                variant="outlined" 
                              />
                            )}
                          </Box>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(item)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          color="error" 
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteWorkItem(item.id)}
                        >
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
                {filterItemsByStatus(status).length === 0 && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      No work items in this status. Click "Add Work Item" to create one.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </TabPanel>
          ))}
        </Box>
      )}

      {/* Work Item Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingItem && 'id' in editingItem && editingItem.id ? 'Edit Work Item' : 'Add Work Item'}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {editingItem && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={editingItem.title || ''}
                  onChange={handleInputChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  value={editingItem.description || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={editingItem.status || 'todo'}
                    label="Status"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="todo">To Do</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="review">Review</MenuItem>
                    <MenuItem value="done">Done</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={editingItem.priority || 'medium'}
                    label="Priority"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    name="assignedTo"
                    value={editingItem.assignedTo?.id || ''}
                    label="Assigned To"
                    onChange={handleAssigneeChange}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={editingItem.dueDate ? editingItem.dueDate.substring(0, 10) : ''}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleAddTag}
                    sx={{ ml: 1, minWidth: '120px' }}
                  >
                    Add Tag
                  </Button>
                </Box>
                {editingItem.tags && editingItem.tags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags:</Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {editingItem.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          onDelete={() => handleRemoveTag(index)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Grid>
              
              {/* File attachment section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Button 
                    onClick={toggleAttachments}
                    endIcon={attachmentsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    color="primary"
                  >
                    File Attachments {workItemAttachments.length > 0 && `(${workItemAttachments.length})`}
                  </Button>
                </Box>
                
                <Collapse in={attachmentsOpen}>
                  <Box sx={{ mb: 2 }}>
                    {editingItem && editingItem.id ? (
                      <>
                        <FileUploader 
                          onUpload={(file) => handleFileUpload(file)}
                          label="Add files to this work item"
                          workItemId={editingItem.id}
                        />
                        
                        {workItemAttachments.length > 0 ? (
                          <FileAttachmentViewer
                            attachments={workItemAttachments}
                            onDelete={handleDeleteAttachment}
                          />
                        ) : (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            No attachments yet. Use the upload button to add files.
                          </Alert>
                        )}
                      </>
                    ) : (
                      <Alert severity="info">
                        Save the work item first before adding attachments.
                      </Alert>
                    )}
                  </Box>
                </Collapse>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveWorkItem}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 