import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from '@expo-google-fonts/arima-madurai';

export default function EditProfileScreen() {
  const [name, setName] = useState('Murukaiya Rajah');
  const [phone, setPhone] = useState('07712345690');
  const [address, setAddress] = useState('Kovil Road, Jaffna');
  const [profileImage, setProfileImage] = useState(require('../../assets/images/elder.png'));

  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleSave = () => {
    alert('Profile Saved!');
  };

  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1], // square crop
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage({ uri: result.assets[0].uri });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#04302B" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Profile</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#04302B" />
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageWrapper}>
            <Image source={profileImage} style={styles.profileImage} />
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} />
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF3E9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 30 },
  headerText: { fontSize: 20, color: '#04302B', fontFamily: 'ArimaMadurai_700Bold' },
  profileImageContainer: { alignItems: 'center', marginVertical: 16 },
  profileImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#CFE2D3',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImage: { width: 90, height: 90, borderRadius: 45 },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#04302B',
    padding: 6,
    borderRadius: 20,
  },
  form: { paddingHorizontal: 24 },
  label: { marginTop: 16, marginBottom: 4, color: '#04302B', fontFamily: 'ArimaMadurai_700Bold', fontSize: 16 },
  input: {
    backgroundColor: '#CFE2D3',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#04302B',
    fontFamily: 'ArimaMadurai_400Regular',
  },
  saveButtonContainer: { paddingHorizontal: 24, marginTop: 24, marginBottom: 30 },
  saveButton: { backgroundColor: '#04302B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontFamily: 'ArimaMadurai_700Bold' },
});
