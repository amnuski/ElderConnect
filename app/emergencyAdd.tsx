import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { router } from "expo-router";

interface EmergencyButtonProps {
  title: string;
}

export default function EmergencyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Emergency{"\n"}member</Text>
        <TouchableOpacity>
          <Icon name="bell-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <EmergencyButton title="Family Call" />
        <EmergencyButton title="Ambulance" />
        <EmergencyButton title="Police" />
      </View>

      {/* Floating Buttons */}
      <TouchableOpacity style={styles.floatingButtonLeft}>
        <Icon name="account-plus" size={28} color="#fff" />
      </TouchableOpacity>

      
    </SafeAreaView>
  );
}

function EmergencyButton({ title }: EmergencyButtonProps) {
  return (
    <TouchableOpacity style={styles.emergencyCard}>
      <Text style={styles.buttonText}>{title}</Text>
      <Icon name="phone" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d5f5d5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
    marginTop: 35,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  emergencyCard: {
    backgroundColor: "#003d2d",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  floatingButtonLeft: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#003d2d",
    padding: 16,
    borderRadius: 50,
    elevation: 5,
  },
  floatingButtonCenter: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "red",
    padding: 16,
    borderRadius: 50,
    elevation: 5,
  },
});
