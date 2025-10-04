import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

type FamilyMember = {
  id: string;
  name: string;
  relation: string;
};

// ✅ Custom TextInput to apply ArimaMadurai font to input and placeholder
const AppTextInput: React.FC<TextInputProps> = (props) => {
  return <TextInput {...props} style={[{ fontFamily: "ArimaMadurai_400Regular" }, props.style]} />;
};

export default function FamilyPage() {
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [name, setName] = useState("");
  const [family, setFamily] = useState<FamilyMember[]>([
    { id: "1", name: "Kavi", relation: "Son" },
    { id: "2", name: "Ashu", relation: "Son" },
  ]);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) return null;

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
          <Ionicons name="create-outline" size={20} color="#04302B" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => deleteMember(item.id)}
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
});
