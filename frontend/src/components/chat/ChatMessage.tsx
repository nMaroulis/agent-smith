import { Box, Typography, Avatar, Paper, Grid, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  metrics?: {
    tokens: number;
    latency: number;
  };
  isStreaming?: boolean;
}

export const ChatMessage = ({ role, content, metrics, isStreaming }: ChatMessageProps) => {
  const [showMetrics, setShowMetrics] = useState(false);

  const handleMouseEnter = () => {
    setShowMetrics(true);
  };

  const handleMouseLeave = () => {
    setShowMetrics(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '80%',
        mx: 'auto',
        mb: 2,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 2,
          maxWidth: '90%',
          alignSelf: role === 'user' ? 'flex-start' : 'flex-end',
          bgcolor: role === 'user' ? 'primary.light' : 'secondary.light',
          color: role === 'user' ? 'primary.contrastText' : 'secondary.contrastText',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: role === 'user' ? 'primary.main' : 'secondary.main',
              width: 32,
              height: 32,
              mr: 1,
            }}
          >
            {role === 'user' ? 'U' : 'A'}
          </Avatar>
          <Typography variant="subtitle2" component="span">
            {role === 'user' ? 'User' : 'Assistant'}
          </Typography>
          {isStreaming && (
            <Box sx={{ ml: 'auto' }}>
              <CircularProgress size={16} />
            </Box>
          )}
        </Box>
        <Typography variant="body1" component="div">
          {content}
        </Typography>
      </Paper>
      {showMetrics && metrics && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <Typography color="textSecondary">
            {metrics.tokens} tokens
          </Typography>
          <Typography color="textSecondary">
            {metrics.latency.toFixed(2)} ms
          </Typography>
        </Box>
      )}
    </Box>
  );
};