import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  useTheme,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Container,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Drawer,
  Divider,
  CssBaseline,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Task as TaskIcon,
  Chat as ChatIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import WorkloadHeatmap from './WorkloadHeatmap';
import GazeHeatmap from './GazeHeatmap';
import ProjectAnalytics from './ProjectAnalytics';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import MeetingScheduler from './MeetingScheduler';
import WorkTracker from './WorkTracker';
import Chat from './Chat';
import { useAuth } from './contexts/AuthContext';

// Enhanced Type Definitions
interface Task {
  name: string;
  value: number;
  color?: string;
  details?: string;
}

interface PerformanceMetric {
  month: string;
  performance: number;
  target?: number;
}

interface CompletedWorkItem {
  month: string;
  design: number;
  development: number;
  testing: number;
  documentation: number;
  total: number;
}

interface GazeData {
  x: number;
  y: number;
  timestamp: number;
}

// Mock Data with More Context
const pendingTasks: Task[] = [
  { name: 'High Priority', value: 4, color: '#FF6384', details: 'Critical tasks requiring immediate attention' },
  { name: 'Medium Priority', value: 8, color: '#36A2EB', details: 'Important tasks in progress' },
  { name: 'Low Priority', value: 15, color: '#FFCE56', details: 'Routine tasks with flexible timelines' },
];

const performanceData: PerformanceMetric[] = [
  { month: 'Jan', performance: 65, target: 70 },
  { month: 'Feb', performance: 75, target: 70 },
  { month: 'Mar', performance: 85, target: 80 },
  { month: 'Apr', performance: 82, target: 80 },
  { month: 'May', performance: 90, target: 85 },
  { month: 'Jun', performance: 88, target: 85 },
];

const completedTasks: CompletedWorkItem[] = [
  { month: 'Jan', design: 20, development: 15, testing: 10, documentation: 5, total: 50 },
  { month: 'Feb', design: 25, development: 18, testing: 12, documentation: 7, total: 62 },
  { month: 'Mar', design: 30, development: 20, testing: 15, documentation: 10, total: 75 },
  { month: 'Apr', design: 28, development: 22, testing: 18, documentation: 12, total: 80 },
  { month: 'May', design: 32, development: 25, testing: 20, documentation: 15, total: 92 },
  { month: 'Jun', design: 35, development: 28, testing: 22, documentation: 18, total: 103 },
];

const notificationData: Task[] = [
  { name: 'Mentions', value: 8, color: '#FF6384', details: 'Unread mentions in project channels' },
  { name: 'Meeting Reminders', value: 12, color: '#36A2EB', details: 'Upcoming meetings and schedules' },
  { name: 'Deadlines', value: 5, color: '#FFCE56', details: 'Approaching project milestones' },
  { name: 'Project Updates', value: 15, color: '#4BC0C0', details: 'Recent project status changes' },
];

// Mock gaze data for the heatmap
const mockGazeData: GazeData[] = [
  { x: 0.2, y: 0.3, timestamp: Date.now() - 5000 },
  { x: 0.4, y: 0.5, timestamp: Date.now() - 4000 },
  { x: 0.6, y: 0.2, timestamp: Date.now() - 3000 },
  { x: 0.3, y: 0.7, timestamp: Date.now() - 2000 },
  { x: 0.8, y: 0.4, timestamp: Date.now() - 1000 },
];

const drawerWidth = 240;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [activeNotificationIndex, setActiveNotificationIndex] = useState(0);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedData, setSelectedData] = useState<{ payload?: Task } | null>(null);
  const [gazeData, setGazeData] = useState<GazeData[]>(mockGazeData);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, index: 0 },
    { text: 'Meetings', icon: <EventIcon />, index: 1 },
    { text: 'Work Items', icon: <TaskIcon />, index: 2 },
    { text: 'Analytics', icon: <ChartIcon />, index: 3 },
    { text: 'Chat', icon: <ChatIcon />, index: 4 }
  ];

  // Simulate realtime eye-gaze tracking data
  useEffect(() => {
    const interval = setInterval(() => {
      const newPoint = {
        x: Math.random(),
        y: Math.random(),
        timestamp: Date.now(),
      };
      setGazeData(prev => [...prev.slice(-19), newPoint]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Utility function to calculate total tasks
  const calculateTotalTasks = (tasks: Task[]) => 
    tasks.reduce((sum, task) => sum + task.value, 0);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Dashboard
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom>Welcome, {user?.name}</Typography>
              <Typography variant="body1" paragraph>
                Here's your team productivity dashboard. View your scheduled meetings,
                track work items, analyze project progress, and communicate with your team.
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      borderTop: 4,
                      borderColor: 'primary.main',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <EventIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" gutterBottom>Meetings</Typography>
                      <Typography variant="body2">Schedule and manage team meetings</Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => setActiveTab(1)}
                      sx={{ mt: 2 }}
                    >
                      Manage Meetings
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      borderTop: 4,
                      borderColor: 'secondary.main',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <TaskIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" gutterBottom>Work Items</Typography>
                      <Typography variant="body2">Track and manage tasks and work items</Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => setActiveTab(2)}
                      sx={{ mt: 2 }}
                    >
                      View Work Items
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      borderTop: 4,
                      borderColor: 'success.main',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <AnalyticsIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" gutterBottom>Analytics</Typography>
                      <Typography variant="body2">View project analytics and insights</Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      color="success"
                      onClick={() => setActiveTab(3)}
                      sx={{ mt: 2 }}
                    >
                      View Analytics
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center',
                      borderTop: 4,
                      borderColor: 'info.main',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <ChatIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" gutterBottom>Team Chat</Typography>
                      <Typography variant="body2">Communicate with your team in real-time</Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      color="info"
                      onClick={() => setActiveTab(4)}
                      sx={{ mt: 2 }}
                    >
                      Open Chat
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="New meeting scheduled" 
                      secondary="Design Review - Tomorrow, 10:00 AM" 
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Task assigned to you" 
                      secondary="Finish UI design for dashboard" 
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Message from Alex" 
                      secondary="Let's discuss the project timeline" 
                    />
                  </ListItem>
                </List>
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Team Members</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>J</Avatar>
                    </ListItemIcon>
                    <ListItemText primary="John Smith" secondary="Project Manager" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>A</Avatar>
                    </ListItemIcon>
                    <ListItemText primary="Alice Johnson" secondary="Developer" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'error.main' }}>R</Avatar>
                    </ListItemIcon>
                    <ListItemText primary="Robert Brown" secondary="Designer" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        );
      case 1: // Meetings
        return <MeetingScheduler />;
      case 2: // Work Items
        return <WorkTracker />;
      case 3: // Analytics
        return <ProjectAnalytics />;
      case 4: // Chat
        return <Chat />;
      default:
        return <Typography>Content not found</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Kinetics Workspace
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationIcon />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.name ? user.name[0] : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={activeTab === item.index}
                  onClick={() => setActiveTab(item.index)}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          ml: drawerOpen ? `${drawerWidth}px` : 0,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          {renderTabContent()}
        </Container>
      </Box>
    </Box>
  );
}