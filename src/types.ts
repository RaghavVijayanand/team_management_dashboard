// Message priority levels
export type MessagePriority = 'urgent' | 'important' | 'normal' | 'low';

// Sentiment type
export type Sentiment = 'positive' | 'neutral' | 'negative';

// User interface
export interface User {
  id: string;
  name: string;
  email?: string;
  isOnline: boolean;
  avatar?: string;
}

// Interface for Message type
export interface Message {
  id: number;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  isPrivate: boolean;
  priority: MessagePriority;
  tags: string[];
  mentions: string[];
  searchKeywords: string[];
  readBy: string[];
  sentiment?: Sentiment;
  attachments?: FileAttachment[];
  recipientId?: string | null; // Add recipient ID for private messages
}

// Team sentiment analysis result
export interface TeamSentimentAnalysis {
  overallSentiment: string; // Changed from 'sentiment' to match usage
  insight: string;
  data: {
    positive: number;
    neutral: number;
    negative: number;
  };
  messageCount?: number;
  analysis?: {
    positivePercent: number;
    negativePercent: number;
    neutralPercent: number;
  };
}

// Work item status
export type WorkItemStatus = 'todo' | 'in-progress' | 'review' | 'done';

// Work item priority
export type WorkItemPriority = 'high' | 'medium' | 'low';

// Meeting interface
export interface Meeting {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  organizer: User;
  attendees: string[];
  notes: string;
  createdAt: string;
}

// Work item interface
export interface WorkItem {
  id: number;
  title: string;
  description: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignedTo: User | null;
  createdBy: User;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  attachments?: FileAttachment[];
}

// Chart data interface
export interface ChartData {
  id: number;
  chartType: string;
  title: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

// File attachment interface
export interface FileAttachment {
  id: number;
  filename: string;
  fileType: string;
  fileSize: number;
  uploaderId: string;
  uploaderName: string;
  uploadedAt: string;
  messageId?: number;
  workItemId?: number;
  data?: string; // Base64 encoded file data (only included in single file retrieval)
}
