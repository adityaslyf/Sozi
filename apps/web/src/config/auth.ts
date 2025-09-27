// Authentication configuration
export const AUTH_CONFIG = {
  // For development, you can use a test client ID
  // In production, this should come from environment variables
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id.googleusercontent.com',
  
  // Backend API endpoints
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // OAuth endpoints
  GOOGLE_AUTH_ENDPOINT: '/auth/google',
} as const;

export default AUTH_CONFIG;
