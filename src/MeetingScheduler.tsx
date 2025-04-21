import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Alert,
  Snackbar,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  Autocomplete
} from '@mui/material';
import { 
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import Calendar from './Calendar';
import RoomSelector from './RoomSelector';
import { Meeting, User } from './types';
import { useAuth } from './contexts/AuthContext';
import api, { meetingsService, usersApi } from './services/api';

interface MeetingSchedulerProps {
  onMeetingScheduled?: (meeting: Meeting) => void;
  onClose?: () => void;
}

const steps = ['Select Date & Time', 'Choose Room', 'Confirm Details'];

export default function MeetingScheduler({ onMeetingScheduled, onClose }: MeetingSchedulerProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [meeting, setMeeting] = useState<Partial<Meeting>>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    room: '',
    attendees: [],
    notes: ''
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [attendeeInput, setAttendeeInput] = useState('');
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [modalData, setModalData] = useState<Partial<Meeting>>({});

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await meetingsService.getAll();
      setMeetings(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch meetings');
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
    fetchMeetings();
    fetchUsers();
  }, [fetchMeetings, fetchUsers]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleMeetingScheduled = (newMeeting: Partial<Meeting>) => {
    // Convert string attendees list to proper format for API
    let attendeesList: string[] = [];
    
    if (Array.isArray(newMeeting.attendees)) {
      attendeesList = newMeeting.attendees as string[];
    } else if (typeof newMeeting.attendees === 'string') {
      attendeesList = (newMeeting.attendees as string).split(',').map((a: string) => a.trim());
    }
    
    // Ensure all fields are properly set
    setMeeting(prev => ({ 
      ...prev, 
      ...newMeeting,
      attendees: attendeesList
    }));
    
    // Move to next step
    handleNext();
    
    // Log for debugging
    console.log("Meeting scheduled:", { ...newMeeting, attendees: attendeesList });
  };

  const handleRoomSelected = (room: any) => {
    if (!room) {
      setError('Please select a valid room');
      return;
    }
    
    setSelectedRoom(room.name);
    setMeeting(prev => ({ ...prev, room: room.name }));
    handleNext();
  };

  // Validate form
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!meeting.title) errors.title = 'Title is required';
    if (!meeting.date) errors.date = 'Date is required';
    if (!meeting.startTime) errors.startTime = 'Start time is required';
    if (!meeting.endTime) errors.endTime = 'End time is required';
    if (!meeting.room) errors.room = 'Room is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Prepare meeting data for API
      const meetingData = {
        ...meeting,
        // Make sure attendees is an array of strings
        attendees: Array.isArray(meeting.attendees) ? meeting.attendees : []
      };
      
      // Log what we're sending to API for debugging
      console.log("Sending meeting data to API:", meetingData);
      
      const response = await meetingsService.create(meetingData);
      
      if (onMeetingScheduled) {
        onMeetingScheduled(response.data);
      }
      
      setShowSuccess(true);
      setMeeting({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        room: '',
        attendees: [],
        notes: ''
      });
      setActiveStep(0);
      setOpenDialog(false);
      fetchMeetings();
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error creating meeting:", err);
      setError(err.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      await meetingsService.delete(id);
      fetchMeetings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setMeeting(prev => ({ ...prev, [name]: value }));
      
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

  const handleAddAttendee = () => {
    if (attendeeInput && meeting.attendees) {
      setMeeting(prev => ({
        ...prev,
        attendees: [...(prev.attendees || []), attendeeInput]
      }));
      setAttendeeInput('');
    }
  };

  const handleRemoveAttendee = (index: number) => {
    if (meeting.attendees) {
      setMeeting(prev => ({
        ...prev,
        attendees: prev.attendees?.filter((_, i) => i !== index)
      }));
    }
  };

  const openNewMeetingDialog = () => {
    setMeeting({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      room: '',
      attendees: [],
      notes: ''
    });
    setActiveStep(0);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };

  const ManualMeetingForm = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Meeting Title"
            name="title"
            value={meeting.title || ''}
            onChange={handleInputChange}
            error={!!formErrors.title}
            helperText={formErrors.title}
            required
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Date"
            name="date"
            type="date"
            value={meeting.date || ''}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            error={!!formErrors.date}
            helperText={formErrors.date}
            required
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Start Time"
            name="startTime"
            type="time"
            value={meeting.startTime || ''}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            error={!!formErrors.startTime}
            helperText={formErrors.startTime}
            required
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="End Time"
            name="endTime"
            type="time"
            value={meeting.endTime || ''}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            error={!!formErrors.endTime}
            helperText={formErrors.endTime}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Room"
            name="room"
            value={meeting.room || ''}
            onChange={handleInputChange}
            error={!!formErrors.room}
            helperText={formErrors.room}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              label="Add Attendee"
              value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value)}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddAttendee}
              sx={{ ml: 1, minWidth: '120px' }}
            >
              Add
            </Button>
          </Box>
          {meeting.attendees && meeting.attendees.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Attendees:</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {meeting.attendees.map((attendee, index) => (
                  <Chip
                    key={index}
                    label={attendee}
                    onDelete={() => handleRemoveAttendee(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            multiline
            rows={4}
            value={meeting.notes || ''}
            onChange={handleInputChange}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <ManualMeetingForm />;
      case 1:
        return <RoomSelector onRoomSelected={handleRoomSelected} />;
      case 2:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Meeting Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography><strong>Title:</strong> {meeting.title}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Date:</strong> {meeting.date}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Time:</strong> {meeting.startTime} - {meeting.endTime}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Room:</strong> {meeting.room}</Typography>
              </Grid>
              {meeting.attendees && meeting.attendees.length > 0 && (
                <Grid item xs={12}>
                  <Typography><strong>Attendees:</strong></Typography>
                  <List dense>
                    {meeting.attendees.map((attendee, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={attendee} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
              {meeting.notes && (
                <Grid item xs={12}>
                  <Typography><strong>Notes:</strong></Typography>
                  <Typography variant="body2">{meeting.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      default:
        return null;
    }
  };

  const handleOpenModal = (meeting: Meeting | null = null) => {
    setSelectedMeeting(meeting);
    
    if (meeting) {
      // Create a safe copy of attendees
      const attendeesCopy = Array.isArray(meeting.attendees) 
        ? meeting.attendees.map(att => 
            typeof att === 'string' ? att : (att as any).id || '')
        : [];
        
      setModalData({ 
        ...meeting, 
        attendees: attendeesCopy
      });
      setSelectedRoom(meeting.room || '');
    } else {
      setModalData({ attendees: [] });
      setSelectedRoom('');
    }
    
    setOpenDialog(true);
  };

  const handleCloseModal = () => {
    setOpenDialog(false);
    setSelectedMeeting(null);
    setModalData({});
    setError('');
    setSelectedRoom('');
  };

  const handleSaveMeeting = async () => {
    setLoading(true);
    setError('');
    
    const meetingDataToSave = {
      ...modalData,
      room: selectedRoom,
      attendees: Array.isArray(modalData.attendees) ? modalData.attendees : [],
    };

    try {
      if (selectedMeeting) {
        await meetingsService.update(selectedMeeting.id, meetingDataToSave);
      } else {
        await meetingsService.create(meetingDataToSave);
      }
      fetchMeetings();
      handleCloseModal();
    } catch (err: any) {
      console.error("Error saving meeting:", err);
      setError(err.message || 'Failed to save meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setModalData({ ...modalData, [e.target.name]: e.target.value });
  };

  const handleAttendeesChange = (event: any, newValue: User[]) => {
    setModalData({ ...modalData, attendees: newValue.map(u => u.id) });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Meetings</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openNewMeetingDialog}
          >
            New Meeting
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <IconButton size="small" onClick={() => setError('')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            <Typography fontWeight="bold">Error:</Typography> 
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : meetings.length === 0 ? (
          <Alert severity="info">No meetings scheduled. Click "New Meeting" to add one.</Alert>
        ) : (
          <Grid container spacing={2}>
            {meetings.map((meeting) => (
              <Grid item xs={12} sm={6} md={4} key={meeting.id}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" noWrap sx={{ mb: 1 }}>
                      {meeting.title}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EventIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">{meeting.date}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimeIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">{meeting.startTime} - {meeting.endTime}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RoomIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">{meeting.room}</Typography>
                    </Box>
                    {meeting.attendees.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    )}
                    {meeting.notes && (
                      <Tooltip title={meeting.notes}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <NotesIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body2" noWrap>
                            {meeting.notes.substring(0, 30)}{meeting.notes.length > 30 ? '...' : ''}
                          </Typography>
                        </Box>
                      </Tooltip>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton onClick={() => handleDeleteMeeting(meeting.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Meeting Dialog */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Schedule New Meeting</Typography>
            <IconButton onClick={closeDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}
        </DialogContent>
        <DialogActions>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Confirm Meeting'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Meeting scheduled successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}