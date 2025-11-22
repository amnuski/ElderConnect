import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { apiGet, apiPut, ApiError } from "@/services/api";

// ✅ Ride type matching backend schema
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

interface RidesResponse {
  rides: Ride[];
}

export default function DriverResponseScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch rides from API
  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const response = await apiGet<RidesResponse>("/api/rides?status=pending");
      setRides(response.rides || []);
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Error",
        apiError.message || "Failed to fetch rides. Please try again."
      );
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Accept ride function
  const handleAccept = async (rideId: string) => {
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
      
      Alert.alert("Ride Accepted ✅", response.message || "You have accepted the ride.");
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

  // ✅ Decline ride function
  const handleDecline = async (rideId: string) => {
    try {
      setProcessing(rideId);
      const response = await apiPut<{ message: string; ride: Ride }>(
        `/api/rides/${rideId}/decline`
      );
      
      // Remove from local state
      setRides((prevRides) => prevRides.filter((ride) => ride._id !== rideId));
      
      Alert.alert("Ride Declined ❌", response.message || "You have declined the ride.");
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Error",
        apiError.message || "Failed to decline ride. Please try again."
      );
      console.error("Error declining ride:", error);
    } finally {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#0a3d2e" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Driver Response</Text>

        <Image
          source={{ uri: "https://via.placeholder.com/50" }}
          style={styles.profileImage}
        />
      </View>

      <ScrollView style={styles.rideList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0a3d2e" />
            <Text style={styles.loadingText}>Loading rides...</Text>
          </View>
        ) : rides.length === 0 ? (
          <Text style={styles.noRides}>No ride requests available</Text>
        ) : (
          rides.map((ride) => (
            <View key={ride._id} style={styles.rideCard}>
              <Text style={styles.rideTitle}>Ride Request</Text>
              <Text style={styles.rideInfo}>
                <Text style={styles.label}>Pickup Location: </Text>
                {ride.pickupLocation}
              </Text>
              <Text style={styles.rideInfo}>
                <Text style={styles.label}>Drop Location: </Text>
                {ride.dropLocation}
              </Text>
              <Text style={styles.rideInfo}>
                <Text style={styles.label}>Scheduled Time: </Text>
                {formatTime(ride.scheduledTime)}
              </Text>
              <Text style={styles.rideInfo}>
                <Text style={styles.label}>Status: </Text>
                <Text style={styles.statusText}>{ride.status.toUpperCase()}</Text>
              </Text>

              {ride.status === "pending" && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.acceptButton,
                      processing === ride._id && styles.buttonDisabled,
                    ]}
                    onPress={() => handleAccept(ride._id)}
                    disabled={processing === ride._id}
                  >
                    {processing === ride._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.declineButton,
                      processing === ride._id && styles.buttonDisabled,
                    ]}
                    onPress={() => handleDecline(ride._id)}
                    disabled={processing === ride._id}
                  >
                    {processing === ride._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Decline</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8f0" ,padding:10,},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#e6ffe6",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginTop:10,
  },
  backBtn: { padding: 6, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0a3d2e" },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  rideList: { flex: 1, padding: 10 },
  rideCard: {
    backgroundColor: "#d9f2d9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rideTitle: { fontWeight: "bold", marginBottom: 5, fontSize: 16 },
  buttonRow: { flexDirection: "row", marginTop: 10, justifyContent: "space-around" },
  acceptButton: {
    backgroundColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  declineButton: {
    backgroundColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  buttonDisabled: { opacity: 0.6 },
  noRides: { textAlign: "center", marginTop: 50, fontSize: 16, color: "#666" },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  rideInfo: { marginBottom: 8, fontSize: 14, color: "#333" },
  label: { fontWeight: "600", color: "#0a3d2e" },
  statusText: { 
    fontWeight: "bold", 
    color: "#0a3d2e",
    textTransform: "capitalize",
  },
});
