// app/Family/dash.tsx
import { ArimaMadurai_400Regular, ArimaMadurai_700Bold, useFonts } from "@expo-google-fonts/arima-madurai";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback } from "react";
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

  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // Fetch schedules from backend
  const fetchSchedules = async () => {
    try {
      if (!user) return;

      const response = await apiGet<{ schedules: any[] }>('/schedules');
      
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
        }))
        .sort((a, b) => {
          // Sort by time - handle both 12-hour and 24-hour format
          const timeA = a.time.toLowerCase().replace(/\s*(am|pm)/, '');
          const timeB = b.time.toLowerCase().replace(/\s*(am|pm)/, '');
          return timeA.localeCompare(timeB);
        });

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
    const activityDate = new Date(activity.date);
    router.push({
      pathname: "/Family/add_schedule",
      params: {
        selectedDate: activityDate.toISOString(),
        editMode: "true",
        scheduleId: activity._id,
        title: activity.title,
        time: activity.time,
        fromLocation: activity.fromLocation || "",
        toLocation: activity.toLocation || "",
      },
    });
    setSelectedActivity(null);
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
              await apiDelete(`/schedules/${activityId}`);
              // Remove from local state
              setActivities(prev => prev.filter(a => a._id !== activityId));
              setSelectedActivity(null);
            } catch (error: any) {
              console.error('Error deleting schedule:', error);
              Alert.alert("Error", "Failed to delete activity. Please try again.");
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
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#04302B" />
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
                <TouchableOpacity
                  style={styles.addActivityButton}
                  onPress={() => router.push("/Family/add_schedule")}
                >
                  <Text style={styles.addActivityText}>Add Activity</Text>
                </TouchableOpacity>
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
          <TouchableOpacity style={styles.trackRideButton}>
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
  addActivityButton: {
    backgroundColor: "#04302B",
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.08,
    borderRadius: screenWidth * 0.03,
  },
  addActivityText: {
    fontFamily: "ArimaMadurai_700Bold",
    color: "#fff",
    fontSize: screenWidth * 0.04,
  },
  activityLocation: {
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: screenWidth * 0.035,
    color: "#666",
    marginTop: screenHeight * 0.005,
  },
});
