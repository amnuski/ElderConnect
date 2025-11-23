// app/Family/track-ride.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { apiGet } from "@/services/api";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";

interface Schedule {
  _id: string;
  title: string;
  time: string;
  date: string;
  fromLocation: string;
  toLocation: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  status?: string;
}

interface Ride {
  _id: string;
  scheduleId: string;
  driverId: string;
  status: string;
  driverLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    updatedAt: string;
  };
}

export default function TrackRideScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LatLng | null>(null);
  const [dropLocation, setDropLocation] = useState<LatLng | null>(null);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [driverHeading, setDriverHeading] = useState<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [ride, setRide] = useState<Ride | null>(null);
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  // Fetch today's schedule and active ride
  useEffect(() => {
    const fetchRideData = async () => {
      try {
        setLoading(true);
        
        // Fetch schedules
        const scheduleResponse = await apiGet<{ schedules: Schedule[] }>('/schedules');
        
        // Get today's date
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();
        
        // Find today's schedule with driver
        const todaySchedule = (scheduleResponse.schedules || []).find((s: Schedule) => {
          if (!s.date) return false;
          const scheduleDate = new Date(s.date);
          return (
            scheduleDate.getFullYear() === todayYear &&
            scheduleDate.getMonth() === todayMonth &&
            scheduleDate.getDate() === todayDay &&
            s.driverId && s.driverName
          );
        });

        if (todaySchedule) {
          setSchedule(todaySchedule);
          
          // Fetch active ride for this schedule
          try {
            const ridesResponse = await apiGet<{ rides: Ride[] }>('/api/rides');
            const activeRide = ridesResponse.rides?.find(
              (r: Ride) => r.scheduleId === todaySchedule._id && 
                          (r.status === 'in_progress' || r.status === 'accepted')
            );
            
            if (activeRide) {
              setRide(activeRide);
              // Update driver location if available
              if (activeRide.driverLocation) {
                setDriverLocation({
                  latitude: activeRide.driverLocation.latitude,
                  longitude: activeRide.driverLocation.longitude,
                });
                if (activeRide.driverLocation.heading) {
                  setDriverHeading(activeRide.driverLocation.heading);
                }
              }
            }
          } catch (rideError) {
            console.error('Error fetching ride:', rideError);
          }
          
          // Geocode locations
          await geocodeLocations(todaySchedule.fromLocation, todaySchedule.toLocation);
        } else {
          Alert.alert(
            "No Active Ride",
            "You don't have any scheduled ride with a driver for today.",
            [
              { text: "OK", onPress: () => router.back() }
            ]
          );
        }
      } catch (error: any) {
        console.error('Error fetching schedule:', error);
        
        if (error.status === 429) {
          Alert.alert(
            "Too Many Requests",
            "Please wait a moment and try again.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert("Error", error.message || "Failed to load ride information.");
        }
      } finally {
        setLoading(false);
        setLoadingLocations(false);
      }
    };

    fetchRideData();
  }, []);

  // Real-time driver location updates (only when ride is in_progress)
  useEffect(() => {
    if (!ride || ride.status !== 'in_progress' || !ride.driverId) {
      return;
    }

    const updateDriverLocation = async () => {
      try {
        const ridesResponse = await apiGet<{ rides: Ride[] }>('/api/rides');
        const currentRide = ridesResponse.rides?.find((r: Ride) => r._id === ride._id);
        
        if (currentRide?.driverLocation) {
          setDriverLocation({
            latitude: currentRide.driverLocation.latitude,
            longitude: currentRide.driverLocation.longitude,
          });
          if (currentRide.driverLocation.heading !== undefined) {
            setDriverHeading(currentRide.driverLocation.heading);
          }
          
          // Update map to follow driver
          if (mapRef.current && driverLocation) {
            mapRef.current.animateToRegion({
              latitude: currentRide.driverLocation.latitude,
              longitude: currentRide.driverLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    };

    // Update every 3 seconds when ride is in progress
    locationUpdateIntervalRef.current = setInterval(updateDriverLocation, 3000);
    
    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, [ride, driverLocation]);

  // Geocode address strings to coordinates
  const geocodeLocations = async (fromAddress: string, toAddress: string) => {
    try {
      setLoadingLocations(true);
      
      let pickup: LatLng | null = null;
      let drop: LatLng | null = null;
      
      // Geocode pickup location
      const pickupResults = await Location.geocodeAsync(fromAddress);
      if (pickupResults && pickupResults.length > 0) {
        pickup = {
          latitude: pickupResults[0].latitude,
          longitude: pickupResults[0].longitude,
        };
        setPickupLocation(pickup);
      }

      // Geocode drop location
      const dropResults = await Location.geocodeAsync(toAddress);
      if (dropResults && dropResults.length > 0) {
        drop = {
          latitude: dropResults[0].latitude,
          longitude: dropResults[0].longitude,
        };
        setDropLocation(drop);
      }

      // Calculate route if both locations are available
      if (pickup && drop) {
        await calculateRoute(pickup, drop);
        
        // Fit map to show both locations
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates([pickup!, drop!], {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error geocoding locations:', error);
      Alert.alert("Error", "Failed to find locations on map.");
    } finally {
      setLoadingLocations(false);
    }
  };

  // Calculate route between two points
  const calculateRoute = async (start: LatLng, end: LatLng) => {
    try {
      const profile = 'driving'; // driving, walking, cycling
      const url = `https://router.project-osrm.org/route/v1/${profile}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  // Update route when locations change
  useEffect(() => {
    if (pickupLocation && dropLocation) {
      calculateRoute(pickupLocation, dropLocation);
    }
  }, [pickupLocation, dropLocation]);

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#04302B" />
          <Text style={styles.loadingText}>Loading ride information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!schedule) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#FFFFFF", "#B6DDB3"]} style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#04302B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Track Ride</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>No active ride found</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#FFFFFF", "#B6DDB3"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#04302B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Ride</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Schedule Info */}
          <View style={styles.infoCard}>
            <Text style={styles.scheduleTitle}>{schedule.title}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#04302B" />
              <Text style={styles.infoText}>{schedule.time}</Text>
            </View>
            {schedule.driverName && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#04302B" />
                <Text style={styles.infoText}>Driver: {schedule.driverName}</Text>
              </View>
            )}
            {schedule.driverPhone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#04302B" />
                <Text style={styles.infoText}>{schedule.driverPhone}</Text>
              </View>
            )}
            <View style={styles.locationRow}>
              <View style={styles.locationItem}>
                <Ionicons name="location" size={20} color="#4CAF50" />
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText} numberOfLines={2}>{schedule.fromLocation}</Text>
              </View>
              <View style={styles.locationItem}>
                <Ionicons name="location" size={20} color="#F44336" />
                <Text style={styles.locationLabel}>Drop-off</Text>
                <Text style={styles.locationText} numberOfLines={2}>{schedule.toLocation}</Text>
              </View>
            </View>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            {loadingLocations ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="large" color="#04302B" />
                <Text style={styles.mapLoadingText}>Loading map...</Text>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: pickupLocation?.latitude || 6.9271,
                  longitude: pickupLocation?.longitude || 79.8612,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                {/* Pickup Marker */}
                {pickupLocation && (
                  <Marker
                    coordinate={pickupLocation}
                    pinColor="green"
                    title="Pickup Location"
                    description={schedule.fromLocation}
                  />
                )}
                
                {/* Drop-off Marker */}
                {dropLocation && (
                  <Marker
                    coordinate={dropLocation}
                    pinColor="red"
                    title="Drop-off Location"
                    description={schedule.toLocation}
                  />
                )}

                {/* Driver Location with 3D Car Marker */}
                {driverLocation && ride?.status === 'in_progress' && (
                  <Marker
                    coordinate={driverLocation}
                    anchor={{ x: 0.5, y: 0.5 }}
                    title="Driver Location"
                    description="Driver's current location"
                    rotation={driverHeading}
                  >
                    <View style={styles.carMarkerContainer}>
                      <View style={[styles.carMarker, { transform: [{ rotate: `${driverHeading}deg` }] }]}>
                        <Ionicons name="car" size={40} color="#2196F3" />
                        <View style={styles.carShadow} />
                      </View>
                    </View>
                  </Marker>
                )}

                {/* Route Polyline */}
                {routeCoordinates.length > 0 && (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#2196F3"
                    strokeWidth={4}
                  />
                )}
              </MapView>
            )}
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Ride Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: schedule.status === 'completed' ? '#4CAF50' : schedule.status === 'confirmed' ? '#2196F3' : '#FF9800' }]} />
              <Text style={styles.statusText}>
                {schedule.status === 'completed' ? 'Completed' : 
                 schedule.status === 'confirmed' ? 'Confirmed' : 
                 schedule.status === 'cancelled' ? 'Cancelled' : 'Pending'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#04302B",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#999",
  },
  infoCard: {
    backgroundColor: "#E8F5E8",
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleTitle: {
    fontSize: 22,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#04302B",
  },
  locationRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 15,
  },
  locationItem: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#666",
    marginTop: 5,
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#04302B",
  },
  mapContainer: {
    height: 400,
    margin: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
  },
  mapLoadingText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#04302B",
  },
  statusCard: {
    backgroundColor: "#E8F5E8",
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#04302B",
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#04302B",
  },
  carMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carMarker: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  carShadow: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
  },
});

