import axios from 'axios';

// Base URL should match your backend server URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const fetchRemoteLLMs = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/llms/remote`);
    return response.data;
  } catch (error) {
    console.error('Error fetching remote LLMs:', error);
    throw error;
  }
};

export const fetchLocalLLMs = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/llms/local`);
    return response.data;
  } catch (error) {
    console.error('Error fetching local LLMs:', error);
    throw error;
  }
};

export const fetchRemoteModels = async (alias: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/llms/remote/${alias}/models`);
    return response.data.models;
  } catch (error) {
    console.error('Error fetching remote models:', error);
    throw error;
  }
};

export const fetchLocalModels = async (alias: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/llms/local/${alias}/models`);
    return response.data.models;
  } catch (error) {
    console.error('Error fetching local models:', error);
    throw error;
  }
};

export const fetchModelParameters = async (provider: string, alias: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/llms/${provider}/${alias}/parameters`);
    return response.data;
  } catch (error) {
    console.error('Error fetching model parameters:', error);
    throw error;
  }
};
