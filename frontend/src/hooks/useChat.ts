import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage as sendMessageAPI } from '../api/chatbot';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMetrics {
  tokens: number;
  latency: number;
}

interface ChatConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  streaming: boolean;
  systemPrompt: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [metrics, setMetrics] = useState<ChatMetrics[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [config, setConfig] = useState<ChatConfig>({
    provider: '',
    model: '',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    streaming: true,
    systemPrompt: 'You are a helpful AI assistant.',
  });

  const queryClient = useQueryClient();

  const sendMessage = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;

    // Create a unique ID for this message exchange
    const exchangeId = Date.now();
    
    // Add user message with a temporary ID
    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: message,
        id: `user-${exchangeId}`
      },
      {
        role: 'assistant',
        content: '',
        id: `assistant-${exchangeId}`,
        isLoading: true
      }
    ]);

    try {
      setIsStreaming(true);
      const startTime = Date.now();

      // Create message array with system prompt and user message
      const chatMessages: Message[] = [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: message }
      ];

      // Send message to API
      const response = await sendMessageAPI(chatMessages, {
        provider: config.provider,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        frequencyPenalty: config.frequencyPenalty,
        presencePenalty: config.presencePenalty,
        streaming: config.streaming,
        systemPrompt: config.systemPrompt
      });

      if (config.streaming) {
        // Handle streaming response
        let assistantMessage = '';
        const reader = response.data.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') break;

              try {
                const chunk = JSON.parse(data);
                if (chunk.choices[0]?.delta?.content) {
                  assistantMessage += chunk.choices[0].delta.content;
                  // Update only the assistant's message in the messages array
                  setMessages(prev => {
                    const assistantMsgIndex = prev.findIndex(m => m.id === `assistant-${exchangeId}`);
                    if (assistantMsgIndex === -1) return prev;
                    
                    const newMessages = [...prev];
                    newMessages[assistantMsgIndex] = {
                      ...newMessages[assistantMsgIndex],
                      content: assistantMessage,
                      isLoading: false
                    };
                    return newMessages;
                  });
                }
              } catch (error) {
                console.error('Error parsing chunk:', error);
              }
            }
          }
        }

        // Add metrics for the completed message
        const endTime = Date.now();
        const latency = endTime - startTime;
        const tokenCount = assistantMessage.length / 4; // Rough estimate
        setMetrics(prev => [...prev, { tokens: tokenCount, latency }]);
      } else {
        // Handle non-streaming response
        const endTime = Date.now();
        const latency = endTime - startTime;
        const tokenCount = response.data.usage?.completion_tokens || 0;
        
        setMessages(prev => {
          const assistantMsgIndex = prev.findIndex(m => m.id === `assistant-${exchangeId}`);
          if (assistantMsgIndex === -1) return prev;
          
          const newMessages = [...prev];
          newMessages[assistantMsgIndex] = {
            ...newMessages[assistantMsgIndex],
            content: response.data.choices[0]?.message?.content || '',
            isLoading: false
          };
          return newMessages;
        });
        
        setMetrics(prev => [...prev, { tokens: tokenCount, latency }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const assistantMsgIndex = prev.findIndex(m => m.id === `assistant-${exchangeId}`);
        if (assistantMsgIndex === -1) return prev;
        
        const newMessages = [...prev];
        newMessages[assistantMsgIndex] = {
          ...newMessages[assistantMsgIndex],
          content: 'Sorry, an error occurred while processing your request.',
          isLoading: false,
          error: true
        };
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // Use ref to track previous provider value to avoid unnecessary invalidations
  const prevProviderRef = useRef(config.provider);

  const updateConfig = useCallback((newConfig: Partial<ChatConfig>) => {
    setConfig(prev => {
      const updatedConfig = {
        ...prev,
        ...newConfig
      };
      
      // Only invalidate queries if provider actually changed
      if (prev.provider !== newConfig.provider) {
        queryClient.invalidateQueries(['remoteLLMs']);
        queryClient.invalidateQueries(['localLLMs']);
        prevProviderRef.current = newConfig.provider || prev.provider;
      }
      
      return updatedConfig;
    });
  }, [queryClient]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setMetrics([]);
  }, []);

  return {
    messages,
    metrics,
    config,
    isStreaming,
    sendMessage,
    updateConfig,
    clearChat,
  };
};
