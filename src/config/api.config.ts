/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Get the API URL from environment variable or use default
// Use HTTP for local development (backend doesn't have SSL)
// export const API_BASE_URL = 'https://pdfconvertbackendexpress-production.up.railway.app';
// export const API_BASE_URL = 'https://pdf-create-express-production.up.railway.app';
export const API_BASE_URL = 'http://localhost:5000';
export const API_URL = `${API_BASE_URL}/api`;

export default {
  BASE_URL: API_BASE_URL,
  API_URL,
};

