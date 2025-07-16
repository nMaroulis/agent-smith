import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage as sendMessageAPI } from '../api/chatbot';

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Message type for API requests
interface APIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  error?: boolean;
}

interface ChatMetrics {
  tokens: number;
  latency: number;
}

interface ChatConfig {
  llmType: string;
  llmAlias: string;
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
  const [metrics, setMetrics] = useState<ChatMetrics>({ tokens: 0, latency: 0 });
  const [isStreaming, setIsStreaming] = useState(false);
  const [config, setConfig] = useState<ChatConfig>({
    llmType: 'remote',
    llmAlias: '',
    model: '',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    streaming: true,
    systemPrompt: 'You are a helpful AI assistant.'
  });

  const queryClient = useQueryClient();

  const updateAssistantMessage = (content: string, messageId: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const messageIndex = newMessages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content,
          isLoading: false
        };
      }
      return newMessages;
    });
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);

    // Add empty assistant message for streaming
    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isLoading: true
      }
    ]);

    try {
      setIsStreaming(true);
      const startTime = Date.now();

      const apiMessages: APIMessage[] = [
        { role: 'system', content: config.systemPrompt },
        ...messages
          .filter((m): m is ChatMessage & { role: 'user' | 'assistant' } => 
            m.role === 'user' || m.role === 'assistant'
          )
          .map(m => ({
            role: m.role,
            content: m.content
          })),
        { role: 'user', content: content.trim() }
      ];

      const response = await sendMessageAPI(
        apiMessages,
        {
          llmType: config.llmType as 'remote' | 'local',
          llmAlias: config.llmAlias,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topP: config.topP,
          frequencyPenalty: config.frequencyPenalty,
          presencePenalty: config.presencePenalty
        },
        config.streaming
      );

      if (config.streaming) {
        // For streaming responses, the response is a ReadableStream
        let assistantMessage = '';
        const reader = (response as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();

        // Process the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk of data
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  assistantMessage += parsed.choices[0].delta.content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant' && lastMessage.isLoading) {
                      lastMessage.content = assistantMessage;
                    } else {
                      newMessages.push({
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: assistantMessage,
                        isLoading: true
                      });
                    }
                    return newMessages;
                  });
                }
              } catch (error) {
                console.error('Error parsing chunk:', error, 'Chunk:', data);
              }
            }
          }
        }

        // Mark the message as done loading
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.isLoading = false;
          }
          return newMessages;
        });
      } else {
        // For non-streaming responses, the response is a ChatResponse object
        const responseData = response as ChatResponse;

        if (!responseData.choices || responseData.choices.length === 0) {
          throw new Error('No response data received');
        }

        const assistantMessage = responseData.choices[0].message.content;

        setMessages(prev => [
          ...prev.filter(m => m.id !== assistantMessageId),
          {
            id: assistantMessageId,
            role: 'assistant',
            content: assistantMessage,
            isLoading: false
          }
        ]);
      }

      // Update metrics
      const endTime = Date.now();
      const latency = endTime - startTime;
      const totalTokens = (response as any).usage?.total_tokens || 0;

      setMetrics(prev => ({
        ...prev,
        tokens: prev.tokens + totalTokens,
        latency
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the assistant message with the error
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = 'Sorry, there was an error processing your message.';
          lastMessage.error = true;
          lastMessage.isLoading = false;
        }
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // Use ref to track previous LLM type to avoid unnecessary invalidations
  const prevLLMTypeRef = useRef(config.llmType);

  const updateConfig = useCallback((newConfig: Partial<ChatConfig>) => {
    setConfig(prev => {
      const updatedConfig = {
        ...prev,
        ...newConfig
      };
      
      // Only invalidate queries if LLM type actually changed
      if (prev.llmType !== newConfig.llmType) {
        const llmType = newConfig.llmType || prev.llmType;
        if (llmType) {
          queryClient.invalidateQueries({ 
            queryKey: [`${llmType}LLMs`] as const 
          });
        }
        prevLLMTypeRef.current = llmType || 'remote';
      }
      
      return updatedConfig;
    });
  }, [queryClient]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setMetrics({ tokens: 0, latency: 0 });
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
