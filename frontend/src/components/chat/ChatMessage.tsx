import { Box, Typography, Avatar, Paper, CircularProgress, Stack, Chip } from '@mui/material';
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

  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  const getRoleColor = () => {
    if (isUser) {
      return {
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        color: '#000',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        iconColor: '#666',
      };
    }
    return {
      bgcolor: '#40444b',
      color: '#fff',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      iconColor: '#fff',
    };
  };

  const roleColors = getRoleColor();

  return (
    <Box
      sx={{
        width: '100%',
        mb: 3,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-start' : 'flex-end',
          gap: 2,
        }}
      >
        {isUser && (
          <Avatar
            sx={{
              bgcolor: '#666',
              color: '#fff',
              width: 32,
              height: 32,
              fontSize: '1rem',
            }}
          >
            U
          </Avatar>
        )}
        {isAssistant && (
          <Avatar
            sx={{
              bgcolor: '#40444b',
              color: '#fff',
              width: 32,
              height: 32,
              fontSize: '1rem',
            }}
          >
            A
          </Avatar>
        )}
        <Box
          sx={{
            maxWidth: '80%',
            bgcolor: roleColors.bgcolor,
            color: roleColors.color,
            borderRadius: '12px',
            p: 3,
            border: '1px solid',
            borderColor: roleColors.borderColor,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontSize: '1rem',
              lineHeight: 1.5,
              mb: 1,
            }}
          >
            {content}
          </Typography>
          {isStreaming && (
            <Box
              sx={{
                position: 'absolute',
                right: 12,
                bottom: 12,
              }}
            >
              <CircularProgress
                size={16}
                sx={{
                  color: roleColors.iconColor,
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
      {showMetrics && metrics && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: isUser ? 'flex-start' : 'flex-end',
            fontSize: '0.8rem',
            color: roleColors.color,
            opacity: 0.7,
            mt: 1,
          }}
        >
          <Typography>
            {metrics.tokens} tokens • {metrics.latency.toFixed(1)}ms
          </Typography>
        </Box>
      )}
    </Box>
  );
};