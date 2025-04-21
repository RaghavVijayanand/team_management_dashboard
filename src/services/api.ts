import axios, { AxiosResponse } from 'axios'; // Import AxiosResponse
import { User, Message, FileAttachment, Meeting, WorkItem, ChartData, TeamSentimentAnalysis } from '../types'; // Import necessary types, including TeamSentimentAnalysis

// Define base URL without /api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor to handle auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/api/auth/register', { name, email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
  verifyToken: async () => {
    const response = await api.get('/api/auth/verify');
    return response.data;
  }
};

// Messages API - Add /api prefix
export const messagesApi = {
  getMessages: async () => {
    const response = await api.get('/api/messages');
    return response.data;
  },
  sendMessage: async (message: Partial<Message>) => {
    const response = await api.post('/api/messages', message);
    return response.data;
  },
  // Assuming delete exists on backend:
  deleteMessage: async (id: number) => {
    const response = await api.delete(`/api/messages/${id}`);
    return response.data;
  },
  analyzeSentiment: async (text: string) => {
    const response = await api.post('/api/analyze/sentiment', { text });
    return response.data;
  },
  getTeamSentiment: async () => {
    const response = await api.get('/api/analyze/team-sentiment');
    return response.data;
  },
  summarizeChat: async (messages: Message[]) => {
    const response = await api.post('/api/summarize', { messages });
    return response.data;
  },
  translateMessages: async (messages: {id: number, content: string}[], targetLanguage: string) => {
    const response = await api.post('/api/translate', { messages, targetLanguage });
    return response.data;
  },
  // New AI chat endpoint
  aiChat: async (message: string) => {
    const response = await api.post('/api/ai-chat', { message });
    return response.data;
  }
};

// Users API - Add /api prefix
export const usersApi = {
  getUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  }
};

// API services - Add /api prefix and improve type safety
export const meetingsService = {
  getAll: (): Promise<AxiosResponse<Meeting[]>> => api.get('/api/meetings'),
  getById: (id: number): Promise<AxiosResponse<Meeting>> => api.get(`/api/meetings/${id}`),
  create: (meeting: Partial<Meeting>): Promise<AxiosResponse<Meeting>> => api.post('/api/meetings', meeting),
  update: (id: number, meeting: Partial<Meeting>): Promise<AxiosResponse<Meeting>> => api.put(`/api/meetings/${id}`, meeting),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/api/meetings/${id}`)
};

export const workItemsService = {
  getAll: (): Promise<AxiosResponse<WorkItem[]>> => api.get('/api/work-items'),
  getById: (id: number): Promise<AxiosResponse<WorkItem>> => api.get(`/api/work-items/${id}`),
  create: (workItem: Partial<WorkItem>): Promise<AxiosResponse<WorkItem>> => api.post('/api/work-items', workItem),
  update: (id: number, workItem: Partial<WorkItem>): Promise<AxiosResponse<WorkItem>> => api.put(`/api/work-items/${id}`, workItem),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/api/work-items/${id}`)
};

export const messagesService = {
  // Assuming the backend returns { data: Message[] }
  getAll: (): Promise<AxiosResponse<{ data: Message[] }>> => api.get('/api/messages'), 
  create: (message: Partial<Message>): Promise<AxiosResponse<Message>> => api.post('/api/messages', message),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/api/messages/${id}`),
  // Use specific type for team sentiment analysis result
  getTeamSentiment: (): Promise<AxiosResponse<TeamSentimentAnalysis>> => api.get('/api/analyze/team-sentiment') 
};

export const chartDataService = {
  getAll: (type?: string): Promise<AxiosResponse<ChartData[]>> => api.get('/api/chart-data', { params: { type } }),
  getById: (id: number): Promise<AxiosResponse<ChartData>> => api.get(`/api/chart-data/${id}`),
  create: (chartData: Partial<ChartData>): Promise<AxiosResponse<ChartData>> => api.post('/api/chart-data', chartData),
  update: (id: number, chartData: Partial<ChartData>): Promise<AxiosResponse<ChartData>> => api.put(`/api/chart-data/${id}`, chartData),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> => api.delete(`/api/chart-data/${id}`)
};

export const usersService = {
  // Assuming backend returns User[]
  getAll: (): Promise<AxiosResponse<User[]>> => api.get('/api/users'), 
  getById: (id: string): Promise<AxiosResponse<User>> => api.get(`/api/users/${id}`)
};

// New service for file attachments
export const fileAttachmentsService = {
  uploadFile: (fileData: {
    filename: string;
    fileType: string;
    fileData: string;
    messageId?: number;
    workItemId?: number;
  }) => api.post('/api/files', fileData),
  
  getFile: async (fileId: number): Promise<FileAttachment> => {
    const response = await api.get(`/api/files/${fileId}`);
    return response.data;
  },
  
  getMessageFiles: async (messageId: number): Promise<FileAttachment[]> => {
    const response = await api.get(`/api/files/message/${messageId}`);
    return response.data;
  },
  
  getWorkItemFiles: async (workItemId: number): Promise<FileAttachment[]> => {
    const response = await api.get(`/api/files/work-item/${workItemId}`);
    return response.data;
  },
  
  deleteFile: async (fileId: number) => {
    const response = await api.delete(`/api/files/${fileId}`);
    return response.data;
  }
};

export default api;
