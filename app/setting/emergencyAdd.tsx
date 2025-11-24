import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, Modal, TextInput, FlatList, Linking, Platform } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost, apiDelete, apiPut } from "@/services/api";
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from "@expo-google-fonts/arima-madurai";

interface EmergencyButtonProps {
  title: string;
  phone?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
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
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

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
      if (editingContact) {
        // Update existing contact
        await apiPut(`/emergency/${editingContact._id}`, {
          name: newName.trim(),
          phone: newPhone.trim(),
          relation: newRelation.trim(),
        });
        Alert.alert("Success", "Emergency contact updated!");
      } else {
        // Add new contact
        const elderId = user.role === 'elder' ? user._id : user._id;
        await apiPost('/emergency', {
          elderId,
          name: newName.trim(),
          phone: newPhone.trim(),
          relation: newRelation.trim(),
          priority: contacts.length + 1,
        });
        Alert.alert("Success", "Emergency contact added!");
      }
      
      await fetchEmergencyContacts(user);
      setModalVisible(false);
      setNewName("");
      setNewPhone("");
      setNewRelation("");
      setEditingContact(null);
    } catch (error: any) {
      console.error('Error saving emergency contact:', error);
      Alert.alert("Error", error.message || `Failed to ${editingContact ? 'update' : 'add'} emergency contact`);
    }
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setNewName(contact.name);
    setNewPhone(contact.phone);
    setNewRelation(contact.relation);
    setModalVisible(true);
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${contact.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiDelete(`/emergency/${contact._id}`);
              await fetchEmergencyContacts(user);
              Alert.alert("Success", "Emergency contact deleted!");
            } catch (error: any) {
              console.error('Error deleting emergency contact:', error);
              Alert.alert("Error", error.message || "Failed to delete emergency contact");
            }
          }
        }
      ]
    );
  };

  const makeCall = async (phone: string) => {
    if (!phone) {
      Alert.alert("Error", "Phone number not available");
      return;
    }

    // Remove any non-digit characters except + for international numbers
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanedPhone}`;

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Error", "Unable to make phone call. Please check your device settings.");
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert("Error", "Failed to initiate phone call");
    }
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
                onEdit={() => handleEditContact(contact)}
                onDelete={() => handleDeleteContact(contact)}
              />
            ))
          ) : (
            <>
              <EmergencyButton 
                title="Family Call" 
                phone="+94123456789"
                onPress={() => makeCall("+94123456789")}
              />
              <EmergencyButton 
                title="Ambulance" 
                phone="110"
                onPress={() => makeCall("110")}
              />
              <EmergencyButton 
                title="Police" 
                phone="119"
                onPress={() => makeCall("119")}
              />
            </>
          )}
        </View>
      )}

      {/* Floating Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => {
          setEditingContact(null);
          setNewName("");
          setNewPhone("");
          setNewRelation("");
          setModalVisible(true);
        }}
      >
        <Icon name="account-plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Contact Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContact ? "Edit Emergency Contact" : "Add Emergency Contact"}
            </Text>
            
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
                  setEditingContact(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
                <Text style={styles.addText}>{editingContact ? "Update" : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EmergencyButton({ title, phone, onPress, onEdit, onDelete }: EmergencyButtonProps) {
  return (
    <View style={styles.emergencyCardContainer}>
      <TouchableOpacity style={styles.emergencyCard} onPress={onPress}>
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.buttonText}>{title}</Text>
            {phone && <Text style={styles.phoneText}>{phone}</Text>}
          </View>
          <Icon name="phone" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
      {(onEdit || onDelete) && (
        <View style={styles.actionButtons}>
          {onEdit && (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={onEdit}
            >
              <Icon name="pencil" size={20} color="#04302B" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={onDelete}
            >
              <Icon name="delete" size={20} color="#d32f2f" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
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
  emergencyCardContainer: {
    width: "100%",
    marginBottom: 15,
  },
  emergencyCard: {
    backgroundColor: "#04302B",
    borderRadius: 12,
    elevation: 3,
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    alignItems: "flex-start",
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 10,
  },
  editButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#04302B",
  },
  deleteButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d32f2f",
  },
});
