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

type LinkedElder = {
  id: string;
  name: string;
  relation?: string;
  phone?: string;
};

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
  
  console.log('AddSchedule - Edit Mode:', resolvedEditMode, 'Schedule ID:', resolvedScheduleId);

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
  const [driverRides, setDriverRides] = useState<Map<string, any[]>>(new Map());
  const [busyDrivers, setBusyDrivers] = useState<Set<string>>(new Set());
  const [linkedElders, setLinkedElders] = useState<LinkedElder[]>([]);
  const [selectedElder, setSelectedElder] = useState<LinkedElder | null>(null);
  const [elderModalVisible, setElderModalVisible] = useState(false);
  const [linkedEldersLoading, setLinkedEldersLoading] = useState(false);

  const [date, setDate] = useState(
    selectedDate ? new Date(selectedDate as string) : new Date()
  );
  // Initialize with minimum time (current time + 30 minutes)
  const getMinimumTime = () => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    // Round up to next 5 minutes for better UX
    const minutes = minTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    minTime.setMinutes(roundedMinutes);
    if (roundedMinutes >= 60) {
      minTime.setHours(minTime.getHours() + 1);
      minTime.setMinutes(0);
    }
    return minTime;
  };
  const [selectedTime, setSelectedTime] = useState<Date>(getMinimumTime());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const getDriverDisplayName = (driver?: Driver | null) => {
    if (!driver) return "Select Driver";
    const nameParts = [driver.firstName, driver.lastName].filter(Boolean).join(" ").trim();
    if (nameParts.length > 0) return nameParts;
    return driver.phoneNumber || "Driver";
  };
  const getElderDisplayName = (elder?: LinkedElder | null) => {
    if (!elder) return "Select Elder";
    return elder.name || elder.relation || "Elder";
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
            console.log('Loading schedule for edit:', schedule);
            setTitle(schedule.title || "");
            setTime(schedule.time || "");
            setFromLocation(schedule.fromLocation || "");
            setToLocation(schedule.toLocation || "");
            if (schedule.date) {
              setDate(new Date(schedule.date));
            }
            // Parse time string to Date object for time picker
            // This allows user to select any time when editing
            if (schedule.time) {
              try {
                const timeMatch = schedule.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (timeMatch) {              
                  let hour = parseInt(timeMatch[1]);
                  const minutes = parseInt(timeMatch[2]);
                  const period = timeMatch[3].toUpperCase();
                  if (period === 'PM' && hour !== 12) hour += 12;
                  if (period === 'AM' && hour === 12) hour = 0;
                  
                  const timeDate = new Date();
                  timeDate.setHours(hour, minutes, 0, 0);
                  setSelectedTime(timeDate);
                }
              } catch (error) {
                console.error('Error parsing time:', error);
              }
            }
            if (schedule.driverId) {
              setSelectedDriver({
                _id: schedule.driverId,
                firstName: schedule.driverName,
                phoneNumber: schedule.driverPhone,
              });
            } else {
              // Driver was declined/cleared - allow selecting new driver
              setSelectedDriver(null);
            }
          } else {
            console.error('Schedule not found for edit:', scheduleIdForEdit);
            Alert.alert("Error", "Schedule not found. Please try again.");
            router.back();
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (isEditMode) {
          Alert.alert("Error", "Failed to load schedule data. Please try again.");
        }
      }
    };
    loadData();
  }, [isEditMode, scheduleIdForEdit]);

  // Load available drivers and their active rides
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!user) return;
      try {
        setDriversLoading(true);
        const response = await apiGet<{ drivers: Driver[] }>('/drivers');
        const driversList = response.drivers || [];
        setDrivers(driversList);
        
        // Fetch active rides for each driver
        const ridesMap = new Map<string, any[]>();
        for (const driver of driversList) {
          try {
            const ridesResponse = await apiGet<{ rides: any[] }>(
              `/api/rides?driverId=${driver._id}&status=in_progress,accepted`
            );
            const activeRides = (ridesResponse.rides || []).filter(
              (ride: any) => 
                ride.status === 'in_progress' || 
                ride.status === 'accepted' ||
                (ride.status === 'pending' && new Date(ride.scheduledTime) <= new Date())
            );
            ridesMap.set(driver._id, activeRides);
          } catch (error) {
            console.error(`Error fetching rides for driver ${driver._id}:`, error);
          }
        }
        setDriverRides(ridesMap);
      } catch (error) {
        console.error('Error fetching drivers:', error);
        Alert.alert("Error", "Failed to load drivers. Please try again.");
      } finally {
        setDriversLoading(false);
      }
    };
    fetchDrivers();
  }, [user]);

  useEffect(() => {
    const fetchLinkedElders = async () => {
      if (!user || user.role !== 'family') return;
      try {
        setLinkedEldersLoading(true);
        const response = await apiGet<{ members: any[] }>('/family?linked=me');
        const members = response.members || [];
        const mapped: LinkedElder[] = members
          .map((member) => {
            const elder = member.elderId;
            const elderId = typeof elder === 'object' && elder?._id ? elder._id : elder;
            if (!elderId) return null;
            const elderName =
              elder?.firstName || elder?.lastName
                ? [elder?.firstName, elder?.lastName].filter(Boolean).join(' ').trim()
                : member.relation || member.name || 'Elder';
            return {
              id: elderId,
              name: elderName,
              relation: member.relation,
              phone: elder?.phoneNumber,
            };
          })
          .filter(Boolean) as LinkedElder[];
        setLinkedElders(mapped);
        setSelectedElder((current) => current || mapped[0] || null);
      } catch (error) {
        console.error('Error loading linked elders:', error);
      } finally {
        setLinkedEldersLoading(false);
      }
    };
    fetchLinkedElders();
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
    const busyDriversSet = new Set<string>();

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
        busyDriversSet.add(schedule.driverId.toString());
      }
    });

    setBusyDrivers(busyDriversSet);

    const filtered = drivers.filter((driver) => {
      const driverId = driver._id?.toString();
      if (!driverId) return false;

      if (selectedDriver && selectedDriver._id === driverId) {
        return true;
      }

      if (driver.isAvailable === false) {
        return false;
      }

      // Use local busyDriversSet instead of state busyDrivers to avoid infinite loop
      if (busyDriversSet.has(driverId)) {
        return false;
      }

      // Check if driver is currently on a ride (has active rides)
      const activeRides = driverRides.get(driverId) || [];
      if (activeRides.length > 0) {
        return false; // Driver is currently driving
      }

      return true;
    });

    if (selectedDriver && !filtered.find((d) => d._id === selectedDriver._id)) {
      filtered.unshift(selectedDriver);
    }

    setAvailableDrivers(filtered);
    setBusyDrivers(busyDriversSet);
  }, [drivers, allSchedules, date, time, selectedDriver, isEditMode, scheduleIdForEdit, driverRides]);

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

    // Validate that scheduled time is at least 30 minutes from now
    try {
      const scheduleDate = new Date(date);
      const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        scheduleDate.setHours(hour, minutes, 0, 0);
        
        const now = new Date();
        const minScheduledTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
        
        if (scheduleDate <= now) {
          Alert.alert(
            "Invalid Schedule Time",
            "Cannot schedule at current time or in the past. Please schedule at least 30 minutes from now."
          );
          setLoading(false);
          return;
        }
        
        if (scheduleDate < minScheduledTime) {
          const minTimeStr = minScheduledTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          });
          Alert.alert(
            "Invalid Schedule Time",
            `Please schedule at least 30 minutes from now.\n\nMinimum time: ${minTimeStr}`
          );
          setLoading(false);
          return;
        }
      }
    } catch (timeError) {
      console.error('Error validating time:', timeError);
      Alert.alert("Error", "Invalid time format. Please select a valid time.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    let elderId = user._id;
    let familyId = user._id;

    if (user.role === 'family') {
      if (!selectedElder) {
        Alert.alert("Error", "Please select which elder this schedule is for.");
        setLoading(false);
        return;
      }
      elderId = selectedElder.id;
    }

    const driverName = getDriverDisplayName(selectedDriver);

    const elderIdStr = elderId?.toString();

    const hasConflict = allSchedules.some((schedule: any) => {
      if (!schedule.date || !schedule.time) return false;
      const scheduleDate = new Date(schedule.date);
      const scheduleDateKey = scheduleDate.toISOString().split('T')[0];
      const targetDateKey = formattedDate;
      const sameDate = scheduleDateKey === targetDateKey;
      const sameTime = schedule.time === time;
      let scheduleElderId = schedule.elderId;
      if (scheduleElderId && typeof scheduleElderId === 'object' && scheduleElderId._id) {
        scheduleElderId = scheduleElderId._id;
      }
      const sameElder =
        (scheduleElderId && scheduleElderId.toString() === elderIdStr) ||
        (!scheduleElderId && user.role !== 'family');
      return sameDate && sameTime && sameElder;
    });

    const saveSchedule = async () => {
      try {
        if (isEditMode && scheduleIdForEdit) {
          const updateData: any = {
            title,
            date: formattedDate,
            time,
            fromLocation,
            toLocation,
            driverId: selectedDriver._id,
            driverName,
            driverPhone: selectedDriver.phoneNumber,
          };
          
          const response = await apiPut(`/schedules/${scheduleIdForEdit}`, updateData);
          console.log('Updating schedule:', scheduleIdForEdit, 'with data:', updateData);
          console.log('Schedule updated successfully:', response);
          if (selectedDriver) {
            Alert.alert(
              "Schedule Updated ✅", 
              `Schedule updated. Ride status: ${response.schedule?.status === 'pending' ? 'Waiting for driver acceptance' : response.schedule?.status || 'Updated'}.`
            );
          } else {
            Alert.alert("Success", "Event updated successfully!");
          }
        } else {
          const createData = {
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
          };
          
          const response = await apiPost('/schedules', createData);
          console.log('Schedule created:', response);
          
          // Show message about driver acceptance requirement
          if (selectedDriver) {
            Alert.alert(
              "Ride Booking Sent ✅", 
              `Ride booking has been sent to ${driverName}. Waiting for driver acceptance. You will be notified when the driver responds.`,
              [{ text: "OK" }]
            );
          } else {
            Alert.alert("Success", "Event saved successfully!");
          }
        }

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
        console.error('Error details:', JSON.stringify(error, null, 2));
        const errorMessage = error?.data?.message || error?.message || error?.error || "Failed to save event. Please try again.";
        Alert.alert("Error", errorMessage);
      }
    };

    if (hasConflict) {
      setLoading(false);
      Alert.alert(
        "Schedule Conflict",
        "There is already an event at this time. Do you want to continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Proceed",
            onPress: () => {
              setLoading(true);
              saveSchedule();
            },
          },
        ]
      );
      return;
    }

    await saveSchedule();
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
          minimumDate={new Date()} // Cannot select past dates
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
              
              // If selected date is today, update time to minimum (current time + 30 minutes)
              const now = new Date();
              const selectedDateOnly = new Date(selectedDate);
              selectedDateOnly.setHours(0, 0, 0, 0);
              const todayOnly = new Date(now);
              todayOnly.setHours(0, 0, 0, 0);
              const isToday = selectedDateOnly.getTime() === todayOnly.getTime();
              
              if (isToday) {
                const minTime = getMinimumTime();
                setSelectedTime(minTime);
                setTime(formatTime(minTime));
              }
            }
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
          value={selectedTime}
          display="spinner"
          onChange={(event, selectedTimeValue) => {
            if (selectedTimeValue) {
              // Validate selected time is at least 30 minutes from now (only if date is today)
              const now = new Date();
              const minTime = new Date(now.getTime() + 30 * 60 * 1000);
              
              // Check if selected date is today
              const selectedDateOnly = new Date(date);
              selectedDateOnly.setHours(0, 0, 0, 0);
              const todayOnly = new Date(now);
              todayOnly.setHours(0, 0, 0, 0);
              const isToday = selectedDateOnly.getTime() === todayOnly.getTime();
              
              // Create a combined date-time for comparison
              const selectedDateTime = new Date(date);
              selectedDateTime.setHours(selectedTimeValue.getHours(), selectedTimeValue.getMinutes(), 0, 0);
              
              if (isToday && selectedDateTime < minTime) {
                setShowTimePicker(false);
                Alert.alert(
                  "Invalid Time",
                  `Please select a time at least 30 minutes from now.\n\nMinimum time: ${formatTime(minTime)}`,
                  [
                    {
                      text: "Set Minimum Time",
                      onPress: () => {
                        // Set to minimum time
                        setSelectedTime(minTime);
                        setTime(formatTime(minTime));
                      }
                    },
                    {
                      text: "Cancel",
                      style: "cancel"
                    }
                  ]
                );
                return;
              }
              
              setShowTimePicker(false);
              setSelectedTime(selectedTimeValue);
              setTime(formatTime(selectedTimeValue));
            } else {
              setShowTimePicker(false);
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

      {user?.role === 'family' && (
        <View style={styles.selectorWrapper}>
          <Text style={styles.label}>Elder</Text>
          <TouchableOpacity
            style={styles.driverSelector}
            onPress={() => {
              if (linkedElders.length > 0) {
                setElderModalVisible(true);
              } else {
                Alert.alert("No Elder Linked", "Please ensure an elder has added you as a family member.");
              }
            }}
          >
            <Text
              style={
                selectedElder ? styles.driverValue : styles.driverPlaceholder
              }
            >
              {getElderDisplayName(selectedElder)}
            </Text>
            <Ionicons name="chevron-down" size={18} color={THEME_COLOR} />
          </TouchableOpacity>
          {linkedEldersLoading && (
            <ActivityIndicator size="small" color={THEME_COLOR} style={{ marginTop: 8 }} />
          )}
          {!linkedEldersLoading && linkedElders.length === 0 && (
            <Text style={styles.helperText}>
              Ask an elder to add you in Settings → Add Family.
            </Text>
          )}
        </View>
      )}

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
              {availableDrivers.map((driverOption) => {
                const activeRides = driverRides.get(driverOption._id) || [];
                const isDriving = activeRides.length > 0;
                const hasConflict = busyDrivers.has(driverOption._id?.toString());
                
                return (
                  <TouchableOpacity
                    key={driverOption._id}
                    style={[styles.modalDriverCard, (isDriving || hasConflict) && styles.modalDriverCardDisabled]}
                    onPress={() => {
                      if (isDriving) {
                        Alert.alert(
                          "Driver Busy",
                          `${getDriverDisplayName(driverOption)} is currently on a ride. Please select another driver.`
                        );
                        return;
                      }
                      if (hasConflict) {
                        Alert.alert(
                          "Driver Busy",
                          `${getDriverDisplayName(driverOption)} already has a schedule at this time. Please select another driver.`
                        );
                        return;
                      }
                      setSelectedDriver(driverOption);
                      setDriverModalVisible(false);
                    }}
                    disabled={isDriving || hasConflict}
                  >
                    <View style={styles.modalDriverInfo}>
                      <Text style={styles.modalDriverName}>
                        {getDriverDisplayName(driverOption)}
                      </Text>
                      {driverOption.phoneNumber && (
                        <Text style={styles.modalDriverPhone}>{driverOption.phoneNumber}</Text>
                      )}
                      {isDriving && (
                        <Text style={styles.driverStatusText}>
                          ⚠️ Currently on a ride
                        </Text>
                      )}
                      {hasConflict && !isDriving && (
                        <Text style={styles.driverStatusText}>
                          ⚠️ Busy at this time
                        </Text>
                      )}
                      {!isDriving && !hasConflict && (
                        <Text style={styles.driverAvailableText}>
                          ✓ Available
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
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

      <Modal
        visible={elderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setElderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Elder</Text>
            <ScrollView style={styles.modalList}>
              {linkedElders.map((elderOption) => (
                <TouchableOpacity
                  key={elderOption.id}
                  style={styles.modalDriverCard}
                  onPress={() => {
                    setSelectedElder(elderOption);
                    setElderModalVisible(false);
                  }}
                >
                  <Text style={styles.modalDriverName}>{elderOption.name}</Text>
                  {elderOption.relation && (
                    <Text style={styles.modalDriverPhone}>{elderOption.relation}</Text>
                  )}
                </TouchableOpacity>
              ))}
              {!linkedEldersLoading && linkedElders.length === 0 && (
                <Text style={styles.modalEmptyText}>No elders linked to this account.</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setElderModalVisible(false)}
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
  modalDriverInfo: {
    flex: 1,
  },
  driverStatusText: {
    fontSize: 12,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#FF6B35",
    marginTop: 4,
  },
  driverAvailableText: {
    fontSize: 12,
    fontFamily: "ArimaMadurai_400Regular",
    color: "#4CAF50",
    marginTop: 4,
  },
  modalDriverCardDisabled: {
    opacity: 0.6,
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
 