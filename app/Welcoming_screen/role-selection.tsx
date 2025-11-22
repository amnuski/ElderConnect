import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet } from "@/services/api";

const { width } = Dimensions.get("window");
// Width used for snapping between cards: card width (0.56w) + horizontal margins (0.1w)
const ITEM_WIDTH = width * 0.66;
// Padding to center the first and last items when snapping to center
const H_PADDING = Math.max(0, (width - ITEM_WIDTH) / 2);

export default function RoleSelectionScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // Animated value for checkmark
  const checkAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  // Check if user already has a role - if yes, redirect to their dashboard
  useEffect(() => {
    const checkExistingRole = async () => {
      try {
        setCheckingRole(true);
        
        // First check AsyncStorage
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('[ROLE SELECTION] User from AsyncStorage:', user);
          
          // If user already has a role, redirect to their dashboard immediately
          if (user && user.role && user.role.trim() !== '') {
            console.log('[ROLE SELECTION] User has role:', user.role, '- Redirecting to dashboard');
            switch (user.role.toLowerCase()) {
              case 'elder':
              case 'family':
                router.replace('/Family/dash');
                return;
              case 'driver':
                router.replace('/Driver/Driver-dash');
                return;
            }
          }
        }
        
        // Also check from API to ensure we have latest data from database
        try {
          const response = await apiGet<{ user: any }>('/users/me');
          console.log('[ROLE SELECTION] User from API:', response.user);
          
          if (response.user && response.user.role && response.user.role.trim() !== '') {
            await AsyncStorage.setItem('user', JSON.stringify(response.user));
            console.log('[ROLE SELECTION] User has role from API:', response.user.role, '- Redirecting to dashboard');
            switch (response.user.role.toLowerCase()) {
              case 'elder':
              case 'family':
                router.replace('/Family/dash');
                return;
              case 'driver':
                router.replace('/Driver/Driver-dash');
                return;
            }
          }
        } catch (apiError: any) {
          // API might fail if not authenticated, continue with role selection
          console.log('[ROLE SELECTION] API check failed (user might not be authenticated yet):', apiError?.message);
        }
        
        // If we reach here, user has no role - show role selection screen
        console.log('[ROLE SELECTION] User has no role - showing role selection');
        setCheckingRole(false);
      } catch (error) {
        console.error('[ROLE SELECTION] Error checking user role:', error);
        // Continue with role selection if check fails
        setCheckingRole(false);
      }
    };
    checkExistingRole();
  }, []);

  if (!fontsLoaded || checkingRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#042222" />
        <Text style={{ marginTop: 10, color: "#042222", fontFamily: "ArimaMadurai_400Regular" }}>
          Checking account...
        </Text>
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
      key: "driver", // driver role
      label: "Driver",
      description: "Hi, I am a Driver\nI want to assist elders.",
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
    if (selectedRole === roleKey) {
      // unselect without scrolling back
      setSelectedRole(null);

      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(checkAnim, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    setSelectedRole(roleKey);

  scrollRef.current?.scrollTo({
      x: index * ITEM_WIDTH,
      animated: true,
    });

    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(checkAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    if (selectedRole === "elder" || selectedRole === "family") {
      router.push({
        pathname: "/Welcoming_screen/profile-info",
        params: { role: selectedRole },
      });
    } else if (selectedRole === "driver") {
      router.push({
        pathname: "/Welcoming_screen/driver-profile",
        params: { role: selectedRole },
      });
    }
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#B6DDB3"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <Text style={[styles.title, { fontFamily: "ArimaMadurai_700Bold" }]}>
        Choose Yourself
      </Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: H_PADDING }]}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="center"
        disableIntervalMomentum
        snapToOffsets={roles.map((_, i) => i * ITEM_WIDTH)}
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
                style={[
                  styles.roleName,
                  { fontFamily: "ArimaMadurai_700Bold" },
                ]}
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

              {/* Animated Checkmark */}
              <Animated.View
                style={[
                  styles.checkMark,
                  {
                    opacity: checkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, isSelected ? 1 : 0],
                    }),
                    transform: [
                      {
                        scale: checkAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.checkText}>✓</Text>
              </Animated.View>
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
            onPress={handleContinue}
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
    width: width * 0.56,
    height: 450,
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
    marginTop: 70,
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
    marginBottom: 40,
    width: "70%",
    alignItems: "center",
  },
  continueText: {
    color: "#A0C9A4",
    fontSize: 18,
  },
});
