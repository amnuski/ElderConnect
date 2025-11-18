import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import scheduleEventEmitter from "./scheduleEventEmitter";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";
import { apiPost, apiPut, apiGet } from "@/services/api";

const THEME_COLOR = "#04302B";

const AddSchedule = () => {
  const router = useRouter();
  const { selectedDate, editMode, scheduleId, title: initialTitle, time: initialTime, fromLocation: initialFromLocation, toLocation: initialToLocation } = useLocalSearchParams();

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  const [title, setTitle] = useState(initialTitle as string || "");
  const [time, setTime] = useState(initialTime as string || "");
  const [driver, setDriver] = useState("");
  const [fromLocation, setFromLocation] = useState(initialFromLocation as string || "");
  const [toLocation, setToLocation] = useState(initialToLocation as string || "");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isEditMode = editMode === "true" && scheduleId;

  const [date, setDate] = useState(
    selectedDate ? new Date(selectedDate as string) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load user data and schedule data if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }

        // If editing, load the schedule data
        if (isEditMode && scheduleId) {
          try {
            const response = await apiGet<{ schedules: any[] }>('/schedules');
            const schedule = response.schedules.find((s: any) => s._id === scheduleId);
            if (schedule) {
              setTitle(schedule.title || "");
              setTime(schedule.time || "");
              setFromLocation(schedule.fromLocation || "");
              setToLocation(schedule.toLocation || "");
              if (schedule.date) {
                setDate(new Date(schedule.date));
              }
            }
          } catch (error) {
            console.error('Error loading schedule:', error);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [isEditMode, scheduleId]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  // ✅ Get current location
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please enable location access.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const [address] = await Location.reverseGeocodeAsync(location.coords);
    setFromLocation(
      `${address.name || ""}, ${address.city || ""}, ${address.region || ""}`
    );
  };

  // ✅ Save event
  const handleAdd = async () => {
    if (!title || !time || !fromLocation || !toLocation) {
      Alert.alert("Error", "Please fill all required fields!");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found. Please login again.");
      return;
    }

    setLoading(true);

    try {
      // Format date for backend (YYYY-MM-DD)
      const formattedDate = date.toISOString().split('T')[0];
      
      // Determine elderId and familyId based on user role
      let elderId = user._id;
      let familyId = user._id;
      
      // If user is family member, we need to get the elder they're associated with
      // For now, using the same user ID (you can update this based on your family relationship logic)
      if (user.role === 'family') {
        // In a real app, you'd get the elder ID from family relationships
        // For now, using the same ID (you may need to add a family relationship model)
        elderId = user._id;
        familyId = user._id;
      } else if (user.role === 'elder') {
        // Elder creating their own schedule
        elderId = user._id;
        // You might want to get familyId from family relationships
        familyId = user._id;
      }

      // Save or update to backend
      if (isEditMode && scheduleId) {
        // Update existing schedule
        await apiPut(`/schedules/${scheduleId}`, {
          title,
          date: formattedDate,
          time,
          fromLocation,
          toLocation,
        });
        Alert.alert("Success", "Event updated successfully!");
      } else {
        // Create new schedule
        await apiPost('/schedules', {
          elderId,
          familyId,
          title,
          date: formattedDate,
          time,
          fromLocation,
          toLocation,
        });
        Alert.alert("Success", "Event saved successfully!");
      }

      // Emit event for local updates
      scheduleEventEmitter.emit("eventAdded", {
        title,
        time,
        date: date.toDateString(),
        driver,
        location: `${fromLocation} → ${toLocation}`,
      });

      setLoading(false);
      router.back();
    } catch (error: any) {
      setLoading(false);
      console.error('Error saving schedule:', error);
      Alert.alert(
        "Error",
        error.message || "Failed to save event. Please try again."
      );
    }
  };

  // ✅ Format time
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={THEME_COLOR} />
        </TouchableOpacity>
        <Text style={styles.header}>{isEditMode ? "Edit Event" : "Add Event"}</Text>
      </View>

      {/* 📅 Date Picker */}
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.inputBox}
      >
        <Text style={styles.inputText}>{`Date: ${date.toDateString()}`}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {/* 🕒 Time Picker */}
      <TouchableOpacity
        onPress={() => setShowTimePicker(true)}
        style={styles.inputBox}
      >
        <Text style={styles.inputText}>
          {time ? `Time: ${time}` : "Select Time"}
        </Text>
      </TouchableOpacity>

      {showTimePicker && (
        <DateTimePicker
          mode="time"
          value={new Date()}
          display="spinner"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setTime(formatTime(selectedTime));
          }}
        />
      )}

      <TextInput
        placeholder="Event Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholderTextColor="#7b7b7b"
      />

      <View style={styles.row}>
        <TextInput
          placeholder="From Location"
          value={fromLocation}
          onChangeText={setFromLocation}
          style={[styles.input, { flex: 1 }]}
          placeholderTextColor="#7b7b7b"
        />
        <TouchableOpacity onPress={getCurrentLocation}>
          <Ionicons name="locate" size={28} color={THEME_COLOR} />
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="To Location"
        value={toLocation}
        onChangeText={setToLocation}
        style={styles.input}
        placeholderTextColor="#7b7b7b"
      />

      <TextInput
        placeholder="Driver Name"
        value={driver}
        onChangeText={setDriver}
        style={styles.input}
        placeholderTextColor="#7b7b7b"
      />

      <TouchableOpacity 
        style={[styles.addButton, loading && styles.addButtonDisabled]} 
        onPress={handleAdd}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.addText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default AddSchedule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9F6EC",
    padding: 40,
    marginTop: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  header: {
    fontSize: 26,
    color: THEME_COLOR,
    marginLeft: 10,
    fontFamily: "ArimaMadurai_700Bold",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    color: THEME_COLOR,
    fontFamily: "ArimaMadurai_400Regular",
  },
  inputBox: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  inputText: {
    fontSize: 16,
    color: THEME_COLOR,
    fontFamily: "ArimaMadurai_400Regular",
  },
  addButton: {
    backgroundColor: THEME_COLOR,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  addText: {
    color: "white",
    fontSize: 18,
    fontFamily: "ArimaMadurai_700Bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
});
 