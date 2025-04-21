import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  LinearProgress, 
  Paper, 
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  FileCopy as FileIcon,
  InsertDriveFile as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  AttachFile as AttachIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { fileAttachmentsService } from '../services/api';
import { FileAttachment } from '../types';

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  label?: string;
  messageId?: number;
  workItemId?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUpload, 
  label = "Upload a file",
  messageId, 
  workItemId 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <ImageIcon color="primary" />;
    if (fileType.includes('pdf')) return <PdfIcon color="error" />;
    if (fileType.includes('document') || fileType.includes('word')) return <DocumentIcon color="info" />;
    return <FileIcon color="action" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  // Upload the file
  const uploadFile = async () => {
    if (!selectedFile) return;
    
    // Check if onUpload is a function
    if (typeof onUpload !== 'function') {
      setError('Upload functionality is not available');
      console.error('onUpload is not a function', onUpload);
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Simulate progress updates (for UX)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Call the upload function
      await onUpload(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset state
      setTimeout(() => {
        setUploading(false);
        setSelectedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
      
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || 'Failed to upload file');
      setUploading(false);
    }
  };

  // Cancel upload
  const cancelUpload = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      {/* File selection area */}
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          p: 2, 
          mb: 2, 
          border: '1px dashed',
          borderColor: 'primary.main',
          borderRadius: 2,
          bgcolor: 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <UploadIcon color="primary" fontSize="large" />
        <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Max file size: 10MB
        </Typography>
      </Paper>

      {/* Selected file info */}
      {selectedFile && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box display="flex" alignItems="center">
            {getFileIcon(selectedFile.type)}
            <Box flexGrow={1} ml={2}>
              <Typography variant="body2" noWrap>
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
            <IconButton size="small" onClick={cancelUpload} disabled={uploading}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="textSecondary" align="right" display="block" sx={{ mt: 0.5 }}>
                {uploadProgress}%
              </Typography>
            </Box>
          )}
          
          {!uploading && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadIcon />}
              sx={{ mt: 2 }}
              onClick={uploadFile}
              fullWidth
            >
              Upload
            </Button>
          )}
        </Paper>
      )}

      {/* Error message */}
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileUploader; 