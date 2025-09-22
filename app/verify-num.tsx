import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";
import { KaushanScript_400Regular } from "@expo-google-fonts/kaushan-script";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert,
} from "react-native";
import CountryPicker, { CountryCode } from "react-native-country-picker-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";

export default function PhoneNumberScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("LK"); // default Sri Lanka
  const [callingCode, setCallingCode] = useState("94");
  const [showPicker, setShowPicker] = useState(false);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
    KaushanScript_400Regular,
  });

  if (!fontsLoaded) return null;

  const handleSendCode = () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    const fullNumber = `+${callingCode}${phoneNumber}`;
    console.log(`Sending code to: ${fullNumber}`);

    Alert.alert("Code Sent", `OTP sent to ${fullNumber}`);

    router.push("/otp"); // navigate to OTP screen
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={["#FFFFFF", "#B6DDB3"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        
      >
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={Platform.OS === "ios" ? 40 : 60}
          extraHeight={Platform.OS === "ios" ? 60 : 80}
          keyboardOpeningTime={0}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.header}>
            <Image
              source={require("../assets/images/elderconnect-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { fontFamily: "KaushanScript_400Regular" }]}>
              Elder Connect
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={[styles.title, { fontFamily: "ArimaMadurai_700Bold" }]}>
              Enter Your Phone Number
            </Text>

            {/* Country Picker + Phone Input */}
            <View style={styles.inputRow}>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={styles.countryDisplay}
              >
                <CountryPicker
                  countryCode={countryCode}
                  withFilter
                  withFlag
                  withCallingCode
                  withEmoji
                  visible={showPicker}
                  onSelect={(country) => {
                    setCountryCode(country.cca2 as CountryCode);
                    setCallingCode(country.callingCode[0]);
                    setShowPicker(false);
                  }}
                  onClose={() => setShowPicker(false)}
                />
                <Text style={styles.countryCodeText}>+{callingCode}</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.phoneInput, { fontFamily: "ArimaMadurai_400Regular" }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="123 456 7890"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                maxLength={20}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            {/* Send Code Button */}
            <TouchableOpacity
              onPress={handleSendCode}
              activeOpacity={0.85}
              style={{ width: "100%" }}
            >
              <LinearGradient
                colors={["#042222", "#042222"]}
                style={styles.sendButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.sendButtonText, { fontFamily: "ArimaMadurai_700Bold" }]}>
                  Send Code
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: Platform.OS === "ios" ? 30 : 80,
  },
  logo: { width: 200, height: 200 },
  appName: { fontSize: 32, color: "#042222", marginTop: -40, textAlign: "center" },
  card: {
    width: "90%",
    backgroundColor: "#53725aff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 20,
  },
  title: { fontSize: 20, color: "#ffffff", marginBottom: 20, textAlign: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 56,
    marginBottom: 24,
  },
  countryDisplay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
    color: "#042222",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#042222",
    marginLeft: 10,
  },
  sendButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    marginTop: 20,
  },
  sendButtonText: { color: "#B8DEB5", fontSize: 18, fontWeight: "700" },
});
