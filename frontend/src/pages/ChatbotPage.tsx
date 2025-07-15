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
  const { 
    messages, 
    config, 
    sendMessage: sendMessage2, 
    isStreaming, 
    metrics, 
    clearChat,
    updateConfig
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      // First scroll to bottom with smooth behavior
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      // Then scroll to the ref element
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []); // Removed dependencies since refs are stable

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]); // Added scrollToBottom to dependencies

  const prevProviderRef = useRef(config.provider);

  useEffect(() => {
    // Only invalidate if provider actually changed
    if (prevProviderRef.current !== config.provider) {
      queryClient.invalidateQueries(['remoteLLMs']);
      queryClient.invalidateQueries(['localLLMs']);
      prevProviderRef.current = config.provider;
    }
  }, [config.provider, queryClient]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 64px)', // Adjust for navbar height
      width: '100%',
      bgcolor: '#111827', // bg-gray-900
      color: 'white'
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
          bgcolor: '#111827', // bg-gray-900
          borderRight: '1px solid',
          borderColor: '#1f2937' // border-gray-800
        }}>
          <Paper sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: '#111827', // bg-gray-900
            boxShadow: 'none',
            borderRadius: 0,
            borderRight: '1px solid #1f2937' // border-gray-800
          }}>
            <ConfigPanel
              config={config}
              onConfigChange={updateConfig}
              onClearChat={clearChat}
            />
          </Paper>
        </Box>

        {/* Right Column - Chat */}
        <Box sx={{ 
          flex: 1, 
          height: '100%', 
          overflow: 'hidden',
          bgcolor: '#111827', // bg-gray-900
          borderLeft: '1px solid',
          borderColor: '#1f2937' // border-gray-800
        }}>
          <Paper sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: '#111827', // bg-gray-900
            boxShadow: 'none',
            borderRadius: 0,
            borderRight: '1px solid #1f2937' // border-gray-800
          }}>
            {/* Chat Messages */}
            <Box
              ref={messagesContainerRef}
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: '#1f2937', // bg-gray-800
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
                bgcolor: '#1f2937', // bg-gray-800
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