/**
 * API Configuration
 * 
 * This file manages the API base URL for the ElderConnect backend.
 * It supports both local development and tunnel URLs.
 * 
 * Environment variables can be set in:
 * - app.json (expo.extra)
 * - .env file (requires expo-constants)
 * - Or directly in this file for quick changes
 */

import Constants from 'expo-constants';

// Get environment variables from expo config or use defaults
const getEnvVar = (key: string, defaultValue: string): string => {
  // Try to get from expo config extra
  const extra = Constants.expoConfig?.extra;
  if (extra && extra[key]) {
    return extra[key];
  }
  
  // Try to get from process.env (if available)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  return defaultValue;
};

// Configuration values
export const DEV_API_PORT = getEnvVar('DEV_API_PORT', '5000');
// Note: DEV_API_IP should point to your backend server (port 5000), not ngrok web interface (port 4040)
export const DEV_API_IP = getEnvVar('DEV_API_IP', `http://127.0.0.1:${getEnvVar('DEV_API_PORT', '5000')}`);
export const TUNNEL_URL = getEnvVar('TUNNEL_URL', '');

/**
 * Get the API base URL
 * 
 * Priority:
 * 1. TUNNEL_URL if set (for mobile testing with tunnel)
 * 2. DEV_API_IP (for local development)
 * 3. Fallback to localhost with DEV_API_PORT
 */
export const getApiBaseUrl = (): string => {
  // Use tunnel URL if available (for mobile app testing)
  if (TUNNEL_URL && TUNNEL_URL.trim() !== '') {
    return TUNNEL_URL;
  }
  
  // Use DEV_API_IP if set
  if (DEV_API_IP && DEV_API_IP.trim() !== '') {
    return DEV_API_IP;
  }
  
  // Fallback to localhost
  return `http://localhost:${DEV_API_PORT}`;
};

/**
 * API Base URL - use this in your API calls
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Full API endpoint helper
 * Example: apiEndpoint('/auth/login') => 'https://tunnel-url.com/api/auth/login'
 */
export const apiEndpoint = (path: string): string => {
  const base = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${apiPath.startsWith('/api') ? apiPath : `/api${apiPath}`}`;
};

/**
 * Check if using tunnel URL
 */
export const isUsingTunnel = (): boolean => {
  return !!(TUNNEL_URL && TUNNEL_URL.trim() !== '');
};

/**
 * Get current API configuration info (for debugging)
 */
export const getApiConfig = () => {
  return {
    apiBaseUrl: API_BASE_URL,
    isUsingTunnel: isUsingTunnel(),
    tunnelUrl: TUNNEL_URL || 'Not set',
    devApiIp: DEV_API_IP,
    devApiPort: DEV_API_PORT,
  };
};

// Log configuration in development
if (__DEV__) {
  console.log('🔧 API Configuration:', getApiConfig());
}

