// app/Driver/route-view.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { apiGet } from "@/services/api";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";

interface Ride {
  _id: string;
  pickupLocation: string;
  dropLocation: string;
  scheduledTime: string;
  status: string;
}

export default function DriverRouteViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rideId = params.rideId as string;
  const mapRef = useRef<MapView | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<Ride | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LatLng | null>(null);
  const [dropLocation, setDropLocation] = useState<LatLng | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  // Fetch ride data
  useEffect(() => {
    const fetchRide = async () => {
      try {
        setLoading(true);
        const response = await apiGet<{ rides: Ride[] }>('/api/rides');
        const foundRide = response.rides?.find((r: Ride) => r._id === rideId);
        
        if (foundRide) {
          setRide(foundRide);
          // Geocode locations
          await geocodeLocations(foundRide.pickupLocation, foundRide.dropLocation);
        } else {
          Alert.alert("Error", "Ride not found", [
            { text: "OK", onPress: () => router.back() }
          ]);
        }
      } catch (error: any) {
        console.error('Error fetching ride:', error);
        Alert.alert("Error", error.message || "Failed to load ride information.");
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchRide();
    }
  }, [rideId]);

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting current location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  // Geocode address strings to coordinates
  const geocodeLocations = async (pickupAddress: string, dropAddress: string) => {
    try {
      setLoadingLocations(true);
      
      let pickup: LatLng | null = null;
      let drop: LatLng | null = null;
      
      // Geocode pickup location
      const pickupResults = await Location.geocodeAsync(pickupAddress);
      if (pickupResults && pickupResults.length > 0) {
        pickup = {
          latitude: pickupResults[0].latitude,
          longitude: pickupResults[0].longitude,
        };
        setPickupLocation(pickup);
      }

      // Geocode drop location
      const dropResults = await Location.geocodeAsync(dropAddress);
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
      const profile = 'driving';
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
        setDistance(route.distance / 1000); // Convert to km
        setDuration(route.duration / 60); // Convert to minutes
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#04302B" />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#FFFFFF", "#B6DDB3"]} style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#04302B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Route View</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>No ride information found</Text>
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
          <Text style={styles.headerTitle}>Route to Destination</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ride Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#4CAF50" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText} numberOfLines={2}>{ride.pickupLocation}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#F44336" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Drop-off</Text>
                <Text style={styles.locationText} numberOfLines={2}>{ride.dropLocation}</Text>
              </View>
            </View>
            {distance && duration && (
              <View style={styles.routeInfo}>
                <View style={styles.routeInfoItem}>
                  <Ionicons name="navigate" size={18} color="#2196F3" />
                  <Text style={styles.routeInfoText}>{distance.toFixed(1)} km</Text>
                </View>
                <View style={styles.routeInfoItem}>
                  <Ionicons name="time-outline" size={18} color="#2196F3" />
                  <Text style={styles.routeInfoText}>{Math.round(duration)} min</Text>
                </View>
              </View>
            )}
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
                {/* Current Location Marker */}
                {currentLocation && (
                  <Marker
                    coordinate={currentLocation}
                    title="Your Location"
                    description="Your current location"
                  >
                    <View style={styles.currentLocationMarker}>
                      <Ionicons name="navigate" size={24} color="#2196F3" />
                    </View>
                  </Marker>
                )}

                {/* Pickup Marker */}
                {pickupLocation && (
                  <Marker
                    coordinate={pickupLocation}
                    title="Pickup Location"
                    description={ride.pickupLocation}
                  >
                    <View style={styles.pickupMarker}>
                      <Ionicons name="location" size={30} color="#4CAF50" />
                    </View>
                  </Marker>
                )}
                
                {/* Drop-off Marker */}
                {dropLocation && (
                  <Marker
                    coordinate={dropLocation}
                    title="Drop-off Location"
                    description={ride.dropLocation}
                  >
                    <View style={styles.dropMarker}>
                      <Ionicons name="location" size={30} color="#F44336" />
                    </View>
                  </Marker>
                )}

                {/* Route Polyline */}
                {routeCoordinates.length > 0 && (
                  <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#2196F3"
                    strokeWidth={5}
                  />
                )}
              </MapView>
            )}
          </View>

          {/* Navigation Button */}
          {pickupLocation && dropLocation && (
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => {
                // Open in external maps app
                const url = `https://www.google.com/maps/dir/?api=1&destination=${dropLocation.latitude},${dropLocation.longitude}`;
                Alert.alert(
                  "Open in Maps",
                  "Would you like to open this route in Google Maps?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open", onPress: () => {
                      // You can use Linking.openURL(url) here if needed
                      Alert.alert("Info", "Please use your preferred navigation app to navigate to the destination.");
                    }}
                  ]
                );
              }}
            >
              <Ionicons name="navigate" size={24} color="#FFFFFF" />
              <Text style={styles.navigateButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          )}
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
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  locationText: {
    fontSize: 15,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#04302B",
    lineHeight: 20,
  },
  routeInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#D0E0D0",
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeInfoText: {
    fontSize: 16,
    fontFamily: "ArimaMadurai_700Bold",
    color: "#2196F3",
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
  currentLocationMarker: {
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  pickupMarker: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  dropMarker: {
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#F44336",
  },
  navigateButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    margin: 20,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  navigateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "ArimaMadurai_700Bold",
  },
});

