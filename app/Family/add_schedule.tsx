import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
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

interface Driver {
  _id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isAvailable?: boolean;
}

const THEME_COLOR = "#04302B";

const AddSchedule = () => {
  const router = useRouter();
  const {
    selectedDate,
    editMode,
    scheduleId,
    title: initialTitle,
    time: initialTime,
    fromLocation: initialFromLocation,
    toLocation: initialToLocation,
  } = useLocalSearchParams();
  const resolvedScheduleId = Array.isArray(scheduleId) ? scheduleId[0] : scheduleId;
  const resolvedEditMode = Array.isArray(editMode) ? editMode[0] : editMode;

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  const [title, setTitle] = useState(initialTitle as string || "");
  const [time, setTime] = useState(initialTime as string || "");
  const [fromLocation, setFromLocation] = useState(initialFromLocation as string || "");
  const [toLocation, setToLocation] = useState(initialToLocation as string || "");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isEditMode = resolvedEditMode === "true" && !!resolvedScheduleId;
  const scheduleIdForEdit = resolvedScheduleId || "";
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);

  const [date, setDate] = useState(
    selectedDate ? new Date(selectedDate as string) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const getDriverDisplayName = (driver?: Driver | null) => {
    if (!driver) return "Select Driver";
    const nameParts = [driver.firstName, driver.lastName].filter(Boolean).join(" ").trim();
    if (nameParts.length > 0) return nameParts;
    return driver.phoneNumber || "Driver";
  };

  // Load user data and schedules (used for driver availability + editing)
  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }

        const response = await apiGet<{ schedules: any[] }>('/schedules');
        const schedulesData = response.schedules || [];
        setAllSchedules(schedulesData);

        if (isEditMode && scheduleIdForEdit) {
          const schedule = schedulesData.find((s: any) => s._id === scheduleIdForEdit);
          if (schedule) {
            setTitle(schedule.title || "");
            setTime(schedule.time || "");
            setFromLocation(schedule.fromLocation || "");
            setToLocation(schedule.toLocation || "");
            if (schedule.date) {
              setDate(new Date(schedule.date));
            }
            if (schedule.driverId) {
              setSelectedDriver({
                _id: schedule.driverId,
                firstName: schedule.driverName,
                phoneNumber: schedule.driverPhone,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [isEditMode, scheduleIdForEdit]);

  // Load available drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!user) return;
      try {
        setDriversLoading(true);
        const response = await apiGet<{ drivers: Driver[] }>('/drivers');
        setDrivers(response.drivers || []);
      } catch (error) {
        console.error('Error fetching drivers:', error);
        Alert.alert("Error", "Failed to load drivers. Please try again.");
      } finally {
        setDriversLoading(false);
      }
    };
    fetchDrivers();
  }, [user]);

  // Filter drivers that are available for selected date/time
  useEffect(() => {
    if (!drivers || drivers.length === 0) {
      if (selectedDriver) {
        setAvailableDrivers([selectedDriver]);
      } else {
        setAvailableDrivers([]);
      }
      return;
    }

    const currentDateKey = date.toISOString().split('T')[0];
    const busyDrivers = new Set<string>();

    allSchedules.forEach((schedule: any) => {
      if (!schedule?.driverId) return;
      if (isEditMode && schedule._id === scheduleIdForEdit) return;

      const scheduleDate = schedule.date ? new Date(schedule.date) : null;
      if (!scheduleDate) return;
      const scheduleDateKey = scheduleDate.toISOString().split('T')[0];
      if (scheduleDateKey !== currentDateKey) return;

      const sameTime = time ? schedule.time === time : true;
      const isActiveStatus = !schedule.status || ["pending", "confirmed"].includes(schedule.status);
      if (sameTime && isActiveStatus) {
        busyDrivers.add(schedule.driverId.toString());
      }
    });

    const filtered = drivers.filter((driver) => {
      const driverId = driver._id?.toString();
      if (!driverId) return false;

      if (selectedDriver && selectedDriver._id === driverId) {
        return true;
      }

      if (driver.isAvailable === false) {
        return false;
      }

      if (busyDrivers.has(driverId)) {
        return false;
      }

      return true;
    });

    if (selectedDriver && !filtered.find((d) => d._id === selectedDriver._id)) {
      filtered.unshift(selectedDriver);
    }

    setAvailableDrivers(filtered);
  }, [drivers, allSchedules, date, time, selectedDriver, isEditMode, scheduleIdForEdit]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  // ✅ Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location access.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [address] = await Location.reverseGeocodeAsync(location.coords);
      setFromLocation(
        `${address.name || ""}, ${address.city || ""}, ${address.region || ""}`
      );
    } catch (error: any) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location. Please make sure location services are enabled and try again.");
    }
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

    if (!selectedDriver) {
      Alert.alert("Error", "Please select an available driver.");
      return;
    }

    setLoading(true);

    try {
      // Format date for backend (YYYY-MM-DD) - use local date to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
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

      const driverName = getDriverDisplayName(selectedDriver);

      // Save or update to backend
      if (isEditMode && scheduleIdForEdit) {
        // Update existing schedule
        await apiPut(`/schedules/${scheduleIdForEdit}`, {
          title,
          date: formattedDate,
          time,
          fromLocation,
          toLocation,
          driverId: selectedDriver._id,
          driverName,
          driverPhone: selectedDriver.phoneNumber,
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
          driverId: selectedDriver._id,
          driverName,
          driverPhone: selectedDriver.phoneNumber,
        });
        Alert.alert("Success", "Event saved successfully!");
      }

      // Emit event for local updates
      scheduleEventEmitter.emit("eventAdded", {
        title,
        time,
        date: date.toDateString(),
        driver: driverName,
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

      <View style={styles.selectorWrapper}>
        <Text style={styles.label}>Driver</Text>
        <TouchableOpacity
          style={styles.driverSelector}
          onPress={() => {
            if (availableDrivers.length > 0) {
              setDriverModalVisible(true);
            } else {
              Alert.alert("No Drivers", "No available drivers for the selected date/time.");
            }
          }}
        >
          <Text
            style={
              selectedDriver ? styles.driverValue : styles.driverPlaceholder
            }
          >
            {getDriverDisplayName(selectedDriver)}
          </Text>
          <Ionicons name="chevron-down" size={18} color={THEME_COLOR} />
        </TouchableOpacity>
        {driversLoading && (
          <ActivityIndicator size="small" color={THEME_COLOR} style={{ marginTop: 8 }} />
        )}
        {!driversLoading && availableDrivers.length === 0 && (
          <Text style={styles.helperText}>No drivers available for this selection.</Text>
        )}
      </View>

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

      <Modal
        visible={driverModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDriverModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Driver</Text>
            <ScrollView style={styles.modalList}>
              {availableDrivers.map((driverOption) => (
                <TouchableOpacity
                  key={driverOption._id}
                  style={styles.modalDriverCard}
                  onPress={() => {
                    setSelectedDriver(driverOption);
                    setDriverModalVisible(false);
                  }}
                >
                  <Text style={styles.modalDriverName}>
                    {getDriverDisplayName(driverOption)}
                  </Text>
                  {driverOption.phoneNumber && (
                    <Text style={styles.modalDriverPhone}>{driverOption.phoneNumber}</Text>
                  )}
                </TouchableOpacity>
              ))}
              {!driversLoading && availableDrivers.length === 0 && (
                <Text style={styles.modalEmptyText}>No drivers available right now.</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setDriverModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  label: {
    fontSize: 16,
    color: THEME_COLOR,
    fontFamily: "ArimaMadurai_700Bold",
    marginBottom: 6,
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
  selectorWrapper: {
    marginBottom: 15,
  },
  driverSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE2D3",
  },
  driverValue: {
    color: THEME_COLOR,
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: 16,
  },
  driverPlaceholder: {
    color: "#7b7b7b",
    fontFamily: "ArimaMadurai_400Regular",
    fontSize: 16,
  },
  helperText: {
    marginTop: 6,
    color: "#a33",
    fontSize: 13,
    fontFamily: "ArimaMadurai_400Regular",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxHeight: "70%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "ArimaMadurai_700Bold",
    color: THEME_COLOR,
    marginBottom: 12,
    textAlign: "center",
  },
  modalList: {
    marginBottom: 12,
  },
  modalDriverCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalDriverName: {
    fontSize: 16,
    fontFamily: "ArimaMadurai_700Bold",
    color: THEME_COLOR,
  },
  modalDriverPhone: {
    fontSize: 14,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#555",
    marginTop: 2,
  },
  modalEmptyText: {
    textAlign: "center",
    color: "#555",
    fontFamily: "ArimaMadurai_400Regular",
    marginVertical: 12,
  },
  modalCloseButton: {
    backgroundColor: THEME_COLOR,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#fff",
    fontFamily: "ArimaMadurai_700Bold",
    fontSize: 16,
  },
});
 