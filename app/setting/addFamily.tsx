import React, { useState, useEffect } from "react";
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

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          await fetchFamilyMembers(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const fetchFamilyMembers = async (userData: any) => {
    try {
      setLoading(true);
      const response = await apiGet<{ members: FamilyMember[] }>('/family');
      setFamily(response.members || []);
    } catch (error: any) {
      console.error('Error fetching family members:', error);
      Alert.alert("Error", error.message || "Failed to load family members");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const addFamily = async () => {
    if (!phone || !relation || !name) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found. Please login again.");
      return;
    }

    setSaving(true);
    try {
      const elderId = user.role === 'elder' ? user._id : user._id; // For now, use current user's ID
      await apiPost('/family', {
        elderId,
        name: name.trim(),
        phone: phone.trim(),
        relation: relation.trim(),
      });
      
      // Refresh the list
      await fetchFamilyMembers(user);
      setPhone("");
      setRelation("");
      setName("");
      Alert.alert("Success", "Family member added successfully!");
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
        <AppTextInput
          placeholder="Phone Number"
          placeholderTextColor="#406B63"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <AppTextInput
          placeholder="Relation"
          placeholderTextColor="#406B63"
          value={relation}
          onChangeText={setRelation}
          style={styles.input}
        />
        <AppTextInput
          placeholder="Name"
          placeholderTextColor="#406B63"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TouchableOpacity 
          style={[styles.connectBtn, saving && styles.connectBtnDisabled]} 
          onPress={addFamily}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.connectBtnText}>Connect</Text>
          )}
        </TouchableOpacity>
      </View>

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
});
