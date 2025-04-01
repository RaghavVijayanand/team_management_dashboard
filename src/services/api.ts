import axios from 'axios';
import { User, Message, FileAttachment } from '../types';

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
  }
};

// Users API - Add /api prefix
export const usersApi = {
  getUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  }
};

// API services - Add /api prefix
export const meetingsService = {
  getAll: () => api.get('/api/meetings'),
  getById: (id: number) => api.get(`/api/meetings/${id}`),
  create: (meeting: any) => api.post('/api/meetings', meeting),
  update: (id: number, meeting: any) => api.put(`/api/meetings/${id}`, meeting),
  delete: (id: number) => api.delete(`/api/meetings/${id}`)
};

export const workItemsService = {
  getAll: () => api.get('/api/work-items'),
  getById: (id: number) => api.get(`/api/work-items/${id}`),
  create: (workItem: any) => api.post('/api/work-items', workItem),
  update: (id: number, workItem: any) => api.put(`/api/work-items/${id}`, workItem),
  delete: (id: number) => api.delete(`/api/work-items/${id}`)
};

export const messagesService = {
  getAll: () => api.get('/api/messages'),
  create: (message: any) => api.post('/api/messages', message),
  delete: (id: number) => api.delete(`/api/messages/${id}`),
  getTeamSentiment: () => api.get('/api/analyze/team-sentiment')
};

export const chartDataService = {
  getAll: (type?: string) => api.get('/api/chart-data', { params: { type } }),
  getById: (id: number) => api.get(`/api/chart-data/${id}`),
  create: (chartData: any) => api.post('/api/chart-data', chartData),
  update: (id: number, chartData: any) => api.put(`/api/chart-data/${id}`, chartData),
  delete: (id: number) => api.delete(`/api/chart-data/${id}`)
};

export const usersService = {
  getAll: () => api.get('/api/users'),
  getById: (id: string) => api.get(`/api/users/${id}`)
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