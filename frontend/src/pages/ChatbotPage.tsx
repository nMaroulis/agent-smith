import { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, useTheme } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { ConfigPanel } from '../components/chat/ConfigPanel';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { useChat } from '../hooks/useChat';

const ChatbotPage = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { messages, config, sendMessage, isStreaming, metrics } = useChat();

  useEffect(() => {
    // Invalidate cache when config changes
    queryClient.invalidateQueries(['remoteLLMs']);
    queryClient.invalidateQueries(['localLLMs']);
  }, [config.provider]);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%',
      bgcolor: theme.palette.background.default 
    }}>
      <Box sx={{ 
        display: 'flex', 
        height: '100%', 
        width: '100%', 
        overflow: 'hidden'
      }}>
        {/* Left Column - Config Panel */}
        <Box sx={{ 
          width: '300px', 
          height: '100%', 
          flexShrink: 0,
          bgcolor: theme.palette.background.paper,
          borderRight: '1px solid',
          borderColor: 'divider'
        }}>
          <Paper sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: theme.palette.background.paper 
          }}>
            <ConfigPanel
              onConfigChange={(newConfig) => {
                // Update config here
              }}
            />
          </Paper>
        </Box>

        {/* Right Column - Chat */}
        <Box sx={{ 
          flex: 1, 
          height: '100%', 
          overflow: 'hidden',
          bgcolor: theme.palette.background.paper 
        }}>
          <Paper sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: theme.palette.background.paper 
          }}>
            {/* Chat Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  metrics={metrics[index]}
                  isStreaming={isStreaming && message.role === 'assistant'}
                />
              ))}
            </Box>

            {/* Chat Input */}
            <Box sx={{ width: '100%', position: 'sticky', bottom: 0, zIndex: 1 }}>
              <ChatInput
                onSendMessage={(message, files) => sendMessage(message, files)}
                isSubmitting={isStreaming}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatbotPage;