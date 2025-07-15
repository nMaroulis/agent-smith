import { useState, useCallback } from 'react';
import { Box, TextField, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useDropzone } from 'react-dropzone';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  isSubmitting?: boolean;
}

export const ChatInput = ({ onSendMessage, isSubmitting = false }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message.trim(), files);
      setMessage('');
      setFiles([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        bgcolor: '#1f2937', // bg-gray-800
        borderTop: '1px solid',
        borderColor: '#374151', // border-gray-700
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
      }}
    >
      <Box
        {...getRootProps()}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          borderRadius: 1,
          bgcolor: isDragActive ? '#1e40af' : '#1f2937', // bg-blue-900 or bg-gray-800
          border: '1px solid',
          borderColor: '#374151', // border-gray-700
          cursor: 'pointer',
          '&:hover': {
            bgcolor: '#1e40af', // bg-blue-900
          },
        }}
      >
        <input {...getInputProps()} style={{ display: 'none' }} />
        <AttachFileIcon sx={{ 
          color: isDragActive ? 'white' : '#9ca3af', // text-gray-400
          ml: 1 
        }} />
      </Box>
      
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: 1,
            backgroundColor: '#1f2937', // bg-gray-800
            color: 'white',
            '& fieldset': {
              borderColor: '#374151', // border-gray-700
            },
            '&:hover fieldset': {
              borderColor: '#4b5563', // border-gray-600
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6', // border-blue-500
            },
          },
          '& .MuiInputBase-input': {
            color: 'white',
            '&::placeholder': {
              color: '#9ca3af', // text-gray-400
              opacity: 1,
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleSend}
                disabled={isSubmitting || (!message.trim() && files.length === 0)}
                sx={{
                  bgcolor: '#1e40af', // bg-blue-900
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1e3a8a', // bg-blue-950
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={20} sx={{ color: 'primary.main' }} />
                ) : (
                  <SendIcon sx={{ color: 'primary.main' }} />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};