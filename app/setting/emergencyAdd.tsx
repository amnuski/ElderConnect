import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from "@expo-google-fonts/arima-madurai";

interface EmergencyButtonProps {
  title: string;
}

export default function EmergencyScreen() {
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Icon name="arrow-left" size={26} color="#04302B" />
        </TouchableOpacity>

        <Text style={styles.title}>Add Emergency{"\n"}Member</Text>

        <View style={styles.headerIcon} />
      </View>

      {/* Buttons Vertical */}
      <View style={styles.buttonContainer}>
        <EmergencyButton title="Family Call" />
        <EmergencyButton title="Ambulance" />
        <EmergencyButton title="Police" />
      </View>

      {/* Floating Button */}
      <TouchableOpacity style={styles.floatingButton}>
        <Icon name="account-plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function EmergencyButton({ title }: EmergencyButtonProps) {
  return (
    <TouchableOpacity style={styles.emergencyCard}>
      <Text style={styles.buttonText}>{title}</Text>
      <Icon name="phone" size={24} color="#fff" style={{ marginTop: 6 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF3E9",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 50,
    marginTop:20,
  },
  headerIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
    textAlign: "center",
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 15,
  },
  emergencyCard: {
    backgroundColor: "#04302B",
    flexDirection: "column", // vertical inside
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 12,
    elevation: 3,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "ArimaMadurai_700Bold",
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#04302B",
    padding: 20,
    borderRadius: 50,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});
