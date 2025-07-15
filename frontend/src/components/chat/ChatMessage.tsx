import { Box, Typography, Avatar, Paper, CircularProgress, Stack, Chip, IconButton, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface ChatMessageProps {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metrics?: {
    tokens: number;
    latency: number;
  };
  isStreaming?: boolean;
  isLoading?: boolean;
  error?: boolean;
}

export const ChatMessage = ({ 
  id, 
  role, 
  content, 
  metrics, 
  isStreaming, 
  isLoading = false,
  error = false 
}: ChatMessageProps) => {
  const [showMetrics, setShowMetrics] = useState(false);
  const [copied, setCopied] = useState(false);
  const [renderedContent, setRenderedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  // Handle typing animation for assistant messages
  useEffect(() => {
    // Skip if content is empty or this is a user message
    if (!content || !isAssistant) {
      setRenderedContent(content || '');
      return;
    }

    // If we're still loading, show loading state
    if (isLoading) {
      setRenderedContent('');
      setIsTyping(true);
      return;
    }

    // If there's an error, just show the error message
    if (error) {
      setRenderedContent(content);
      setIsTyping(false);
      return;
    }

    // If we already have the full content, show it
    if (renderedContent === content) {
      setIsTyping(false);
      return;
    }
    
    // Start typing animation for new content
    const remainingContent = content.slice(renderedContent.length);
    const remainingArray = remainingContent.split('');
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex < remainingArray.length) {
        setRenderedContent(prev => prev + remainingArray[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 10);
    
    return () => clearInterval(typingInterval);
  }, [content, isAssistant, isLoading, error]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseEnter = () => setShowMetrics(true);
  const handleMouseLeave = () => setShowMetrics(false);



  const getRoleStyles = () => {
    if (isUser) {
      return {
        bgcolor: 'rgba(255, 255, 255, 0.05)',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '18px 18px 4px 18px',
        alignSelf: 'flex-end',
        maxWidth: '85%',
        ml: 'auto',
        position: 'relative',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.08)',
        },
      };
    }
    return {
      bgcolor: 'rgba(32, 33, 35, 0.9)',
      color: '#fff',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '18px 18px 18px 4px',
      alignSelf: 'flex-start',
      maxWidth: '85%',
      mr: 'auto',
      position: 'relative',
      '&:hover': {
        bgcolor: 'rgba(32, 33, 35, 0.95)',
      },
    };
  };

  const messageStyles = getRoleStyles();

  // Simple markdown code block detection and rendering
  const renderContent = (text: string) => {
    if (!text) return null;
    
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, language, code] = match;
      const before = text.slice(lastIndex, match.index);
      
      if (before) {
        parts.push(<Box key={`text-${lastIndex}`} sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>{before}</Box>);
      }
      
      parts.push(
        <Box key={`code-${lastIndex}`} sx={{ position: 'relative', my: 1, borderRadius: '8px', overflow: 'hidden' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            bg: '#1e1e1e',
            p: '4px 12px',
            fontSize: '0.8rem',
            color: '#9ca3af',
            fontFamily: 'monospace',
          }}>
            <span>{language || 'code'}</span>
            <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
              <IconButton 
                size="small" 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                sx={{ color: '#9ca3af', p: '4px', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
          <SyntaxHighlighter 
            language={language} 
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '16px',
              fontSize: '0.9rem',
              borderRadius: '0 0 8px 8px',
              background: '#1e1e1e',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </Box>
      );
      
      lastIndex = match.index + fullMatch.length;
    }

    const remaining = text.slice(lastIndex);
    if (remaining) {
      parts.push(<Box key={`text-end`} sx={{ whiteSpace: 'pre-wrap' }}>{remaining}</Box>);
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <Box
      sx={{
        width: '100%',
        mb: 2,
        px: 2,
        py: 1,
        position: 'relative',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          gap: 2,
          maxWidth: '1000px',
          mx: 'auto',
          width: '100%',
        }}
      >
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: 0.5,
          opacity: 0.8,
          '&:hover': { opacity: 1 }
        }}>
          <Avatar
            sx={{
              bgcolor: isUser ? '#10a37f' : '#202123',
              color: '#fff',
              width: 36,
              height: 36,
              fontSize: '0.9rem',
              fontWeight: 600,
              border: '1px solid',
              borderColor: isUser ? 'rgba(16, 163, 127, 0.5)' : 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'all 0.2s ease',
              },
            }}
          >
            {isUser ? 'You' : 'AI'}
          </Avatar>
          
          {showMetrics && metrics && (
            <Box sx={{ 
              mt: 0.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
            }}>
              <Chip 
                size="small" 
                label={`${metrics.tokens} tokens`}
                sx={{ height: '20px', fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Chip 
                size="small" 
                label={`${metrics.latency.toFixed(0)}ms`}
                sx={{ height: '20px', fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              />
            </Box>
          )}
        </Box>

        <Box
          sx={{
            ...messageStyles,
            p: 3,
            boxShadow: '0 0 15px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            '& pre': {
              m: 0,
              p: 2,
              borderRadius: '8px',
              overflowX: 'auto',
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              bgcolor: '#1e1e1e',
            },
            '& code': {
              fontFamily: 'monospace',
              bgcolor: 'transparent',
              p: 0.5,
              borderRadius: 0.25,
              color: '#f8f8f2',
              fontSize: '0.9em',
            },
            '& a': {
              color: '#58a6ff',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            '& ul, & ol': {
              pl: 3,
              my: 1,
            },
            '& li': {
              mb: 0.5,
            },
            '& blockquote': {
              borderLeft: '3px solid #4b5563',
              pl: 2,
              ml: 0,
              color: '#9ca3af',
              fontStyle: 'italic',
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              my: 1,
              '& th, & td': {
                border: '1px solid #4b5563',
                p: 1,
                textAlign: 'left',
              },
              '& th': {
                bgcolor: 'rgba(255,255,255,0.05)',
              },
            },
          }}
        >
          {isAssistant && !isTyping && (
            <Box sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              display: 'flex',
              gap: 0.5,
              opacity: showMetrics ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}>
              <Tooltip title={copied ? 'Copied!' : 'Copy'}>
                <IconButton 
                  size="small" 
                  onClick={handleCopy}
                  sx={{ 
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.8)',
                    },
                  }}
                >
                  {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          )}
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
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: isUser ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.7)',
                fontSize: '0.8rem',
              }}
            >
              <CircularProgress
                size={14}
                thickness={5}
                sx={{ color: 'inherit' }}
              />
              <span>Generating...</span>
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