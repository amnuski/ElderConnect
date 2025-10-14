import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CallAttended() {
  const { name, phone } = useLocalSearchParams();
  const router = useRouter();
  const [callStatus, setCallStatus] = useState("incoming");

  const handleAccept = () => setCallStatus("inCall");
  const handleDecline = () => setCallStatus("ended");
  const handleEndCall = () => setCallStatus("ended");
  const handleBack = () => router.back();

  return (
    <View style={styles.container}>
      {/* Back button */}
      {callStatus !== "incoming" && (
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      )}

      {/* Avatar */}
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/2922/2922510.png" }}
        style={styles.avatar}
      />

      {/* Contact name + phone */}
      <Text style={styles.name}>{name || "Unknown Contact"}</Text>
      {phone && <Text style={styles.phone}>{phone}</Text>}

      {/* Status text */}
      {callStatus === "incoming" && <Text style={styles.status}>Incoming call...</Text>}
      {callStatus === "inCall" && <Text style={styles.status}>In call...</Text>}
      {callStatus === "ended" && <Text style={styles.statusEnd}>Call Ended</Text>}

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        {callStatus === "incoming" && (
          <>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: "#E53935" }]}
              onPress={handleDecline}
            >
              <Ionicons name="call-outline" size={30} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: "#4CAF50" }]}
              onPress={handleAccept}
            >
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {callStatus === "inCall" && (
          <>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="camera-reverse-outline" size={26} color="#4CAF50" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="mic-off-outline" size={26} color="#4CAF50" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: "#E53935" }]}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="briefcase-outline" size={26} color="#4CAF50" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="ellipsis-horizontal" size={26} color="#4CAF50" />
            </TouchableOpacity>
          </>
        )}

        {callStatus === "ended" && (
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: "#4CAF50" }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back-outline" size={30} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", top: 60, left: 20 },
  backText: { fontSize: 16, color: "#555" },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  name: { fontSize: 22, fontWeight: "600", color: "#333" },
  phone: { fontSize: 15, color: "#666", marginBottom: 6 },
  status: { fontSize: 16, color: "#777", marginBottom: 60 },
  statusEnd: { fontSize: 16, color: "#E53935", marginBottom: 60 },
  bottomBar: {
    flexDirection: "row",
    position: "absolute",
    bottom: 50,
    justifyContent: "space-between",
    alignItems: "center",
    width: "80%",
  },
  callBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtn: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
});
