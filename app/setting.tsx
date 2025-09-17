import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SettingsScreen() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#E6F2E6" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Setting</Text>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4202/4202831.png' }}
              style={styles.avatar}
            />
            <Text style={styles.name}>Murukaiya Rajah</Text>
            <Text style={styles.phone}>0771234567</Text>
          </View>
          
          {/* Menu List */}
          <View style={styles.menu}>
            <MenuItem title="Edit Profile" icon="person-outline" />
            <MenuItem title="Language" icon="language-outline" />
            <MenuItem title="Add Family Members" icon="people-outline" />
            <MenuItem title="Add Drivers" icon="car-outline" />
            <MenuItem title="Emergency Add" icon="alert-circle-outline" danger />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
    </>
  );
}

type MenuItemProps = {
  title: string;
  icon: string;
  danger?: boolean;
};

function MenuItem({ title, icon, danger = false }: MenuItemProps) {
  const handlePress = () => {
    console.log(`${title} pressed`);
    // You can add specific navigation for each menu item here
    // Example: router.push('/edit-profile') for Edit Profile
  };

  return (
    <TouchableOpacity 
      style={[styles.menuItem, danger && styles.dangerItem]}
      onPress={handlePress}
    >
      <View style={styles.menuLeft}>
        <Ionicons
          name={icon as any}
          size={22}
          color={danger ? 'red' : '#4A7C59'}
          style={styles.menuIcon}
        />
        <Text style={[styles.menuText, danger && styles.dangerText]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={danger ? 'red' : '#4A7C59'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6F2E6',
  },
  container: {
    flex: 1,
    backgroundColor: '#E6F2E6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 140,
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
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#A8D3A8',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
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
});