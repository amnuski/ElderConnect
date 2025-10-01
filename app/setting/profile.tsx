import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function EditProfileScreen() {
  const [name, setName] = useState('Murukaiya Rajah');
  const [phone, setPhone] = useState('07712345690');
  const [address, setAddress] = useState('Kovil Road, Jaffna');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#4C5C4C" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Profile</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#4C5C4C" />
        </TouchableOpacity>
      </View>

      {/* Profile Image */}
      {/* <View style={styles.profileImageContainer}>
        <View style={styles.profileImageWrapper}>
          <Image
            source={require('../assets/images/elder.png')} // Replace with your asset or user image
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View> */}

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
        />
      </View>

      
     
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAF3E9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
  },
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#4C5C4C' },
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
    backgroundColor: '#4C5C4C',
    padding: 6,
    borderRadius: 20,
  },
  form: { paddingHorizontal: 24 },
  label: { marginTop: 16, marginBottom: 4, color: '#4C5C4C', fontWeight: '500' },
  input: {
    backgroundColor: '#CFE2D3',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  activeButton: {
    backgroundColor: '#4C5C4C',
    padding: 12,
    borderRadius: 50,
  },
});
