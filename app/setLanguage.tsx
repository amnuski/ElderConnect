import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar as RNStatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const languages = ["தமிழ்", "English", "සිංහල"];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Status Bar */}
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor="#E6F2E6"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
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
            <Text
              style={[
                styles.languageText,
                selectedLanguage === lang && styles.selectedText,
              ]}
            >
              {lang}
            </Text>
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
      <Text style={styles.infoText}>
        Your language preference can be changed at any time in settings.
      </Text>

      {/* Bottom Navigation (Example) */}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E6F2E6",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
    paddingBottom: Platform.OS === "android" ? 20 : 40, // safe bottom padding
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
    fontWeight: "600",
  },
  languageContainer: {
    width: "90%",
    marginTop: 20,
    flex: 1, // fills available space
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
    backgroundColor: "#003d33",
  },
  languageText: {
    fontSize: 18,
    fontWeight: "500",
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
    marginBottom: 20, // ensures text is above bottom nav
  },
  bottomNav: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "#E6F2E6",
  },
  centerButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 50,
    elevation: 5,
  },
});
