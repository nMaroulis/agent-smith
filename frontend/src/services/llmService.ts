import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

type APIProvider = 'openai' | 'anthropic' | 'huggingface' | 'llama-cpp';

export interface LLM {
  id: string;
  type: 'api' | 'local';
  provider: APIProvider;
  model: string;
  name: string;
  apiKey?: string;
  baseUrl?: string;
}

export const llmService = {
  // API LLMs
  listApiLLMs: async (): Promise<LLM[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/llm/api/list`);
    return response.data;
  },

  // Local LLMs
  listLocalLLMs: async (): Promise<LLM[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/llm/local/list`);
    return response.data;
  },

  // Get all LLMs (both API and local)
  listAllLLMs: async (): Promise<LLM[]> => {
    try {
      const [apiLLMs, localLLMs] = await Promise.all([
        llmService.listApiLLMs(),
        llmService.listLocalLLMs(),
      ]);
      return [...apiLLMs, ...localLLMs];
    } catch (error) {
      console.error('Error fetching LLMs:', error);
      return [];
    }
  },
};
