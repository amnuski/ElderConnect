// app/index.tsx
import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  Image,
  StatusBar,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, KaushanScript_400Regular } from "@expo-google-fonts/kaushan-script";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

export default function WelcomeScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    KaushanScript_400Regular,
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  const logoY = useRef(new Animated.Value(0)).current;
  const boxY = useRef(new Animated.Value(500)).current; // start completely hidden

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.sequence([
      // 1. Wait 1.5s before moving logo
      Animated.delay(1500),

      // 2. Move logo upwards
      Animated.timing(logoY, {
        toValue: -150,
        duration: 1000,
        useNativeDriver: true,
      }),

      // 3. Slide language box from bottom
      Animated.timing(boxY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <LinearGradient
      colors={["#FFFFFF", "#B6DDB3"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#B6DDB3" />

      {/* Logo + App name */}
      <Animated.View
        style={[styles.topSection, { transform: [{ translateY: logoY }] }]}
      >
        <Image
          source={require("@/assets/images/elderconnect-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { fontFamily: "KaushanScript_400Regular" }]}>
          Elder Connect
        </Text>
      </Animated.View>

      {/* Language Box */}
      <Animated.View
        style={[styles.languageBox, { transform: [{ translateY: boxY }] }]}
      >
        <Text style={[styles.title, { fontFamily: "ArimaMadurai_700Bold" }]}>
          Choose language
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, { fontFamily: "ArimaMadurai_400Regular" }]}>
            தமிழ்
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}
        onPress={() => router.push("/onboarding")}>
          <Text style={[styles.buttonText, { fontFamily: "ArimaMadurai_400Regular" }]}>
            English
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={[styles.buttonText, { fontFamily: "ArimaMadurai_400Regular" }]}>
            සිංහල
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  topSection: {
    alignItems: "center",
    marginTop: 250,
  },
  logo: {
    width: 200,
    height: 200,
  },
  appName: {
    fontSize: 28,
    color: "#042222",
    marginTop: -20,
  },
  languageBox: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#7CA986",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 30,
    color: "#042222",
  },
  button: {
    backgroundColor: "#042222",
    width: "70%",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 8,
  },
  buttonText: {
    color: "#A0C9A4",
    fontSize: 18,
  },
});
