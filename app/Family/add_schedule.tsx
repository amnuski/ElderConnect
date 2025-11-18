import React, { useState } from "react";
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
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../constants/api";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import scheduleEventEmitter from "./scheduleEventEmitter";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";

const THEME_COLOR = "#04302B";

const AddSchedule = () => {
  const router = useRouter();
  const { selectedDate } = useLocalSearchParams();

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [driver, setDriver] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  const [date, setDate] = useState(
    selectedDate ? new Date(selectedDate as string) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    if (!title || !time || !fromLocation || !toLocation || !selectedTime) {
      Alert.alert("Error", "Please fill all required fields!");
      return;
    }

    try {
      const userDataStr = await AsyncStorage.getItem("userData");
      if (!userDataStr) {
        Alert.alert("Error", "User not found. Please login again.");
        router.push("/Welcoming_screen/verify-num");
        return;
      }
      const userData = JSON.parse(userDataStr);

      // Build a Date object for the scheduled datetime (combine selected date and time)
      const scheduledDate = new Date(date);
      scheduledDate.setHours(selectedTime.getHours());
      scheduledDate.setMinutes(selectedTime.getMinutes());
      scheduledDate.setSeconds(0);

      // Prepare payload for backend. Use elderId/familyId as current user when relation not available.
      const payload: any = {
        elderId: userData._id,
        familyId: userData._id,
        title,
        date: scheduledDate.toISOString(),
        time,
        fromLocation,
        toLocation,
      };

      // Create schedule on backend
      const response = await api.createSchedule(payload);
      if (response?.schedule) {
        const created = response.schedule;

        // Emit local event to update schedule list in UI
        // Provide both ISO and formatted date so all listeners can consume the shape they expect
        scheduleEventEmitter.emit('eventAdded', {
          title: created.title,
          time: created.time,
          date: new Date(created.date).toDateString(), // human readable date for list components
          iso: created.date, // keep ISO for dashboards that want precise filtering
          fromLocation: created.fromLocation,
          toLocation: created.toLocation,
          location: `${created.fromLocation || ''}${created.toLocation ? ` → ${created.toLocation}` : ''}`,
        });

        // Request permission and schedule local notification
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            const seconds = Math.floor((scheduledDate.getTime() - Date.now()) / 1000);
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Reminder: ${title}`,
                body: `Scheduled at ${time}`,
                data: { scheduleId: created._id },
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(seconds, 1) },
            });
          }
        } catch (nErr) {
          console.warn('Failed to schedule notification', nErr);
        }

        Alert.alert('Success', 'Event saved successfully!');
        router.back();
        return;
      }

      // Fallback: emit locally if backend did not return schedule
      scheduleEventEmitter.emit('eventAdded', {
        title,
        time,
        date: scheduledDate.toDateString(),
        iso: scheduledDate.toISOString(),
        fromLocation,
        toLocation,
        location: `${fromLocation || ''}${toLocation ? ` → ${toLocation}` : ''}`,
      });
      Alert.alert('Success', 'Event saved locally');
      router.back();
    } catch (error: any) {
      console.error('Add schedule error', error);
      Alert.alert('Error', error.message || 'Failed to save event');
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
        <Text style={styles.header}>Add Event</Text>
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
            if (selectedTime) {
              setSelectedTime(selectedTime);
              setTime(formatTime(selectedTime));
            }
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

      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Text style={styles.addText}>Save</Text>
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
});
 