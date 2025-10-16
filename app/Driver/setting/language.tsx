import React, { ReactNode, useState, useEffect } from "react";
import {
  View,
  Text as RNText,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar as RNStatusBar,
  TextProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFonts, ArimaMadurai_700Bold } from "@expo-google-fonts/arima-madurai";
import * as SplashScreen from "expo-splash-screen";

const { width } = Dimensions.get("window");

// ✅ Custom AppText with proper TypeScript props
type AppTextProps = TextProps & {
  children: ReactNode;
};

const AppText: React.FC<AppTextProps> = ({ children, style, ...props }) => (
  <RNText {...props} style={[{ fontFamily: "ArimaMadurai_700Bold" }, style]}>
    {children}
  </RNText>
);

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const languages = ["தமிழ்", "English", "සිංහල"];

  const [fontsLoaded] = useFonts({
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Status Bar */}
      <RNStatusBar barStyle="dark-content" backgroundColor="#E6F2E6" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#04302B" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Language</AppText>
        {/* Empty view to balance the back button */}
        <View style={{ width: 24 }} />
      </View>

      {/* Language Buttons */}
      <View style={styles.languageContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.languageButton,
              selectedLanguage === lang && styles.selectedButton,
            ]}
            onPress={() => setSelectedLanguage(lang)}
          >
            <AppText
              style={[
                styles.languageText,
                selectedLanguage === lang && styles.selectedText,
              ]}
            >
              {lang}
            </AppText>
            {selectedLanguage === lang && (
              <Ionicons
                name="checkmark"
                size={20}
                color="white"
                style={{ marginLeft: 10 }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Info Text */}
      <AppText style={styles.infoText}>
        Your language preference can be changed at any time in settings.
      </AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E6F2E6",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
    paddingBottom: Platform.OS === "android" ? 20 : 40,
  },
  header: {
    flexDirection: "row",
    width: width,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    textAlign: "center",
    flex: 1,
  },
  languageContainer: {
    width: "90%",
    marginTop: 20,
    flex: 1,
  },
  languageButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C6E1C6",
    paddingVertical: 15,
    borderRadius: 12,
    marginVertical: 8,
  },
  selectedButton: {
    backgroundColor: "#04302B",
  },
  languageText: {
    fontSize: 18,
    color: "#003d33",
  },
  selectedText: {
    color: "white",
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});
