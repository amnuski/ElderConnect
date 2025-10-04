import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DriverResponseScreen() {
  // Ride requests state
  const [rides, setRides] = useState([
    { id: 1, pickup: "Station Road", drop: "University", time: "10:30 AM", status: "Pending" },
    { id: 2, pickup: "Market", drop: "Hospital", time: "11:00 AM", status: "Pending" },
  ]);

  // Handle Accept
  const handleAccept = (id) => {
    setRides((prevRides) =>
      prevRides.map((ride) =>
        ride.id === id ? { ...ride, status: "Accepted" } : ride
      )
    );
    Alert.alert("Ride Accepted ✅", "You have accepted the ride.");
  };

  // Handle Decline
  const handleDecline = (id) => {
    setRides((prevRides) => prevRides.filter((ride) => ride.id !== id));
    Alert.alert("Ride Declined ❌", "You have declined the ride.");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: "https://via.placeholder.com/50" }} // replace with driver photo
          style={styles.profileImage}
        />
      </View>

      {/* Ride List */}
      <ScrollView style={styles.rideList}>
        {rides.length === 0 ? (
          <Text style={styles.noRides}>No ride requests available</Text>
        ) : (
          rides.map((ride) => (
            <View key={ride.id} style={styles.rideCard}>
              <Text style={styles.rideTitle}>Ride</Text>
              <Text>Pickup Location : {ride.pickup}</Text>
              <Text>Drop Location : {ride.drop}</Text>
              <Text>Time : {ride.time}</Text>
              <Text>Status : {ride.status}</Text>

              {ride.status === "Pending" && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(ride.id)}
                  >
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDecline(ride.id)}
                  >
                    <Text style={styles.buttonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <Ionicons name="home" size={28} color="black" />
        <Ionicons name="car" size={28} color="black" />
        <Ionicons name="person" size={28} color="black" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8f0" },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#e6ffe6",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  profileImage: { width: 50, height: 50, borderRadius: 25 },
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
  noRides: { textAlign: "center", marginTop: 50, fontSize: 16, color: "#666" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});
