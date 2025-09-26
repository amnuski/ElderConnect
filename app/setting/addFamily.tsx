import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

type FamilyMember = {
  id: string;
  name: string;
  relation: string;
};

export default function FamilyPage() {
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [name, setName] = useState("");
  const [family, setFamily] = useState<FamilyMember[]>([
    { id: "1", name: "Kavi", relation: "Son" },
    { id: "2", name: "Ashu", relation: "Son" },
  ]);

  const addFamily = () => {
    if (phone && relation && name) {
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name,
        relation,
      };
      setFamily((prev) => [...prev, newMember]);
      setPhone("");
      setRelation("");
      setName("");
    }
  };

  const deleteMember = (id: string) => {
    setFamily((prev) => prev.filter((item) => item.id !== id));
  };

  const renderItem = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberDetails}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRelation}>{item.relation}</Text>
      </View>

      <View style={styles.memberActions}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="create-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => deleteMember(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor="#e6f2e6"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Add Family Members</Text>

        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {/* Inputs */}
      <View style={styles.inputSection}>
        <TextInput
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TextInput
          placeholder="Relation"
          value={relation}
          onChangeText={setRelation}
          style={styles.input}
        />
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TouchableOpacity style={styles.connectBtn} onPress={addFamily}>
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      </View>

      {/* Family List */}
      <FlatList
        data={family}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.familyList}
        contentContainerStyle={styles.familyListContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e6f2e6",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
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
    backgroundColor: "#d6e9d6",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 6,
    fontSize: 16,
    elevation: 1,
  },
  connectBtn: {
    backgroundColor: "#04302b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  connectBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  familyList: {
    flex: 1,
  },
  familyListContainer: {
    paddingBottom: 20,
  },
  memberCard: {
    backgroundColor: "#00584a",
    borderRadius: 10,
    padding: 15,
    marginVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  memberRelation: {
    color: "lightgray",
    fontSize: 14,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    marginLeft: 10,
  },
});
