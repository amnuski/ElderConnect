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
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_500Medium,
  ArimaMadurai_700Bold,
} from '@expo-google-fonts/arima-madurai';
import DriverFooter from '@/app/Footer/DriverFooter';

export default function SettingsScreen() {
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_500Medium,
    ArimaMadurai_700Bold,
  });

  if (!fontsLoaded) {
    return null; // loading screen
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#EAF3E9" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#4C5C4C" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Settings</Text>
              <TouchableOpacity>
                <Ionicons name="notifications-outline" size={24} color="#4C5C4C" />
              </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
              <Image
                source={require('../../assets/images/elder.png')}
                style={styles.avatar}
              />
              <Text style={styles.name}>Murukaiya Rajah</Text>
              <Text style={styles.phone}>0771234567</Text>
            </View>

            {/* Menu List */}
            <View style={styles.menu}>
              <MenuItem title="Edit Profile" icon="person-outline" onPress={() => router.push('./Driver/setting/edit-profile')} />
              <MenuItem title="Language" icon="language-outline" onPress={() => router.push('./Driver/setting/language')} />
            </View>

            {/* Space under menu */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
              {/* ✅ Footer */}
          <DriverFooter activeTab="profile" />
      </SafeAreaView>
    </>
  );
}

type MenuItemProps = {
  title: string;
  icon: string;
  danger?: boolean;
  onPress?: () => void;
};

function MenuItem({ title, icon, danger = false , onPress }: MenuItemProps) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, danger && styles.dangerItem]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <Ionicons
          name={icon as any}
          size={22}
          color={danger ? 'red' : '#042222'}
          style={styles.menuIcon}
        />
        <Text style={[styles.menuText, danger && styles.dangerText]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={danger ? 'red' : '#4C5C4C'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAF3E9',
  },
  container: {
    flex: 1,
    backgroundColor: '#EAF3E9',
    padding:5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'ArimaMadurai_700Bold',
    color: '#042222',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 0,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    backgroundColor: '#CFE2D3',
  },
  name: {
    fontSize: 18,
    fontFamily: 'ArimaMadurai_500Medium', // changed
    color: '#04302B',
  },
  phone: {
    fontSize: 14,
    fontFamily: 'ArimaMadurai_400Regular',
    color: '#666',
    paddingBottom:20,
  },
  menu: {
    backgroundColor: '#CFE2D3',
    borderRadius: 12,
    paddingVertical: 10,
    padding: 20,
    marginBottom: 20,
    
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#B7D4B7',
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
    fontFamily: 'ArimaMadurai_500Medium', // changed
    color: '#042222',
  },
  dangerItem: {
    backgroundColor: '#fce6e69e',
  },
  dangerText: {
    color: 'red',
    fontFamily: 'ArimaMadurai_700Bold',
  },
});
