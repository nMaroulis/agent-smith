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
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
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
          bgcolor: isDragActive ? 'primary.light' : 'action.hover',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} style={{ display: 'none' }} />
        <AttachFileIcon color={isDragActive ? 'primary' : 'action'} sx={{ ml: 1 }} />
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
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleSend}
                disabled={isSubmitting || (!message.trim() && files.length === 0)}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': {
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