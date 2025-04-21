import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  EventNote as MeetingIcon, 
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  Check as CheckIcon,
  Close as CloseIcon 
} from '@mui/icons-material';

interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  isAvailable: boolean;
  currentMeeting?: {
    title: string;
    startTime: string;
    endTime: string;
    attendees: string[];
  };
}

interface RoomSelectorProps {
  onRoomSelected?: (room: Room | null) => void;
  initialRooms?: Room[];
}

const defaultMockRooms: Room[] = [
  {
    id: '1',
    name: 'Room A',
    capacity: 10,
    equipment: ['Projector', 'Whiteboard'],
    isAvailable: true
  },
  {
    id: '2',
    name: 'Room B',
    capacity: 6,
    equipment: ['TV Screen', 'Conference Phone'],
    isAvailable: false,
    currentMeeting: {
      title: 'Team Sync',
      startTime: '09:00',
      endTime: '10:00',
      attendees: ['John', 'Alice', 'Bob']
    }
  },
  {
    id: '3',
    name: 'Room C',
    capacity: 15,
    equipment: ['Projector', 'Whiteboard', 'Video Conference'],
    isAvailable: true
  },
  {
    id: '4',
    name: 'Room D',
    capacity: 4,
    equipment: ['TV Screen'],
    isAvailable: true
  }
];

const RoomSelector: React.FC<RoomSelectorProps> = ({ 
  onRoomSelected, 
  initialRooms = defaultMockRooms 
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [rooms] = React.useState<Room[]>(initialRooms);
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsDialogOpen(true);
  };

  const handleRoomSelect = () => {
    if (selectedRoom && onRoomSelected) {
      onRoomSelected(selectedRoom);
    }
    setIsDialogOpen(false);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedRoom(null);
  };

  const filteredRooms = React.useMemo(() => {
    if (!searchQuery) return rooms;
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return rooms.filter(room => 
      room.name.toLowerCase().includes(lowercaseQuery) ||
      room.equipment.some(eq => eq.toLowerCase().includes(lowercaseQuery))
    );
  }, [rooms, searchQuery]);

  const renderRoomEquipment = (equipment: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {equipment.map((eq, index) => (
        <Chip
          key={index}
          label={eq}
          size="small"
          variant="outlined"
        />
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search rooms by name or equipment"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />
          }}
        />
        <Grid container spacing={2}>
          {filteredRooms.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" color="textSecondary" align="center">
                No rooms found matching your search
              </Typography>
            </Grid>
          ) : (
            filteredRooms.map((room) => (
              <Grid 
                item 
                key={room.id} 
                xs={12} 
                sm={6} 
                md={4}
              >
                <Card
                  elevation={3}
                  sx={{
                    opacity: room.isAvailable ? 1 : 0.7,
                    transition: 'all 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleRoomClick(room)}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">{room.name}</Typography>
                        <Chip
                          icon={room.isAvailable ? <CheckIcon /> : <CloseIcon />}
                          label={room.isAvailable ? 'Available' : 'Occupied'}
                          color={room.isAvailable ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <GroupIcon sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">Capacity: {room.capacity}</Typography>
                      </Box>
                      {renderRoomEquipment(room.equipment)}
                      {!room.isAvailable && room.currentMeeting && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Current Meeting:
                          </Typography>
                          <Typography variant="body2">{room.currentMeeting.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption">
                              {room.currentMeeting.startTime} - {room.currentMeeting.endTime}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      <Dialog 
        open={isDialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isSmallScreen}
      >
        <DialogTitle>
          Room Details - {selectedRoom?.name}
        </DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Room Information:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupIcon sx={{ mr: 1 }} />
                  <Typography>Capacity: {selectedRoom.capacity} people</Typography>
                </Box>
                <Typography variant="subtitle2">Equipment:</Typography>
                {renderRoomEquipment(selectedRoom.equipment)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleRoomSelect}
            variant="contained"
            color="primary"
            disabled={!selectedRoom?.isAvailable}
          >
            Select Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomSelector;