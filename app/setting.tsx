import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.headerTitle}>Setting</Text>
        <Ionicons name="notifications-outline" size={24} color="#000" />
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4202/4202831.png' }} // sample avatar
          style={styles.avatar}
        />
        <Text style={styles.name}>Murukaiya Rajah</Text>
        <Text style={styles.phone}>0771234567</Text>
      </View>

      {/* Menu List */}
      <View style={styles.menu}>
        <MenuItem title="Edit Profile" />
        <MenuItem title="Language" />
        <MenuItem title="Add Family Members" />
        <MenuItem title="Add Drivers" />
        <MenuItem title="Emergency Add" danger />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Ionicons name="home-outline" size={28} color="#000" />
        <Ionicons name="gift-outline" size={28} color="#000" />
        <View style={styles.emergencyButton}>
          <Ionicons name="alert" size={28} color="#fff" />
        </View>
        <Ionicons name="car-outline" size={28} color="#000" />
        <Ionicons name="person-outline" size={28} color="#000" />
      </View>
    </ScrollView>
  );
}

type MenuItemProps = {
  title: string;
  danger?: boolean; // ✅ optional now
};

function MenuItem({ title, danger = false }: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, danger && styles.dangerItem]}>
      <Text style={[styles.menuText, danger && styles.dangerText]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={danger ? 'red' : '#000'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E6F2E6',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  phone: {
    fontSize: 14,
    color: 'gray',
  },
  menu: {
    backgroundColor: '#C6E1C6',
    borderRadius: 12,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#A8D3A8',
  },
  menuText: {
    fontSize: 16,
  },
  dangerItem: {
    backgroundColor: '#FCE6E6',
  },
  dangerText: {
    color: 'red',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 30,
  },
  emergencyButton: {
    backgroundColor: 'red',
    width: 55,
    height: 55,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
  },
});
