// app/Driver/dash.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Footer from "../Footer/DriverFooter";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPut, ApiError } from "@/services/api";
import * as Location from "expo-location";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

interface Schedule {
  _id: string;
  title: string;
  time: string;
  date: string;
  fromLocation?: string;
  toLocation?: string;
  elderId?: any;
  status?: string;
}

interface Ride {
  _id: string;
  scheduleId: string;
  elderId: string;
  driverId: string;
  familyId: string;
  pickupLocation: string;
  dropLocation: string;
  scheduledTime: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export default function DriverDash() {
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [acceptedRides, setAcceptedRides] = useState<Ride[]>([]);
  const [inProgressRides, setInProgressRides] = useState<Ride[]>([]);
  const [reminderShown, setReminderShown] = useState<Set<string>>(new Set());
  const [scheduleRidesMap, setScheduleRidesMap] = useState<Map<string, Ride>>(new Map());
  const lastSchedulesMapRef = useRef<Map<string, string>>(new Map());
  const previousRideIdsRef = useRef<Set<string>>(new Set());
  const lastFetchTimeRef = useRef<{ schedules: number; rides: number }>({ schedules: 0, rides: 0 });
  const activeRideIdRef = useRef<string | null>(null);
  const locationUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const FETCH_COOLDOWN = 2000; // 2 seconds cooldown between fetches

  // Load driver data from database
  useEffect(() => {
    const loadDriverData = async () => {
      try {
        setLoading(true);
        // First try to get from AsyncStorage
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        }
        
        // Also fetch latest from API to ensure we have current data
        try {
          const response = await apiGet<{ user: any }>('/users/me');
          if (response.user) {
            setUser(response.user);
            await AsyncStorage.setItem('user', JSON.stringify(response.user));
          }
        } catch (apiError) {
          console.error('Error fetching user from API:', apiError);
          // Continue with AsyncStorage data if API fails
        }
      } catch (error) {
        console.error('Error loading driver data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDriverData();
  }, []);

  // Fetch schedules assigned to this driver
  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    
    // Rate limiting: Don't fetch if last fetch was too recent
    const now = Date.now();
    if (now - lastFetchTimeRef.current.schedules < FETCH_COOLDOWN) {
      console.log('Skipping schedules fetch - too soon after last fetch');
      return;
    }
    lastFetchTimeRef.current.schedules = now;
    
    try {
      setSchedulesLoading(true);
      const response = await apiGet<{ schedules: Schedule[] }>('/schedules');
      
      // Get today's and upcoming schedules
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      
      const upcomingSchedules = (response.schedules || [])
        .filter((schedule: Schedule) => {
          if (!schedule.date) return false;
          // Only show confirmed schedules (driver has accepted)
          // Exclude completed and cancelled schedules
          if (schedule.status === 'completed' || schedule.status === 'cancelled') return false;
          if (schedule.status !== 'confirmed') return false;
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= new Date(today.setHours(0, 0, 0, 0));
        })
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() === dateB.getTime()) {
            return a.time.localeCompare(b.time);
          }
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5); // Show only next 5 schedules
      
      // Check for deleted schedules (schedule was there before, now missing)
      const currentScheduleIds = new Set(upcomingSchedules.map(s => s._id));
      const deletedSchedules: string[] = [];
      
      lastSchedulesMapRef.current.forEach((scheduleTitle, scheduleId) => {
        if (!currentScheduleIds.has(scheduleId)) {
          deletedSchedules.push(scheduleTitle);
        }
      });
      
      // Show alert for deleted schedules
      if (deletedSchedules.length > 0) {
        Alert.alert(
          "❌ Schedule Cancelled",
          `The schedule "${deletedSchedules[0]}" has been cancelled by the family/elder. The associated ride has been cancelled.`,
          [{ text: "OK" }]
        );
      }
      
      // Update last schedules map ref
      const newSchedulesMap = new Map<string, string>();
      upcomingSchedules.forEach((schedule) => {
        newSchedulesMap.set(schedule._id, schedule.title);
      });
      lastSchedulesMapRef.current = newSchedulesMap;
      
      setSchedules(upcomingSchedules);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      // Handle rate limiting error gracefully
      if (error.status === 429) {
        console.warn('Rate limit reached for schedules fetch, will retry later');
        // Don't show alert for rate limiting - just log it
      } else {
        Alert.alert("Error", error.message || "Failed to load schedules. Please try again.");
      }
    } finally {
      setSchedulesLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Fetch rides assigned to this driver
  const fetchRides = useCallback(async () => {
    if (!user) return;
    
    // Rate limiting: Don't fetch if last fetch was too recent
    const now = Date.now();
    if (now - lastFetchTimeRef.current.rides < FETCH_COOLDOWN) {
      console.log('Skipping rides fetch - too soon after last fetch');
      return;
    }
    lastFetchTimeRef.current.rides = now;
    
    try {
      setRidesLoading(true);
      // Fetch pending rides
      const pendingResponse = await apiGet<{ rides: Ride[] }>('/api/rides?status=pending');
      
      // Fetch accepted rides for pickup confirmation
      const acceptedResponse = await apiGet<{ rides: Ride[] }>('/api/rides?status=accepted');
      
      // Fetch in_progress rides (active rides that need location tracking)
      const inProgressResponse = await apiGet<{ rides: Ride[] }>('/api/rides?status=in_progress');
      
      // Sort by scheduled time
      const sortedPendingRides = (pendingResponse.rides || [])
        .sort((a, b) => {
          const timeA = new Date(a.scheduledTime).getTime();
          const timeB = new Date(b.scheduledTime).getTime();
          return timeA - timeB;
        })
        .slice(0, 10); // Show only next 10 rides
      
      const sortedAcceptedRides = (acceptedResponse.rides || [])
        .sort((a, b) => {
          const timeA = new Date(a.scheduledTime).getTime();
          const timeB = new Date(b.scheduledTime).getTime();
          return timeA - timeB;
        });
      
      // If there's an in_progress ride, start location tracking
      const inProgressRidesList = inProgressResponse.rides || [];
      const driverInProgressRides = inProgressRidesList.filter(
        (r: Ride) => r.driverId?.toString() === user?._id?.toString()
      );
      setInProgressRides(driverInProgressRides);
      
      const activeInProgressRide = driverInProgressRides[0]; // Get first in-progress ride
      
      // Check if currently tracked ride is still in progress
      if (activeRideIdRef.current) {
        const isStillInProgress = driverInProgressRides.some(
          (r: Ride) => r._id === activeRideIdRef.current
        );
        if (!isStillInProgress) {
          // Currently tracked ride is no longer in progress (completed/cancelled), stop tracking
          stopLocationTracking();
        }
      }
      
      if (activeInProgressRide && activeInProgressRide._id !== activeRideIdRef.current) {
        startLocationTracking(activeInProgressRide._id);
      } else if (!activeInProgressRide && activeRideIdRef.current) {
        // No active ride, stop tracking
        stopLocationTracking();
      }
      
      // Check for cancelled rides (ride was accepted/pending before, now cancelled or missing)
      const currentRideIds = new Set([
        ...sortedPendingRides.map(r => r._id),
        ...sortedAcceptedRides.map(r => r._id)
      ]);
      
      // Find rides that were active before but are now missing (likely cancelled)
      if (previousRideIdsRef.current.size > 0) {
        const missingRideIds = Array.from(previousRideIdsRef.current).filter(id => !currentRideIds.has(id));
        
        if (missingRideIds.length > 0) {
          // Fetch all rides to check if they were cancelled
          try {
            const allRidesResponse = await apiGet<{ rides: Ride[] }>('/api/rides');
            const allRides = allRidesResponse.rides || [];
            const cancelledRides = allRides.filter((ride: Ride) => 
              missingRideIds.includes(ride._id) && 
              ride.status === 'cancelled' &&
              (ride.driverId?.toString() === user?._id?.toString())
            );
            
            if (cancelledRides.length > 0) {
              Alert.alert(
                "❌ Ride Cancelled",
                `A ride has been cancelled. The family/elder has deleted the schedule.`,
                [{ text: "OK" }]
              );
            }
          } catch (error) {
            console.error('Error checking cancelled rides:', error);
          }
        }
      }
      
      // Update previous ride IDs ref
      previousRideIdsRef.current = currentRideIds;
      
      setRides(sortedPendingRides);
      setAcceptedRides(sortedAcceptedRides);
      
      // Create a map of scheduleId to accepted ride for easy lookup
      const scheduleToRideMap = new Map<string, Ride>();
      sortedAcceptedRides.forEach((ride) => {
        scheduleToRideMap.set(ride.scheduleId, ride);
      });
      setScheduleRidesMap(scheduleToRideMap);
    } catch (error: any) {
      console.error('Error fetching rides:', error);
      // Handle rate limiting error gracefully
      if (error.status === 429) {
        console.warn('Rate limit reached for rides fetch, will retry later');
        // Don't show alert for rate limiting - just log it
      }
      // Don't show alert for other errors either, just log
    } finally {
      setRidesLoading(false);
    }
  }, [user]);

  // Accept ride function
  const handleAcceptRide = async (rideId: string) => {
    const ride = rides.find(r => r._id === rideId);
    try {
      setProcessing(rideId);
      const response = await apiPut<{ message: string; ride: Ride }>(
        `/api/rides/${rideId}/accept`
      );
      
      // Update local state
      setRides((prevRides) =>
        prevRides.map((ride) =>
          ride._id === rideId ? { ...ride, status: "accepted" } : ride
        )
      );
      
      // Show detailed success message
      const rideDetails = ride ? 
        `\n\n📍 Pickup: ${ride.pickupLocation}\n📍 Drop: ${ride.dropLocation}\n🕐 Time: ${formatTime(ride.scheduledTime)}` 
        : '';
      
      Alert.alert(
        "Ride Accepted ✅", 
        `${response.message || "You have accepted the ride."}${rideDetails}\n\nSchedule has been confirmed.`,
        [{ text: "OK" }]
      );
      // Refresh rides to get updated list
      fetchRides();
      fetchSchedules();
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Error",
        apiError.message || "Failed to accept ride. Please try again."
      );
      console.error("Error accepting ride:", error);
    } finally {
      setProcessing(null);
    }
  };

  // Decline ride function
  const handleDeclineRide = async (rideId: string) => {
    const ride = rides.find(r => r._id === rideId);
    try {
      setProcessing(rideId);
      
      // Show confirmation dialog before declining
      Alert.alert(
        "Decline Ride Request",
        ride 
          ? `Are you sure you want to decline this ride?\n\n📍 From: ${ride.pickupLocation}\n📍 To: ${ride.dropLocation}\n🕐 Time: ${formatTime(ride.scheduledTime)}`
          : "Are you sure you want to decline this ride?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setProcessing(null)
          },
          {
            text: "Decline",
            style: "destructive",
            onPress: async () => {
              try {
                const response = await apiPut<{ message: string; ride: Ride }>(
                  `/api/rides/${rideId}/decline`
                );
                
                // Remove from local state
                setRides((prevRides) => prevRides.filter((ride) => ride._id !== rideId));
                
                // Show detailed decline message
                const declineMessage = ride
                  ? `You have declined the ride request.\n\n📍 Pickup: ${ride.pickupLocation}\n📍 Drop: ${ride.dropLocation}\n🕐 Time: ${formatTime(ride.scheduledTime)}\n\nThe family has been notified.`
                  : response.message || "You have declined the ride.";
                
                Alert.alert("Ride Declined ❌", declineMessage);
                // Refresh rides
                fetchRides();
              } catch (declineError) {
                const apiError = declineError as ApiError;
                Alert.alert(
                  "Error",
                  apiError.message || "Failed to decline ride. Please try again."
                );
                setProcessing(null);
              }
            }
          }
        ]
      );
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Error",
        apiError.message || "Failed to decline ride. Please try again."
      );
      console.error("Error declining ride:", error);
      setProcessing(null);
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  // Update driver location during ride
  const updateDriverLocation = async (rideId: string) => {
    try {
      // Check if ride is still active before updating
      if (activeRideIdRef.current !== rideId) {
        return; // Ride changed, stop updating
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const heading = location.coords.heading || 0;

      await apiPut(`/api/rides/${rideId}/location`, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: heading,
      });
    } catch (error: any) {
      // Silently handle rate limit errors - don't spam console
      if (error?.status === 429) {
        // Rate limit exceeded - will retry on next interval
        return;
      }
      
      // If ride is completed or cancelled, stop tracking silently
      if (error?.status === 400) {
        const errorMessage = error?.data?.error || error?.message || '';
        if (errorMessage.includes('completed') || errorMessage.includes('must be in progress')) {
          // Ride is completed, stop tracking
          stopLocationTracking();
          return;
        }
      }
      
      // Only log other errors (not rate limit or completed ride)
      if (error?.status !== 400) {
        console.error('Error updating driver location:', error);
      }
    }
  };

  // Start location tracking for active ride
  const startLocationTracking = (rideId: string) => {
    // Clear any existing interval
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    activeRideIdRef.current = rideId;
    
    // Update immediately
    updateDriverLocation(rideId);
    
    // Then update every 15 seconds (to avoid rate limiting)
    // Rate limit: 120 requests per 15 minutes = ~8 per minute
    // 15 seconds = 4 per minute, which is well within limits
    locationUpdateIntervalRef.current = setInterval(() => {
      if (activeRideIdRef.current === rideId) {
        updateDriverLocation(rideId);
      } else {
        // Ride changed, stop this interval
        stopLocationTracking();
      }
    }, 15000); // 15 seconds interval for better rate limit compliance
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
    activeRideIdRef.current = null;
  };

  // Complete ride (confirm drop) function
  const handleCompleteRide = async (rideId: string) => {
    const ride = inProgressRides.find(r => r._id === rideId);
    try {
      setProcessing(rideId);
      
      const response = await apiPut<{ message: string; ride: Ride }>(
        `/api/rides/${rideId}/complete`
      );
      
      // Stop location tracking
      stopLocationTracking();
      
      // Remove from in-progress rides
      setInProgressRides((prevRides) =>
        prevRides.filter((ride) => ride._id !== rideId)
      );
      
      // Remove completed schedule from local state immediately
      setSchedules((prevSchedules) => {
        const completedRide = inProgressRides.find(r => r._id === rideId);
        if (completedRide) {
          return prevSchedules.filter(s => s._id !== completedRide.scheduleId);
        }
        return prevSchedules;
      });
      
      // Also remove from scheduleRidesMap
      const completedRide = inProgressRides.find(r => r._id === rideId);
      if (completedRide) {
        setScheduleRidesMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.delete(completedRide.scheduleId);
          return newMap;
        });
      }
      
      Alert.alert(
        "Drop Confirmed ✅", 
        `${response.message || "Ride completed successfully!"}\n\nSchedule has been cleared. You can now accept new ride requests.`,
        [{ text: "OK" }]
      );
      
      // Refresh rides and schedules to show new assignments
      fetchRides();
      fetchSchedules();
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Error",
        apiError.message || "Failed to complete ride. Please try again."
      );
      console.error("Error completing ride:", error);
    } finally {
      setProcessing(null);
    }
  };

  // Confirm pickup function
  const handleConfirmPickup = async (rideId: string) => {
    const ride = acceptedRides.find(r => r._id === rideId);
    try {
      setProcessing(rideId);
      
      // Get current location before confirming
      const { status } = await Location.requestForegroundPermissionsAsync();
      let latitude: number | undefined;
      let longitude: number | undefined;
      let heading: number | undefined;

      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
          heading = location.coords.heading || 0;
        } catch (locError) {
          console.error('Error getting location:', locError);
        }
      }

      const response = await apiPut<{ message: string; ride: Ride }>(
        `/api/rides/${rideId}/pickup`,
        latitude && longitude ? { latitude, longitude, heading } : undefined
      );
      
      // Update local state
      setAcceptedRides((prevRides) =>
        prevRides.filter((ride) => ride._id !== rideId)
      );
      
      // Start location tracking
      startLocationTracking(rideId);
      
      Alert.alert(
        "Pickup Confirmed ✅", 
        `${response.message || "Pickup confirmed successfully."}\n\nElder and family members have been notified and can now track the ride in real-time.`,
        [
          { text: "View Route", onPress: () => {
            router.push({
              pathname: '/Driver/route-view',
              params: { rideId: rideId }
            });
          }},
          { text: "OK", style: "cancel" }
        ]
      );
      
      // Refresh rides
      fetchRides();
      fetchSchedules();
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Error",
        apiError.message || "Failed to confirm pickup. Please try again."
      );
      console.error("Error confirming pickup:", error);
    } finally {
      setProcessing(null);
    }
  };

  // Cleanup location tracking on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Check for 10-minute reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
      
      // Check accepted rides
      acceptedRides.forEach((ride) => {
        if (reminderShown.has(ride._id)) return;
        
        const scheduledTime = new Date(ride.scheduledTime);
        const timeDiff = scheduledTime.getTime() - now.getTime();
        
        // If scheduled time is within 10 minutes and not past
        if (timeDiff > 0 && timeDiff <= 10 * 60 * 1000) {
          const minutesUntil = Math.floor(timeDiff / (60 * 1000));
          Alert.alert(
            "⏰ Reminder: Ride Starting Soon",
            `You have a ride scheduled in ${minutesUntil} minute(s).\n\n📍 Pickup: ${ride.pickupLocation}\n📍 Drop: ${ride.dropLocation}\n🕐 Time: ${formatTime(ride.scheduledTime)}`,
            [{ text: "OK" }]
          );
          setReminderShown(prev => new Set(prev).add(ride._id));
        }
      });
      
      // Check schedules
      schedules.forEach((schedule) => {
        if (schedule.status !== 'confirmed') return;
        if (reminderShown.has(`schedule-${schedule._id}`)) return;
        
        try {
          const scheduleDate = new Date(schedule.date);
          const timeMatch = schedule.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toUpperCase();
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            
            scheduleDate.setHours(hour, minutes, 0, 0);
            const timeDiff = scheduleDate.getTime() - now.getTime();
            
            // If scheduled time is within 10 minutes and not past
            if (timeDiff > 0 && timeDiff <= 10 * 60 * 1000) {
              const minutesUntil = Math.floor(timeDiff / (60 * 1000));
              Alert.alert(
                "⏰ Reminder: Schedule Starting Soon",
                `You have a schedule in ${minutesUntil} minute(s).\n\n📅 ${schedule.title}\n📍 From: ${schedule.fromLocation}\n📍 To: ${schedule.toLocation}\n🕐 Time: ${schedule.time}`,
                [{ text: "OK" }]
              );
              setReminderShown(prev => new Set(prev).add(`schedule-${schedule._id}`));
            }
          }
        } catch (error) {
          console.error('Error checking schedule reminder:', error);
        }
      });
    };
    
    // Check every minute
    const interval = setInterval(checkReminders, 60 * 1000);
    checkReminders(); // Check immediately
    
    return () => clearInterval(interval);
  }, [acceptedRides, schedules, reminderShown]);

  // Load schedules and rides when user is loaded
  useEffect(() => {
    if (user) {
      fetchSchedules();
      fetchRides();
    }
  }, [user, fetchSchedules, fetchRides]);

  // Refresh schedules and rides when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSchedules();
        fetchRides();
      }
    }, [user, fetchSchedules, fetchRides])
  );

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003C1F" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#F6FFF6", "#CDEDC8"]} style={styles.gradient}>
        {/* Header */}
        <LinearGradient colors={["#0A3D2E", "#1B5E3F"]} style={styles.headerGradient}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.profileIconContainer}>
                <Image
                  source={{
                    uri: user?.profileImage || "https://cdn-icons-png.flaticon.com/512/847/847969.png",
                  }}
                  style={styles.profileIcon}
                />
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.nameText}>{user?.firstName || 'Driver'}!</Text>
                {user?.phoneNumber && (
                  <View style={styles.phoneContainer}>
                    <Ionicons name="call-outline" size={12} color="#CDEDC8" />
                    <Text style={styles.phoneText}>{user.phoneNumber}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity 
              style={styles.bellButton}
              onPress={() => router.push("/Call/DriverResponsePage")}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#0A3D2E"
              />
              {(schedules.filter(s => s.status === 'pending').length > 0 || rides.length > 0) && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {schedules.filter(s => s.status === 'pending').length + rides.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchSchedules();
                fetchRides();
              }}
            />
          }
        >
          {/* In Progress Rides - Ready for Drop Confirmation */}
          {inProgressRides.length > 0 && (
            <View style={styles.schedulesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="car-sport" size={24} color="#2196F3" />
                  <Text style={styles.sectionTitle}>In Progress</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{inProgressRides.length}</Text>
                </View>
              </View>
              {ridesLoading ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="small" color="#0A3D2E" />
                </View>
              ) : (
                inProgressRides.map((ride) => (
                  <LinearGradient
                    key={ride._id}
                    colors={["#FFFFFF", "#E3F2FD"]}
                    style={styles.rideCard}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="car-outline" size={22} color="#2196F3" />
                        </View>
                        <Text style={styles.cardTitle}>Ride In Progress</Text>
                      </View>
                      <View style={styles.inProgressBadge}>
                        <Ionicons name="navigate" size={16} color="white" />
                        <Text style={styles.inProgressBadgeText}>IN PROGRESS</Text>
                      </View>
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                          <Ionicons name="time" size={18} color="#0A3D2E" />
                        </View>
                        <Text style={styles.infoText}>
                          {formatTime(ride.scheduledTime)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, styles.pickupIcon]}>
                          <Ionicons name="location" size={18} color="#4CAF50" />
                        </View>
                        <View style={styles.locationContainer}>
                          <Text style={styles.locationLabel}>Pickup</Text>
                          <Text style={styles.locationText} numberOfLines={2}>
                            {ride.pickupLocation}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, styles.dropIcon]}>
                          <Ionicons name="location" size={18} color="#F44336" />
                        </View>
                        <View style={styles.locationContainer}>
                          <Text style={styles.locationLabel}>Drop-off</Text>
                          <Text style={styles.locationText} numberOfLines={2}>
                            {ride.dropLocation}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[
                            styles.completeRideButton,
                            processing === ride._id && styles.buttonDisabled,
                          ]}
                          onPress={() => handleCompleteRide(ride._id)}
                          disabled={processing === ride._id}
                        >
                          {processing === ride._id ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-done-circle" size={20} color="white" />
                              <Text style={styles.completeRideButtonText}>Confirm Drop</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.viewRouteButton}
                          onPress={() => {
                            router.push({
                              pathname: '/Driver/route-view',
                              params: { rideId: ride._id }
                            });
                          }}
                        >
                          <Ionicons name="map-outline" size={20} color="white" />
                          <Text style={styles.viewRouteButtonText}>View Route</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                ))
              )}
            </View>
          )}

          {/* Accepted Rides - Ready for Pickup */}
          {acceptedRides.length > 0 && (
            <View style={styles.schedulesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.sectionTitle}>Ready for Pickup</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{acceptedRides.length}</Text>
                </View>
              </View>
              {ridesLoading ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="small" color="#0A3D2E" />
                </View>
              ) : (
                acceptedRides.map((ride) => (
                  <LinearGradient
                    key={ride._id}
                    colors={["#FFFFFF", "#F0FDF4"]}
                    style={styles.rideCard}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="car-outline" size={22} color="#10B981" />
                        </View>
                        <Text style={styles.cardTitle}>Accepted Ride</Text>
                      </View>
                      <View style={styles.acceptedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="white" />
                        <Text style={styles.acceptedBadgeText}>Accepted</Text>
                      </View>
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                          <Ionicons name="time" size={18} color="#0A3D2E" />
                        </View>
                        <Text style={styles.infoText}>
                          {formatTime(ride.scheduledTime)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, styles.pickupIcon]}>
                          <Ionicons name="location" size={18} color="#4CAF50" />
                        </View>
                        <View style={styles.locationContainer}>
                          <Text style={styles.locationLabel}>Pickup</Text>
                          <Text style={styles.locationText} numberOfLines={2}>
                            {ride.pickupLocation}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, styles.dropIcon]}>
                          <Ionicons name="location" size={18} color="#F44336" />
                        </View>
                        <View style={styles.locationContainer}>
                          <Text style={styles.locationLabel}>Drop</Text>
                          <Text style={styles.locationText} numberOfLines={2}>
                            {ride.dropLocation}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[
                            styles.confirmPickupButton,
                            processing === ride._id && styles.buttonDisabled,
                          ]}
                          onPress={() => handleConfirmPickup(ride._id)}
                          disabled={processing === ride._id}
                        >
                          {processing === ride._id ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle" size={20} color="white" />
                              <Text style={styles.confirmPickupButtonText}>Confirm Pickup</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.viewRouteButton}
                          onPress={() => {
                            router.push({
                              pathname: '/Driver/route-view',
                              params: { rideId: ride._id }
                            });
                          }}
                        >
                          <Ionicons name="map-outline" size={20} color="white" />
                          <Text style={styles.viewRouteButtonText}>View Route</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                ))
              )}
            </View>
          )}

          {/* Ride Requests Section */}
          {rides.length > 0 && (
            <View style={styles.schedulesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="car-sport" size={24} color="#0A3D2E" />
                  <Text style={styles.sectionTitle}>Ride Requests</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{rides.length}</Text>
                </View>
              </View>
              {ridesLoading ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="small" color="#0A3D2E" />
                </View>
              ) : (
                rides.map((ride) => (
                  <LinearGradient
                    key={ride._id}
                    colors={ride.status === 'pending' ? ["#FFFFFF", "#F0FDF4"] : ["#FFFFFF", "#F0F9FF"]}
                    style={styles.rideCard}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="car-outline" size={22} color="#0A3D2E" />
                        </View>
                        <Text style={styles.cardTitle}>Ride Request</Text>
                      </View>
                      {ride.status === 'pending' && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                          <Ionicons name="time" size={18} color="#0A3D2E" />
                        </View>
                        <Text style={styles.infoText}>
                          {formatTime(ride.scheduledTime)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, styles.pickupIcon]}>
                          <Ionicons name="location" size={18} color="#4CAF50" />
                        </View>
                        <View style={styles.locationContainer}>
                          <Text style={styles.locationLabel}>Pickup</Text>
                          <Text style={styles.locationText} numberOfLines={2}>
                            {ride.pickupLocation}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, styles.dropIcon]}>
                          <Ionicons name="location" size={18} color="#F44336" />
                        </View>
                        <View style={styles.locationContainer}>
                          <Text style={styles.locationLabel}>Drop</Text>
                          <Text style={styles.locationText} numberOfLines={2}>
                            {ride.dropLocation}
                          </Text>
                        </View>
                      </View>
                      {ride.status === "pending" && (
                        <View style={styles.buttonRow}>
                          <TouchableOpacity
                            style={[
                              styles.acceptButton,
                              processing === ride._id && styles.buttonDisabled,
                            ]}
                            onPress={() => handleAcceptRide(ride._id)}
                            disabled={processing === ride._id}
                          >
                            {processing === ride._id ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={18} color="white" />
                                <Text style={styles.buttonText}>Accept</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.declineButton,
                              processing === ride._id && styles.buttonDisabled,
                            ]}
                            onPress={() => handleDeclineRide(ride._id)}
                            disabled={processing === ride._id}
                          >
                            {processing === ride._id ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Ionicons name="close-circle" size={18} color="white" />
                                <Text style={styles.buttonText}>Decline</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                      {ride.status === "accepted" && (
                        <View style={styles.acceptedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="white" />
                          <Text style={styles.acceptedBadgeText}>Accepted</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                ))
              )}
            </View>
          )}

          {/* New Schedule Notifications */}
          {schedules.length > 0 && (
            <View style={styles.schedulesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="calendar" size={24} color="#0A3D2E" />
                  <Text style={styles.sectionTitle}>Your Assigned Schedules</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{schedules.length}</Text>
                </View>
              </View>
              {schedulesLoading ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="small" color="#0A3D2E" />
                </View>
              ) : (
                schedules.map((schedule) => (
                  <LinearGradient
                    key={schedule._id}
                    colors={["#FFFFFF", "#F0FDF4"]}
                    style={styles.scheduleCard}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="calendar-outline" size={22} color="#0A3D2E" />
                        </View>
                        <Text style={styles.cardTitle}>{schedule.title}</Text>
                      </View>
                      {schedule.status === 'confirmed' && (
                        <View style={styles.confirmedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="white" />
                          <Text style={styles.confirmedBadgeText}>CONFIRMED</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                          <Ionicons name="time" size={18} color="#0A3D2E" />
                        </View>
                        <Text style={styles.infoText}>
                          {new Date(schedule.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} at {schedule.time}
                        </Text>
                      </View>
                      {schedule.fromLocation && (
                        <View style={styles.infoRow}>
                          <View style={[styles.infoIcon, styles.pickupIcon]}>
                            <Ionicons name="location" size={18} color="#4CAF50" />
                          </View>
                          <View style={styles.locationContainer}>
                            <Text style={styles.locationLabel}>From</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                              {schedule.fromLocation}
                            </Text>
                          </View>
                        </View>
                      )}
                      {schedule.toLocation && (
                        <View style={styles.infoRow}>
                          <View style={[styles.infoIcon, styles.dropIcon]}>
                            <Ionicons name="location" size={18} color="#F44336" />
                          </View>
                          <View style={styles.locationContainer}>
                            <Text style={styles.locationLabel}>To</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                              {schedule.toLocation}
                            </Text>
                          </View>
                        </View>
                      )}
                      {/* Show Confirm Pickup button for confirmed schedules with accepted rides */}
                      {schedule.status === 'confirmed' && scheduleRidesMap.has(schedule._id) && (
                        <View style={styles.buttonRow}>
                          <TouchableOpacity
                            style={[
                              styles.confirmPickupButton,
                              processing === scheduleRidesMap.get(schedule._id)?._id && styles.buttonDisabled,
                            ]}
                            onPress={() => {
                              const ride = scheduleRidesMap.get(schedule._id);
                              if (ride) {
                                handleConfirmPickup(ride._id);
                              }
                            }}
                            disabled={processing === scheduleRidesMap.get(schedule._id)?._id}
                          >
                            {processing === scheduleRidesMap.get(schedule._id)?._id ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={20} color="white" />
                                <Text style={styles.confirmPickupButtonText}>Confirm Pickup</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          {scheduleRidesMap.get(schedule._id) && (
                            <TouchableOpacity
                              style={styles.viewRouteButton}
                              onPress={() => {
                                const ride = scheduleRidesMap.get(schedule._id);
                                if (ride) {
                                  router.push({
                                    pathname: '/Driver/route-view',
                                    params: { rideId: ride._id }
                                  });
                                }
                              }}
                            >
                              <Ionicons name="map-outline" size={20} color="white" />
                              <Text style={styles.viewRouteButtonText}>View Route</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                ))
              )}
              {!schedulesLoading && schedules.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.emptyText}>No schedules assigned yet</Text>
                </View>
              )}
            </View>
          )}

          {/* Call Icon */}
          <View style={styles.callSection}>
            <TouchableOpacity
              style={styles.callIconContainer}
              onPress={() => router.push("//Call/contactList")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#0A3D2E", "#1B5E3F"]}
                style={styles.callIconGradient}
              >
                <Ionicons name="call" size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.callLabel}>Contacts</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Footer />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: "space-between" },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  userInfo: { 
    flexDirection: "row", 
    alignItems: "center",
    flex: 1,
  },
  profileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    padding: 3,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIcon: { 
    width: "100%", 
    height: "100%", 
    borderRadius: 27,
  },
  userTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "#CDEDC8",
    fontFamily: "ArimaMadurai_400Regular",
    marginBottom: 2,
  },
  nameText: {
    fontSize: 22,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    color: "#CDEDC8",
    fontFamily: "ArimaMadurai_400Regular",
  },
  bellButton: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 30,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF5722",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "ArimaMadurai_700Bold",
  },
  body: { flex: 1 },
  bodyContent: {
    padding: 20,
    paddingTop: 10,
  },
  schedulesSection: {
    width: "100%",
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#0A3D2E",
  },
  countBadge: {
    backgroundColor: "#0A3D2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 32,
    alignItems: "center",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "ArimaMadurai_700Bold",
  },
  loadingWrapper: {
    paddingVertical: 30,
    alignItems: "center",
  },
  scheduleCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rideCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#0A3D2E",
    flex: 1,
  },
  newBadge: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "ArimaMadurai_700Bold",
    letterSpacing: 0.5,
  },
  confirmedBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  confirmedBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "ArimaMadurai_700Bold",
    letterSpacing: 0.5,
  },
  cardBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  pickupIcon: {
    backgroundColor: "#F0FDF4",
  },
  dropIcon: {
    backgroundColor: "#FEF2F2",
  },
  infoText: {
    fontSize: 15,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#374151",
    flex: 1,
    lineHeight: 22,
  },
  locationContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#6B7280",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 15,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#111827",
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 12,
  },
  acceptButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  declineButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
    fontFamily: "ArimaMadurai_700Bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptedBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  acceptedBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "ArimaMadurai_700Bold",
  },
  confirmPickupButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    flex: 1,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmPickupButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "ArimaMadurai_700Bold",
  },
  viewRouteButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    marginLeft: 8,
    flex: 1,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewRouteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "ArimaMadurai_700Bold",
  },
  completeRideButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    flex: 1,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completeRideButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "ArimaMadurai_700Bold",
  },
  inProgressBadge: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inProgressBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "ArimaMadurai_700Bold",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontFamily: "ArimaMadurai_400Regular",
    textAlign: "center",
    marginTop: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: "#888",
    fontFamily: "ArimaMadurai_400Regular",
    marginBottom: 20,
  },
  callSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  callIconContainer: {
    borderRadius: 35,
    shadowColor: "#0A3D2E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  callIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  callLabel: {
    fontSize: 16,
    color: "#0A3D2E",
    marginTop: 12,
    fontFamily: "ArimaMadurai_700Bold",
  },
  footerContainer: { width: "100%" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6FFF6",
  },
});
