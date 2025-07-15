import axios from 'axios';

// Base URL should match your backend server URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  stream: boolean;
}

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    delta: {
      content: string;
    };
  }>;
}

export const sendMessage = async (messages: Message[], config: any) => {
  const { provider, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, streaming, systemPrompt, aiAgent } = config;

  const chatRequest: ChatRequest = {
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages
    ],
    model,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    stream: streaming
  };

  const endpoint = streaming ? '/playground/chatbot/chat/stream' : '/playground/chatbot/chat';

  try {
    const response = await axios.post(
      `${BASE_URL}${endpoint}`,
      chatRequest,
      streaming ? {
        responseType: 'stream',
        headers: {
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json'
        }
      } : {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (streaming) {
      return response;
    } else {
      return response.data as ChatResponse;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
