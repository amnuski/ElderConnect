// API Configuration and Service Functions
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the correct API URL based on platform
const getApiBaseUrl = () => {
  // Production API URL
  const PRODUCTION_API = 'https://elders-api.tselven.com/api';
  
  // Development API - use tunnel URL or local IP
  // Option 1: Use tunnel URL (ngrok, localtunnel, etc.)
  // Set this to your tunnel URL when using tunneling (e.g., 'https://abc123.ngrok-free.app')
  // Leave empty to use local IP
  const TUNNEL_URL = 'https://vesical-superloyally-reese.ngrok-free.dev'; // Your tunnel URL (without /api, will be added)
  
  // Option 2: Use local IP for same network testing
  const DEV_API_IP = 'http://127.0.0.1:4040'; // Local IP address (not full URL)
  const DEV_API_PORT = '5000';
  
  // Build development URL
  const devBaseUrl = TUNNEL_URL 
    ? `${TUNNEL_URL}/api`  // Use tunnel if set (add /api)
    : `http://${DEV_API_IP}:${DEV_API_PORT}/api`;  // Otherwise use local IP

  if (!__DEV__) {
    return PRODUCTION_API;
  }

  // Development URLs based on platform
  if (Platform.OS === 'android') {
    // For Android emulator, use 10.0.2.2 to access host machine
    // For physical Android device, use the actual IP address
    return devBaseUrl; // Using IP address for both emulator and physical device
  } else if (Platform.OS === 'ios') {
    // iOS simulator - use IP address for consistency
    return devBaseUrl;
  } else {
    // Web or other platforms - use IP address
    return devBaseUrl;
  }
};

const API_BASE_URL = getApiBaseUrl();

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
};

// API Service Class
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Get stored token
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Store tokens
  async storeTokens(accessToken: string, refreshToken: string, userData: any) {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Clear tokens
  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Make API request
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
      if (!response.ok) {
        // Allow parsing of the response body below then throw with the parsed message
      }

      // Some endpoints or error responses may not return JSON.
      // Try parsing JSON first; if that fails, fall back to text and provide a readable error.
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          // Server set JSON content-type but returned invalid JSON (e.g., HTML/error page). Fallback to text.
          const text = await response.text();
          data = { __rawText: text };
        }
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          // Not JSON — keep raw text
          data = { __rawText: text };
        }
      }

      if (!response.ok) {
        const message = (data && data.message) || data?.__rawText || `Request failed with status ${response.status}`;
        const detailed = `${message} — URL: ${this.baseUrl}${endpoint} — Status: ${response.status}`;
        throw new Error(detailed);
      }

      return data;
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Provide more helpful error messages
      if (error.message === 'Network request failed' || error.message?.includes('Network')) {
        const helpfulMessage = __DEV__ 
          ? `Network request failed. Make sure:\n1. Backend server is running on port 5000\n2. For Android emulator: using 10.0.2.2:5000\n3. For physical device: use your computer's IP address\n\nCurrent URL: ${this.baseUrl}${endpoint}`
          : 'Network request failed. Please check your internet connection.';
        throw new Error(helpfulMessage);
      }
      
      throw error;
    }
  }

  // Auth APIs
  async sendOTP(phoneNumber: string) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async verifyOTP(phoneNumber: string, otp: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
  }

  // User APIs
  async updateProfile(userId: string, profileData: any) {
    // Use /me endpoint if updating own profile, otherwise use /users/:id
    if (userId) {
      return this.request(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    }
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getUserProfile(userId?: string) {
    if (userId) {
      return this.request(`/users/${userId}`);
    }
    return this.request('/users/me');
  }

  // Ride APIs
  async getRides(filters?: { elderId?: string; driverId?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.elderId) queryParams.append('elderId', filters.elderId);
    if (filters?.driverId) queryParams.append('driverId', filters.driverId);
    if (filters?.status) queryParams.append('status', filters.status);
    
    const query = queryParams.toString();
    return this.request(`/rides${query ? `?${query}` : ''}`);
  }

  async createRide(rideData: any) {
    return this.request('/rides', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
  }

  async updateRideStatus(rideId: string, status: string) {
    return this.request(`/rides/${rideId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Schedule APIs
  async getSchedules(filters?: { elderId?: string; familyId?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.elderId) queryParams.append('elderId', filters.elderId);
    if (filters?.familyId) queryParams.append('familyId', filters.familyId);
    
    const query = queryParams.toString();
    return this.request(`/schedules${query ? `?${query}` : ''}`);
  }

  async createSchedule(scheduleData: any) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateSchedule(scheduleId: string, scheduleData: any) {
    return this.request(`/schedules/${scheduleId}`, {
      method: 'PATCH',
      body: JSON.stringify(scheduleData),
    });
  }

  async deleteSchedule(scheduleId: string) {
    return this.request(`/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiService();
export default apiClient;

