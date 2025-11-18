// app/Family/dash.tsx
import { ArimaMadurai_400Regular, ArimaMadurai_700Bold, useFonts } from "@expo-google-fonts/arima-madurai";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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
} from "react-native";
import Footer from "../Footer/footer";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../constants/api";
import scheduleEventEmitter from "./scheduleEventEmitter";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function Dashboard() {
  // Hooks: keep in a stable order to avoid React Hooks order errors
  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem("userData");
        let storedUser = null;
        if (userDataStr) {
          storedUser = JSON.parse(userDataStr);
          setUserData(storedUser);
        }

        // Try fetching fresh data from backend
        try {
          const response = await api.getUserProfile();
          if (response?.user) {
            setUserData(response.user);
            await AsyncStorage.setItem("userData", JSON.stringify(response.user));
          }
        } catch {
          // ignore network errors, keep stored user
        }
      } catch (error) {
        console.warn("Failed to load user data for family dashboard", error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
    // also load schedules for header quick view
    const loadSchedules = async () => {
      try {
        const response = await api.getSchedules();
        if (response?.schedules) {
          setSchedules(response.schedules || []);
        }
      } catch (error) {
        console.warn("Failed to load schedules for header", error);
      }
    };
    loadSchedules();
  }, []);

  // Derive activities from schedules: prefer today's schedules, otherwise show upcoming
  const todayStr = new Date().toDateString();
  const todays = schedules.filter((s) => new Date(s.date).toDateString() === todayStr);
  const upcoming = schedules
    .filter((s) => new Date(s.date).toDateString() !== todayStr)
    .slice(0, 4 - todays.length);

  const activities = (
    todays.concat(upcoming)
  ).map((s, idx) => ({
    id: idx + 1,
    title: s.title || s.eventTitle || 'Event',
    time: s.time || (s.date ? new Date(s.date).toLocaleTimeString() : ''),
    location: s.location || `${s.fromLocation || ''}${s.toLocation ? ` → ${s.toLocation}` : ''}`,
  }));

  const quickActions = [
    { icon: "call", route: "/Call/DriverCall" },
    { icon: "person", route: "/Call/CareTakerCall" },
    { icon: "car", route: "/Call/FamilyCall" },
  ];

  const handleTabPress = (tab: string) => setActiveTab(tab);

  const handleActivityPress = (activityId: number) => {
    setSelectedActivity(selectedActivity === activityId ? null : activityId);
  };

  const handleEditActivity = (activityId: number) => {
    console.log("Edit activity:", activityId);
    setSelectedActivity(null);
  };

  const handleDeleteActivity = (activityId: number) => {
    console.log("Delete activity:", activityId);
    setSelectedActivity(null);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = screenWidth * 0.5 + screenWidth * 0.04;
    const index = Math.round(offsetX / cardWidth);
    setActiveIndex(index);
  };

  // Listen for scheduleEventEmitter to update schedules live when adding from AddSchedule
  useEffect(() => {
    const sub = scheduleEventEmitter.addListener('eventAdded', (newEvent: any) => {
      // Normalize incoming event. Prefer `iso` when present (emitted by add_schedule),
      // otherwise try to parse `date` which may be human-readable or ISO.
      let isoDate: string | null = null;
      if (newEvent.iso) {
        isoDate = newEvent.iso;
      } else if (newEvent.date) {
        try {
          const parsed = new Date(newEvent.date);
          if (!isNaN(parsed.getTime())) isoDate = parsed.toISOString();
        } catch {
          isoDate = null;
        }
      }

      const normalized = {
        title: newEvent.title,
        time: newEvent.time,
        date: isoDate || newEvent.date || new Date().toISOString(),
        location: newEvent.location || `${newEvent.fromLocation || ''}${newEvent.toLocation ? ` → ${newEvent.toLocation}` : ''}`,
      };

      setSchedules((prev) => [normalized, ...prev]);
    });
    return () => sub.remove();
  }, []);

  // Delay rendering until fonts and user load are ready — placed after all hooks
  if (!fontsLoaded || loadingUser) return null;

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
              source={
                userData?.profileImage
                  ? { uri: userData.profileImage }
                  : require("../../assets/images/profile.png")
              }
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.userName}>{userData?.firstName ? `${userData.firstName} !` : 'User'}</Text>
            </View>
          </View>
          {/* Quick upcoming schedules preview */}
          <View style={{ marginLeft: 12 }}>
            {schedules.slice(0,2).map((s, idx) => (
              <Text key={idx} style={{ fontSize: 12, color: '#045' }}>
                {s.title} • {new Date(s.date).toLocaleDateString()} {s.time}
              </Text>
            ))}
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#04302B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Today Activity */}
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle1}>Today Activity</Text>
            <Text style={styles.dateText}>July 12, 2025</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.activityCardsContainer}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityCard,
                    selectedActivity === activity.id && styles.selectedActivityCard,
                  ]}
                  onPress={() => handleActivityPress(activity.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                    {activity.location ? (
                      <Text style={styles.activityLocation}>{activity.location}</Text>
                    ) : null}
                  </View>
                  {selectedActivity === activity.id && (
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditActivity(activity.id)}
                      >
                        <Ionicons name="create" size={16} color="#2E7D32" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteActivity(activity.id)}
                      >
                        <Ionicons name="trash" size={16} color="#2E7D32" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Scroll Indicators */}
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
              This content ensures that the footer doesn&apos;t hide any important
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
  activityLocation: { fontFamily: "ArimaMadurai_400Regular", fontSize: screenWidth * 0.035, color: "#555", marginTop: screenHeight * 0.008 },
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
});
