import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, Modal, TextInput, FlatList } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost, apiDelete } from "@/services/api";
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from "@expo-google-fonts/arima-madurai";

interface EmergencyButtonProps {
  title: string;
  phone?: string;
  onPress?: () => void;
}

interface EmergencyContact {
  _id: string;
  name: string;
  phone: string;
  relation: string;
  priority: number;
}

export default function EmergencyScreen() {
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          await fetchEmergencyContacts(userData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchEmergencyContacts = async (userData: any) => {
    try {
      setLoading(true);
      const elderId = userData.role === 'elder' ? userData._id : userData._id;
      const response = await apiGet<{ contacts: EmergencyContact[] }>(`/emergency?elderId=${elderId}`);
      setContacts(response.contacts || []);
    } catch (error: any) {
      console.error('Error fetching emergency contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newName || !newPhone || !newRelation) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    try {
      const elderId = user.role === 'elder' ? user._id : user._id;
      await apiPost('/emergency', {
        elderId,
        name: newName.trim(),
        phone: newPhone.trim(),
        relation: newRelation.trim(),
        priority: contacts.length + 1,
      });
      
      await fetchEmergencyContacts(user);
      setModalVisible(false);
      setNewName("");
      setNewPhone("");
      setNewRelation("");
      Alert.alert("Success", "Emergency contact added!");
    } catch (error: any) {
      console.error('Error adding emergency contact:', error);
      Alert.alert("Error", error.message || "Failed to add emergency contact");
    }
  };

  const makeCall = (phone: string) => {
    const phoneUrl = `tel:${phone}`;
    // Using Linking would be better, but for now just alert
    Alert.alert("Call", `Calling ${phone}`);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Icon name="arrow-left" size={26} color="#04302B" />
        </TouchableOpacity>

        <Text style={styles.title}>Add Emergency{"\n"}Member</Text>

        <View style={styles.headerIcon} />
      </View>

      {/* Buttons Vertical */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#04302B" />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <EmergencyButton
                key={contact._id}
                title={contact.name}
                phone={contact.phone}
                onPress={() => makeCall(contact.phone)}
              />
            ))
          ) : (
            <>
              <EmergencyButton title="Family Call" />
              <EmergencyButton title="Ambulance" />
              <EmergencyButton title="Police" />
            </>
          )}
        </View>
      )}

      {/* Floating Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="account-plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Contact Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Relation (e.g., Family, Ambulance, Police)"
              value={newRelation}
              onChangeText={setNewRelation}
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setNewName("");
                  setNewPhone("");
                  setNewRelation("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmergencyButton({ title, phone, onPress }: EmergencyButtonProps) {
  return (
    <TouchableOpacity style={styles.emergencyCard} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
      {phone && <Text style={styles.phoneText}>{phone}</Text>}
      <Icon name="phone" size={24} color="#fff" style={{ marginTop: 6 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF3E9",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 50,
    marginTop:20,
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
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-start",
    gap: 15,
  },
  emergencyCard: {
    backgroundColor: "#04302B",
    flexDirection: "column", // vertical inside
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 12,
    elevation: 3,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "ArimaMadurai_700Bold",
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#04302B",
    padding: 20,
    borderRadius: 50,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  phoneText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "ArimaMadurai_400Regular",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: 16,
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
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#333",
    fontFamily: "ArimaMadurai_700Bold",
  },
  addButton: {
    backgroundColor: "#04302B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  addText: {
    color: "#fff",
    fontFamily: "ArimaMadurai_700Bold",
  },
});
