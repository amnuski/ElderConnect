// components/Footer.tsx
import React from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

const { height: screenHeight } = Dimensions.get("window");

interface FooterProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

export default function Footer({ activeTab = "home", onTabPress }: FooterProps) {
  const insets = useSafeAreaInsets();

  // ✅ Load fonts
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) {
    return null; // don’t render until fonts are loaded
  }

  const handleTabPress = (tabId: string) => {
    if (onTabPress) onTabPress(tabId);

    switch (tabId) {
      case "home":
        router.push("/Family/dash");
        break;
      case "activities":
        router.push("/Family/schedule_page");
        break;
      case "rides":
        router.push("/Family/add_schedule");
        break;
      case "profile":
        router.push("/setting/setting");
        break;
      case "emergency":
        router.push("/setting/emergencyAdd");
        break;
    }
  };

  return (
    <View
      style={[
        styles.footerContainer,
        {
          paddingBottom: insets.bottom, // ✅ only safe area padding
        },
      ]}
    >
      {/* Footer background */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress("home")}
        >
          <Ionicons
            name="home"
            size={24}
            color={activeTab === "home" ? "#2E7D32" : "#042222"}
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress("activities")}
        >
          <Ionicons
            name="clipboard-outline"
            size={24}
            color={activeTab === "activities" ? "#2E7D32" : "#042222"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "activities" && styles.activeLabel,
            ]}
          >
            Activities
          </Text>
        </TouchableOpacity>

        {/* Spacer for Emergency Button */}
        <View style={{ width: 60 }} />

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress("rides")}
        >
          <Ionicons
            name="car"
            size={24}
            color={activeTab === "rides" ? "#2E7D32" : "#042222"}
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress("profile")}
        >
          <Ionicons
            name="person"
            size={24}
            color={activeTab === "profile" ? "#2E7D32" : "#042222"}
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

      {/* Floating Emergency Button */}
      <View style={styles.emergencyWrapper}>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => handleTabPress("emergency")}
          activeOpacity={0.8}
        >
          <Image
            source={require("../../assets/images/emicon.png")}
            style={{ width: 28, height: 28, resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: "transparent",
    height: screenHeight * 0.085,
  },
  bottomNavigation: {
    marginHorizontal: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#042222",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 11,
    marginTop: 3,
    color: "#042222",
    fontFamily: "ArimaMadurai_400Regular", // ✅ custom font
  },
  activeLabel: {
    color: "#042222",
    fontFamily: "ArimaMadurai_700Bold", // ✅ bold font
  },
  emergencyWrapper: {
    position: "absolute",
    top: -30, // lifts above footer
    left: "50%",
    transform: [{ translateX: -30 }],
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
});
