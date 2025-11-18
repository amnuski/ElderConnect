// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Load custom fonts
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Keep splash screen visible until fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; // Optional: Custom loading component can go here
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Root Screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Welcoming Screen Pages */}
          <Stack.Screen name="Welcoming_screen/verify-num" />
          <Stack.Screen name="Welcoming_screen/otp" />
          <Stack.Screen name="Welcoming_screen/role-selection" />
          <Stack.Screen name="Welcoming_screen/profile-info" />
          <Stack.Screen name="Welcoming_screen/driver-profile" />
          <Stack.Screen name="Welcoming_screen/onboarding" />

          {/* Family Screens */}
          <Stack.Screen name="Family/schedule_page" />
          <Stack.Screen name="Family/dash" />
          <Stack.Screen name="Family/add_schedule" />
          <Stack.Screen name="map/Location_screen" />

          {/* Call Screens */}
          <Stack.Screen name="Call/callattend" />
          <Stack.Screen name="Call/CareTakerCall" />
          <Stack.Screen name="Call/DriverCall" />
          <Stack.Screen name="Call/FamilyCall" />
          <Stack.Screen name="Call/contactList" />


          {/* Driver Screens */}
          <Stack.Screen name="Driver/Driver-dash" />
          <Stack.Screen name="Driver/ride" />
          <Stack.Screen name="Driver/profile" />
          <Stack.Screen name="Driver/setting/edit-profile" />
          <Stack.Screen name="Driver/setting/language" />


          {/* Setting Screens */}
          <Stack.Screen name="setting/setting" />
          <Stack.Screen name="setting/addDriver" />
          <Stack.Screen name="setting/addFamily" />
          <Stack.Screen name="setting/emgencyAdd" />
          <Stack.Screen name="setting/profile" />
          <Stack.Screen name="setting/setLanguage" />
        </Stack>

        {/* StatusBar adapts to theme */}
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
