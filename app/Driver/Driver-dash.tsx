// app/Driver/dash.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Footer from "../Footer/DriverFooter";
import { router } from "expo-router";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../constants/api";

export default function DriverDash() {
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Try to get from storage first
      const userDataStr = await AsyncStorage.getItem('userData');
      let storedUserData = null;
      if (userDataStr) {
        storedUserData = JSON.parse(userDataStr);
        setUserData(storedUserData);
      }
      
      // Fetch latest from backend (use /me endpoint which doesn't need userId)
      const response = await api.getUserProfile();
      if (response.user) {
        setUserData(response.user);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
      } else if (storedUserData) {
        // If backend call fails but we have stored data, keep using it
        setUserData(storedUserData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // If error, try to use stored data if available
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          setUserData(JSON.parse(userDataStr));
        }
      } catch (e) {
        console.error('Error loading from storage:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#042222" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#F6FFF6", "#CDEDC8"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
              }}
              style={styles.profileIcon}
            />
            <View>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.nameText}>
                {userData?.firstName || "Driver"}!
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Ionicons
              name="notifications-outline"
              size={26}
              color="#003C1F"
              onPress={() => router.push("/Call/DriverResponsePage")}
            />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.placeholderText}>Your dashboard content here</Text>

          {/* Call Icon */}
          <TouchableOpacity
            style={styles.callIconContainer}
            onPress={() => router.push("//Call/contactList")}
          >
            <Ionicons name="call-outline" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.callLabel}>Contacts</Text>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Footer />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, justifyContent: "space-between" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  profileIcon: { width: 45, height: 45, marginRight: 10, borderRadius: 50 },
  welcomeText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "ArimaMadurai_400Regular",
  },
  nameText: {
    fontSize: 20,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#003C1F",
  },
  bellButton: {
    backgroundColor: "#E8F6E9",
    padding: 8,
    borderRadius: 50,
  },
  body: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: {
    fontSize: 16,
    color: "#888",
    fontFamily: "ArimaMadurai_400Regular",
    marginBottom: 20,
  },
  callIconContainer: {
    backgroundColor: "#0A3D2E",
    padding: 18,
    borderRadius: 50,
    elevation: 4,
  },
  callLabel: {
    fontSize: 16,
    color: "#0A3D2E",
    marginTop: 10,
    fontFamily: "ArimaMadurai_700Bold",
  },
  footerContainer: { width: "100%" },
});
