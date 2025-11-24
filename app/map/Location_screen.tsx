import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import MapView, { Marker, Polyline, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
}

export default function App() {
  const mapRef = useRef<MapView | null>(null);

  // State for start and destination
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [startLocation, setStartLocation] = useState<LatLng | null>(null);
  const [endLocation, setEndLocation] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location access to use this feature.");
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLoc: LatLng = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setStartLocation(currentLoc);

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync(currentLoc);
      const addressString = `${address.name || ""}${address.street ? ", " + address.street : ""}${address.city ? ", " + address.city : ""}${address.region ? ", " + address.region : ""}`.trim();
      setStartText(addressString || "Current Location");

      // Center map on current location
      mapRef.current?.animateToRegion({
        ...currentLoc,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location. Please try again.");
    } finally {
      setLoadingLocation(false);
    }
  };

  // Search locations using OpenStreetMap Nominatim
  const searchLocations = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "ElderConnectApp/1.0",
          "Accept-Language": "en",
        },
      });

      const data: NominatimResult[] = await response.json();
      setSearchResults(data);
      setShowSearchResults(data.length > 0);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search locations. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // Select a location from search results
  const selectLocation = (result: NominatimResult, isStart: boolean = false) => {
    const loc: LatLng = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    if (isStart) {
      setStartLocation(loc);
      setStartText(result.display_name);
    } else {
      setEndLocation(loc);
      setEndText(result.display_name);
      // Auto-calculate route if start location exists
      if (startLocation) {
        getRoute();
      }
    }

    setShowSearchResults(false);
    setSearchResults([]);
    mapRef.current?.animateToRegion({
      ...loc,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  // Load current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const calculateFare = (distanceKm: number) => {
    const baseFare = 200; // flat fee to dispatch a vehicle
    const perKmRate = 75; // cost per km
    return Math.max(baseFare, baseFare + distanceKm * perKmRate);
  };

  // Get route from OSRM
  const getRoute = async (mode: "car" | "bike" | "foot" = "car") => {
    if (!startLocation || !endLocation) return;

    let profile = mode === "bike" ? "bike" : mode === "foot" ? "foot" : "driving";

    const url = `https://router.project-osrm.org/route/v1/${profile}/${startLocation.longitude},${startLocation.latitude};${endLocation.longitude},${endLocation.latitude}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      const json = await response.json();

      if (json.routes.length > 0) {
        const coords = json.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
        );
        const computedDistance = json.routes[0].distance / 1000;
        setRoute(coords);
        setDistance(computedDistance);
        setDuration(json.routes[0].duration / 60);
        setFare(calculateFare(computedDistance));

        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
          animated: true,
        });
      } else {
        setFare(null);
      }
    } catch (error) {
      console.error("OSRM route error:", error);
      setFare(null);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 7.8731,
          longitude: 80.7718,
          latitudeDelta: 2.5,
          longitudeDelta: 2.5,
        }}
      >
        {startLocation && <Marker coordinate={startLocation} pinColor="green" title="Start" />}
        {endLocation && <Marker coordinate={endLocation} pinColor="red" title="Destination" />}
        {route.length > 0 && <Polyline coordinates={route} strokeWidth={5} strokeColor="blue" />}
      </MapView>

      {/* Search bars */}
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="location" size={20} color="#04302B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="From (Current Location)"
            value={startText}
            onChangeText={setStartText}
            editable={false}
            placeholderTextColor="#999"
          />
          {loadingLocation ? (
            <ActivityIndicator size="small" color="#04302B" style={styles.loadingIcon} />
          ) : (
            <TouchableOpacity onPress={getCurrentLocation} style={styles.locationButton}>
              <Ionicons name="refresh" size={20} color="#04302B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.searchContainer, { top: 100 }]}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color="#04302B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="To (Search destination)"
            value={endText}
            onChangeText={(text) => {
              setEndText(text);
              searchLocations(text);
            }}
            placeholderTextColor="#999"
          />
          {searching && (
            <ActivityIndicator size="small" color="#04302B" style={styles.loadingIcon} />
          )}
        </View>
      </View>

      {/* Search Results Modal */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => selectLocation(item, false)}
              >
                <Ionicons name="location-outline" size={20} color="#04302B" />
                <Text style={styles.searchResultText} numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
          />
        </View>
      )}

      {/* Directions info */}
      {startLocation && endLocation && (
        <View style={styles.directionContainer}>
          <Text>Distance: {distance ? distance.toFixed(2) : "-"} km</Text>
          <Text>Duration: {duration ? duration.toFixed(0) : "-"} min</Text>
          <Text style={styles.fareText}>
            Estimated Fare: {fare ? `LKR ${fare.toFixed(0)}` : "-"}
          </Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity style={styles.modeButton} onPress={() => getRoute("car")}>
              <Text>Car</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modeButton} onPress={() => getRoute("bike")}>
              <Text>Bike</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modeButton} onPress={() => getRoute("foot")}>
              <Text>Walk</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  searchContainer: {
    position: "absolute",
    top: 40,
    left: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    fontSize: 16,
    color: "#000",
  },
  loadingIcon: {
    marginLeft: 8,
  },
  locationButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchResultsContainer: {
    position: "absolute",
    top: 150,
    left: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchResultText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
  },
  directionContainer: {
    position: "absolute",
    bottom: 30,
    left: 10,
    right: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fareText: {
    marginTop: 8,
    fontWeight: "600",
    color: "#04302B",
  },
  modeButtons: { flexDirection: "row", marginTop: 10, justifyContent: "space-around" },
  modeButton: { padding: 8, backgroundColor: "#eee", borderRadius: 5 },
});
