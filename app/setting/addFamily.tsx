import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost, apiDelete } from "@/services/api";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

type FamilyMember = {
  _id: string;
  name: string;
  relation: string;
  phone: string;
};

// ✅ Custom TextInput to apply ArimaMadurai font to input and placeholder
const AppTextInput: React.FC<TextInputProps> = (props) => {
  return <TextInput {...props} style={[{ fontFamily: "ArimaMadurai_400Regular" }, props.style]} />;
};

export default function FamilyPage() {
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [name, setName] = useState("");
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [relationPickerVisible, setRelationPickerVisible] = useState(false);
  const [linkedElderId, setLinkedElderId] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  const normalizedRole = (user?.role || "").toString().trim().toLowerCase();

  const relationOptions = useMemo(() => {
    if (
      !normalizedRole ||
      normalizedRole.includes("elder") ||
      normalizedRole.includes("family")
    ) {
      return ["Elder", "Family Member", "Caregiver", "Doctor", "Emergency Contact"];
    }
    return ["Elder"];
  }, [normalizedRole]);

  const canManageFamily =
    !normalizedRole || normalizedRole.includes("elder") || normalizedRole.includes("family");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setLinkedElderId(userData.elderId || null);
          await fetchFamilyMembers(userData);
        }
        // Refresh user profile to get latest elderId
        try {
          const fresh = await apiGet<{ user: any }>('/users/me');
          if (fresh?.user) {
            setUser(fresh.user);
            setLinkedElderId((prev) => fresh.user.elderId || prev || null);
            await AsyncStorage.setItem('user', JSON.stringify(fresh.user));
            await fetchFamilyMembers(fresh.user);
          }
        } catch (apiError) {
          console.error('Error refreshing user profile:', apiError);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (relationOptions.length && !relation) {
      setRelation(relationOptions[0]);
    }
  }, [relationOptions, relation]);

  const fetchFamilyMembers = async (userData: any) => {
    try {
      setLoading(true);
      const response = await apiGet<{ members: any[] }>('/family');
      const members = (response.members || []).map((member) => ({
        _id: member._id,
        name: member.name,
        relation: member.relation,
        phone: member.phone,
      }));
      setFamily(members);
      
      // Extract elderId from family members if user is family role
      if (userData?.role?.toLowerCase() === 'family') {
        const elderFromMember = response.members?.find((m) => m.elderId);
        if (elderFromMember) {
          const elder = elderFromMember.elderId;
          setLinkedElderId(typeof elder === 'string' ? elder : elder?._id || null);
        }
      }
    } catch (error: any) {
      console.error('Error fetching family members:', error);
      Alert.alert("Error", error.message || "Failed to load family members");
    } finally {
      setLoading(false);
    }
  };

  const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "");
  const formatPhoneNumber = (value: string) => {
    const cleaned = normalizePhone(value);
    if (!cleaned) return "";
    if (cleaned.startsWith("+")) return cleaned;
    const withoutLeadingZero = cleaned.replace(/^0+/, "");
    return `+94${withoutLeadingZero}`;
  };

  if (!fontsLoaded) return null;

  const addFamily = async () => {
    if (!canManageFamily) {
      Alert.alert("Permission Required", "Only elder or family profiles can add connections.");
      return;
    }

    if (!phone || !relation || !name) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found. Please login again.");
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone.startsWith("+") || formattedPhone.length < 11) {
      Alert.alert("Invalid Number", "Please include the country code (e.g., +94XXXXXXXXX).");
      return;
    }

    const normalizedComparison = formattedPhone.replace(/^\+/, "");
    if (family.some((member) => normalizePhone(member.phone).replace(/^\+/, "") === normalizedComparison)) {
      Alert.alert("Duplicate Number", "This phone number is already linked to another family account.");
      return;
    }

    if (user.phoneNumber && normalizePhone(user.phoneNumber).replace(/^\+/, "") === normalizedComparison) {
      Alert.alert("Invalid Number", "You cannot add your own phone number as a family contact.");
      return;
    }

    setSaving(true);
    try {
      let elderId = user._id;
      let requestBody: any = {
        name: name.trim(),
        phone: formattedPhone,
        relation: relation?.trim() || "Family Member",
      };

      // If relation is "Elder", don't send elderId - backend will create elder account
      if (relation?.toLowerCase() === "elder") {
        // Backend will create elder account and link it
        requestBody.relation = "Elder";
      } else {
        // For other relations, need elderId
        if (normalizedRole.includes("family")) {
          const resolvedElderId = user.elderId || linkedElderId;
          if (!resolvedElderId) {
            Alert.alert(
              "Missing Elder Link",
              "Please add an elder first by selecting 'Elder' as the relation. This will create the elder account and link it to your family profile."
            );
            setSaving(false);
            return;
          }
          elderId = resolvedElderId;
        }
        requestBody.elderId = elderId;
      }

      const response = await apiPost<{ member: any; elderUser?: any }>('/family', requestBody);
      
      // If elder was created, update family user's elderId
      if (relation?.toLowerCase() === "elder" && response.elderUser) {
        const elderUserId = response.elderUser._id || response.elderUser.id;
        if (elderUserId && normalizedRole.includes("family")) {
          // Update family user with elderId
          try {
            const updatedUser = await apiGet<{ user: any }>('/users/me');
            if (updatedUser?.user) {
              setUser(updatedUser.user);
              setLinkedElderId(updatedUser.user.elderId || elderUserId);
              await AsyncStorage.setItem('user', JSON.stringify(updatedUser.user));
            }
          } catch (updateError) {
            console.error('Error updating user profile:', updateError);
          }
        }
      }
      
      // Refresh the list
      await fetchFamilyMembers(user);
      setPhone("");
      setRelation("");
      setName("");
      Alert.alert("Success", relation?.toLowerCase() === "elder" 
        ? "Elder account created and linked successfully! The elder can now login with their phone number."
        : "Family member added successfully!");
    } catch (error: any) {
      console.error('Error adding family member:', error);
      Alert.alert("Error", error.message || "Failed to add family member");
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: string) => {
    Alert.alert(
      "Delete Family Member",
      "Are you sure you want to delete this family member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDelete(`/family/${id}`);
              setFamily((prev) => prev.filter((item) => item._id !== id));
              Alert.alert("Success", "Family member deleted successfully!");
            } catch (error: any) {
              console.error('Error deleting family member:', error);
              Alert.alert("Error", error.message || "Failed to delete family member");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberDetails}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRelation}>{item.relation}</Text>
        {item.phone && <Text style={styles.memberPhone}>{item.phone}</Text>}
      </View>

      <View style={styles.memberActions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => deleteMember(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#B00020" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor="#EAF3E9"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <Ionicons name="chevron-back" size={26} color="#04302B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Add Family Members</Text>

        {/* Empty view to balance back button */}
        <View style={styles.headerIcon} />
      </View>

      {/* Inputs */}
      <View style={styles.inputSection}>
        {!canManageFamily && (
          <View style={styles.permissionBanner}>
            <Ionicons name="alert-circle" size={20} color="#B00020" />
            <Text style={styles.permissionText}>
              Only elder or family profiles can add or edit members on this device. Please switch accounts if you need to manage them.
            </Text>
          </View>
        )}
        <AppTextInput
          placeholder="Phone Number"
          placeholderTextColor="#406B63"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
          editable={canManageFamily}
        />
        <TouchableOpacity
          style={[styles.input, styles.relationPicker]}
          onPress={() => {
            if (!canManageFamily) {
              Alert.alert("Permission Required", "Only elder or family profiles can change relation.");
              return;
            }
            setRelationPickerVisible(true);
          }}
          activeOpacity={0.8}
          disabled={!canManageFamily}
        >
          <Text style={relation ? styles.relationText : styles.relationPlaceholder}>
            {relation || "Select Relation"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#406B63" />
        </TouchableOpacity>
        <AppTextInput
          placeholder="Name"
          placeholderTextColor="#406B63"
          value={name}
          onChangeText={setName}
          style={styles.input}
          editable={canManageFamily}
        />

        <TouchableOpacity 
          style={[styles.connectBtn, (saving || !canManageFamily) && styles.connectBtnDisabled]} 
          onPress={addFamily}
          disabled={saving || !canManageFamily}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.connectBtnText}>Connect</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={relationPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRelationPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Relation</Text>
            {relationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.pickerOption}
                onPress={() => {
                  setRelation(option);
                  setRelationPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    relation === option && styles.pickerOptionSelected,
                  ]}
                >
                  {option}
                </Text>
                {relation === option && (
                  <Ionicons name="checkmark" size={18} color="#04302B" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Family List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#04302B" />
        </View>
      ) : (
        <FlatList
          data={family}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          style={styles.familyList}
          contentContainerStyle={styles.familyListContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No family members added yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EAF3E9",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
    textAlign: "center",
    flex: 1,
    padding: 15,
  },
  headerIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inputSection: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#CFE2D3",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 6,
    fontSize: 16,
    color: "#04302B",
    fontFamily: "ArimaMadurai_400Regular",

  },
  connectBtn: {
    backgroundColor: "#04302B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  connectBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "ArimaMadurai_700Bold",
  },
  familyList: {
    flex: 1,
  },
  familyListContainer: {
    paddingBottom: 20,
  },
  memberCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CFE2D3",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    color: "#04302B",
    fontFamily: "ArimaMadurai_700Bold",
    fontSize: 16,
  },
  memberRelation: {
    color: "#406B63",
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: 14,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    marginLeft: 10,
  },
  connectBtnDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: 14,
    color: "#666",
  },
  memberPhone: {
    color: "#666",
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  permissionBanner: {
    flexDirection: "row",
    backgroundColor: "#FEEFEF",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  permissionText: {
    flex: 1,
    color: "#7A1F1F",
    fontFamily: "ArimaMadurai_400Regular",
  },
  relationPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  relationText: {
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
  },
  relationPlaceholder: {
    fontFamily: "ArimaMadurai_400Regular",
    color: "#406B63",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  pickerCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },
  pickerTitle: {
    fontFamily: "ArimaMadurai_700Bold",
    fontSize: 18,
    color: "#04302B",
    marginBottom: 10,
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E6E3",
  },
  pickerOptionText: {
    fontFamily: "ArimaMadurai_400Regular",
    color: "#04302B",
    fontSize: 16,
  },
  pickerOptionSelected: {
    fontFamily: "ArimaMadurai_700Bold",
  },
});
