import axios from 'axios';

// Base URL should match your backend server URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types
export interface LLM {
  alias: string;
  provider: string;
}

export interface ModelParameter {
  name: string;
  type: string;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  llm_type: 'remote' | 'local';
  llm_alias: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices: Array<{
    index: number;
    message: Message;
    finish_reason: string | null;
  }>;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    delta: {
      content: string;
    };
    index: number;
    finish_reason: string | null;
  }>;
}

// Fetch available remote LLMs
export const fetchRemoteLLMs = async (): Promise<LLM[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/llms/remote`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching remote LLMs:', error);
    return [];
  }
};

// Fetch available local LLMs
export const fetchLocalLLMs = async (): Promise<LLM[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/llms/local`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching local LLMs:', error);
    return [];
  }
};

// Fetch available models for a specific LLM
export const fetchRemoteModels = async (alias: string): Promise<string[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/llms/remote/${alias}/models`);
    // The backend returns { models: string[] }
    return Array.isArray(response.data?.models) ? response.data.models : [];
  } catch (error) {
    console.error(`Error fetching models for remote LLM ${alias}:`, error);
    return [];
  }
};

export const fetchLocalModels = async (alias: string): Promise<string[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/llms/local/${alias}/models`);
    // The backend returns { models: string[] }
    return Array.isArray(response.data?.models) ? response.data.models : [];
  } catch (error) {
    console.error(`Error fetching models for local LLM ${alias}:`, error);
    return [];
  }
};

// Fetch model parameters for a specific LLM and model
export const fetchModelParameters = async (llmType: 'remote' | 'local', alias: string): Promise<Record<string, any>> => {
  try {
    const response = await axios.get(`${BASE_URL}/llms/${llmType}/${alias}/parameters`);
    return response.data || {};
  } catch (error) {
    console.error(`Error fetching parameters for ${llmType} LLM ${alias}:`, error);
    return {};
  }
};



export const sendMessage = async (
  messages: Message[], 
  config: {
    llmType: 'remote' | 'local';
    llmAlias: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    streaming?: boolean;
  },
  streaming = false
): Promise<ChatResponse | ReadableStream<Uint8Array>> => {
  const { 
    llmType, 
    llmAlias, 
    model, 
    temperature = 0.7, 
    maxTokens = 1000, 
    topP = 1.0,
    frequencyPenalty = 0.0,
    presencePenalty = 0.0
  } = config;

  if (!model) {
    throw new Error('No model selected');
  }

  // Only include parameters that have values
  const chatRequest: ChatRequest = {
    messages,
    llm_type: llmType,
    llm_alias: llmAlias,
    model,
    ...(temperature !== undefined && { temperature }),
    ...(maxTokens !== undefined && { max_tokens: maxTokens }),
    ...(topP !== undefined && { top_p: topP }),
    ...(frequencyPenalty !== undefined && { frequency_penalty: frequencyPenalty }),
    ...(presencePenalty !== undefined && { presence_penalty: presencePenalty })
  };

  const endpoint = streaming ? '/playground/chatbot/chat/stream' : '/playground/chatbot/chat';
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || 
        errorData.message || 
        `HTTP error! status: ${response.status}`
      );
    }

    if (streaming) {
      // Return the readable stream directly for streaming responses
      if (!response.body) {
        throw new Error('No response body for streaming request');
      }
      return response.body;
    } else {
      // For non-streaming, parse and return the JSON response
      const data: ChatResponse = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};
