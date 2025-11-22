// app/otp.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  KaushanScript_400Regular,
} from "@expo-google-fonts/kaushan-script";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";
import { apiPost } from "@/services/api";

interface User {
  _id: string;
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  role?: string;
  isVerified: boolean;
}

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phoneNumber = params.phone as string;
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digits OTP
  const [loading, setLoading] = useState(false);

  // store references to each TextInput
  const inputs = useRef<Array<TextInput | null>>([]);

  const [fontsLoaded] = useFonts({
    KaushanScript_400Regular,
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    if (!phoneNumber) {
      Alert.alert("Error", "Phone number is required");
      router.back();
    }
  }, [phoneNumber]);

  if (!fontsLoaded) return null;

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus(); // auto focus next
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter all 6 digits.");
      return;
    }

    if (!phoneNumber) {
      Alert.alert("Error", "Phone number is missing.");
      return;
    }

    setLoading(true);

    try {
      // Verify OTP with backend
      const response = await apiPost<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/verify-otp', {
        phoneNumber: phoneNumber,
        otp: code,
      });

      // Store tokens in AsyncStorage
      await AsyncStorage.setItem('accessToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      setLoading(false);

      // Check if phoneNumber exists in database with role (using phoneNumber as primary key)
      // If user has role → existing account → go to dashboard immediately
      // If user has no role → new account → go to role selection
      console.log('[OTP VERIFY] User data received:', {
        phoneNumber: response.user?.phoneNumber,
        role: response.user?.role,
        hasRole: !!(response.user && response.user.role && response.user.role.trim() !== '')
      });
      
      if (response.user && response.user.role && response.user.role.trim() !== '') {
        // Phone number already registered with role → existing account → go to dashboard
        const role = response.user.role.toLowerCase();
        console.log('[OTP VERIFY] Existing user with role:', role, 'Phone:', response.user.phoneNumber, '- Redirecting to dashboard');
        
        switch (role) {
          case 'elder':
          case 'family':
            router.replace('/Family/dash');
            break;
          case 'driver':
            router.replace('/Driver/Driver-dash');
            break;
          default:
            console.log('[OTP VERIFY] Unknown role:', role, '- Going to role selection');
            router.replace('/Welcoming_screen/role-selection');
        }
      } else {
        // Phone number not in database OR no role → new account → go to role selection
        console.log('[OTP VERIFY] New phone number or no role. Phone:', response.user?.phoneNumber, '- Going to role selection');
        router.replace('/Welcoming_screen/role-selection');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('OTP verification error:', error);
      Alert.alert(
        "Verification Failed",
        error.message || "Invalid OTP. Please try again."
      );
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

        <TouchableOpacity 
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]} 
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#A0C9A4" />
          ) : (
            <Text
              style={[
                styles.verifyText,
                { fontFamily: "ArimaMadurai_700Bold" },
              ]}
            >
              Verify
            </Text>
          )}
        </TouchableOpacity>
        
        {phoneNumber && (
          <Text style={styles.phoneText}>
            Code sent to {phoneNumber}
          </Text>
        )}
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
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
    marginBottom: 40,
    gap: 10,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#042222ff",
    backgroundColor: "#B6DDB3",
    borderRadius: 12,
    width: 50,
    height: 65,
    textAlign: "center",
    fontSize: 24,
    color: "#042222",
    padding: 0,
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
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  phoneText: {
    marginTop: 20,
    fontSize: 12,
    color: "#04222299",
    fontFamily: "ArimaMadurai_400Regular",
  },
});
