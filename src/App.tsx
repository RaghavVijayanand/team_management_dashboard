import React, { useState, useEffect } from 'react';
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
  Button
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
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link,
  useNavigate,
  Navigate,
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { FutureConfig } from '@remix-run/router';
import './App.css';
import Login from './Login';
import Dashboard from './Dashboard';
import MeetingScheduler from './MeetingScheduler';
import WorkTracker from './WorkTracker';
import ProjectAnalytics from './ProjectAnalytics';
import Chat from './Chat';
import Calendar from './Calendar';
import { useAuth } from './contexts/AuthContext';

const drawerWidth = 240;

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
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
  
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setNotification('Speech recognition is not supported in your browser.');
      setShowNotification(true);
      return;
    }
    
    // @ts-ignore
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setNotification('Listening for commands...');
      setShowNotification(true);
    };
    
    recognition.onerror = (event: any) => {
      setIsListening(false);
      setNotification(`Error: ${event.error}`);
      setShowNotification(true);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setNotification(`Command recognized: ${transcript}`);
      setShowNotification(true);
      
      // Process commands
      if (transcript.includes('go to dashboard') || transcript.includes('show dashboard')) {
        navigate('/dashboard');
      } else if (transcript.includes('go to chat') || transcript.includes('open chat')) {
        navigate('/chat');
      } else if (transcript.includes('go to calendar') || transcript.includes('show calendar')) {
        navigate('/calendar');
      } else if (transcript.includes('go to schedule') || transcript.includes('open scheduler')) {
        navigate('/scheduler');
      } else {
        setNotification(`Unrecognized command: ${transcript}`);
        setShowNotification(true);
      }
    };
    
    recognition.start();
  };
  
  const toggleListening = () => {
    if (isListening) {
      // @ts-ignore
      window.recognition?.stop();
      setIsListening(false);
    } else {
      startListening();
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
          severity={notification.includes('Error') ? 'error' : 'info'} 
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
  
  return <>{children}</>;
};

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
    <div>
      <Toolbar />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/chat"
          >
            <ListItemIcon>
              <MessageIcon />
            </ListItemIcon>
            <ListItemText primary="Chat" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/dashboard"
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/calendar"
          >
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="Calendar" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleDrawerToggle()}
            component={Link} 
            to="/scheduler"
          >
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText primary="Meeting Scheduler" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Kinetics Messenger
          </Typography>
          {user && (
            <Typography variant="body1" sx={{ mr: 2 }}>
              Welcome, {user.name}
            </Typography>
          )}
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          overflow: 'auto'
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/scheduler" element={<MeetingScheduler />} />
          <Route path="/" element={<Navigate to="/chat" />} />
        </Routes>
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
        element: <Navigate to="/chat" replace />
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
        path: "scheduler",
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
        path: "*",
        element: <Navigate to="/chat" replace />
      }
    ]
  },
  {
    path: "login",
    element: <Login />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  } as any
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;