import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
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

type Driver = {
  _id: string;
  name: string;
  phone: string;
  relation?: string;
};

// Custom TextInput with ArimaMadurai font
const AppTextInput: React.FC<TextInputProps> = (props) => (
  <TextInput
    {...props}
    style={[{ fontFamily: "ArimaMadurai_400Regular" }, props.style]}
  />
);

export default function AddDriversScreen() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await apiGet<{ contacts: Driver[] }>('/contacts');
      // Filter only drivers
      const driverContacts = (response.contacts || []).filter(
        (contact) => contact.relation === 'driver'
      );
      setDrivers(driverContacts);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      Alert.alert("Error", error.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const addDriver = async () => {
    if (!phone || !name) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      await apiPost('/contacts', {
        name: name.trim(),
        phone: phone.trim(),
        relation: 'driver',
      });
      
      // Refresh the list
      await fetchDrivers();
      setPhone("");
      setName("");
      Alert.alert("Success", "Driver added successfully!");
    } catch (error: any) {
      console.error('Error adding driver:', error);
      Alert.alert("Error", error.message || "Failed to add driver");
    } finally {
      setSaving(false);
    }
  };

  const deleteDriver = async (id: string) => {
    Alert.alert(
      "Delete Driver",
      "Are you sure you want to delete this driver?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDelete(`/contacts/${id}`);
              setDrivers((prev) => prev.filter((d) => d._id !== id));
              Alert.alert("Success", "Driver deleted successfully!");
            } catch (error: any) {
              console.error('Error deleting driver:', error);
              Alert.alert("Error", error.message || "Failed to delete driver");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Driver }) => (
    <View style={styles.driverCard}>
      <View>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.driverPhone}>{item.phone}</Text>
      </View>
      <View style={styles.driverActions}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => deleteDriver(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#B00020" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0 }]}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={26} color="#04302B" />
        </TouchableOpacity>

        <Text style={styles.title}>Add Drivers</Text>

        {/* Empty view to balance back button */}
        <View style={styles.headerIcon} />
      </View>

      {/* Inputs */}
      <View style={styles.inputSection}>
        <AppTextInput
          placeholder="Enter Driver Phone Number"
          placeholderTextColor="#406B63"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <AppTextInput
          placeholder="Enter Driver Name"
          placeholderTextColor="#406B63"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TouchableOpacity 
          style={[styles.connectBtn, saving && styles.connectBtnDisabled]} 
          onPress={addDriver}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.connectBtnText}>Connect</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Driver List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#04302B" />
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No drivers added yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF3E9",
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  headerIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
    textAlign: "center",
    flex: 1,
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#CFE2D3",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 6,
    fontSize: 14,
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
    fontFamily: "ArimaMadurai_700Bold",
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  driverCard: {
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
  driverName: {
    color: "#04302B",
    fontFamily: "ArimaMadurai_700Bold",
    fontSize: 16,
  },
  driverPhone: {
    color: "#406B63",
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: 14,
  },
  driverActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
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
});
