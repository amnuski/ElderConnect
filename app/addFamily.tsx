import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ListRenderItem,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
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

  const renderItem: ListRenderItem<FamilyMember> = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberDetails}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRelation}>{item.relation}</Text>
      </View>

      <View style={styles.memberActions}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="create-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => deleteMember(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="white" />
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

        <Text style={styles.headerTitle}>Add Your Family Members</Text>

        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      {/* Inputs */}
      <View style={styles.inputSection}>
        <TextInput
          placeholder="Relation Phone Number"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TextInput
          placeholder="Relation Status"
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
    paddingHorizontal: width * 0.05,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: height * 0.02,
  },
  headerTitle: {
    fontSize: width * 0.05,
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
    marginBottom: height * 0.02,
  },
  input: {
    backgroundColor: "#d6e9d6",
    borderRadius: 10,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.035,
    marginVertical: height * 0.008,
    fontSize: width * 0.04,
    elevation: 2,
  },
  connectBtn: {
    backgroundColor: "#04302b",
    paddingVertical: height * 0.015,
    borderRadius: 10,
    alignItems: "center",
    marginTop: height * 0.015,
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
    paddingBottom: height * 0.03,
  },
  memberCard: {
    backgroundColor: "#00584aff",
    borderRadius: 12,
    padding: width * 0.04,
    marginVertical: height * 0.005,
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
    fontSize: width * 0.045,
  },
  memberRelation: {
    color: "lightgray",
    fontSize: width * 0.035,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    marginLeft: width * 0.03,
  },
});
