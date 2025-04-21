import React, { useState, useEffect, useRef } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemButton,
  Snackbar,
  Alert,
  Fab,
  Tooltip,
  CircularProgress,
  Button,
  Avatar
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Message as MessageIcon, 
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon, // Added for consistency
  Work as WorkIcon, // Added for consistency
  Visibility as VisibilityIcon // Added for eye gaze tracker
} from '@mui/icons-material';
import {
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
  createBrowserRouter,
  RouterProvider,
  Outlet // Import Outlet
} from 'react-router-dom';
// import { FutureConfig } from '@remix-run/router'; // FutureConfig might not be needed directly
import './App.css';
import Login from './Login';
import Dashboard from './Dashboard';
import MeetingScheduler from './MeetingScheduler';
import WorkTracker from './WorkTracker';
import ProjectAnalytics from './ProjectAnalytics';
import Chat from './Chat';
import Calendar from './Calendar';
import EyeGazeTracker from './EyeGazeTracker';
import { useAuth } from './contexts/AuthContext';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Add TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const drawerWidth = 240;

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5', // Indigo as primary color
      light: '#757de8',
      dark: '#002984',
    },
    secondary: {
      main: '#f50057', // Pink as secondary color
      light: '#ff5983',
      dark: '#bb002f',
    },
    background: {
      default: '#f7f9fc', // Lighter background for better contrast
      paper: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    text: {
      primary: '#3a3a3a',
      secondary: '#6b6b6b',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // Slightly rounder corners for a modern look
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1), 0px 4px 5px 0px rgba(0,0,0,0.07)',
          },
        },
        contained: {
          boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#f7f9fc',
          borderRight: 'none',
          boxShadow: '1px 0px 3px 0px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)',
          borderRadius: 12,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.1), 0px 6px 10px 0px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(63, 81, 181, 0.2)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          },
        },
      },
    },
  },
});

// Voice commands handler component
function VoiceCommandHandler() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setNotification('Listening... Speak now');
      setShowNotification(true);
      retryCountRef.current = 0;
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // If we haven't reached max retries and there was a no-speech error, try again
      if (retryCountRef.current < maxRetries && error === 'no-speech') {
        console.log(`Retrying speech recognition (attempt ${retryCountRef.current + 1}/${maxRetries})`);
        setTimeout(() => {
          recognitionRef.current.start();
        }, 100);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
      
      let errorMessage = 'An error occurred with speech recognition.';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          retryCountRef.current++;
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }
      
      setNotification(errorMessage);
      setShowNotification(true);
      setIsListening(false);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      
      console.log('Raw transcript:', transcript);
      console.log('Confidence:', event.results[0][0].confidence);
      
      setNotification(`Heard: ${transcript}`);
      setShowNotification(true);

      // Process commands
      const command = transcript.toLowerCase().trim();
      console.log('Processing command:', command);

      if (command.includes('go to dashboard') || command.includes('show dashboard')) {
        console.log('Navigating to dashboard');
        navigate('/dashboard');
      } else if (command.includes('go to chat') || command.includes('open chat')) {
        console.log('Navigating to chat');
        navigate('/chat');
      } else if (command.includes('go to calendar') || command.includes('show calendar')) {
        console.log('Navigating to calendar');
        navigate('/calendar');
      } else if (command.includes('go to schedule') || command.includes('open scheduler')) {
        console.log('Navigating to scheduler');
        navigate('/scheduler');
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [navigate]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setNotification('Speech recognition not supported');
      setShowNotification(true);
      return;
    }

    if (isListening) {
      console.log('Stopping speech recognition');
      recognitionRef.current.stop();
    } else {
      console.log('Starting speech recognition');
      retryCountRef.current = 0;
      setError(null);
      recognitionRef.current.start();
    }
  };

  return (
    <>
      <Tooltip title={isListening ? "Stop voice commands" : "Start voice commands"}>
        <Fab
          color={isListening ? "secondary" : "primary"}
          size="medium"
          onClick={toggleListening}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: theme.zIndex.drawer + 2
          }}
        >
          {isListening ? <MicOffIcon /> : <MicIcon />}
        </Fab>
      </Tooltip>
      
      <Snackbar
        open={showNotification}
        autoHideDuration={3000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          severity={error ? 'error' : 'info'} 
          onClose={() => setShowNotification(false)}
        >
          {notification}
        </Alert>
      </Snackbar>
    </>
  );
}

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}


function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: 'background.paper' 
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)' 
      }}>
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
          Kinetics
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/chat"
            sx={{ 
              py: 1.5,
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon>
              <MessageIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Chat" 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/dashboard"
            sx={{ 
              py: 1.5,
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon>
              <DashboardIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard" 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/work-tracker"
            sx={{ 
              py: 1.5,
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon>
              <WorkIcon color="primary" /> {/* Use WorkIcon */}
            </ListItemIcon>
            <ListItemText
              primary="Work Tracker"
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/meetings"
            sx={{ 
              py: 1.5,
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon>
              <EventIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Meetings" 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/analytics"
            sx={{ 
              py: 1.5,
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon>
              <AnalyticsIcon color="primary" /> {/* Use AnalyticsIcon */}
            </ListItemIcon>
            <ListItemText
              primary="Analytics"
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/calendar"
            sx={{ 
              py: 1.5,
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon>
              <EventIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Calendar" 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/eye-gaze"
            sx={{ 
              py: 1.5,
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon>
              <VisibilityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Eye Gaze" 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout}
            sx={{ 
              py: 1.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
              }
            }}
          >
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ fontWeight: 500, color: 'error.main' }}
            />
          </ListItemButton>
        </ListItem>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, px: 2 }}>
            <Avatar 
              sx={{ 
                width: 42, 
                height: 42, 
                mr: 1.5,
                backgroundColor: 'primary.main',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email || 'Online'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            Kinetics Messenger
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRadius: '0 16px 16px 0',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRadius: '0 16px 16px 0',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          height: '100vh',
          overflow: 'auto',
          backgroundColor: theme.palette.background.default // Ensure background color consistency
        }}
      >
        <Toolbar />
        {/* Render child routes here */}
        <Outlet /> 
        <VoiceCommandHandler /> 
      </Box>
    </Box>
  );
}

// Add ErrorBoundary component
function ErrorBoundary() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      p: 3,
      textAlign: 'center'
    }}>
      <Typography variant="h4" gutterBottom>
        Oops! Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        We're sorry, but there was an error loading this page. Please try refreshing or navigating back.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => window.location.reload()}
        startIcon={<RefreshIcon />}
      >
        Refresh Page
      </Button>
    </Box>
  );
}

const router = createBrowserRouter([
  {
    path: "/*",
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: "",
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: "chat",
        element: <Chat />
      },
      {
        path: "dashboard",
        element: <Dashboard />
      },
      {
        path: "calendar",
        element: <Calendar />
      },
      {
        path: "meetings",
        element: <MeetingScheduler />
      },
      {
        path: "work-tracker",
        element: <WorkTracker />
      },
      {
        path: "analytics",
        element: <ProjectAnalytics />
      },
      {
        path: "eye-gaze",
        element: <EyeGazeTracker />
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />
      }
    ]
  },
  {
    path: "login",
    element: <Login />
  } // Added missing closing brace for the login route object
]); // Removed future flags as they might not be necessary or correctly typed

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
