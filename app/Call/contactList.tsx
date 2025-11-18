// app/Call/ContactList.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  StyleSheet,
  Modal,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiGet, apiPost, apiDelete } from "@/services/api";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Contact {
  _id: string;
  name: string;
  phone: string;
  relation?: string;
}

export default function ContactList() {
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await apiGet<{ contacts: Contact[] }>('/contacts');
      setContacts(response.contacts || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      Alert.alert("Error", error.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const addContact = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      await apiPost('/contacts', {
        name: newName.trim(),
        phone: newPhone.trim(),
        relation: 'other',
      });
      
      await fetchContacts();
      setNewName("");
      setNewPhone("");
      setModalVisible(false);
      Alert.alert("Success", "Contact added successfully!");
    } catch (error: any) {
      console.error('Error adding contact:', error);
      Alert.alert("Error", error.message || "Failed to add contact");
    }
  };

  const deleteContact = async (id: string) => {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact?",
      [
        { text: "Cancel", style: "cancel", onPress: () => setSelectedId(null) },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDelete(`/contacts/${id}`);
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setContacts(contacts.filter((c) => c._id !== id));
              setSelectedId(null);
            } catch (error: any) {
              console.error('Error deleting contact:', error);
              Alert.alert("Error", error.message || "Failed to delete contact");
            }
          },
        },
      ]
    );
  };

  const handleLongPress = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedId(selectedId === id ? null : id); // toggle selection
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#003C1F" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Contact List</Text>
      </View>

      {/* Contact List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A3D2E" />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.contactCard,
                selectedId === item._id && { backgroundColor: "#FDECEC" },
              ]}
              onPress={() => makeCall(item.phone)}
              onLongPress={() => handleLongPress(item._id)}
            >
              <View>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactNumber}>{item.phone}</Text>
                {item.relation && (
                  <Text style={styles.contactRelation}>{item.relation}</Text>
                )}
              </View>

              {selectedId === item._id ? (
                <TouchableOpacity onPress={() => deleteContact(item._id)}>
                  <Ionicons name="trash" size={24} color="#D10000" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="call-outline" size={24} color="#0A3D2E" />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No contacts added yet</Text>
            </View>
          }
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Contact Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Contact</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter Name"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Phone Number"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addButton} onPress={addContact}>
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6FFF6", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 25,
  },
  headerText: {
    fontSize: 22,
    marginLeft: 10,
    color: "#003C1F",
    fontFamily: "ArimaMadurai_700Bold",
  },
  contactCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F6E9",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  contactName: {
    fontSize: 16,
    color: "#003C1F",
    fontFamily: "ArimaMadurai_700Bold",
  },
  contactNumber: {
    fontSize: 14,
    color: "#555",
    fontFamily: "ArimaMadurai_400Regular",
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#0A3D2E",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: "85%",
  },
  modalTitle: {
    fontSize: 20,
    color: "#003C1F",
    fontFamily: "ArimaMadurai_700Bold",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontFamily: "ArimaMadurai_400Regular",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  cancelText: {
    color: "#333",
    fontFamily: "ArimaMadurai_700Bold",
  },
  addButton: {
    backgroundColor: "#0A3D2E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addText: {
    color: "#fff",
    fontFamily: "ArimaMadurai_700Bold",
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
  contactRelation: {
    fontSize: 12,
    color: "#888",
    fontFamily: "ArimaMadurai_400Regular",
    marginTop: 2,
  },
});
