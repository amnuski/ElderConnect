import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

type Driver = {
  id: string;
  name: string;
  phone: string;
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
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: "1", name: "Raja", phone: "Jaffna" },
    { id: "2", name: "Abi", phone: "Chunnagam" },
  ]);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) return null;

  const addDriver = () => {
    if (phone && name) {
      const newDriver: Driver = {
        id: Date.now().toString(),
        name,
        phone,
      };
      setDrivers((prev) => [...prev, newDriver]);
      setPhone("");
      setName("");
    }
  };

  const deleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  const renderItem = ({ item }: { item: Driver }) => (
    <View style={styles.driverCard}>
      <View>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.driverPhone}>{item.phone}</Text>
      </View>
      <View style={styles.driverActions}>
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="create-outline" size={20} color="04302B" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => deleteDriver(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="B00020" />
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
        <TouchableOpacity style={styles.connectBtn} onPress={addDriver}>
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      </View>

      {/* Driver List */}
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
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
});
