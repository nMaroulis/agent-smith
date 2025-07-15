import axios from 'axios';

// Base URL should match your backend server URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

export const fetchChatCompletion = async (request: ChatRequest) => {
  try {
    const response = await axios.post<ChatResponse>(
      `${BASE_URL}/api/playground/chatbot/chat`,
      request
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching chat completion:', error);
    throw error;
  }
};

export const fetchStreamingChatCompletion = async (request: ChatRequest) => {
  try {
    const response = await axios.post<AsyncGenerator<ChatCompletionChunk>>(
      `${BASE_URL}/api/playground/chatbot/chat/stream`,
      request,
      {
        responseType: 'stream',
      }
    );

    return new Response(response.data).body;
  } catch (error) {
    console.error('Error fetching streaming chat completion:', error);
    throw error;
  }
};
