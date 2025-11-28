import axios from 'axios';

// Determine if we are in a development environment (localhost or 127.0.0.1)
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Create an Axios instance
const api = axios.create({
  // Use port 5001 for development, otherwise relative path for production
  baseURL: isDevelopment ? 'http://localhost:5001/api' : '/api',
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
    baseURL: isDevelopment ? 'http://127.0.0.1:5001/api' : '/api',
    headers: {
      'x-api-key': apiKey,
    },
  });
};

export default api;