// app/Welcoming_screen/profile-info.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiPut } from "@/services/api";

export default function ProfileInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role as string; // 'elder' or 'family'
  
  const [firstName, setFirstName] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load fonts
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    if (!role) {
      Alert.alert("Error", "Role is required");
      router.back();
    }
  }, [role]);

  if (!fontsLoaded) return null;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!role) {
      Alert.alert("Error", "Role is missing");
      return;
    }

    setLoading(true);

    try {
      // Update user profile with role and name
      const updateData: any = {
        firstName: firstName.trim(),
        role: role,
      };

      // Add profile image if selected (in production, upload to server first)
      if (imageUri) {
        updateData.profileImage = imageUri; // In production, upload to cloud storage first
      }

      const response = await apiPut<{ user: any }>('/users/me', updateData);

      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      setLoading(false);

      // Navigate to dashboard based on role
      if (role === 'elder' || role === 'family') {
        router.replace('/Family/dash');
      } else {
        router.replace('/Welcoming_screen/role-selection');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Profile update error:', error);
      Alert.alert(
        "Error",
        error.message || "Failed to save profile. Please try again."
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
        style={{ flex: 1, width: "100%" }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.push("/Welcoming_screen/verify-num")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#042222" />
        </TouchableOpacity>

        {/* Title + Subtitle */}
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Text style={[styles.title, { fontFamily: "ArimaMadurai_700Bold" }]}>
            Profile info
          </Text>
          <Text
            style={[styles.subtitle, { fontFamily: "ArimaMadurai_400Regular" }]}
          >
            Please provide your name and{"\n"}profile photo
          </Text>
        </View>

        {/* Profile Image + Camera Button */}
        <View style={styles.imageContainer}>
          <Image
            source={
              imageUri
                ? { uri: imageUri }
                : require("../../assets/images/profile.png") // ✅ FIXED
            }
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Name Input */}
        <TextInput
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          style={[styles.input, { fontFamily: "ArimaMadurai_400Regular" }]}
          placeholderTextColor="#04222299"
        />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          style={{ width: "100%", marginTop: 30 }}
          disabled={loading}
        >
          <LinearGradient
            colors={["#042222", "#042222"]}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[styles.submitText, { fontFamily: "ArimaMadurai_700Bold" }]}
              >
                Continue
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    top: 55,
    left: 7,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    color: "#042222",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 15,
    color: "#042222",
    marginBottom: 25,
  },
  imageContainer: {
    marginTop: 25,
    marginBottom: 25,
    alignItems: "center",
    position: "relative",
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#B6DDB3",
    backgroundColor: "#E5E7EB",
  },
  cameraButton: {
    position: "absolute",
    bottom: 5,
    right: 88,
    backgroundColor: "#042222",
    borderRadius: 20,
    padding: 6,
  },
  input: {
    width: "100%",
    backgroundColor: "#B6DDB3",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#042222",
    elevation: 3,
    marginTop: 10,
  },
  submitButton: {
    marginTop: 150,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    width: 320,
    alignSelf: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
