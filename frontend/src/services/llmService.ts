import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export type APIProvider = 'openai' | 'anthropic' | 'huggingface' | 'llama-cpp';

export interface LLM {
  id?: string; // Optional, only used for internal frontend tracking
  type: 'api' | 'local';
  provider?: APIProvider; // Made optional to handle cases where it might be undefined
  /** For API LLMs: model name, for Local LLMs: path to model file */
  model?: string; // Only required for local LLMs
  path?: string; // For local LLMs
  alias: string; // Primary identifier for API operations
  apiKey?: string;
  baseUrl?: string;
}

export const llmService = {
  // API LLMs
  listApiLLMs: async (): Promise<LLM[]> => {
    const response = await axios.get(`${API_BASE_URL}/llms/remote`);
    return response.data;
  },

  getApiLLM: async (alias: string): Promise<LLM> => {
    const response = await axios.get(`${API_BASE_URL}/llms/remote/${encodeURIComponent(alias)}`);
    return response.data;
  },

  createApiLLM: async (llm: Omit<LLM, 'id' | 'type'>): Promise<LLM> => {
    const { apiKey, alias, provider, baseUrl } = llm;
    const payload = {
      alias,
      provider: provider as 'openai' | 'anthropic' | 'huggingface',
      api_key: apiKey,
      base_url: baseUrl,
      type: 'api' as const
    };
    
    console.log('[createApiLLM] Sending payload:', JSON.stringify(payload, null, 2));
    try {
      const response = await axios.post(`${API_BASE_URL}/llms/remote`, payload);
      console.log('[createApiLLM] Response:', response.data);
      return {
        ...response.data,
        model: response.data.model || '',
        apiKey: response.data.api_key
      };
    } catch (error: any) {
      console.error('[createApiLLM] Error:', error.response?.data || error.message);
      throw error;
    }
  },

  updateApiLLM: async (alias: string, llm: Partial<LLM>): Promise<LLM> => {
    const { apiKey, alias: newAlias, provider, baseUrl } = llm;
    const payload: Record<string, any> = {};
    
    // Only include fields that are actually provided
    if (newAlias !== undefined) payload.alias = newAlias;
    if (provider !== undefined) payload.provider = provider;
    if (apiKey !== undefined) payload.api_key = apiKey;
    if (baseUrl !== undefined) payload.base_url = baseUrl;
    
    console.log(`[updateApiLLM] Updating alias ${alias} with payload:`, JSON.stringify(payload, null, 2));
    try {
      const response = await axios.put(`${API_BASE_URL}/llms/remote/${encodeURIComponent(alias)}`, payload);
      console.log(`[updateApiLLM] Response for alias ${alias}:`, response.data);
      return {
        ...response.data,
        model: response.data.model || '',
        apiKey: response.data.api_key
      };
    } catch (error: any) {
      console.error(`[updateApiLLM] Error for alias ${alias}:`, error.response?.data || error.message);
      throw error;
    }
  },

  deleteApiLLM: async (alias: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/llms/remote/${encodeURIComponent(alias)}`);
  },

  // Local LLMs
  listLocalLLMs: async (): Promise<LLM[]> => {
    const response = await axios.get(`${API_BASE_URL}/llms/local`);
    return response.data.map((llm: any) => ({
      ...llm,
      path: llm.path || llm.model
    }));
  },

  getLocalLLM: async (alias: string): Promise<LLM> => {
    const response = await axios.get(`${API_BASE_URL}/llms/local/${encodeURIComponent(alias)}`);
    return response.data;
  },

  createLocalLLM: async (llm: Omit<LLM, 'type'>): Promise<LLM> => {
    const payload = {
      ...llm,
      type: 'local' as const
    };
    console.log('[createLocalLLM] Sending payload:', JSON.stringify(payload, null, 2));
    const response = await axios.post(`${API_BASE_URL}/llms/local`, payload);
    console.log('[createLocalLLM] Response:', response.data);
    return response.data;
  },

  updateLocalLLM: async (alias: string, llm: Partial<LLM>): Promise<LLM> => {
    console.log(`[updateLocalLLM] Updating alias ${alias} with payload:`, JSON.stringify(llm, null, 2));
    const response = await axios.put(`${API_BASE_URL}/llms/local/${encodeURIComponent(alias)}`, llm);
    const responseData = {
      ...response.data,
      path: response.data.path || response.data.model
    };
    console.log(`[updateLocalLLM] Response for alias ${alias}:`, responseData);
    return responseData;
  },

  deleteLocalLLM: async (alias: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/llms/local/${encodeURIComponent(alias)}`);
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
  getLLM: async (alias: string, type: 'api' | 'local'): Promise<LLM> => {
    return type === 'api' ? llmService.getApiLLM(alias) : llmService.getLocalLLM(alias);
  },
  
  createLLM: async (llm: Omit<LLM, 'id'>, type: 'api' | 'local'): Promise<LLM> => {
    return type === 'api' ? llmService.createApiLLM(llm) : llmService.createLocalLLM(llm);
  },
  
  updateLLM: async (alias: string, llm: Partial<LLM>, type: 'api' | 'local'): Promise<LLM> => {
    return type === 'api' ? llmService.updateApiLLM(alias, llm) : llmService.updateLocalLLM(alias, llm);
  },
  
  deleteLLM: async (alias: string, type: 'api' | 'local'): Promise<void> => {
    return type === 'api' 
      ? llmService.deleteApiLLM(alias) 
      : llmService.deleteLocalLLM(alias);
  },
};
