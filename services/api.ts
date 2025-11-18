/**
 * API Service
 * 
 * Centralized API service for making HTTP requests to the backend.
 * Uses the API configuration from constants/API.ts
 */

import { API_BASE_URL, apiEndpoint } from '@/constants/API';

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

/**
 * Custom fetch wrapper with error handling
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = apiEndpoint(endpoint);
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add authentication token if available
  try {
    const AsyncStorageModule = await import('@react-native-async-storage/async-storage');
    const AsyncStorage = (AsyncStorageModule.default || AsyncStorageModule) as unknown as {
      getItem: (key: string) => Promise<string | null>;
    };
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
  } catch (e) {
    // AsyncStorage not available or token not found - continue without auth
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    if (!response.ok) {
      const errorData = isJson ? await response.json() : await response.text();
      throw {
        message: errorData?.message || errorData || `HTTP ${response.status}`,
        status: response.status,
        data: errorData,
      } as ApiError;
    }

    if (isJson) {
      return await response.json();
    }
    
    return await response.text() as any;
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      throw error; // Re-throw API errors
    }
    
    // Network or other errors
    throw {
      message: error instanceof Error ? error.message : 'Network error',
      status: 0,
    } as ApiError;
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * Health check endpoint
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiGet<{ status: string; message: string }>('/health');
    return response.status === 'success';
  } catch {
    return false;
  }
}

// Export API base URL for direct use if needed
export { API_BASE_URL, apiEndpoint } from '@/constants/API';

