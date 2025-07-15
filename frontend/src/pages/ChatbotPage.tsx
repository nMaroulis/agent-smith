import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Container, Grid, Paper, Typography, useTheme } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { ConfigPanel } from '../components/chat/ConfigPanel';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { useChat } from '../hooks/useChat';

const ChatbotPage = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { messages, config, sendMessage: sendMessage2, isStreaming, metrics } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      // First scroll to bottom with smooth behavior
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      // Then scroll to the ref element
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Invalidate cache when config changes
    queryClient.invalidateQueries(['remoteLLMs']);
    queryClient.invalidateQueries(['localLLMs']);
  }, [config.provider]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 64px)', // Adjust for navbar height
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
                queryClient.setQueryData(['chat-config'], newConfig);
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
              ref={messagesContainerRef}
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mb: 'auto', // Push messages up
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
              {/* Empty div to scroll to */}
              <div ref={messagesEndRef} style={{ height: '1px' }} />
            </Box>

            {/* Chat Input */}
            <Box
              sx={{
                width: '100%',
                height: '80px',
                position: 'sticky',
                bottom: 0,
                zIndex: 1,
                bgcolor: theme.palette.background.paper,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}
            >
              <ChatInput
                onSendMessage={sendMessage2}
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