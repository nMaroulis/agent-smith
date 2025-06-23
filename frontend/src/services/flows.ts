import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface Flow {
  id: number;
  name: string;
  description: string | null;
  serialized_graph: any;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFlowData {
  name: string;
  description?: string;
  serialized_graph: any;
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
    const response = await axios.post(`${API_BASE_URL}/flows/`, flowData);
    return response.data;
  } catch (error) {
    console.error('Error creating flow:', error);
    throw error;
  }
};

// Update an existing flow
export const updateFlow = async (id: number, flowData: CreateFlowData): Promise<Flow> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/flows/${id}`, flowData);
    return response.data;
  } catch (error) {
    console.error(`Error updating flow ${id}:`, error);
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
