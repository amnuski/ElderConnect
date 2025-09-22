// app/profile-info.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from "@expo-google-fonts/arima-madurai";
import { useRouter } from "expo-router";

export default function ProfileInfoScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Load fonts
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) return null; // or a loading indicator

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

  const handleSubmit = () => {
    if (!firstName.trim()) {
      alert("Please enter your name");
      return;
    }
    console.log("Submitted:", { firstName, imageUri });
    router.push("/role-selection");
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
          onPress={() => router.push("/role-selection")}
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
                : require("../assets/images/profile.png")
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
        >
          <LinearGradient
            colors={["#042222", "#042222"]}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text
              style={[styles.submitText, { fontFamily: "ArimaMadurai_700Bold" }]}
            >
              Continue
            </Text>
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
});
