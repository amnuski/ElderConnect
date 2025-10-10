// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

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
    return null; // Optional: You could return a custom loading component here
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Root Screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="phone-number" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="profile-info" />
        <Stack.Screen name="driver-profile" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Family Screens */}
        <Stack.Screen name="Family/schedule_page" />
        <Stack.Screen name="Family/dash" />
        <Stack.Screen name="Family/add_schedule" />
        <Stack.Screen name="map/Location_screen" />


       {/* Driver Screens */}
        <Stack.Screen name="Driver/dashboard" />


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
  );
}
