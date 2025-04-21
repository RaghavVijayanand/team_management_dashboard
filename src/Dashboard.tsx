import React, { useState, useEffect, useCallback } from 'react';
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
  Badge,
  CardHeader,
  Skeleton,
  LinearProgress,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  ButtonBase,
  CardActionArea,
  CardActions,
  Fade,
  Zoom,
  alpha
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
  BarChart as ChartIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  Mail as MailIcon,
  CalendarToday as CalendarIcon,
  Group as TeamIcon,
  WorkOutline as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  NotificationsActive as AlertIcon,
  Warning as WarningIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Favorite as FavoriteIcon,
  ArrowForward as ArrowRightIcon,
  Close as CloseIcon,
  PriorityHigh as PendingIcon,
  Refresh as RefreshIcon
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
  Tooltip as RechartsTooltip,
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
  id: string;
  name: string;
  value: number;
  color?: string;
  details?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
}

interface PerformanceMetric {
  month: string;
  performance: number;
  target?: number;
  previousYear?: number;
}

interface CompletedWorkItem {
  month: string;
  design: number;
  development: number;
  testing: number;
  documentation: number;
  total: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  initials: string;
  color: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  completedTasks: number;
  pendingTasks: number;
  availableHours: number;
}

interface ActivityItem {
  id: string;
  type: 'meeting' | 'task' | 'message' | 'project' | 'code' | 'deployment';
  title: string;
  description: string;
  timestamp: string;
  relatedTo?: string;
  icon?: React.ReactNode;
}

interface ProjectSummary {
  id: string;
  name: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  tasksDone: number;
  totalTasks: number;
  startDate: string;
  endDate: string;
}

interface GazeData {
  x: number;
  y: number;
  timestamp: number;
}

// Mock Data with More Context
const pendingTasks: Task[] = [
  {
    id: 't1',
    name: 'High Priority',
    value: 4,
    color: '#FF5252',
    details: 'Critical tasks requiring immediate attention',
    priority: 'high',
    status: 'pending'
  },
  {
    id: 't2',
    name: 'Medium Priority',
    value: 8,
    color: '#448AFF',
    details: 'Important tasks in progress',
    priority: 'medium',
    status: 'in_progress'
  },
  {
    id: 't3',
    name: 'Low Priority',
    value: 15,
    color: '#66BB6A',
    details: 'Routine tasks with flexible timelines',
    priority: 'low',
    status: 'pending'
  },
  {
    id: 't4',
    name: 'Urgent',
    value: 2,
    color: '#FF1744',
    details: 'Critical issues requiring immediate resolution',
    priority: 'urgent',
    status: 'pending'
  },
];

const performanceData: PerformanceMetric[] = [
  { month: 'Jan', performance: 65, target: 70, previousYear: 60 },
  { month: 'Feb', performance: 75, target: 70, previousYear: 62 },
  { month: 'Mar', performance: 85, target: 80, previousYear: 70 },
  { month: 'Apr', performance: 82, target: 80, previousYear: 75 },
  { month: 'May', performance: 90, target: 85, previousYear: 78 },
  { month: 'Jun', performance: 88, target: 85, previousYear: 80 },
];

const completedWorkItems: CompletedWorkItem[] = [
  { month: 'Jan', design: 20, development: 15, testing: 10, documentation: 5, total: 50 },
  { month: 'Feb', design: 25, development: 18, testing: 12, documentation: 7, total: 62 },
  { month: 'Mar', design: 30, development: 20, testing: 15, documentation: 10, total: 75 },
  { month: 'Apr', design: 28, development: 22, testing: 18, documentation: 12, total: 80 },
  { month: 'May', design: 32, development: 25, testing: 20, documentation: 15, total: 92 },
  { month: 'Jun', design: 35, development: 28, testing: 22, documentation: 18, total: 103 },
];

const teamMembers: TeamMember[] = [
  {
    id: 'tm1',
    name: 'John Smith',
    role: 'Project Manager',
    initials: 'JS',
    color: '#3f51b5',
    status: 'online',
    completedTasks: 15,
    pendingTasks: 8,
    availableHours: 30
  },
  {
    id: 'tm2',
    name: 'Alice Johnson',
    role: 'Developer',
    initials: 'AJ',
    color: '#f50057',
    status: 'online',
    completedTasks: 24,
    pendingTasks: 6,
    availableHours: 25
  },
  {
    id: 'tm3',
    name: 'Robert Brown',
    role: 'Designer',
    initials: 'RB',
    color: '#f44336',
    status: 'away',
    completedTasks: 18,
    pendingTasks: 3,
    availableHours: 15
  },
  {
    id: 'tm4',
    name: 'Sarah Wilson',
    role: 'QA Tester',
    initials: 'SW',
    color: '#4caf50',
    status: 'online',
    completedTasks: 22,
    pendingTasks: 5,
    availableHours: 32
  },
  {
    id: 'tm5',
    name: 'Michael Bay',
    role: 'DevOps Engineer',
    initials: 'MB',
    color: '#ff9800',
    status: 'busy',
    completedTasks: 12,
    pendingTasks: 10,
    availableHours: 18
  },
  {
    id: 'tm6',
    name: 'Laura Davis',
    role: 'Frontend Developer',
    initials: 'LD',
    color: '#2196f3',
    status: 'offline',
    completedTasks: 20,
    pendingTasks: 4,
    availableHours: 0
  },
];

const recentActivities: ActivityItem[] = [
  {
    id: 'a1',
    type: 'meeting',
    title: 'New meeting scheduled',
    description: 'Design Review - Tomorrow, 10:00 AM',
    timestamp: '30 minutes ago',
    icon: <CalendarIcon color="primary" />
  },
  {
    id: 'a2',
    type: 'task',
    title: 'Task assigned to you',
    description: 'Finish UI design for dashboard',
    timestamp: '2 hours ago',
    icon: <AssignmentIcon color="secondary" />
  },
  {
    id: 'a3',
    type: 'message',
    title: 'Message from Alex',
    description: 'Let\'s discuss the project timeline',
    timestamp: '4 hours ago',
    icon: <MailIcon color="info" />
  },
  {
    id: 'a4',
    type: 'project',
    title: 'Project "Phoenix" status updated',
    description: 'Phase 2 completed',
    timestamp: '1 day ago',
    icon: <WorkIcon color="success" />
  },
  {
    id: 'a5',
    type: 'code',
    title: 'Code review completed',
    description: 'Feature Branch "auth-flow"',
    timestamp: '1 day ago',
    icon: <CheckCircleIcon color="success" />
  },
  {
    id: 'a6',
    type: 'deployment',
    title: 'Deployment successful',
    description: 'Staging Environment v1.2.3',
    timestamp: '2 days ago',
    icon: <TrendingUpIcon color="success" />
  }
];

const projectSummaries: ProjectSummary[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    progress: 75,
    status: 'on_track',
    tasksDone: 15,
    totalTasks: 20,
    startDate: '2023-01-15',
    endDate: '2023-06-30'
  },
  {
    id: 'p2',
    name: 'Mobile App Development',
    progress: 45,
    status: 'at_risk',
    tasksDone: 9,
    totalTasks: 20,
    startDate: '2023-02-01',
    endDate: '2023-08-15'
  },
  {
    id: 'p3',
    name: 'API Integration',
    progress: 90,
    status: 'on_track',
    tasksDone: 18,
    totalTasks: 20,
    startDate: '2023-03-10',
    endDate: '2023-05-30'
  },
  {
    id: 'p4',
    name: 'Database Migration',
    progress: 60,
    status: 'delayed',
    tasksDone: 12,
    totalTasks: 20,
    startDate: '2023-04-01',
    endDate: '2023-07-15'
  }
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

// Import API services
import { chartDataService, workItemsService, meetingsService, messagesService } from './services/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const { user } = useAuth();
  const [activeNotificationIndex, setActiveNotificationIndex] = useState(0);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedData, setSelectedData] = useState<{ payload?: Task } | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // State for data from database
  const [pendingTasksData, setPendingTasksData] = useState<Task[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [completedWorkItemsData, setCompletedWorkItemsData] = useState<CompletedWorkItem[]>([]);
  const [teamMembersData, setTeamMembersData] = useState<TeamMember[]>([]);
  const [recentActivitiesData, setRecentActivitiesData] = useState<ActivityItem[]>([]);
  const [projectSummariesData, setProjectSummariesData] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from the database
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch chart data for different chart types
      const [tasksRes, performanceRes, workItemsRes, teamRes, activitiesRes, projectsRes] = await Promise.all([
        chartDataService.getAll('tasks'),
        chartDataService.getAll('performance'),
        chartDataService.getAll('work_items'),
        chartDataService.getAll('team'),
        chartDataService.getAll('activities'),
        chartDataService.getAll('projects')
      ]);

      // Process and set data
      if (tasksRes.data && tasksRes.data.length > 0) {
        setPendingTasksData(JSON.parse(tasksRes.data[0].data));
      } else {
        setPendingTasksData(pendingTasks); // Fallback to mock data
      }

      if (performanceRes.data && performanceRes.data.length > 0) {
        setPerformanceData(JSON.parse(performanceRes.data[0].data));
      } else {
        setPerformanceData(performanceData); // Fallback to mock data
      }

      if (workItemsRes.data && workItemsRes.data.length > 0) {
        setCompletedWorkItemsData(JSON.parse(workItemsRes.data[0].data));
      } else {
        setCompletedWorkItemsData(completedWorkItems); // Fallback to mock data
      }

      if (teamRes.data && teamRes.data.length > 0) {
        setTeamMembersData(JSON.parse(teamRes.data[0].data));
      } else {
        setTeamMembersData(teamMembers); // Fallback to mock data
      }

      if (activitiesRes.data && activitiesRes.data.length > 0) {
        setRecentActivitiesData(JSON.parse(activitiesRes.data[0].data));
      } else {
        setRecentActivitiesData(recentActivities); // Fallback to mock data
      }

      if (projectsRes.data && projectsRes.data.length > 0) {
        setProjectSummariesData(JSON.parse(projectsRes.data[0].data));
      } else {
        setProjectSummariesData(projectSummaries); // Fallback to mock data
      }

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Using mock data instead.');

      // Fallback to mock data
      setPendingTasksData(pendingTasks);
      setPerformanceData(performanceData);
      setCompletedWorkItemsData(completedWorkItems);
      setTeamMembersData(teamMembers);
      setRecentActivitiesData(recentActivities);
      setProjectSummariesData(projectSummaries);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Load data on component mount and when date range changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Dialog handlers
  const handleOpenActivityDialog = () => setIsActivityDialogOpen(true);
  const handleCloseActivityDialog = () => setIsActivityDialogOpen(false);
  const handleOpenTeamDialog = () => setIsTeamDialogOpen(true);
  const handleCloseTeamDialog = () => setIsTeamDialogOpen(false);
  const handleOpenProjectDialog = (project: ProjectSummary) => {
    setSelectedProject(project);
    setIsProjectDialogOpen(true);
  };
  const handleCloseProjectDialog = () => {
    setSelectedProject(null);
    setIsProjectDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.error.light;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return { icon: <ArrowUpIcon color="success" />, text: `+${((current - previous) / previous * 100).toFixed(1)}%`, color: 'success.main' };
    } else if (current < previous) {
      return { icon: <ArrowDownIcon color="error" />, text: `-${((previous - current) / previous * 100).toFixed(1)}%`, color: 'error.main' };
    } else {
      return { icon: null, text: '0%', color: 'text.secondary' };
    }
  };

  const calculateTotalTasks = (tasks: Task[]) => {
    return tasks ? tasks.reduce((sum: number, task: Task) => sum + (task.value || 0), 0) : 0;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'on_track':
        return theme.palette.success.main;
      case 'at_risk':
        return theme.palette.warning.main;
      case 'delayed':
        return theme.palette.error.main;
      case 'completed':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Activity Timeline component
  const ActivityTimeline = ({ activities }: { activities: ActivityItem[] }) => {
    return (
      <List sx={{ py: 0 }}>
        {activities.map((activity, index) => (
          <React.Fragment key={activity.id}>
            <ListItem sx={{ py: 1.5 }}>
              <ListItemIcon>
                <Avatar>{activity.icon || <MessageIcon />}</Avatar>
              </ListItemIcon>
              <ListItemText
                primary={activity.title}
                secondary={activity.description}
              />
              <Typography variant="caption" color="text.secondary">
                {activity.timestamp}
              </Typography>
            </ListItem>
            {index < activities.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  // Team Member Card component
  const TeamMemberCard = ({ member }: { member: TeamMember }) => {
    return (
      <Card sx={{ p: 2, borderRadius: '12px' }}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: member.color }}>{member.initials}</Avatar>
          <Box ml={2}>
            <Typography variant="subtitle1">{member.name}</Typography>
            <Typography variant="body2" color="text.secondary">{member.role}</Typography>
          </Box>
        </Box>
      </Card>
    );
  };

  // Project Details component
  const ProjectDetails = ({ project }: { project: ProjectSummary }) => {
    return (
      <Box>
        <Typography variant="h6">{project.name}</Typography>
        <Box my={2}>
          <Typography variant="body2">Progress: {project.progress}%</Typography>
          <LinearProgress
            variant="determinate"
            value={project.progress}
            color={
              project.status === 'on_track' ? 'success' :
              project.status === 'at_risk' ? 'warning' :
              project.status === 'delayed' ? 'error' : 'info'
            }
          />
        </Box>
        <Typography variant="body2">
          Tasks completed: {project.tasksDone} of {project.totalTasks}
        </Typography>
      </Box>
    );
  };

  // Function to render dashboard content
  function renderTabContent() {
    // Implementation of what was previously in renderTabContent() for the dashboard tab
    switch (activeTab) {
      case 0: // Dashboard
        return (
          <Box>
            {/* Welcome and Overview Header */}
            <Box sx={{ mb: 4 }}>
              <Fade in={true} timeout={800}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      Welcome back, {user?.name || 'User'}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Here's what's happening in your workspace today
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<RefreshIcon />}
                      onClick={() => {}}
                      disabled={refreshing}
                      sx={{ mr: 1 }}
                    >
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>

                    <FormControl sx={{ minWidth: 120 }}>
                      <Select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'quarter')}
                        size="small"
                        displayEmpty
                      >
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                        <MenuItem value="quarter">This Quarter</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Fade>
            </Box>

            {/* Summary Cards with Animation */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} lg={3}>
                <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            mr: 2
                          }}
                        >
                          <CalendarIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Meetings
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Upcoming schedule
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="h3" fontWeight="bold" mb={1}>
                        3
                      </Typography>

                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          2 today, 1 tomorrow
                        </Typography>
                        <Chip
                          label="Next: 10:00 AM"
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 500 }}
                        />
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        onClick={() => setActiveTab(1)}
                        endIcon={<ArrowRightIcon />}
                      >
                        View Calendar
                      </Button>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                            mr: 2
                          }}
                        >
                          <AssignmentIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Tasks
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Your workload
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="h3" fontWeight="bold" mb={1}>
                        {calculateTotalTasks(pendingTasks)}
                      </Typography>

                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box sx={{ width: '100%' }}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="caption" fontWeight="bold">
                              68%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={68}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: theme.palette.warning.main
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        onClick={() => setActiveTab(2)}
                        endIcon={<ArrowRightIcon />}
                      >
                        View Tasks
                      </Button>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                            mr: 2
                          }}
                        >
                          <MailIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Messages
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Unread communications
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="h3" fontWeight="bold" mb={1}>
                        12
                      </Typography>

                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          5 direct messages
                        </Typography>
                        <Badge
                          badgeContent="New"
                          color="error"
                          sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16 } }}
                        />
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        onClick={() => setActiveTab(4)}
                        endIcon={<ArrowRightIcon />}
                      >
                        Open Chat
                      </Button>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>

              <Grid item xs={12} md={6} lg={3}>
                <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            color: theme.palette.error.main,
                            mr: 2
                          }}
                        >
                          <NotificationIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Alerts
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Requires attention
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="h3" fontWeight="bold" mb={1}>
                        4
                      </Typography>

                      <Box display="flex" alignItems="center">
                        <Chip
                          label="2 High Priority"
                          size="small"
                          color="error"
                          sx={{ mr: 1, fontWeight: 500 }}
                        />
                        <Chip
                          label="2 Medium"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 500 }}
                        />
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        onClick={() => console.log('View notifications')}
                        endIcon={<ArrowRightIcon />}
                      >
                        View Alerts
                      </Button>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>
            </Grid>

            {/* Charts and Analytics */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                Analytics Overview
              </Typography>

              <Grid container spacing={3}>
                {/* Performance Trend Chart */}
                <Grid item xs={12} md={8}>
                  <Fade in={true} timeout={1000}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        overflow: 'hidden'
                      }}
                    >
                      <CardHeader
                        title="Performance Trends"
                        subheader="Monthly team performance metrics"
                        action={
                          <IconButton aria-label="settings">
                            <MoreVertIcon />
                          </IconButton>
                        }
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}
                      />
                      <CardContent sx={{ height: 'calc(100% - 76px)', p: 3 }}>
                        <ResponsiveContainer width="100%" height={350}>
                          <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                            <XAxis
                              dataKey="month"
                              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                              axisLine={{ stroke: alpha(theme.palette.divider, 0.3) }}
                            />
                            <YAxis
                              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                              axisLine={{ stroke: alpha(theme.palette.divider, 0.3) }}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                              labelStyle={{
                                fontWeight: 'bold',
                                marginBottom: '8px',
                                color: theme.palette.text.primary
                              }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: '15px' }}
                              formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
                            />
                            <Line
                              type="monotone"
                              dataKey="performance"
                              name="Current Performance"
                              stroke={theme.palette.primary.main}
                              strokeWidth={2}
                              dot={{
                                fill: theme.palette.primary.main,
                                r: 4,
                                strokeWidth: 2,
                                stroke: theme.palette.background.paper
                              }}
                              activeDot={{
                                r: 7,
                                stroke: theme.palette.background.paper,
                                strokeWidth: 2
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="target"
                              name="Target"
                              stroke={alpha(theme.palette.text.secondary, 0.7)}
                              strokeDasharray="4 4"
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="previousYear"
                              name="Previous Year"
                              stroke={theme.palette.info.main}
                              strokeWidth={1.5}
                              dot={{
                                fill: theme.palette.info.main,
                                r: 3,
                                strokeWidth: 2,
                                stroke: theme.palette.background.paper
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>

                {/* Tasks Distribution Pie Chart */}
                <Grid item xs={12} md={4}>
                  <Fade in={true} timeout={1000} style={{ transitionDelay: '200ms' }}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        overflow: 'hidden'
                      }}
                    >
                      <CardHeader
                        title="Task Distribution"
                        subheader={`${calculateTotalTasks(pendingTasks)} total tasks`}
                        action={
                          <IconButton aria-label="settings">
                            <MoreVertIcon />
                          </IconButton>
                        }
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}
                      />
                      <CardContent sx={{ height: 'calc(100% - 76px)', p: 3 }}>
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={pendingTasks}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {pendingTasks.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color || theme.palette.primary.main}
                                  stroke={theme.palette.background.paper}
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <Box
                                      sx={{
                                        bgcolor: 'background.paper',
                                        p: 1.5,
                                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle2"
                                        sx={{
                                          color: data.color,
                                          mb: 0.5,
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {data.name}
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>{data.value} tasks</strong> ({(payload[0].percent * 100).toFixed(0)}%)
                                      </Typography>
                                      {data.details && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                          {data.details}
                                        </Typography>
                                      )}
                                    </Box>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend
                              formatter={(value, entry, index) => (
                                <span style={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                                  {value}
                                </span>
                              )}
                              iconType="circle"
                              layout="vertical"
                              verticalAlign="middle"
                              align="right"
                              wrapperStyle={{ paddingLeft: 20 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              </Grid>
            </Box>

            {/* Projects and Team Overview */}
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={3}>
                {/* Projects Status */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                      Active Projects
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<WorkIcon />}
                    >
                      View All Projects
                    </Button>
                  </Box>

                  <Grid container spacing={2}>
                    {projectSummaries.map((project) => (
                      <Grid item xs={12} sm={6} key={project.id}>
                        <Zoom in={true} style={{ transitionDelay: `${parseInt(project.id.split('p')[1]) * 100}ms` }}>
                          <Card
                            sx={{
                              borderRadius: '12px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                              transition: 'transform 0.3s, box-shadow 0.3s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                              },
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <CardActionArea
                              onClick={() => handleOpenProjectDialog(project)}
                              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}
                            >
                              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom noWrap>
                                    {project.name}
                                  </Typography>
                                  <Chip
                                    label={project.status.replace('_', ' ')}
                                    size="small"
                                    sx={{
                                      textTransform: 'capitalize',
                                      bgcolor: alpha(getStatusColor(project.status), 0.1),
                                      color: getStatusColor(project.status),
                                      fontWeight: 500,
                                      fontSize: '0.7rem'
                                    }}
                                  />
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Progress
                                    </Typography>
                                    <Typography variant="caption" fontWeight="bold">
                                      {project.progress}%
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={project.progress}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: alpha(getStatusColor(project.status), 0.1),
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: getStatusColor(project.status)
                                      }
                                    }}
                                  />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {project.tasksDone} / {project.totalTasks} tasks
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </Zoom>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {/* Team Members */}
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">
                      Team Members
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<TeamIcon />}
                      onClick={handleOpenTeamDialog}
                    >
                      View All
                    </Button>
                  </Box>

                  <Card
                    sx={{
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      overflow: 'hidden'
                    }}
                  >
                    <List disablePadding>
                      {teamMembers.slice(0, 5).map((member, index) => (
                        <React.Fragment key={member.id}>
                          <ListItem
                            sx={{
                              py: 1.5,
                              transition: 'background-color 0.2s',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.05)
                              }
                            }}
                          >
                            <ListItemIcon>
                              <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      bgcolor:
                                        member.status === 'online' ? 'success.main' :
                                        member.status === 'away' ? 'warning.main' :
                                        member.status === 'busy' ? 'error.main' : 'grey.400',
                                      border: '2px solid white'
                                    }}
                                  />
                                }
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: member.color,
                                    width: 40,
                                    height: 40
                                  }}
                                >
                                  {member.initials}
                                </Avatar>
                              </Badge>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body1" fontWeight={500}>
                                  {member.name}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {member.role}
                                </Typography>
                              }
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Tooltip title="Tasks completed">
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <CheckCircleIcon
                                    fontSize="small"
                                    color="success"
                                    sx={{ mr: 0.5, fontSize: '1rem' }}
                                  />
                                  <Typography variant="caption" fontWeight="bold">
                                    {member.completedTasks}
                                  </Typography>
                                </Box>
                              </Tooltip>

                              <Tooltip title="Pending tasks">
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PendingIcon
                                    fontSize="small"
                                    color="warning"
                                    sx={{ mr: 0.5, fontSize: '1rem' }}
                                  />
                                  <Typography variant="caption" fontWeight="bold">
                                    {member.pendingTasks}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Box>
                          </ListItem>
                          {index < teamMembers.length - 1 && (
                            <Divider component="li" sx={{ ml: 9 }} />
                          )}
                        </React.Fragment>
                      ))}

                      <ListItem
                        button
                        onClick={handleOpenTeamDialog}
                        sx={{
                          py: 1.5,
                          color: theme.palette.primary.main,
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="button" color="primary">
                          View All Team Members
                        </Typography>
                      </ListItem>
                    </List>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Recent Activity */}
            <Box sx={{ mt: 4, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">
                  Recent Activity
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleOpenActivityDialog}
                >
                  View All
                </Button>
              </Box>

              <Card
                sx={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  overflow: 'hidden'
                }}
              >
                <List sx={{ p: 0 }}>
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem
                        sx={{
                          py: 1.5,
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor:
                                activity.type === 'meeting' ? alpha(theme.palette.primary.main, 0.1) :
                                activity.type === 'task' ? alpha(theme.palette.secondary.main, 0.1) :
                                activity.type === 'message' ? alpha(theme.palette.info.main, 0.1) :
                                activity.type === 'project' ? alpha(theme.palette.success.main, 0.1) :
                                activity.type === 'code' ? alpha(theme.palette.warning.main, 0.1) :
                                alpha(theme.palette.error.main, 0.1),
                              color:
                                activity.type === 'meeting' ? theme.palette.primary.main :
                                activity.type === 'task' ? theme.palette.secondary.main :
                                activity.type === 'message' ? theme.palette.info.main :
                                activity.type === 'project' ? theme.palette.success.main :
                                activity.type === 'code' ? theme.palette.warning.main :
                                theme.palette.error.main,
                            }}
                          >
                            {activity.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={500}>
                              {activity.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          {activity.timestamp}
                        </Typography>
                      </ListItem>
                      {index < recentActivities.length - 1 && (
                        <Divider component="li" sx={{ ml: 9 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 1.5,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                >
                  <Button
                    size="small"
                    onClick={handleOpenActivityDialog}
                    endIcon={<ArrowRightIcon />}
                  >
                    View All Activity
                  </Button>
                </Box>
              </Card>
            </Box>
          </Box>
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
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            p: 3
          }}
        >
          {renderTabContent()}
        </Container>
      </Box>

      {/* Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onClose={handleCloseActivityDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Recent Activity</Typography>
          <IconButton onClick={handleCloseActivityDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <ActivityTimeline activities={recentActivities} />
        </DialogContent>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={isTeamDialogOpen} onClose={handleCloseTeamDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Team Members</Typography>
          <IconButton onClick={handleCloseTeamDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {teamMembers.map(member => (
              <Grid item xs={12} sm={6} md={4} key={member.id}>
                <TeamMemberCard member={member} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={isProjectDialogOpen} onClose={handleCloseProjectDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedProject ? selectedProject.name : 'Project Details'}
          </Typography>
          <IconButton onClick={handleCloseProjectDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedProject ? (
            <ProjectDetails project={selectedProject} />
          ) : (
            <Typography>No project selected</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
