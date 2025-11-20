// app/Welcoming_screen/driver-profile.tsx
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

export default function DriverProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role as string; // Should be 'driver'

  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [profileUri, setProfileUri] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load fonts
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    if (!role || role !== 'driver') {
      Alert.alert("Error", "Driver role is required");
      router.back();
    }
  }, [role]);

  if (!fontsLoaded) return null;

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) setProfileUri(result.assets[0].uri);
  };

  const pickLicenseImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled) setLicenseImage(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !age.trim() || !licenseNo.trim() || !licenseImage) {
      Alert.alert("Error", "Please fill all fields and upload your license image");
      return;
    }

    if (!role || role !== 'driver') {
      Alert.alert("Error", "Driver role is required");
      return;
    }

    setLoading(true);

    try {
      // Update user profile with driver information
      const updateData: any = {
        firstName: firstName.trim(),
        age: parseInt(age),
        role: 'driver',
        licenseNumber: licenseNo.trim(),
      };

      // Add images if selected (in production, upload to server first)
      if (profileUri) {
        updateData.profileImage = profileUri; // In production, upload to cloud storage first
      }
      if (licenseImage) {
        updateData.licenseImage = licenseImage; // In production, upload to cloud storage first
      }

      const response = await apiPut<{ user: any }>('/users/me', updateData);

      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      setLoading(false);

      // Navigate to driver dashboard
      router.replace('/Driver/Driver-dash');
    } catch (error: any) {
      setLoading(false);
      console.error('Driver profile update error:', error);
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
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#042222" />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Text style={[styles.title, { fontFamily: "ArimaMadurai_700Bold" }]}>
            Profile info
          </Text>
          <Text
            style={[styles.subtitle, { fontFamily: "ArimaMadurai_400Regular" }]}
          >
            Please provide your name and profile photo
          </Text>
        </View>

        {/* Profile Image */}
        <View style={styles.imageContainer}>
          <Image
            source={
              profileUri
                ? { uri: profileUri }
                : require("../../assets/images/profile.png")
            }
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={pickProfileImage}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <TextInput
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          style={[styles.input, { fontFamily: "ArimaMadurai_400Regular" }]}
          placeholderTextColor="#04222299"
        />

        <TextInput
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          style={[styles.input, { fontFamily: "ArimaMadurai_400Regular" }]}
          placeholderTextColor="#04222299"
        />

        <TextInput
          placeholder="License No"
          value={licenseNo}
          onChangeText={setLicenseNo}
          style={[styles.input, { fontFamily: "ArimaMadurai_400Regular" }]}
          placeholderTextColor="#04222299"
        />

        {/* Upload License Image */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Upload Licence Image</Text>

          <TouchableOpacity style={styles.uploadBox} onPress={pickLicenseImage}>
            {licenseImage ? (
              <Image source={{ uri: licenseImage }} style={styles.licensePreview} />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="cloud-upload-outline" size={28} color="#04222299" />
                <Text style={styles.browseText}>Browse Files</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.fileTypes}>
            Accepted File Types : PNG/JPG/JPEG
          </Text>
        </View>

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
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[styles.submitText, { fontFamily: "ArimaMadurai_700Bold" }]}
              >
                Submit
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  backButton: { position: "absolute", top: 55, left: 7, zIndex: 10 },
  title: { fontSize: 22, color: "#042222", fontWeight: "bold" },
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
    width: 180,
    height: 180,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#B6DDB3",
    backgroundColor: "#E5E7EB",
    marginTop: -40,
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
    padding: 10,
    fontSize: 16,
    color: "#042222",
    elevation: 3,
    marginTop: 10,
  },

  // 🔽 Upload Section Styles
  uploadSection: {
    width: "100%",
    marginTop: 15,
  },
  uploadTitle: {
    fontSize: 14,
    color: "#042222",
    marginBottom: 8,
    fontFamily: "ArimaMadurai_400Regular",
  },
  uploadBox: {
    width: "100%",
    height: 100,
    backgroundColor: "#B6DDB3",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#04222299",
    justifyContent: "center",
    alignItems: "center",
  },
  browseText: {
    marginTop: 5,
    fontSize: 14,
    color: "#042222",
    fontWeight: "bold",
  },
  fileTypes: {
    marginTop: 8,
    fontSize: 12,
    color: "#04222299",
    fontFamily: "ArimaMadurai_400Regular",
    textAlign: "center",
  },
  licensePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },

  submitButton: {
    marginTop: -20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    width: 320,
    alignSelf: "center",
  },
  submitText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
