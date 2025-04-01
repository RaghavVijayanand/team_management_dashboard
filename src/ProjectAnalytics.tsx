import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { ChartData } from './types';
import api, { chartDataService, messagesService } from './services/api';
import { useAuth } from './contexts/AuthContext';
import { SelectChangeEvent } from "@mui/material";

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ProjectAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<string>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingChart, setEditingChart] = useState<Partial<ChartData> | null>(null);
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();
  const [teamSentiment, setTeamSentiment] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("week");
  const [chartType, setChartType] = useState("bar");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await chartDataService.getAll(timeRange);
      setChartData(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const fetchTeamSentiment = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await messagesService.getTeamSentiment();
      setTeamSentiment(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team sentiment');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRelatedData = useCallback(async () => {
    try {
      const [workItemsRes, meetingsRes, messagesRes] = await Promise.all([
        api.get('/api/work-items'),
        api.get('/api/meetings'),
        api.get('/api/messages')
      ]);
      
      console.log('API Responses:', {
        workItems: workItemsRes.data,
        meetings: meetingsRes.data,
        messages: messagesRes.data
      });
      
      setWorkItems(Array.isArray(workItemsRes.data) ? workItemsRes.data : []);
      setMeetings(Array.isArray(meetingsRes.data) ? meetingsRes.data : []);
      setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
    } catch (err: any) {
      console.error('Failed to fetch related data:', err);
      setWorkItems([]);
      setMeetings([]);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    fetchChartData();
    fetchTeamSentiment();
    fetchRelatedData();
  }, [fetchChartData, fetchTeamSentiment, fetchRelatedData]);

  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    setTimeRange(event.target.value);
    setError("");
    setSuccess("");
  };

  const handleChartTypeChange = (event: SelectChangeEvent<string>) => {
    setChartType(event.target.value);
    setError("");
    setSuccess("");
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (chart?: ChartData) => {
    if (chart) {
      setEditingChart(chart);
    } else {
      setEditingChart({
        chartType: 'bar',
        title: '',
        data: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingChart(null);
  };

  const handleSaveChart = async () => {
    if (!editingChart?.title || !editingChart?.chartType) {
      setError('Title and chart type are required');
      return;
    }
    
    try {
      setLoading(true);
      
      if ('id' in editingChart && editingChart.id) {
        // Update existing chart
        await api.put(`/api/chart-data/${editingChart.id}`, editingChart);
      } else {
        // Create new chart
        await api.post('/api/chart-data', editingChart);
      }
      
      fetchChartData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save chart');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChart = async (id: number) => {
    try {
      setLoading(true);
      await api.delete(`/api/chart-data/${id}`);
      
      fetchChartData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete chart');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name && editingChart) {
      setEditingChart(prev => ({ ...prev!, [name]: value }));
    }
  };

  // Generate work status chart data
  const generateWorkStatusData = () => {
    if (!workItems || !Array.isArray(workItems) || workItems.length === 0) {
      return [];
    }

    const statusCounts = workItems.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('-', ' '),
      value: count
    }));
  };

  // Generate work priority chart data
  const generateWorkPriorityData = () => {
    if (!workItems || !Array.isArray(workItems) || workItems.length === 0) {
      return [];
    }

    const priorityCounts = workItems.reduce((acc: Record<string, number>, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  };

  // Generate meeting trend data by date
  const generateMeetingTrendData = () => {
    if (!meetings || !Array.isArray(meetings) || meetings.length === 0) {
      return [];
    }

    // Create a map of dates and count meetings on each date
    const meetingsByDate = meetings.reduce((acc: Record<string, number>, meeting) => {
      acc[meeting.date] = (acc[meeting.date] || 0) + 1;
      return acc;
    }, {});
    
    // Sort dates and create the trend data
    return Object.entries(meetingsByDate)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, count]) => ({
        date,
        meetings: count
      }));
  };

  // Generate message sentiment data
  const generateMessageSentimentData = () => {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    const sentimentCounts = messages.reduce((acc: Record<string, number>, message) => {
      if (message.sentiment) {
        acc[message.sentiment] = (acc[message.sentiment] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      name: sentiment,
      value: count
    }));
  };

  // Generate predefined chart data based on the selected tab
  const generatePredefinedChartData = () => {
    switch (tabValue) {
      case 0: // Work Status
        return generateWorkStatusData();
      case 1: // Work Priority
        return generateWorkPriorityData();
      case 2: // Meeting Trends
        return generateMeetingTrendData();
      case 3: // Message Sentiment
        return generateMessageSentimentData();
      default:
        return [];
    }
  };

  // Render chart based on its type and data
  const renderChart = (chart: ChartData) => {
    const chartData = chart.data || [];
    
    switch (chart.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="meetings" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <Typography color="error">Unsupported chart type</Typography>;
    }
  };

  // Render predefined chart based on tab selection
  const renderPredefinedChart = () => {
    const data = generatePredefinedChartData();
    
    switch (tabValue) {
      case 0: // Work Status - Pie Chart
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 1: // Work Priority - Bar Chart
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 2: // Meeting Trends - Line Chart
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="meetings" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 3: // Message Sentiment - Pie Chart
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <Typography>No chart data available</Typography>;
    }
  };

  const renderCustomizedLabel = (entry: { value: number; name?: string }, index: number): string => {
    return `${entry.name || ''}: ${entry.value}`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Project Analytics Dashboard</Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Real-time data visualization for your project. Track work items, meetings, and team communication.
        </Typography>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Work Status" />
          <Tab label="Work Priority" />
          <Tab label="Meeting Trends" />
          <Tab label="Message Sentiment" />
        </Tabs>
        
        {renderPredefinedChart()}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Custom Charts</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={selectedChartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="all">All Charts</MenuItem>
                <MenuItem value="bar">Bar Charts</MenuItem>
                <MenuItem value="line">Line Charts</MenuItem>
                <MenuItem value="pie">Pie Charts</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              New Chart
            </Button>
            <IconButton color="primary" onClick={fetchChartData}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <IconButton size="small" onClick={() => setError('')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Alert>
        )}
        
        {loading && !chartData.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : chartData.length === 0 ? (
          <Alert severity="info">
            No custom charts found. Click "New Chart" to create one.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {chartData.map((chart: ChartData) => (
              <Grid item xs={12} md={6} key={chart.id}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6">{chart.title}</Typography>
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenDialog(chart)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteChart(chart.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    {renderChart(chart)}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Chart Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingChart && 'id' in editingChart && editingChart.id ? 'Edit Chart' : 'Create New Chart'}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {editingChart && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chart Title"
                  name="title"
                  value={editingChart.title || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Chart Type</InputLabel>
                  <Select
                    name="chartType"
                    value={editingChart.chartType || 'bar'}
                    label="Chart Type"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="bar">Bar Chart</MenuItem>
                    <MenuItem value="line">Line Chart</MenuItem>
                    <MenuItem value="pie">Pie Chart</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Chart Data Preview</Typography>
                <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(editingChart.data || [], null, 2)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Note: You can select from predefined data charts or create your own through the API.
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveChart}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Chart'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}