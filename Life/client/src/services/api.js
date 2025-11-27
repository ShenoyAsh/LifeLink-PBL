import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: window.location.origin.includes('localhost:3000') 
    ? 'http://localhost:5001/api' 
    : '/api',  // For production, use relative URL
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Function to get the Admin API Key.
 * In a real app, this would come from a secure auth context (e.g., after admin login).
 * For this prototype, we'll prompt the user or read from local storage.
 */
const getAdminApiKey = () => {
  // Try to get from local storage first
  let key = localStorage.getItem('adminApiKey');
  if (!key) {
    key = prompt('Enter Admin API Key (for export/import):');
    if (key) {
      localStorage.setItem('adminApiKey', key);
    }
  }
  return key;
};

/**
 * Creates an authorized Axios instance for admin actions.
 */
export const createAdminApi = () => {
  const apiKey = getAdminApiKey();
  if (!apiKey) {
    alert('Admin API Key is required for this action.');
    return null;
  }

  return axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
    headers: {
      'x-api-key': apiKey,
    },
  });
};

export default api;