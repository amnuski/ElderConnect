import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPut } from '@/services/api';
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from '@expo-google-fonts/arima-madurai';

export default function EditProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [profileImage, setProfileImage] = useState<any>(require('../../../assets/images/profile.png'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  // Load user data from database (using phone number as primary key)
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        // First try to get from AsyncStorage
        const userStr = await AsyncStorage.getItem('user');
        let userData = userStr ? JSON.parse(userStr) : null;
        
        // Also fetch latest from API to ensure we have current data from database
        try {
          const response = await apiGet<{ user: any }>('/users/me');
          if (response.user) {
            userData = response.user;
            await AsyncStorage.setItem('user', JSON.stringify(response.user));
          }
        } catch (apiError) {
          console.error('Error fetching user from API:', apiError);
          // Continue with AsyncStorage data if API fails
        }

        if (userData) {
          setUser(userData);
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setPhone(userData.phoneNumber || '');
          setAddress(userData.address || '');
          setAge(userData.age?.toString() || '');
          setLicenseNumber(userData.licenseNumber || '');
          if (userData.profileImage) {
            setProfileImage({ uri: userData.profileImage });
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        Alert.alert('Error', 'Failed to load user data');
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
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    try {
      setSaving(true);
      
      // Update driver profile via API (phone number is primary key in database)
      const updateData: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
      };

      if (age) {
        const ageNum = parseInt(age);
        if (!isNaN(ageNum) && ageNum > 0) {
          updateData.age = ageNum;
        }
      }

      if (licenseNumber.trim()) {
        updateData.licenseNumber = licenseNumber.trim();
      }

      if (profileImage?.uri) {
        updateData.profileImage = profileImage.uri;
      }

      // Note: Phone number cannot be changed (it's the primary key)
      const response = await apiPut('/drivers/me', updateData);
      
      // Update local storage
      if (response.driver) {
        await AsyncStorage.setItem('user', JSON.stringify(response.driver));
        setUser(response.driver);
      }

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
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
            <Image source={profileImage} style={styles.profileImage} />
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput 
            style={styles.input} 
            value={firstName} 
            onChangeText={setFirstName}
            placeholder="Enter first name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput 
            style={styles.input} 
            value={lastName} 
            onChangeText={setLastName}
            placeholder="Enter last name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={[styles.input, styles.disabledInput]} 
            value={phone} 
            editable={false}
            placeholder="Phone number (cannot be changed)"
            placeholderTextColor="#999"
          />
          <Text style={styles.hintText}>Phone number is your primary identifier and cannot be changed</Text>

          <Text style={styles.label}>Age</Text>
          <TextInput 
            style={styles.input} 
            value={age} 
            onChangeText={setAge}
            keyboardType="numeric"
            placeholder="Enter age"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput 
            style={styles.input} 
            value={address} 
            onChangeText={setAddress}
            placeholder="Enter address"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>License Number</Text>
          <TextInput 
            style={styles.input} 
            value={licenseNumber} 
            onChangeText={setLicenseNumber}
            placeholder="Enter license number"
            placeholderTextColor="#999"
          />
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
  disabledInput: {
    backgroundColor: '#E0E0E0',
    color: '#666',
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'ArimaMadurai_400Regular',
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  saveButtonContainer: { paddingHorizontal: 24, marginTop: 24, marginBottom: 30 },
  saveButton: { 
    backgroundColor: '#04302B', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontFamily: 'ArimaMadurai_700Bold' },
});
