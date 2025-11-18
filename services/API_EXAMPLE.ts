/**
 * API Usage Examples
 * 
 * This file shows how to use the API service in your components.
 * Copy these patterns into your actual component files.
 */

import { apiGet, apiPost, apiPut, apiDelete, checkApiHealth } from './api';
import { API_BASE_URL, getApiConfig } from '@/constants/API';

// ============================================
// Example 1: Health Check
// ============================================
export async function checkBackendHealth() {
  try {
    const isHealthy = await checkApiHealth();
    console.log('Backend is healthy:', isHealthy);
    return isHealthy;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

// ============================================
// Example 2: Authentication - Send OTP
// ============================================
export async function sendOTP(phoneNumber: string) {
  try {
    const response = await apiPost('/otp/send', {
      phone: phoneNumber,
    });
    return response;
  } catch (error: any) {
    console.error('OTP send error:', error);
    throw error;
  }
}

// ============================================
// Example 3: Authentication - Verify OTP
// ============================================
export async function verifyOTP(phoneNumber: string, otpCode: string) {
  try {
    const response = await apiPost('/otp/verify', {
      phone: phoneNumber,
      otp: otpCode,
    });
    return response;
  } catch (error: any) {
    console.error('OTP verify error:', error);
    throw error;
  }
}

// ============================================
// Example 4: Get User Profile
// ============================================
export async function getUserProfile(userId: string) {
  try {
    const response = await apiGet(`/users/${userId}`);
    return response;
  } catch (error: any) {
    console.error('Get user profile error:', error);
    throw error;
  }
}

// ============================================
// Example 5: Update User Profile
// ============================================
export async function updateUserProfile(userId: string, profileData: any) {
  try {
    const response = await apiPut(`/users/${userId}`, profileData);
    return response;
  } catch (error: any) {
    console.error('Update user profile error:', error);
    throw error;
  }
}

// ============================================
// Example 6: Get Schedules
// ============================================
export async function getSchedules(userId: string) {
  try {
    const response = await apiGet(`/schedules?userId=${userId}`);
    return response;
  } catch (error: any) {
    console.error('Get schedules error:', error);
    throw error;
  }
}

// ============================================
// Example 7: Create Schedule
// ============================================
export async function createSchedule(scheduleData: any) {
  try {
    const response = await apiPost('/schedules', scheduleData);
    return response;
  } catch (error: any) {
    console.error('Create schedule error:', error);
    throw error;
  }
}

// ============================================
// Example 8: Delete Schedule
// ============================================
export async function deleteSchedule(scheduleId: string) {
  try {
    const response = await apiDelete(`/schedules/${scheduleId}`);
    return response;
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    throw error;
  }
}

// ============================================
// Example 9: Using in a React Component
// ============================================
/*
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { sendOTP, verifyOTP } from '@/services/API_EXAMPLE';
import { getApiConfig } from '@/constants/API';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [apiConfig, setApiConfig] = useState(getApiConfig());

  useEffect(() => {
    // Log API configuration on mount
    console.log('API Config:', apiConfig);
  }, []);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const response = await sendOTP('+94771234567');
      console.log('OTP sent:', response);
      // Handle success
    } catch (error: any) {
      console.error('Failed to send OTP:', error.message);
      // Handle error (show alert, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>API Base: {apiConfig.apiBaseUrl}</Text>
      <Text>Using Tunnel: {apiConfig.isUsingTunnel ? 'Yes' : 'No'}</Text>
      <Button title="Send OTP" onPress={handleSendOTP} disabled={loading} />
    </View>
  );
}
*/

// ============================================
// Example 10: Debug API Configuration
// ============================================
export function logApiConfiguration() {
  const config = getApiConfig();
  console.log('📡 API Configuration:');
  console.log('  Base URL:', config.apiBaseUrl);
  console.log('  Using Tunnel:', config.isUsingTunnel ? '✅ Yes' : '❌ No');
  console.log('  Tunnel URL:', config.tunnelUrl || 'Not set');
  console.log('  Dev API IP:', config.devApiIp);
  console.log('  Dev API Port:', config.devApiPort);
}

