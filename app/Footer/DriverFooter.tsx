// app/Footer/DriverFooter.tsx
import React from "react";
import { router } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FooterProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

export default function DriverFooter({
  activeTab = "home",
  onTabPress,
}: FooterProps) {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleTabPress = (tabId: string) => {
    if (onTabPress) onTabPress(tabId);

    switch (tabId) {
      case "home":
        router.push("/Driver/Driver-dash");
        break;
      case "rides":
        router.push("/Driver/rides");
        break;
      case "profile":
        router.push("/Driver/profile");
        break;
    }
  };

  return (
    <View
      style={[
        styles.footerContainer,
        { paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.bottomNavigation}>
        {/* Home */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress("home")}
        >
          <Ionicons
            name="home"
            size={24}
            color={activeTab === "home" ? "#04302B" : "#B0B0B0"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "home" && styles.activeLabel,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* Rides */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress("rides")}
        >
          <Ionicons
            name="car"
            size={24}
            color={activeTab === "rides" ? "#04302B" : "#B0B0B0"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "rides" && styles.activeLabel,
            ]}
          >
            Rides
          </Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress("profile")}
        >
          <Ionicons
            name="person"
            size={24}
            color={activeTab === "profile" ? "#04302B" : "#B0B0B0"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "profile" && styles.activeLabel,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: "transparent",
    marginTop:60,
  },
  bottomNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    marginTop: 3,
    color: "#B0B0B0",
    fontFamily: "ArimaMadurai_400Regular",
  },
  activeLabel: {
    color: "#04302B",
    fontFamily: "ArimaMadurai_700Bold",
  },
});
