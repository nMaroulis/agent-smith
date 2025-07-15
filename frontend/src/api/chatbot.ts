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
  const { provider, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, streaming } = config;

  // Ensure we have a valid model
  if (!model) {
    throw new Error('No model selected');
  }

  // Create the chat request with the provided messages
  // The messages array should already include the system prompt if needed
  const chatRequest: ChatRequest = {
    messages,
    model,
    temperature,
    max_tokens: maxTokens,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    stream: streaming
  };

  const endpoint = streaming ? '/playground/chatbot/chat/stream' : '/playground/chatbot/chat';
  const url = `${BASE_URL}${endpoint}`;

  try {
    if (streaming) {
      // Use Fetch API for streaming responses
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(chatRequest)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch streaming response');
      }

      // Return the response body as a ReadableStream
      if (response.body) {
        return { data: response.body };
      }
      throw new Error('No response body received');
    } else {
      // For non-streaming, continue using axios
      const response = await axios.post(
        url,
        chatRequest,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data as ChatResponse;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
