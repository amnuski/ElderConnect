import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FooterProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}

export default function Footer({ activeTab = 'home', onTabPress }: FooterProps) {
  const insets = useSafeAreaInsets();
  const [pressedButton, setPressedButton] = React.useState<string | null>(null);

  const bottomNavItems = [
    { id: 'home', icon: 'home', label: 'Home', iconType: 'solid' },
    { id: 'activities', icon: 'list', label: 'Activities', iconType: 'outline' },
    { id: 'emergency', icon: 'call', label: 'Emergency', isEmergency: true },
    { id: 'rides', icon: 'car', label: 'Rides', iconType: 'solid' },
    { id: 'profile', icon: 'person', label: 'Profile', iconType: 'solid' },
  ];

  const handleTabPress = (tabId: string) => {
    // Visual feedback for button press
    setPressedButton(tabId);
    
    // Reset pressed state after a short delay
    setTimeout(() => {
      setPressedButton(null);
    }, 150);
    
    if (onTabPress) {
      onTabPress(tabId);
    }
  };

  const handlePressIn = (tabId: string) => {
    setPressedButton(tabId);
  };

  const handlePressOut = () => {
    setPressedButton(null);
  };

  const getIconName = (baseIcon: string, iconType?: string) => {
    if (iconType === 'outline') {
      return baseIcon + '-outline';
    }
    return baseIcon;
  };

  return (
    <View style={styles.footerContainer}>
      {/* Main navigation bar */}
      <View style={[styles.bottomNavigation, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        {bottomNavItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.navItem,
              item.isEmergency && styles.emergencyNavItem,
              pressedButton === item.id && styles.pressedNavItem
            ]}
            onPress={() => handleTabPress(item.id)}
            onPressIn={() => handlePressIn(item.id)}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            {item.isEmergency ? (
              <View style={styles.emergencyButtonContainer}>
                {/* Green dotted circular outline */}
                <View style={styles.emergencyDottedBorder} />
                {/* White circular background */}
                <View style={styles.emergencyButtonBackground}>
                  {/* Red siren icon with radiating dots */}
                  <View style={styles.sirenContainer}>
                    <Ionicons name="call" size={20} color="#FF0000" />
                    {/* Small red dots radiating from siren */}
                    <View style={styles.radiatingDots}>
                      <View style={[styles.dot, styles.dot1]} />
                      <View style={[styles.dot, styles.dot2]} />
                      <View style={[styles.dot, styles.dot3]} />
                      <View style={[styles.dot, styles.dot4]} />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.regularNavItem}>
                <View style={[
                  styles.navIconContainer,
                  pressedButton === item.id && styles.pressedIconContainer
                ]}>
                  <Ionicons 
                    name={getIconName(item.icon, item.iconType) as any} 
                    size={22} 
                    color={
                      pressedButton === item.id 
                        ? "#FFFFFF" 
                        : "#2E7D32"
                    } 
                  />
                </View>
                <Text style={[
                  styles.navLabel,
                  pressedButton === item.id && styles.pressedNavLabel
                ]}>
                  {item.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.12,
    zIndex: 1000, // Ensure footer stays on top
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 15,
    right: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 25,
    height: screenHeight * 0.1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
    zIndex: 2,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeNavItem: {
    backgroundColor: 'transparent',
  },
  emergencyNavItem: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  regularNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    padding: 8,
    borderRadius: 15,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#2E7D32',
    padding: 10,
  },
  emergencyButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyDottedBorder: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
    top: -35,
  },
  emergencyButtonBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF0000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    top: -30,
  },
  sirenContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiatingDots: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FF0000',
  },
  dot1: {
    top: 2,
    left: 18.5,
  },
  dot2: {
    bottom: 2,
    left: 18.5,
  },
  dot3: {
    left: 2,
    top: 18.5,
  },
  dot4: {
    right: 2,
    top: 18.5,
  },
  navLabel: {
    fontSize: 11,
    color: '#2E7D32',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeNavLabel: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  pressedNavItem: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    transform: [{ scale: 0.95 }],
  },
  pressedIconContainer: {
    backgroundColor: '#2E7D32',
    transform: [{ scale: 0.9 }],
    borderRadius: 15,
  },
  pressedNavLabel: {
    color: '#2E7D32',
    fontWeight: '700',
    transform: [{ scale: 0.95 }],
  },
});