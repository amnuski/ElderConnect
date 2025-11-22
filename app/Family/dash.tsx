// app/Family/dash.tsx
import { ArimaMadurai_400Regular, ArimaMadurai_700Bold, useFonts } from "@expo-google-fonts/arima-madurai";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Footer from "../Footer/footer";
import { useRouter, useFocusEffect } from "expo-router";
import { apiGet, apiDelete } from "@/services/api";
import scheduleEventEmitter from "./scheduleEventEmitter";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface Activity {
  _id: string;
  title: string;
  time: string;
  date: string;
  fromLocation?: string;
  toLocation?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  status?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [lastRideStatuses, setLastRideStatuses] = useState<Map<string, string>>(new Map());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [lastRideStatusesMap, setLastRideStatusesMap] = useState<Map<string, string>>(new Map());
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_COOLDOWN = 2000; // 2 seconds cooldown between fetches

  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  // Load user data from database
  useEffect(() => {
    const loadUser = async () => {
      try {
        // First try to get from AsyncStorage
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        }
        
        // Also fetch latest from API to ensure we have current data from database
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
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // Fetch schedules and check ride status changes
  const fetchSchedules = async () => {
    try {
      if (!user) return;
      
      // Rate limiting: Don't fetch if last fetch was too recent
      const now = Date.now();
      if (now - lastFetchTimeRef.current < FETCH_COOLDOWN) {
        console.log('Skipping fetch - too soon after last fetch');
        return;
      }
      lastFetchTimeRef.current = now;

      const response = await apiGet<{ schedules: any[] }>('/schedules');
      
      // Also fetch rides to check for pickup confirmation (only if needed)
      try {
        const ridesResponse = await apiGet<{ rides: any[] }>('/api/rides');
        const rides = ridesResponse.rides || [];
        
        // Check for rides that changed from accepted to in_progress (pickup confirmed)
        rides.forEach((ride: any) => {
          const lastStatus = lastRideStatusesMap.get(ride._id);
          if (lastStatus === 'accepted' && ride.status === 'in_progress') {
            // Pickup confirmed - show notification and auto-open track ride
            const notification = {
              id: `pickup-confirmed-${ride._id}-${Date.now()}`,
              type: 'pickup',
              title: '🚗 Pickup Confirmed',
              message: `Driver has confirmed pickup. You can now track the ride.`,
              rideId: ride._id,
              scheduleId: ride.scheduleId,
              timestamp: new Date(),
            };
            setNotifications(prev => [notification, ...prev].slice(0, 50));
            
            Alert.alert(
              "🚗 Pickup Confirmed",
              "Driver has confirmed pickup. Opening track ride...",
              [
                {
                  text: "Track Ride",
                  onPress: () => {
                    router.push('/Family/track-ride');
                  }
                },
                { text: "OK", style: "cancel" }
              ]
            );
            
            // Auto-open track ride after a short delay
            setTimeout(() => {
              router.push('/Family/track-ride');
            }, 1000);
          }
        });
        
        // Update last ride statuses
        const newRideStatusMap = new Map<string, string>();
        rides.forEach((ride: any) => {
          newRideStatusMap.set(ride._id, ride.status);
        });
        setLastRideStatusesMap(newRideStatusMap);
      } catch (ridesError: any) {
        console.error('Error fetching rides:', ridesError);
        // Don't show alert for rate limiting in background fetch
        if (ridesError.status === 429) {
          console.warn('Rate limit reached for rides fetch, will retry later');
        }
      }
      
      // Filter today's schedules - normalize dates for comparison
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      
      const todaySchedules = (response.schedules || [])
        .filter((schedule: any) => {
          if (!schedule.date) return false;
          
          // Handle both ISO string and Date object
          const scheduleDate = new Date(schedule.date);
          const scheduleYear = scheduleDate.getFullYear();
          const scheduleMonth = scheduleDate.getMonth();
          const scheduleDay = scheduleDate.getDate();
          
          // Compare year, month, and day
          return (
            scheduleYear === todayYear &&
            scheduleMonth === todayMonth &&
            scheduleDay === todayDay
          );
        })
        .map((schedule: any) => ({
          _id: schedule._id,
          title: schedule.title,
          time: schedule.time,
          date: schedule.date,
          fromLocation: schedule.fromLocation,
          toLocation: schedule.toLocation,
          driverId: schedule.driverId,
          driverName: schedule.driverName,
          driverPhone: schedule.driverPhone,
          status: schedule.status,
        }))
        .sort((a, b) => {
          // Sort by time - handle both 12-hour and 24-hour format
          const timeA = a.time.toLowerCase().replace(/\s*(am|pm)/, '');
          const timeB = b.time.toLowerCase().replace(/\s*(am|pm)/, '');
          return timeA.localeCompare(timeB);
        });

      // Check for ride status changes and show notifications
      if (lastRideStatuses.size > 0) {
        todaySchedules.forEach((schedule: Activity) => {
          const lastStatusKey = lastRideStatuses.get(schedule._id);
          const currentStatus = schedule.status || 'pending';
          const currentStatusKey = schedule.driverId 
            ? `${currentStatus}-${schedule.driverId}` 
            : `${currentStatus}-no-driver`;
          
          // Extract status and driver info from keys
          const lastStatus = lastStatusKey ? lastStatusKey.split('-')[0] : null;
          const lastHadDriver = lastStatusKey && lastStatusKey.includes('-') && !lastStatusKey.endsWith('-no-driver');
          const currentHasDriver = !!schedule.driverId;
          
          // Only show notification if status changed
          if (lastStatusKey && lastStatusKey !== currentStatusKey) {
            // Check if driver was cleared (had driver before, no driver now)
            const driverWasCleared = lastHadDriver && !currentHasDriver && currentStatus === 'pending';
            
            // If driver was cleared, it means driver declined
            if (driverWasCleared) {
              // Driver declined - get driver name from lastStatusKey or schedule
              const lastDriverId = lastStatusKey.split('-')[1];
              const driverName = schedule.driverName || 'Driver';
              
              const notification = {
                id: `${schedule._id}-declined-${Date.now()}`,
                type: 'declined',
                title: '❌ Ride Declined',
                message: `Driver ${driverName} has declined your ride request for "${schedule.title}" (${schedule.time}). Please edit the schedule to select another driver.`,
                scheduleId: schedule._id,
                timestamp: new Date(),
              };
              setNotifications(prev => [notification, ...prev].slice(0, 50));
              
              Alert.alert(
                "❌ Ride Declined",
                `Driver ${driverName} has declined your ride request for "${schedule.title}" (${schedule.time}).\n\nYou can edit the schedule to select another driver.`,
                [
                  { text: "OK", style: "cancel" },
                  {
                    text: "Edit Schedule",
                    onPress: () => {
                      try {
                        const activityDate = new Date(schedule.date);
                        router.push({
                          pathname: "/Family/add_schedule",
                          params: {
                            selectedDate: activityDate.toISOString(),
                            editMode: "true",
                            scheduleId: schedule._id,
                            title: schedule.title || "",
                            time: schedule.time || "",
                            fromLocation: schedule.fromLocation || "",
                            toLocation: schedule.toLocation || "",
                          },
                        });
                      } catch (error) {
                        console.error('Error navigating to edit:', error);
                      }
                    }
                  }
                ]
              );
            } else if (lastStatus === 'pending' && currentStatus === 'confirmed') {
              // Driver accepted - add to notifications
              const notification = {
                id: `${schedule._id}-accepted-${Date.now()}`,
                type: 'accepted',
                title: '✅ Ride Accepted',
                message: `Driver ${schedule.driverName} has accepted your ride request for "${schedule.title}" (${schedule.time}).`,
                scheduleId: schedule._id,
                timestamp: new Date(),
              };
              setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
              
              Alert.alert(
                "✅ Ride Accepted",
                `Driver ${schedule.driverName} has accepted your ride request for "${schedule.title}" (${schedule.time}).`
              );
            } else if (lastStatus === 'pending' && currentStatus === 'cancelled') {
              // Driver declined - add to notifications
              const notification = {
                id: `${schedule._id}-declined-${Date.now()}`,
                type: 'declined',
                title: '❌ Ride Declined',
                message: `Driver ${schedule.driverName} has declined your ride request for "${schedule.title}" (${schedule.time}). Please edit the schedule to select another driver.`,
                scheduleId: schedule._id,
                timestamp: new Date(),
              };
              setNotifications(prev => [notification, ...prev].slice(0, 50));
              
              Alert.alert(
                "❌ Ride Declined",
                `Driver ${schedule.driverName} has declined your ride request for "${schedule.title}" (${schedule.time}).\n\nYou can edit the schedule to select another driver.`,
                [
                  { text: "OK", style: "cancel" },
                  {
                    text: "Edit Schedule",
                    onPress: () => {
                      try {
                        const activityDate = new Date(schedule.date);
                        router.push({
                          pathname: "/Family/add_schedule",
                          params: {
                            selectedDate: activityDate.toISOString(),
                            editMode: "true",
                            scheduleId: schedule._id,
                            title: schedule.title || "",
                            time: schedule.time || "",
                            fromLocation: schedule.fromLocation || "",
                            toLocation: schedule.toLocation || "",
                          },
                        });
                      } catch (error) {
                        console.error('Error navigating to edit:', error);
                      }
                    }
                  }
                ]
              );
            } else if (currentStatus === 'cancelled' && lastStatus !== 'cancelled') {
              // Ride cancelled - add to notifications
              const notification = {
                id: `${schedule._id}-cancelled-${Date.now()}`,
                type: 'cancelled',
                title: '❌ Ride Cancelled',
                message: `Your ride booking for "${schedule.title}" (${schedule.time}) has been cancelled.`,
                scheduleId: schedule._id,
                timestamp: new Date(),
              };
              setNotifications(prev => [notification, ...prev].slice(0, 50));
              
              Alert.alert(
                "❌ Ride Cancelled",
                `Your ride booking for "${schedule.title}" (${schedule.time}) has been cancelled.`
              );
            }
          }
        });
      }
      
      // Update last seen statuses (track all schedules, including those without drivers)
      const newStatusMap = new Map<string, string>();
      todaySchedules.forEach((schedule: Activity) => {
        // Track status for all schedules (even without drivers)
        const statusKey = schedule.driverId 
          ? `${schedule.status || 'pending'}-${schedule.driverId}` 
          : `${schedule.status || 'pending'}-no-driver`;
        newStatusMap.set(schedule._id, statusKey);
      });
      setLastRideStatuses(newStatusMap);

      setActivities(todaySchedules);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      Alert.alert("Error", "Failed to load activities. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load schedules on mount and when user is loaded
  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user]);

  // Refresh schedules when screen comes into focus (e.g., when returning from add_schedule)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSchedules();
      }
    }, [user])
  );

  // Listen for new events
  useEffect(() => {
    if (!user) return;
    
    const subscription = scheduleEventEmitter.addListener(
      "eventAdded",
      () => {
        // Refresh schedules when new event is added
        fetchSchedules();
      }
    );
    return () => subscription.remove();
  }, [user]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#04302B" />
      </View>
    );
  }

  const quickActions = [
    { icon: "call", route: "/Call/DriverCall" },
    { icon: "person", route: "/Call/CareTakerCall" },
    { icon: "car", route: "/Call/FamilyCall" },
  ];

  const handleTabPress = (tab: string) => setActiveTab(tab);

  const handleActivityPress = (activityId: string) => {
    setSelectedActivity(selectedActivity === activityId ? null : activityId);
  };

  const handleEditActivity = (activity: Activity) => {
    try {
      const activityDate = new Date(activity.date);
      router.push({
        pathname: "/Family/add_schedule",
        params: {
          selectedDate: activityDate.toISOString(),
          editMode: "true",
          scheduleId: activity._id,
          title: activity.title || "",
          time: activity.time || "",
          fromLocation: activity.fromLocation || "",
          toLocation: activity.toLocation || "",
        },
      });
      setSelectedActivity(null);
    } catch (error) {
      console.error('Error navigating to edit:', error);
      Alert.alert("Error", "Failed to open edit screen. Please try again.");
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity?",
      [
        { text: "Cancel", style: "cancel", onPress: () => setSelectedActivity(null) },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              console.log('Deleting schedule:', activityId);
              const response = await apiDelete(`/schedules/${activityId}`);
              console.log('Delete response:', response);
              
              // Remove from local state
              setActivities(prev => prev.filter(a => a._id !== activityId));
              setSelectedActivity(null);
              
              // Refresh schedules to ensure consistency
              if (user) {
                await fetchSchedules();
              }
              
              Alert.alert("Success", "Activity deleted successfully!");
            } catch (error: any) {
              console.error('Error deleting schedule:', error);
              console.error('Error details:', JSON.stringify(error, null, 2));
              const errorMessage = error?.data?.message || error?.message || error?.error || "Failed to delete activity. Please try again.";
              Alert.alert("Error", errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = screenWidth * 0.5 + screenWidth * 0.04;
    const index = Math.round(offsetX / cardWidth);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#B6DDB3"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffffff" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: user?.profileImage || "https://www.maplewoodseniorliving.com/wp-content/uploads/2024/01/shutterstock_1926698987-Low-Res-scaled.jpg",
              }}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.userName}>{user?.firstName || 'User'} !</Text>
              {user?.phoneNumber && (
                <Text style={styles.userPhone}>{user.phoneNumber}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setNotificationModalVisible(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#04302B" />
            {notifications.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications.length > 99 ? '99+' : notifications.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchSchedules();
            }} />
          }
        >
          {/* Today Activity */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle1}>Today Activity</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#04302B" />
              </View>
            ) : activities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No activities scheduled for today</Text>
              </View>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.activityCardsContainer}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {activities.map((activity) => (
                    <TouchableOpacity
                      key={activity._id}
                      style={[
                        styles.activityCard,
                        selectedActivity === activity._id && styles.selectedActivityCard,
                      ]}
                      onPress={() => handleActivityPress(activity._id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                        {(activity.fromLocation || activity.toLocation) && (
                          <Text style={styles.activityLocation} numberOfLines={1}>
                            {activity.fromLocation} → {activity.toLocation}
                          </Text>
                        )}
                      </View>
                      {selectedActivity === activity._id && (
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEditActivity(activity)}
                          >
                            <Ionicons name="create" size={16} color="#2E7D32" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteActivity(activity._id)}
                          >
                            <Ionicons name="trash" size={16} color="#2E7D32" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Scroll Indicators */}
                {activities.length > 1 && (
                  <View style={styles.scrollIndicators}>
                    {activities.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          activeIndex === index && styles.activeIndicator,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Track Ride */}
          <TouchableOpacity 
            style={styles.trackRideButton}
            onPress={() => router.push('/Family/track-ride')}
          >
            <Text style={styles.trackRideText}>Track Ride</Text>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => router.push(action.route as any)}
              >
                <Ionicons name={action.icon as any} size={26} color="#04302B" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Content */}
          <View style={styles.additionalContent}>
            <Text style={styles.additionalTitle}>Additional Information</Text>
            <Text style={styles.additionalText}>
              This content ensures that the footer doesn't hide any important
              information. The footer floats above the content with proper
              spacing.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <Footer activeTab={activeTab} onTabPress={handleTabPress} />

        {/* Notification Modal */}
        <Modal
          visible={notificationModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setNotificationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity
                  onPress={() => setNotificationModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#04302B" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.notificationsList}>
                {notifications.length === 0 ? (
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-off-outline" size={48} color="#CCCCCC" />
                    <Text style={styles.emptyNotificationsText}>No notifications</Text>
                  </View>
                ) : (
                  [...notifications]
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((notification) => (
                    <View key={notification.id} style={styles.notificationItem}>
                      <View style={[
                        styles.notificationIcon,
                        notification.type === 'accepted' && styles.notificationIconSuccess,
                        notification.type === 'declined' && styles.notificationIconError,
                        notification.type === 'cancelled' && styles.notificationIconError,
                        notification.type === 'pickup' && styles.notificationIconInfo,
                      ]}>
                        <Ionicons
                          name={
                            notification.type === 'accepted' ? 'checkmark-circle' :
                            notification.type === 'declined' ? 'close-circle' :
                            notification.type === 'pickup' ? 'car' :
                            'alert-circle'
                          }
                          size={24}
                          color="white"
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationItemTitle}>{notification.title}</Text>
                        <Text style={styles.notificationItemMessage}>{notification.message}</Text>
                        <Text style={styles.notificationTime}>
                          {notification.timestamp.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Text>
                        {notification.type === 'declined' && notification.scheduleId && (
                          <TouchableOpacity
                            style={styles.editScheduleButton}
                            onPress={async () => {
                              setNotificationModalVisible(false);
                              try {
                                // Find the schedule from activities first
                                let schedule = activities.find(a => a._id === notification.scheduleId);
                                
                                // If not found in today's activities, fetch all schedules
                                if (!schedule) {
                                  try {
                                    const response = await apiGet<{ schedules: any[] }>('/schedules');
                                    schedule = response.schedules?.find((s: any) => s._id === notification.scheduleId);
                                  } catch (fetchError) {
                                    console.error('Error fetching schedule:', fetchError);
                                  }
                                }
                                
                                if (schedule) {
                                  const activityDate = new Date(schedule.date);
                                  router.push({
                                    pathname: "/Family/add_schedule",
                                    params: {
                                      selectedDate: activityDate.toISOString(),
                                      editMode: "true",
                                      scheduleId: schedule._id,
                                      title: schedule.title || "",
                                      time: schedule.time || "",
                                      fromLocation: schedule.fromLocation || "",
                                      toLocation: schedule.toLocation || "",
                                    },
                                  });
                                } else {
                                  // Even if schedule not found, navigate with scheduleId - add_schedule will fetch it
                                  router.push({
                                    pathname: "/Family/add_schedule",
                                    params: {
                                      editMode: "true",
                                      scheduleId: notification.scheduleId,
                                    },
                                  });
                                }
                              } catch (error) {
                                console.error('Error navigating to edit:', error);
                                Alert.alert("Error", "Failed to open edit screen. Please try again.");
                              }
                            }}
                          >
                            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.editScheduleButtonText}>Edit & Select Driver</Text>
                          </TouchableOpacity>
                        )}
                        {notification.type === 'pickup' && (
                          <TouchableOpacity
                            style={styles.trackRideButtonInModal}
                            onPress={() => {
                              setNotificationModalVisible(false);
                              router.push('/Family/track-ride');
                            }}
                          >
                            <Ionicons name="location" size={16} color="#FFFFFF" />
                            <Text style={styles.trackRideButtonTextInModal}>Track Ride</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
              
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={styles.clearNotificationsButton}
                  onPress={() => {
                    setNotifications([]);
                    Alert.alert("Cleared", "All notifications cleared.");
                  }}
                >
                  <Text style={styles.clearNotificationsText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.02,
    paddingTop: screenHeight * 0.06,
  },
  profileSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  profileImage: {
    width: screenWidth * 0.15,
    height: screenWidth * 0.15,
    borderRadius: screenWidth * 0.075,
    marginRight: screenWidth * 0.04,
    backgroundColor: "#4CAF50",
  },
  welcomeText: { fontFamily: "ArimaMadurai_400Regular", fontSize: screenWidth * 0.045, color: "#000" },
  userName: { fontFamily: "ArimaMadurai_700Bold", fontSize: screenWidth * 0.06, color: "#000" },
  userPhone: { fontFamily: "ArimaMadurai_400Regular", fontSize: screenWidth * 0.035, color: "#666", marginTop: 2 },
  notificationButton: {
    width: screenWidth * 0.12,
    height: screenWidth * 0.12,
    borderRadius: screenWidth * 0.06,
    backgroundColor: "#E8F5E8",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF5722",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "ArimaMadurai_700Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: screenHeight * 0.8,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: screenWidth * 0.05,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: screenWidth * 0.06,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
  },
  modalCloseButton: {
    padding: 5,
  },
  notificationsList: {
    maxHeight: screenHeight * 0.6,
    paddingHorizontal: screenWidth * 0.05,
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationIconSuccess: {
    backgroundColor: "#4CAF50",
  },
  notificationIconError: {
    backgroundColor: "#F44336",
  },
  notificationIconInfo: {
    backgroundColor: "#2196F3",
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: screenWidth * 0.045,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
    marginBottom: 4,
  },
  notificationItemMessage: {
    fontSize: screenWidth * 0.04,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: screenWidth * 0.035,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#999",
  },
  emptyNotifications: {
    alignItems: "center",
    paddingVertical: screenHeight * 0.1,
  },
  emptyNotificationsText: {
    fontSize: screenWidth * 0.04,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#999",
    marginTop: 10,
  },
  clearNotificationsButton: {
    backgroundColor: "#F44336",
    marginHorizontal: screenWidth * 0.05,
    marginVertical: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  clearNotificationsText: {
    color: "#FFFFFF",
    fontSize: screenWidth * 0.045,
    fontFamily: "ArimaMadurai_700Bold",
  },
  editScheduleButton: {
    backgroundColor: "#04302B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  editScheduleButtonText: {
    color: "#FFFFFF",
    fontSize: screenWidth * 0.04,
    fontFamily: "ArimaMadurai_700Bold",
  },
  trackRideButtonInModal: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  trackRideButtonTextInModal: {
    color: "#FFFFFF",
    fontSize: screenWidth * 0.04,
    fontFamily: "ArimaMadurai_700Bold",
  },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: screenWidth * 0.05, paddingBottom: screenHeight * 0.15 },
  activitySection: { marginBottom: screenHeight * 0.03 },
  sectionTitle1: { fontFamily: "ArimaMadurai_700Bold", fontSize: screenWidth * 0.055, color: "#000", marginBottom: screenHeight * 0.005 },
  dateText: { fontFamily: "ArimaMadurai_400Regular", fontSize: screenWidth * 0.04, color: "#666", marginBottom: screenHeight * 0.025 },
  activityCardsContainer: { marginBottom: screenHeight * 0.02 },
  activityCard: {
    backgroundColor: "#C8E6C9",
    borderRadius: screenWidth * 0.03,
    padding: screenWidth * 0.04,
    marginRight: screenWidth * 0.04,
    width: screenWidth * 0.5,
    minWidth: 180,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  selectedActivityCard: { borderColor: "#2E7D32", borderWidth: 2, backgroundColor: "#F0F8F0" },
  activityContent: { flex: 1 },
  activityTitle: { fontFamily: "ArimaMadurai_700Bold", fontSize: screenWidth * 0.045, color: "#04302B", marginBottom: screenHeight * 0.01 },
  activityTime: { fontFamily: "ArimaMadurai_400Regular", fontSize: screenWidth * 0.04, color: "#000" },
  editActions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.12,
    backgroundColor: "#A5D6A7",
    borderTopRightRadius: screenWidth * 0.03,
    borderBottomRightRadius: screenWidth * 0.03,
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: screenHeight * 0.01,
  },
  editButton: { padding: screenWidth * 0.02 },
  deleteButton: { padding: screenWidth * 0.02 },
  scrollIndicators: { flexDirection: "row", justifyContent: "center", gap: screenWidth * 0.015, marginTop: screenHeight * 0.01 },
  indicator: { width: screenWidth * 0.05, height: screenHeight * 0.005, backgroundColor: "#E8F5E8", borderRadius: screenHeight * 0.0025 },
  activeIndicator: { backgroundColor: "#2E7D32" },
  trackRideButton: { backgroundColor: "#04302B", borderRadius: screenWidth * 0.03, paddingVertical: screenHeight * 0.02, alignItems: "center", marginBottom: screenHeight * 0.04 },
  trackRideText: { fontFamily: "ArimaMadurai_700Bold", color: "#fff", fontSize: screenWidth * 0.045 },
  quickActionsContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: screenHeight * 0.05 },
  quickActionButton: {
    backgroundColor: "#C8E6C9",
    borderRadius: screenWidth * 0.03,
    padding: screenWidth * 0.05,
    alignItems: "center",
    width: screenWidth * 0.2,
    height: screenWidth * 0.2,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  additionalContent: { marginTop: screenHeight * 0.01, padding: screenWidth * 0.05, backgroundColor: "#E8F5E8", borderRadius: screenWidth * 0.03 },
  additionalTitle: { fontFamily: "ArimaMadurai_700Bold", fontSize: screenWidth * 0.05, color: "#04302B", marginBottom: screenHeight * 0.01 },
  additionalText: { fontFamily: "ArimaMadurai_400Regular", fontSize: screenWidth * 0.04, color: "#333" },
  loadingContainer: {
    paddingVertical: screenHeight * 0.05,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: screenHeight * 0.05,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: screenWidth * 0.04,
    color: "#666",
    marginBottom: screenHeight * 0.02,
  },
  activityLocation: {
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: screenWidth * 0.035,
    color: "#666",
    marginTop: screenHeight * 0.005,
  },
});
