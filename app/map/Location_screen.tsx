import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, LatLng } from "react-native-maps";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
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

  // Search using OpenStreetMap Nominatim
  const searchLocation = async (query: string, setLocation: (loc: LatLng) => void) => {
    if (!query) return;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "DriverApp/1.0 (your_email@example.com)",
          "Accept-Language": "en",
        },
      });

      const data: NominatimResult[] = await response.json();
      if (data.length > 0) {
        const loc: LatLng = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        setLocation(loc);
        mapRef.current?.animateToRegion({ ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 1000);
      } else {
        Alert.alert("Location not found");
      }
    } catch (error) {
      console.error("Search error:", error);
    }
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
        setRoute(coords);
        setDistance(json.routes[0].distance / 1000);
        setDuration(json.routes[0].duration / 60);

        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, bottom: 50, left: 50, right: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error("OSRM route error:", error);
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
        <TextInput
          style={styles.input}
          placeholder="Start location"
          value={startText}
          onChangeText={setStartText}
        />
        <TouchableOpacity style={styles.button} onPress={() => searchLocation(startText, setStartLocation)}>
          <Text style={styles.buttonText}>From</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { top: 100 }]}>
        <TextInput
          style={styles.input}
          placeholder="Destination"
          value={endText}
          onChangeText={setEndText}
        />
        <TouchableOpacity style={styles.button} onPress={() => searchLocation(endText, setEndLocation)}>
          <Text style={styles.buttonText}>To</Text>
        </TouchableOpacity>
      </View>

      {/* Directions info */}
      {startLocation && endLocation && (
        <View style={styles.directionContainer}>
          <Text>Distance: {distance ? distance.toFixed(2) : "-"} km</Text>
          <Text>Duration: {duration ? duration.toFixed(0) : "-"} min</Text>
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
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  input: { flex: 1, padding: 8 },
  button: { backgroundColor: "#007c15ff", padding: 10, borderRadius: 5, marginLeft: 5 },
  buttonText: { color: "white", fontWeight: "bold" },
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
  modeButtons: { flexDirection: "row", marginTop: 10, justifyContent: "space-around" },
  modeButton: { padding: 8, backgroundColor: "#eee", borderRadius: 5 },
});
