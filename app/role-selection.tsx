import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";

const { width } = Dimensions.get("window");

export default function RoleSelectionScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  // Show loader until fonts are ready (avoids hook order bug)
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#042222" />
      </View>
    );
  }

  const roles = [
    {
      key: "elder",
      label: "Elder",
      description: "Hi, I am an Elder\nI want care and reminders.",
      image: require("@/assets/images/elder.png"),
    },
    {
      key: "caregiver",
      label: "Caregiver",
      description: "Hi, I am a Caregiver\nI want to assist elders.",
      image: require("@/assets/images/caregiver.png"),
    },
    {
      key: "family",
      label: "Family",
      description: "Hi, I am Family\nI want to stay connected.",
      image: require("@/assets/images/family.png"),
    },
  ];

  const handleSelectRole = (roleKey: string, index: number) => {
    // if same role clicked again → unselect
    if (selectedRole === roleKey) {
      setSelectedRole(null);
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    setSelectedRole(roleKey);

    scrollRef.current?.scrollTo({
      x: index * (width * 0.8),
      animated: true,
    });

    Animated.timing(buttonOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#B6DDB3"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Text style={[styles.title, { fontFamily: "ArimaMadurai_700Bold" }]}>
        Choose Yourself
      </Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {roles.map((role, index) => {
          const isSelected = selectedRole === role.key;

          return (
            <TouchableOpacity
              key={role.key}
              style={styles.card}
              onPress={() => handleSelectRole(role.key, index)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.circleWrapper,
                  isSelected && styles.selectedCircleWrapper,
                ]}
              >
                <Image
                  source={role.image}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[styles.roleName, { fontFamily: "ArimaMadurai_700Bold" }]}
              >
                {role.label}
              </Text>
              <Text
                style={[
                  styles.roleDesc,
                  { fontFamily: "ArimaMadurai_400Regular" },
                ]}
              >
                {role.description}
              </Text>

              {isSelected && (
                <View style={styles.checkMark}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Animated.View
        style={{
          opacity: buttonOpacity,
          width: "100%",
          alignItems: "center",
        }}
      >
        {selectedRole && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push("/")}
          >
            <Text
              style={[
                styles.continueText,
                { fontFamily: "ArimaMadurai_700Bold" },
              ]}
            >
              Continue
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    color: "#042222",
    marginBottom: 30,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  card: {
    width: width * 0.7,
    height: 500,
    backgroundColor: "#042222",
    borderRadius: 200,
    paddingVertical: 40,
    alignItems: "center",
    marginHorizontal: width * 0.05,
    shadowColor: "#042222",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginTop: -10,
  },
  circleWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#A0C9A4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
    overflow: "hidden",
  },
  selectedCircleWrapper: {
    borderWidth: 0,
    borderColor: "#55c560ff",
    shadowColor: "#338f3cff",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
   
  },
  image: {
    width: "100%",
    height: "100%",
  },
  roleName: {
    fontSize: 30,
    color: "#A0C9A4",
    marginTop: -10,
  },
  roleDesc: {
    fontSize: 14,
    color: "#a9aeaaff",
    textAlign: "center",
    paddingHorizontal: 5,
  },
  checkMark: {
    marginTop: 105,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#A0C9A4",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#071f1fff",
    fontSize: 18,
    fontWeight: "700",
  },
  continueButton: {
    backgroundColor: "#042222",
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 30,
    width: "70%",
    alignItems: "center",
  },
  continueText: {
    color: "#A0C9A4",
    fontSize: 18,
  },
});
