import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { apiPut, apiGet } from '@/services/api';
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from '@expo-google-fonts/arima-madurai';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        // Try to get from AsyncStorage first
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setName(userData.firstName || '');
          setPhone(userData.phoneNumber || '');
          setAddress(userData.address || '');
          if (userData.profileImage) {
            setProfileImage({ uri: userData.profileImage });
          }
        }
        
        // Also fetch latest from API
        const response = await apiGet('/users/me');
        if (response.user) {
          setUser(response.user);
          setName(response.user.firstName || '');
          setPhone(response.user.phoneNumber || '');
          setAddress(response.user.address || '');
          if (response.user.profileImage) {
            setProfileImage({ uri: response.user.profileImage });
          }
          await AsyncStorage.setItem('user', JSON.stringify(response.user));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        Alert.alert("Error", "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EAF3E9' }}>
        <ActivityIndicator size="large" color="#04302B" />
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        firstName: name.trim(),
        address: address.trim(),
      };
      
      if (profileImage && profileImage.uri) {
        updateData.profileImage = profileImage.uri;
      }

      const response = await apiPut('/users/me', updateData);
      
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
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
      mediaTypes: 'images',
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
            <Image 
              source={profileImage || require('../../assets/images/elder.png')} 
              style={styles.profileImage} 
            />
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
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={phone} 
            editable={false}
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} />
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
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
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontFamily: 'ArimaMadurai_700Bold' },
  disabledInput: { backgroundColor: '#f0f0f0', color: '#666' },
});
