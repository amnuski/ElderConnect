import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function DriverCall() {
  const [contacts, setContacts] = useState([
    
  ]);

  const [activeCall, setActiveCall] = useState(null); // holds who is being called

  // Animated icon component
  const AnimatedIcon = ({ name, size = 24, color = "white", onPress }) => {
    const scale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={name} size={size} color={color} style={styles.iconBtn} />
        </Animated.View>
      </Pressable>
    );
  };

  // Swipe actions
  const renderRightActions = (item) => (
    <View style={styles.rightActionContainer}>
      <AnimatedIcon
        name="create-outline"
        size={24}
        color="white"
        onPress={() => alert(`Edit ${item.name}`)}
      />
      <AnimatedIcon
        name="trash-outline"
        size={24}
        color="white"
        onPress={() => setContacts(contacts.filter((c) => c.id !== item.id))}
      />
    </View>
  );

  // Contact card
  const renderContact = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <View style={styles.contactCard}>
        <View>
          <Text style={styles.callerName}>{item.name}</Text>
          <Text style={styles.callerRole}>{item.role}</Text>
        </View>
        <View style={styles.callActions}>
          <AnimatedIcon
            name="call-outline"
            size={26}
            onPress={() => setActiveCall(item)}
          />
          <AnimatedIcon
            name="videocam-outline"
            size={26}
            onPress={() => setActiveCall(item)}
          />
        </View>
      </View>
    </Swipeable>
  );

  return (
    <LinearGradient colors={["#FFFFFF", "#B6DDB3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#0a3d2e"
            onPress={() => alert("Go Back")}
          />
          <Text style={styles.headerText}>Family Call</Text>
        </View>
        <AnimatedIcon
          name="notifications-outline"
          size={24}
          color="#0a3d2e"
          onPress={() => alert("Notifications")}
        />
      </View>

      {/* Call Bar (only if calling) */}
      {activeCall && (
        <View style={styles.callBar}>
          <Text style={styles.callText}>
            Calling {activeCall.name} ({activeCall.role})...
          </Text>
          <Pressable onPress={() => setActiveCall(null)}>
            <Ionicons name="call-outline" size={24} color="white" />
          </Pressable>
        </View>
      )}

      {/* Contact list */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Floating Add Contact Button */}
      <Pressable style={styles.floatingBtn} onPress={() => alert("Add new contact")}>
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

      {/* Bottom Nav */}
     
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0a3d2e",
    marginLeft: 10,
  },

  // Call bar (dynamic)
  callBar: {
    backgroundColor: "green",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  callText: { color: "white", fontSize: 16, fontWeight: "bold" },

  // Contact card
  contactCard: {
    flexDirection: "row",
    backgroundColor: "#0a3d2e",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  callerName: { color: "white", fontSize: 18, fontWeight: "bold" },
  callerRole: { color: "#a3c9b9", fontSize: 14 },
  callActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { marginLeft: 12 },

  // Swipe
  rightActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#155e4a",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 20,
  },

  // Floating Add
  floatingBtn: {
    position: "absolute",
    bottom: 100,
    right: 25,
    backgroundColor: "#0a3d2e",
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },

  // Bottom nav
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  emergencyBtn: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 30,
    marginHorizontal: 10,
  },
});
