import React, { useState } from 'react';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon
} from '@mui/icons-material';

interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  attendees: string[];
}

interface CalendarProps {
  onMeetingScheduled?: (meeting: Meeting) => void;
}

const rooms = ['Room A', 'Room B', 'Room C', 'Room D'];

export default function Calendar({ onMeetingScheduled }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    room: '',
    attendees: []
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setNewMeeting(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
    setIsDialogOpen(true);
  };

  const handleScheduleMeeting = () => {
    if (newMeeting.title && newMeeting.date && newMeeting.startTime && newMeeting.endTime && newMeeting.room) {
      const meeting: Meeting = {
        id: Date.now().toString(),
        title: newMeeting.title,
        date: newMeeting.date,
        startTime: newMeeting.startTime,
        endTime: newMeeting.endTime,
        room: newMeeting.room,
        attendees: newMeeting.attendees || []
      };
      setMeetings([...meetings, meeting]);
      if (onMeetingScheduled) {
        onMeetingScheduled(meeting);
      }
      setIsDialogOpen(false);
      setNewMeeting({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        room: '',
        attendees: []
      });
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<Grid item xs={1.7} key={`empty-${i}`} />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const hasEvents = meetings.some(meeting => meeting.date === date.toISOString().split('T')[0]);

      days.push(
        <Grid item xs={1.7} key={day}>
          <Paper
            elevation={hasEvents ? 3 : 1}
            sx={{
              p: 1,
              height: '60px',
              cursor: 'pointer',
              backgroundColor: hasEvents ? 'primary.light' : 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => handleDateClick(day)}
          >
            <Typography variant="body2">{day}</Typography>
            {hasEvents && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="primary.main">
                  Has Events
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      );
    }

    return days;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6">
          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Grid container spacing={1} sx={{ mb: 2 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Grid item xs={1.7} key={day}>
            <Typography variant="subtitle2" align="center">
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1}>
        {renderCalendarDays()}
      </Grid>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Meeting</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Meeting Title"
              value={newMeeting.title}
              onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Date"
              type="date"
              value={newMeeting.date}
              onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                value={newMeeting.startTime}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, startTime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="time"
                value={newMeeting.endTime}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, endTime: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Room</InputLabel>
              <Select
                value={newMeeting.room}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, room: e.target.value }))}
                label="Room"
              >
                {rooms.map(room => (
                  <MenuItem key={room} value={room}>{room}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Attendees (comma-separated)"
              value={newMeeting.attendees?.join(', ')}
              onChange={(e) => setNewMeeting(prev => ({
                ...prev,
                attendees: e.target.value.split(',').map(email => email.trim())
              }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScheduleMeeting} variant="contained" color="primary">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}