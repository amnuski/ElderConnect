// app/otp.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  KaushanScript_400Regular,
} from "@expo-google-fonts/kaushan-script";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", ""]);

  // store references to each TextInput
  const inputs = useRef<Array<TextInput | null>>([]);

  const [fontsLoaded] = useFonts({
    KaushanScript_400Regular,
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus(); // auto focus next
    }
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length === 4) {
      Alert.alert("OTP Entered", code);
      // Example success: navigate to home (update path as needed)
      router.push("/role-selection");
    } else {
      Alert.alert("Error", "Please enter all 4 digits.");
    }
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#B6DDB3"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inner}
      >
        <Text style={[styles.title, { fontFamily: "ArimaMadurai_700Bold" }]}>
          Verify Code
        </Text>
        <Text
          style={[styles.subtitle, { fontFamily: "ArimaMadurai_400Regular" }]}
        >
          Enter your verification code from your phone number that we’ve sent
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              keyboardType="number-pad"
              maxLength={1}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
          <Text
            style={[
              styles.verifyText,
              { fontFamily: "ArimaMadurai_700Bold" },
            ]}
          >
            Verify
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    color: "#042222",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#0422229b",
    textAlign: "center",
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 40,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#042222ff",
    backgroundColor: "#B6DDB3",
    borderRadius: 12,
    width: 55,
    height: 75,
    textAlign: "center",
    fontSize: 20,
    color: "#042222",
    padding:20,
  },
  verifyButton: {
    backgroundColor: "#042222",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
  },
  verifyText: {
    color: "#A0C9A4",
    fontSize: 18,
  },
});
