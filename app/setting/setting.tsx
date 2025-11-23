import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { apiGet } from '@/services/api';
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_500Medium,
  ArimaMadurai_700Bold,
} from '@expo-google-fonts/arima-madurai';

const { width: screenWidth } = Dimensions.get('window');

interface Driver {
  _id: string;
  firstName: string;
  lastName?: string;
  phoneNumber: string;
  age?: number;
  licenseNumber?: string;
  profileImage?: string;
  licenseImage?: string;
  isAvailable?: boolean;
  address?: string;
}

export default function SettingsScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);
  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_500Medium,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Fetch drivers from database
  const fetchDrivers = async () => {
    try {
      setDriversLoading(true);
      const response = await apiGet<{ drivers: Driver[] }>('/drivers');
      setDrivers(response.drivers || []);
      setShowDrivers(true);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setDriversLoading(false);
    }
  };

  const handleViewDrivers = () => {
    if (drivers.length === 0 && !driversLoading) {
      fetchDrivers();
    } else {
      setShowDrivers(!showDrivers);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EAF3E9' }}>
        <ActivityIndicator size="large" color="#04302B" />
      </View>
    );
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
                source={
                  user?.profileImage
                    ? { uri: user.profileImage }
                    : require('../../assets/images/elder.png')
                }
                style={styles.avatar}
              />
              <Text style={styles.name}>{user?.firstName || 'User'}</Text>
              <Text style={styles.phone}>{user?.phoneNumber || ''}</Text>
            </View>

            {/* Menu List */}
            <View style={styles.menu}>
              <MenuItem title="Edit Profile" icon="person-outline" onPress={() => router.push('/setting/profile')} />
              <MenuItem title="Language" icon="language-outline" onPress={() => router.push('/setting/setLanguage')} />
              <MenuItem 
                title="Add Family Members" 
                icon="people-outline" 
                onPress={() => router.push('/setting/addFamily')} 
              />
              <MenuItem 
                title="View Drivers" 
                icon="car-outline" 
                onPress={handleViewDrivers}
                badge={drivers.length > 0 ? drivers.length.toString() : undefined}
              />
              <MenuItem title="Add Driver" icon="add-circle-outline" onPress={() => router.push('/setting/addDriver')} />
              <MenuItem title="Emergency Add" icon="alert-circle-outline" danger onPress={() => router.push('/setting/emergencyAdd')} />
            </View>

            {/* Drivers Display Section */}
            {showDrivers && (
              <View style={styles.driversSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Available Drivers ({drivers.length})</Text>
                  <TouchableOpacity onPress={() => setShowDrivers(false)}>
                    <Ionicons name="close" size={24} color="#04302B" />
                  </TouchableOpacity>
                </View>
                
                {driversLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#04302B" />
                    <Text style={styles.loadingText}>Loading drivers...</Text>
                  </View>
                ) : drivers.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="car-outline" size={48} color="#999" />
                    <Text style={styles.emptyText}>No drivers found</Text>
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={() => router.push('/setting/addDriver')}
                    >
                      <Text style={styles.addButtonText}>Add Driver</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.driversScroll}
                  >
                    {drivers.map((driver) => (
                      <DriverCard key={driver._id} driver={driver} />
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Space under menu */}
            <View style={{ height: 40 }} />
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
  badge?: string;
  onPress?: () => void;
};

function MenuItem({ title, icon, danger = false, badge, onPress }: MenuItemProps) {
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
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={danger ? 'red' : '#4C5C4C'} />
    </TouchableOpacity>
  );
}

type DriverCardProps = {
  driver: Driver;
};

function DriverCard({ driver }: DriverCardProps) {
  const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Driver';
  
  return (
    <View style={styles.driverCard}>
      <LinearGradient
        colors={driver.isAvailable ? ['#E8F5E8', '#C8E6C9'] : ['#F5F5F5', '#E0E0E0']}
        style={styles.cardGradient}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, driver.isAvailable ? styles.availableBadge : styles.unavailableBadge]}>
          <View style={[styles.statusDot, driver.isAvailable && styles.availableDot]} />
          <Text style={styles.statusText}>
            {driver.isAvailable ? 'Available' : 'Busy'}
          </Text>
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image
            source={
              driver.profileImage
                ? { uri: driver.profileImage }
                : require('../../assets/images/profile.png')
            }
            style={styles.driverImage}
          />
        </View>

        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <Text style={styles.driverName} numberOfLines={1}>{fullName}</Text>
          
          {driver.phoneNumber && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.infoText} numberOfLines={1}>{driver.phoneNumber}</Text>
            </View>
          )}

          {driver.age && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.infoText}>{driver.age} years</Text>
            </View>
          )}

          {driver.licenseNumber && (
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={14} color="#666" />
              <Text style={styles.licenseText} numberOfLines={1}>{driver.licenseNumber}</Text>
            </View>
          )}

          {driver.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.addressText} numberOfLines={2}>{driver.address}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
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
  badge: {
    backgroundColor: '#04302B',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'ArimaMadurai_700Bold',
  },
  driversSection: {
    backgroundColor: '#CFE2D3',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'ArimaMadurai_700Bold',
    color: '#04302B',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'ArimaMadurai_400Regular',
    color: '#666',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'ArimaMadurai_400Regular',
    color: '#999',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#04302B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'ArimaMadurai_700Bold',
  },
  driversScroll: {
    paddingRight: 10,
  },
  driverCard: {
    width: screenWidth * 0.75,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    padding: 15,
    minHeight: 200,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  availableBadge: {
    backgroundColor: '#4CAF50',
  },
  unavailableBadge: {
    backgroundColor: '#FF9800',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  availableDot: {
    backgroundColor: '#fff',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'ArimaMadurai_700Bold',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  driverImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#04302B',
  },
  driverInfo: {
    alignItems: 'center',
  },
  driverName: {
    fontSize: 18,
    fontFamily: 'ArimaMadurai_700Bold',
    color: '#04302B',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    width: '100%',
    justifyContent: 'center',
  },
  infoText: {
    marginLeft: 6,
    fontSize: 13,
    fontFamily: 'ArimaMadurai_400Regular',
    color: '#666',
    flex: 1,
  },
  licenseText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: 'ArimaMadurai_400Regular',
    color: '#666',
    fontStyle: 'italic',
  },
  addressText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: 'ArimaMadurai_400Regular',
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
});
