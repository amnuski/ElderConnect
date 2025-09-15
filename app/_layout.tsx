import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      {/* Status bar setup */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Expo Router Stack Navigator */}
      <Stack
        screenOptions={{
          headerShown: false,   // hide default headers
          animation: "fade",    // smooth fade between screens
        }}
      >
        {/* You don’t need to declare every screen here.
            Expo Router auto-detects files in /app folder */}
      </Stack>
    </>
  );
}
