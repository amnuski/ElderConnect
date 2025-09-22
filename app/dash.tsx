import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Footer from './footer';
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from '@expo-google-fonts/arima-madurai';
import { LinearGradient } from "expo-linear-gradient";
  
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });
  if (!fontsLoaded) {
    return null;
  }
  
  const activities = [
    { id: 1, title: 'Go to Temple', time: '8.00 AM' },
    { id: 2, title: 'Doctor Appointment', time: '2.00 PM' },
    { id: 3, title: 'Grocery Shopping', time: '4.00 PM' },
    { id: 4, title: 'Family Visit', time: '6.00 PM' },
  ];

  const quickActions = [
    { icon: 'call', label: 'Call' },
    { icon: 'person', label: 'Contact' },
    { icon: 'car', label: 'Rides' },
  ];

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    console.log('Navigating to:', tab);
  };

  const handleActivityPress = (activityId: number) => {
    setSelectedActivity(selectedActivity === activityId ? null : activityId);
  };

  const handleEditActivity = (activityId: number) => {
    console.log('Edit activity:', activityId);
    setSelectedActivity(null);
  };

  const handleDeleteActivity = (activityId: number) => {
    console.log('Delete activity:', activityId);
    setSelectedActivity(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
      colors={["#FFFFFF", "#B6DDB3"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://www.maplewoodseniorliving.com/wp-content/uploads/2024/01/shutterstock_1926698987-Low-Res-scaled.jpg' }}
            style={styles.profileImage}
          />
          
          <Text style={styles.welcomeText}>Welcome Anne!</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Today Activity Section */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle1}>Today Activity</Text>
          <Text style={styles.dateText}>July 12, 2025</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.activityCardsContainer}
          >
            {activities.map((activity, index) => (
              <TouchableOpacity 
                key={activity.id} 
                style={[
                  styles.activityCard,
                  selectedActivity === activity.id && styles.selectedActivityCard
                ]}
                onPress={() => handleActivityPress(activity.id)}
                activeOpacity={0.8}
              >
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                {selectedActivity === activity.id && (
                  <View style={styles.editActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => handleEditActivity(activity.id)}
                    >
                      <Ionicons name="create" size={16} color="#2E7D32" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteActivity(activity.id)}
                    >
                      <Ionicons name="trash" size={16} color="#2E7D32" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Scroll Indicators */}
          <View style={styles.scrollIndicators}>
            <View style={[styles.indicator, styles.activeIndicator]} />
            <View style={styles.indicator} />
          </View>
        </View>

        {/* Track Ride Button */}
        <TouchableOpacity style={styles.trackRideButton}>
          <Text style={styles.trackRideText}>Track Ride</Text>
        </TouchableOpacity>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionButton}>
              <Ionicons name={action.icon as any} size={24} color="#2E7D32" />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional content to demonstrate scrolling */}
        <View style={styles.additionalContent}>
          <Text style={styles.additionalTitle}>Additional Information</Text>
          <Text style={styles.additionalText}>
            This content ensures that the footer doesn't hide any important information. 
            The footer floats above the content with proper spacing.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <Footer activeTab={activeTab} onTabPress={handleTabPress} />
      </LinearGradient>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.02,
    backgroundColor: '#F8F9FA',
    paddingTop: screenHeight * 0.1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: screenWidth * 0.15,
    height: screenWidth * 0.15,
    borderRadius: screenWidth * 0.075,
    marginRight: screenWidth * 0.04,
    backgroundColor: '#4CAF50',
  },
  welcomeText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: screenWidth * 0.05,
    fontWeight: '600',
    color: '#2E7D32',
    flex: 1,
  },
  notificationButton: {
    width: screenWidth * 0.12,
    height: screenWidth * 0.12,
    borderRadius: screenWidth * 0.06,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: screenWidth * 0.05,
    paddingBottom: screenHeight * 0.15, // Extra padding to prevent footer overlap
  },
  activitySection: {
    marginBottom: screenHeight * 0.03,
  },
  sectionTitle1: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: screenWidth * 0.08,
    
    color: '#2E7D32',
    marginBottom: screenHeight * 0.01,
  },
  dateText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: screenWidth * 0.04,
    color: '#666',
    marginBottom: screenHeight * 0.025,
  },
  activityCardsContainer: {
    marginBottom: screenHeight * 0.02,
  },
  activityCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: screenWidth * 0.03,
    padding: screenWidth * 0.04,
    marginRight: screenWidth * 0.04,
    width: screenWidth * 0.5,
    minWidth: 180,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedActivityCard: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0F8F0',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: screenHeight * 0.01,
    lineHeight: screenWidth * 0.05,
  },
  activityTime: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: screenWidth * 0.035,
    color: '#666',
  },
  editActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.12,
    backgroundColor: '#C8E6C9',
    borderTopRightRadius: screenWidth * 0.03,
    borderBottomRightRadius: screenWidth * 0.03,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.01,
  },
  editButton: {
    padding: screenWidth * 0.02,
  },
  deleteButton: {
    padding: screenWidth * 0.02,
  },
  scrollIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: screenWidth * 0.015,
    marginTop: screenHeight * 0.01,
  },
  indicator: {
    width: screenWidth * 0.05,
    height: screenHeight * 0.005,
    backgroundColor: '#E8F5E8',
    borderRadius: screenHeight * 0.0025,
  },
  activeIndicator: {
    backgroundColor: '#2E7D32',
  },
  trackRideButton: {
    backgroundColor: '#2E7D32',
    borderRadius: screenWidth * 0.03,
    paddingVertical: screenHeight * 0.025,
    alignItems: 'center',
    marginBottom: screenHeight * 0.04,
    marginHorizontal: screenWidth * 0.02,
  },
  trackRideText: {
    fontFamily: 'ArimaMadurai_700Bold',
    color: '#FFFFFF',
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: screenHeight * 0.05,
    paddingHorizontal: screenWidth * 0.02,
  },
  quickActionButton: {
    backgroundColor: '#E8F5E8',
    borderRadius: screenWidth * 0.03,
    padding: screenWidth * 0.05,
    alignItems: 'center',
    width: screenWidth * 0.22,
    minWidth: 70,
  },
  quickActionLabel: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: screenWidth * 0.03,
    color: '#2E7D32',
    marginTop: screenHeight * 0.01,
    fontWeight: '500',
    textAlign: 'center',
  },
  additionalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: screenWidth * 0.03,
    padding: screenWidth * 0.04,
    marginBottom: screenHeight * 0.02,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalTitle: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: screenHeight * 0.01,
  },
  additionalText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: screenWidth * 0.035,
    color: '#666',
    lineHeight: screenWidth * 0.05,
  },
});
