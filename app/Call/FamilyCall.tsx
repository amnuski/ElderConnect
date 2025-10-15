import React, { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";

// Contact type
interface Contact {
  id: number;
  name: string;
  phone: string;
}

// AnimatedIcon component
interface AnimatedIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress: () => void;
}

const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  name,
  size = 24,
  color = "white",
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
      }
      onPress={onPress}
      style={{ marginLeft: 8 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={name} size={size} color={color} />
      </Animated.View>
    </Pressable>
  );
};

export default function FamilyCall() {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: 1, name: "Raja", phone: "0771234567" },
    { id: 2, name: "Hiruni", phone: "0719876543" },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0a3d2e" />
      </View>
    );
  }

  const openAddModal = () => {
    setEditingContact(null);
    setNameInput("");
    setPhoneInput("");
    setModalVisible(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setNameInput(contact.name);
    setPhoneInput(contact.phone);
    setModalVisible(true);
  };

  const saveContact = () => {
    if (!nameInput.trim() || !phoneInput.trim()) {
      Alert.alert("Validation", "Please enter name and phone number.");
      return;
    }

    if (editingContact) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? { ...c, name: nameInput.trim(), phone: phoneInput.trim() }
            : c
        )
      );
      Alert.alert("Updated", "Contact updated successfully!");
    } else {
      const newId = contacts.length
        ? Math.max(...contacts.map((c) => c.id)) + 1
        : 1;
      setContacts((prev) => [
        { id: newId, name: nameInput.trim(), phone: phoneInput.trim() },
        ...prev,
      ]);
      Alert.alert("Added", "New contact added successfully!");
    }

    setModalVisible(false);
  };

  const deleteContact = (contact: Contact) => {
    Alert.alert("Delete contact", `Delete ${contact.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setContacts((prev) => prev.filter((c) => c.id !== contact.id)),
      },
    ]);
  };

  const renderRightActions = (contact: Contact) => (
    <View style={styles.rightActionContainer}>
      <Pressable
        onPress={() => openEditModal(contact)}
        style={styles.smallActionBtn}
      >
        <Ionicons name="create-outline" size={18} color="white" />
      </Pressable>
      <Pressable
        onPress={() => deleteContact(contact)}
        style={[styles.smallActionBtn, { marginTop: 10 }]}
      >
        <Ionicons name="trash-outline" size={18} color="white" />
      </Pressable>
    </View>
  );

  const renderContact = ({ item }: { item: Contact }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <View style={styles.contactCard}>
        <View>
          <Text style={[styles.callerName, { fontFamily: "ArimaMadurai_700Bold" }]}>
            {item.name}
          </Text>
          <Text style={[styles.callerPhone, { fontFamily: "ArimaMadurai_400Regular" }]}>
            {item.phone}
          </Text>
        </View>
        <View style={styles.callActions}>
          <AnimatedIcon
            name="call-outline"
            size={26}
            onPress={() =>
              router.push({
                pathname: "../drivercallui",
                params: { name: item.name, phone: item.phone },
              })
            }
          />
          <AnimatedIcon
            name="videocam-outline"
            size={26}
            onPress={() =>
              Alert.alert("Video Call", `Video calling ${item.name}...`)
            }
          />
        </View>
      </View>
    </Swipeable>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#F6FBF7", "#CFE4CF"]} style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="chevron-back"
              size={22}
              color="#0a3d2e"
              onPress={() => router.back()}
            />
            <Text
              style={[
                styles.headerText,
                { fontFamily: "ArimaMadurai_700Bold" },
              ]}
            >
              Family Call
            </Text>
          </View>
          <AnimatedIcon
            name="notifications-outline"
            size={22}
            color="#0a3d2e"
            onPress={() =>
              Alert.alert("Notifications", "No new notifications")
            }
          />
        </View>

        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderContact}
          contentContainerStyle={{ paddingBottom: 160 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={{ marginTop: 40, alignItems: "center" }}>
              <Text
                style={{
                  color: "#0a3d2e",
                  opacity: 0.7,
                  fontFamily: "ArimaMadurai_400Regular",
                }}
              >
                No contacts — tap + to add
              </Text>
            </View>
          }
        />

        <Pressable style={styles.floatingBtn} onPress={openAddModal}>
          <Ionicons name="add" size={30} color="white" />
        </Pressable>

        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text
                style={[
                  styles.modalTitle,
                  { fontFamily: "ArimaMadurai_700Bold" },
                ]}
              >
                {editingContact ? "Edit Contact" : "Add Contact"}
              </Text>

              <TextInput
                placeholder="Name"
                value={nameInput}
                onChangeText={setNameInput}
                style={[styles.input, { fontFamily: "ArimaMadurai_400Regular" }]}
                placeholderTextColor="#7b7b7b"
              />
              <TextInput
                placeholder="Phone Number"
                value={phoneInput}
                onChangeText={setPhoneInput}
                style={[
                  styles.input,
                  { marginTop: 10, fontFamily: "ArimaMadurai_400Regular" },
                ]}
                keyboardType="phone-pad"
                placeholderTextColor="#7b7b7b"
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 18,
                }}
              >
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={[styles.modalBtn, { backgroundColor: "#e6e6e6" }]}
                >
                  <Text style={{ fontFamily: "ArimaMadurai_400Regular" }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={saveContact}
                  style={[
                    styles.modalBtn,
                    { marginLeft: 10, backgroundColor: "#0a3d2e" },
                  ]}
                >
                  <Text
                    style={{
                      color: "white",
                      fontFamily: "ArimaMadurai_700Bold",
                    }}
                  >
                    {editingContact ? "Save" : "Add"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: Platform.OS === "android" ? 10 : 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 25,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0a3d2e",
    marginLeft: 10,
    marginBottom: 10,
  },
  contactCard: {
    flexDirection: "row",
    backgroundColor: "#0a3d2e",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  callerName: { color: "white", fontSize: 18 },
  callerPhone: { color: "#a3c9b9", fontSize: 13, marginTop: 4 },
  callActions: { flexDirection: "row", alignItems: "center" },
  rightActionContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#155e4a",
    borderBottomRightRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: 18,
    marginLeft: -7,
    paddingHorizontal: 10,
    marginBottom: 1,
  },
  smallActionBtn: {
    height: 36,
    width: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBtn: {
    position: "absolute",
    bottom: 60,
    right: 24,
    backgroundColor: "#0a3d2e",
    borderRadius: 30,
    padding: 14,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalCard: {
    backgroundColor: "white",
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: "#0a3d2e",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e3e3e3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    color: "#0a3d2e",
    fontSize: 15,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
