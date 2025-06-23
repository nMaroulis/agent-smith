import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

type APIProvider = 'openai' | 'anthropic' | 'huggingface' | 'llama-cpp';

export interface LLM {
  id: string;
  type: 'api' | 'local';
  provider: APIProvider;
  /** For API LLMs: model name, for Local LLMs: path to model file */
  model: string;
  path?: string; // For local LLMs
  name: string;
  apiKey?: string;
  baseUrl?: string;
}

export const llmService = {
  // API LLMs
  listApiLLMs: async (): Promise<LLM[]> => {
    const response = await axios.get(`${API_BASE_URL}/llms/remote`);
    return response.data;
  },

  // Local LLMs
  listLocalLLMs: async (): Promise<LLM[]> => {
    const response = await axios.get(`${API_BASE_URL}/llms/local`);
    // Map the response to ensure path is set for local LLMs
    return response.data.map((llm: any) => ({
      ...llm,
      // For backward compatibility, if path is not set, use model as path
      path: llm.path || llm.model
    }));
  },

  // Get all LLMs (both API and local)
  listAllLLMs: async (): Promise<LLM[]> => {
    try {
      const [apiLLMs, localLLMs] = await Promise.all([
        llmService.listApiLLMs(),
        llmService.listLocalLLMs(),
      ]);
      // Ensure local LLMs have their path set
      const processedLocalLLMs = localLLMs.map(llm => ({
        ...llm,
        path: llm.path || llm.model
      }));
      return [...apiLLMs, ...processedLocalLLMs];
    } catch (error) {
      console.error('Error fetching LLMs:', error);
      return [];
    }
  },
};
