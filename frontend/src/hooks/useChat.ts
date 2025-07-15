import { useState, useEffect } from 'react';
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

    // Add user message
    const timestamp = Date.now();
    setMessages(prev => [...prev, { role: 'user', content: message }]);

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
        systemPrompt: config.systemPrompt,
        aiAgent: config.aiAgent
      });

      if (config.streaming) {
        // Handle streaming response
        let assistantMessage = '';
        const reader = response.data.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') break;

              try {
                const chunk = JSON.parse(data);
                if (chunk.choices[0]?.delta?.content) {
                  assistantMessage += chunk.choices[0].delta.content;
                  setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: assistantMessage }]);
                }
              } catch (error) {
                console.error('Error parsing chunk:', error);
              }
            }
          }
        }

        // Add final assistant message if not already added
        const endTime = Date.now();
        const latency = endTime - startTime;
        const tokenCount = assistantMessage.length / 4; // Rough estimate
        setMetrics(prev => [...prev, { tokens: tokenCount, latency }]);
      } else {
        // Handle non-streaming response
        const endTime = Date.now();
        const latency = endTime - startTime;
        const tokenCount = response.data.usage.completion_tokens;
        setMetrics(prev => [...prev, { tokens: tokenCount, latency }]);
        
        // Add assistant message
        if (response.data.choices[0]?.message?.content) {
          setMessages(prev => [...prev, { role: 'assistant', content: response.data.choices[0].message.content }]);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred while processing your request.' }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const updateConfig = (newConfig: Partial<ChatConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig
    }));
    queryClient.invalidateQueries(['remoteLLMs']);
    queryClient.invalidateQueries(['localLLMs']);
  };

  return {
    messages,
    metrics,
    config,
    isStreaming,
    sendMessage,
    updateConfig,
  };
};
