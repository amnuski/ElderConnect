import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function IncomingCallScreen() {
  const handleAccept = () => {
    router.push("/callattend");
  };

  const handleDecline = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Top Section: Avatar + Info */}
      <View style={styles.topSection}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/147/147144.png",
          }}
          style={styles.avatar}
        />
        <Text style={styles.contactName}>Unknown Contact</Text>
        <Text style={styles.callStatus}>Incoming call...</Text>
      </View>

      {/* Bottom Section: Call Actions */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
          <Ionicons
            name="call"
            size={28}
            color="white"
            style={{ transform: [{ rotate: "135deg" }] }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Ionicons name="call" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  topSection: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  contactName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  callStatus: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
  },
  declineButton: {
    backgroundColor: "red",
    padding: 20,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: "green",
    padding: 20,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
