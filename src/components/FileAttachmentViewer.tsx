import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  FileCopy as FileIcon,
  InsertDriveFile as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { FileAttachment } from '../types';
import { fileAttachmentsService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FileAttachmentViewerProps {
  messageId?: number;
  workItemId?: number;
  attachments?: FileAttachment[];
  onDelete?: (fileId: number) => Promise<void>;
}

const FileAttachmentViewer: React.FC<FileAttachmentViewerProps> = ({
  messageId,
  workItemId,
  attachments: initialAttachments,
  onDelete
}) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { user } = useAuth();

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <ImageIcon color="primary" />;
    if (fileType.includes('pdf')) return <PdfIcon color="error" />;
    if (fileType.includes('document') || fileType.includes('word')) 
      return <DocumentIcon color="info" />;
    return <FileIcon color="action" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format timestamp
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Load attachments if none provided
  useEffect(() => {
    if (initialAttachments && initialAttachments.length > 0) {
      setAttachments(initialAttachments);
    } else if (messageId || workItemId) {
      loadAttachments();
    }
  }, [messageId, workItemId, initialAttachments]);

  // Load attachments from server
  const loadAttachments = async () => {
    if (!messageId && !workItemId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let files: FileAttachment[] = [];
      
      if (messageId) {
        files = await fileAttachmentsService.getMessageFiles(messageId);
      } else if (workItemId) {
        files = await fileAttachmentsService.getWorkItemFiles(workItemId);
      }
      
      setAttachments(files);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  // View file
  const viewFile = async (fileId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const file = await fileAttachmentsService.getFile(fileId);
      setSelectedFile(file);
      setViewerOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load file data');
    } finally {
      setLoading(false);
    }
  };

  // Download file
  const downloadFile = (file: FileAttachment) => {
    if (!file.data) {
      viewFile(file.id).then(() => {
        if (selectedFile?.data) {
          triggerDownload(selectedFile);
        }
      });
      return;
    }
    
    triggerDownload(file);
  };

  // Trigger file download
  const triggerDownload = (file: FileAttachment) => {
    if (!file.data) return;
    
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete file
  const handleDeleteFile = async (fileId: number) => {
    if (onDelete) {
      onDelete(fileId);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await fileAttachmentsService.deleteFile(fileId);
      setAttachments(attachments.filter(file => file.id !== fileId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  // Close viewer
  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedFile(null);
  };

  // Render file preview in viewer
  const renderFilePreview = () => {
    if (!selectedFile || !selectedFile.data) return null;
    
    if (selectedFile.fileType.includes('image')) {
      return (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <img 
            src={selectedFile.data} 
            alt={selectedFile.filename} 
            style={{ maxWidth: '100%', maxHeight: '70vh' }} 
          />
        </Box>
      );
    }
    
    if (selectedFile.fileType.includes('pdf')) {
      return (
        <Box sx={{ width: '100%', height: '70vh' }}>
          <iframe 
            src={selectedFile.data} 
            width="100%" 
            height="100%" 
            title={selectedFile.filename}
          ></iframe>
        </Box>
      );
    }
    
    // For other file types, show info and download button
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        {getFileIcon(selectedFile.fileType)}
        <Typography variant="h6" sx={{ mt: 2 }}>
          {selectedFile.filename}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {formatFileSize(selectedFile.fileSize)}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<DownloadIcon />} 
          sx={{ mt: 3 }}
          onClick={() => triggerDownload(selectedFile)}
        >
          Download
        </Button>
      </Box>
    );
  };

  // If no attachments and not loading, don't render anything
  if (attachments.length === 0 && !loading) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Attachments ({attachments.length})
      </Typography>
      
      {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
      
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
      
      <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
        <List dense>
          {attachments.map(file => (
            <ListItem key={file.id}>
              <ListItemIcon>
                {getFileIcon(file.fileType)}
              </ListItemIcon>
              <ListItemText 
                primary={file.filename} 
                secondary={`${formatFileSize(file.fileSize)} • ${formatDate(file.uploadedAt)}`} 
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  size="small" 
                  sx={{ mr: 1 }}
                  onClick={() => viewFile(file.id)}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  edge="end" 
                  size="small" 
                  sx={{ mr: 1 }}
                  onClick={() => downloadFile(file)}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
                {(user?.id === file.uploaderId) && (
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
      
      {/* File viewer dialog */}
      <Dialog
        open={viewerOpen}
        onClose={closeViewer}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.filename}
          <IconButton
            onClick={closeViewer}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderFilePreview()
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewer}>Close</Button>
          {selectedFile && (
            <Button 
              color="primary" 
              startIcon={<DownloadIcon />}
              onClick={() => downloadFile(selectedFile)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileAttachmentViewer; 