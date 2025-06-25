import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface Flow {
  id: number;
  name: string;
  description: string | null;
  graph: any;
  state?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFlowData {
  name: string;
  description?: string;
  graph: any;
  state?: any;
}

// Get all flows
export const getFlows = async (limit?: number): Promise<Flow[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/flows/`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching flows:', error);
    throw error;
  }
};

// Get a single flow by ID
export const getFlow = async (id: number): Promise<Flow> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/flows/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching flow ${id}:`, error);
    throw error;
  }
};

// Create a new flow
export const createFlow = async (flowData: CreateFlowData): Promise<Flow> => {
  try {
    console.log('Creating flow with data:', JSON.stringify(flowData, null, 2));
    const response = await axios.post(`${API_BASE_URL}/flows/`, flowData);
    console.log('Flow created successfully:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error creating flow:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestData: error.config?.data
      });
    } else {
      console.error('Error creating flow:', error);
    }
    throw error;
  }
};

// Update an existing flow
export const updateFlow = async (id: number, flowData: CreateFlowData): Promise<Flow> => {
  try {
    console.log(`Updating flow ${id} with data:`, JSON.stringify(flowData, null, 2));
    const response = await axios.put(`${API_BASE_URL}/flows/${id}`, flowData);
    console.log(`Flow ${id} updated successfully:`, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error updating flow ${id}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestData: error.config?.data
      });
    } else {
      console.error(`Error updating flow ${id}:`, error);
    }
    throw error;
  }
};

// Delete a flow
export const deleteFlow = async (id: number): Promise<Flow> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/flows/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting flow ${id}:`, error);
    throw error;
  }
};
