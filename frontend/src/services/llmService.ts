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

  getApiLLM: async (id: string): Promise<LLM> => {
    const response = await axios.get(`${API_BASE_URL}/llms/remote/${id}`);
    return response.data;
  },

  createApiLLM: async (llm: Omit<LLM, 'id' | 'type'>): Promise<LLM> => {
    const { apiKey, ...rest } = llm;
    const response = await axios.post(`${API_BASE_URL}/llms/remote`, {
      ...rest,
      api_key: apiKey,  // Transform to snake_case
      type: 'api' as const
    });
    return response.data;
  },

  updateApiLLM: async (id: string, llm: Partial<LLM>): Promise<LLM> => {
    const { apiKey, ...rest } = llm;
    const payload = {
      ...rest,
      api_key: apiKey  // Transform to snake_case
    };
    const response = await axios.put(`${API_BASE_URL}/llms/remote/${id}`, payload);
    return response.data;
  },

  deleteApiLLM: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/llms/remote/${id}`);
  },

  // Local LLMs
  listLocalLLMs: async (): Promise<LLM[]> => {
    const response = await axios.get(`${API_BASE_URL}/llms/local`);
    return response.data.map((llm: any) => ({
      ...llm,
      path: llm.path || llm.model
    }));
  },

  getLocalLLM: async (id: string): Promise<LLM> => {
    const response = await axios.get(`${API_BASE_URL}/llms/local/${id}`);
    return {
      ...response.data,
      path: response.data.path || response.data.model
    };
  },

  createLocalLLM: async (llm: Omit<LLM, 'id' | 'type'>): Promise<LLM> => {
    const response = await axios.post(`${API_BASE_URL}/llms/local`, {
      ...llm,
      type: 'local' as const
    });
    return response.data;
  },

  updateLocalLLM: async (id: string, llm: Partial<LLM>): Promise<LLM> => {
    const response = await axios.put(`${API_BASE_URL}/llms/local/${id}`, llm);
    return {
      ...response.data,
      path: response.data.path || response.data.model
    };
  },

  deleteLocalLLM: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/llms/local/${id}`);
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
  
  // Generic methods that work with both types
  getLLM: async (id: string, type: 'api' | 'local'): Promise<LLM> => {
    return type === 'api' ? llmService.getApiLLM(id) : llmService.getLocalLLM(id);
  },
  
  createLLM: async (llm: Omit<LLM, 'id'>, type: 'api' | 'local'): Promise<LLM> => {
    return type === 'api' ? llmService.createApiLLM(llm) : llmService.createLocalLLM(llm);
  },
  
  updateLLM: async (id: string, llm: Partial<LLM>, type: 'api' | 'local'): Promise<LLM> => {
    return type === 'api' ? llmService.updateApiLLM(id, llm) : llmService.updateLocalLLM(id, llm);
  },
  
  deleteLLM: async (id: string, type: 'api' | 'local'): Promise<void> => {
    return type === 'api' ? llmService.deleteApiLLM(id) : llmService.deleteLocalLLM(id);
  },
};
