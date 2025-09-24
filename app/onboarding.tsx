// app/onboarding.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router"; // ✅ useRouter instead of navigation prop
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

export default function OnboardingScreen() {
  const router = useRouter(); // ✅ Create router instance
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current; // Image fade animation
  const slideAnim = useRef(new Animated.Value(100)).current; // Bottom card slide animation

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* Background Image with fade */}
      <Animated.Image
        source={require("@/assets/images/onboard-image.png")}
        style={[styles.image, { opacity: fadeAnim }]}
        resizeMode="cover"
      />

      {/* Bottom Card with slide-up */}
      <Animated.View style={[styles.bottomCard, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={[styles.title, { fontFamily: "ArimaMadurai_700Bold" }]}>
          Care Beyond Distance,{"\n"}Connect with Love
        </Text>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => router.push("/verify-num")} // ✅ Navigate using router
        >
          <Text style={[styles.buttonText, { fontFamily: "ArimaMadurai_400Regular" }]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#537347" },
  image: { width: "100%", height: "70%" },
  bottomCard: {
    flex: 1,
    backgroundColor: "#7CA986",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  title: { fontSize: 22, color: "#042222", textAlign: "center", marginBottom: 50 },
  button: { backgroundColor: "#042222", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  buttonText: { color: "#A0C9A4", fontSize: 18 },
});
