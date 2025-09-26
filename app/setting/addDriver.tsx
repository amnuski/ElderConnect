import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";  

const { width } = Dimensions.get("window");

type Driver = {
  id: string;
  name: string;
  phone: string;
};

export default function AddDriversScreen() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: "1", name: "Raja", phone: "Jaffna" },
    { id: "2", name: "Abi", phone: "Chunnagam" },
  ]);

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
        <TouchableOpacity style={styles.iconBtn} >
          <Ionicons name="create-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => deleteDriver(item.id)}>
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Back & Notification */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>Add Drivers</Text>

      {/* Inputs */}
      <View style={styles.inputSection}>
        <TextInput
          placeholder="Driver Phone Number"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TextInput
          placeholder="Name"
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
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Bottom Navigation */}
     
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d7edda",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#c6e1c6",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  connectBtn: {
    backgroundColor: "#04302b",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  connectBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  driverCard: {
    backgroundColor: "#04302b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
  },
  driverName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  driverPhone: {
    color: "#c6e1c6",
    fontSize: 14,
  },
  driverActions: {
    flexDirection: "row",
  },
  iconBtn: {
    marginLeft: 10,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  activeButton: {
    backgroundColor: "#04302b",
    padding: 12,
    borderRadius: 50,
  },
});
