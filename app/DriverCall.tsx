import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function HomeScreen() {
  // Reusable Icon Button with Animation
  const AnimatedIcon = ({ name, size = 24, color = "white", onPress }) => {
    const scale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.8,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={name} size={size} color={color} style={styles.iconBtn} />
        </Animated.View>
      </Pressable>
    );
  };

  // Right Swipe Actions
  const renderRightActions = () => (
    <View style={styles.rightActionContainer}>
      <AnimatedIcon name="create-outline" color="white" onPress={() => alert("Edit")} />
      <AnimatedIcon name="trash-outline" color="white" onPress={() => alert("Delete")} />
    </View>
  );

  // Contact Card
  const ContactCard = ({ name, role }) => (
    <Swipeable renderRightActions={renderRightActions}>
      <View style={styles.contactCard}>
        <View style={styles.contactInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
        </View>
        <View style={styles.actionButtons}>
          <AnimatedIcon name="call-outline" size={22} color="white" onPress={() => alert("Calling...")} />
          <AnimatedIcon name="videocam-outline" size={22} color="white" onPress={() => alert("Video Call...")} />
        </View>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Driver Call</Text>
        <AnimatedIcon name="notifications-outline" size={24} color="#0a3d2e" onPress={() => alert("Notifications")} />
      </View>

      {/* Contact List */}
      <ContactCard name="Son" role="Raja" />
      <ContactCard name="Daughter" role="Hiruni" />

      {/* Bottom Menu */}
      <View style={styles.bottomMenu}>
        <AnimatedIcon name="home-outline" size={24} color="#0a3d2e" onPress={() => alert("Home")} />
        <AnimatedIcon name="list-outline" size={24} color="#0a3d2e" onPress={() => alert("List")} />
        <View style={styles.sosBtn}>
          <AnimatedIcon name="alert-circle" size={28} color="red" onPress={() => alert("SOS ALERT!")} />
        </View>
        <AnimatedIcon name="car-outline" size={24} color="#0a3d2e" onPress={() => alert("Car")} />
        <AnimatedIcon name="person-add-outline" size={24} color="#0a3d2e" onPress={() => alert("Add Person")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5fdf7", padding: 20 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20,
  },
  headerText: { fontSize: 22, fontWeight: "bold", color: "#0a3d2e" },
  contactCard: {
    backgroundColor: "#0a3d2e", borderRadius: 12, padding: 15, marginBottom: 15,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  contactInfo: { flexDirection: "column" },
  role: { color: "#a3c9b9", fontSize: 14 },
  name: { color: "white", fontSize: 16, fontWeight: "bold" },
  actionButtons: { flexDirection: "row" },
  iconBtn: { marginLeft: 12 },
  rightActionContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#cc0000",
    borderRadius: 12, paddingHorizontal: 20, marginBottom: 15,
  },
  bottomMenu: {
    position: "absolute", bottom: 15, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
    paddingVertical: 10, backgroundColor: "white", borderRadius: 20,
    marginHorizontal: 10, shadowColor: "#000", shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 5,
  },
  sosBtn: {
    backgroundColor: "white", borderRadius: 50, padding: 8,
    shadowColor: "red", shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 5,
  },
});
