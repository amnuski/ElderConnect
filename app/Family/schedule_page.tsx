import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts
} from "@expo-google-fonts/arima-madurai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { apiGet, apiDelete } from "@/services/api";
import scheduleEventEmitter from "./scheduleEventEmitter";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EventItem {
  _id: string;
  title: string;
  time: string;
  date: string;
  fromLocation?: string;
  toLocation?: string;
}

const SchedulePage = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // Fetch schedules from backend
  const fetchSchedules = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const response = await apiGet<{ schedules: any[] }>('/schedules');
      
      // Map backend schedules to EventItem format
      const mappedEvents = (response.schedules || []).map((schedule: any) => ({
        _id: schedule._id,
        title: schedule.title,
        time: schedule.time,
        date: new Date(schedule.date).toDateString(),
        fromLocation: schedule.fromLocation,
        toLocation: schedule.toLocation,
      }));
      
      setEvents(mappedEvents);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      Alert.alert("Error", "Failed to load schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load schedules when user is available
  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user]);

  // Listen for new events from event emitter
  useEffect(() => {
    const subscription = scheduleEventEmitter.addListener(
      "eventAdded",
      () => {
        // Refresh schedules when new event is added
        fetchSchedules();
      }
    );
    return () => subscription.remove();
  }, [user]);

  const todayStr = selectedDate.toDateString();
  const todayEvents = events.filter((e) => e.date === todayStr);

  const getAllDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days: Date[] = [];
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));
    return days;
  };

  const days = getAllDaysInMonth(selectedDate);

  useEffect(() => {
    const todayIndex = days.findIndex(
      (d) => d.toDateString() === new Date().toDateString()
    );
    if (todayIndex !== -1 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: todayIndex * 60, animated: false });
    }
  }, [days]);

  const currentMonth = selectedDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020–2030

  const handleDatePress = (day: Date) => {
    setSelectedDate(day);
    const dayStr = day.toDateString();
    const hasEvent = events.some((event) => event.date === dayStr);

    if (!hasEvent) {
      Alert.alert(
        "Add Event",
        `Do you want to add an event for ${day.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}?`,
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: () =>
              router.push({
                pathname: "/Family/add_schedule",
                params: { selectedDate: day.toISOString() },
              }),
          },
        ]
      );
    }
  };

  const handleDelete = async (eventId: string) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiDelete(`/schedules/${eventId}`);
            // Remove from local state
            setEvents((prev) => prev.filter((e) => e._id !== eventId));
            setOpenIndex(null);
            Alert.alert("Success", "Event deleted successfully!");
          } catch (error: any) {
            console.error('Error deleting schedule:', error);
            Alert.alert("Error", error.message || "Failed to delete event. Please try again.");
          }
        },
      },
    ]);
  };

  const handleEdit = (item: EventItem) => {
    const eventDate = new Date(item.date);
    router.push({
      pathname: "/Family/add_schedule",
      params: {
        selectedDate: eventDate.toISOString(),
        editMode: "true",
        scheduleId: item._id,
        title: item.title,
        time: item.time,
        fromLocation: item.fromLocation || "",
        toLocation: item.toLocation || "",
      },
    });
  };

  const toggleOpen = (eventId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === eventId ? null : eventId);
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const handleMonthYearSelect = (month: string, year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(months.indexOf(month));
    newDate.setFullYear(year);
    setSelectedDate(newDate);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Schedule</Text>

      {/* 🔹 Month-Year Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <MaterialIcons name="chevron-left" size={28} color="#05361D" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.monthText}>{currentMonth}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeMonth(1)}>
          <MaterialIcons name="chevron-right" size={28} color="#05361D" />
        </TouchableOpacity>
      </View>

      {/* 🔹 Modal Picker */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <FlatList
              data={months}
              numColumns={3}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() =>
                    handleMonthYearSelect(item, selectedDate.getFullYear())
                  }
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={styles.modalTitle}>Select Year</Text>
            <FlatList
              data={years}
              numColumns={3}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() =>
                    handleMonthYearSelect(
                      months[selectedDate.getMonth()],
                      item
                    )
                  }
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🔹 Date Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateBar}
        ref={scrollRef}
      >
        {days.map((day, index) => {
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const dayStr = day.toDateString();
          const hasEvent = events.some((event) => event.date === dayStr);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard, 
                isSelected && styles.selectedDay,
                hasEvent && !isSelected && styles.dayWithEvent
              ]}
              onPress={() => handleDatePress(day)}
            >
              <Text
                style={[styles.dayName, isSelected && styles.selectedDayText]}
              >
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>
              <Text
                style={[styles.dayNum, isSelected && styles.selectedDayText]}
              >
                {day.getDate()}
              </Text>
              {hasEvent && !isSelected && (
                <View style={styles.eventDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>
        Events on{" "}
        {selectedDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}
      </Text>

      {/* 🔹 Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#04302B" />
        </View>
      ) : (
        <FlatList
          data={todayEvents}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isOpen = openIndex === item._id;
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleOpen(item._id)}
                style={styles.eventCard}
              >
                <View style={styles.eventTextContainer}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventTime}>{item.time}</Text>
                  {(item.fromLocation || item.toLocation) && (
                    <Text style={styles.eventLocation} numberOfLines={1}>
                      {item.fromLocation} → {item.toLocation}
                    </Text>
                  )}
                </View>

                {isOpen && (
                  <View style={styles.iconWrapper}>
                    <TouchableOpacity onPress={() => handleEdit(item)}>
                      <MaterialIcons name="edit" size={20} color="#CFE7D3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item._id)}
                      style={{ marginTop: 10 }}
                    >
                      <MaterialIcons name="delete" size={20} color="#CFE7D3" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.noEvent}>No events for this day</Text>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/Family/add_schedule")}
      >
        <Text style={styles.addText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SchedulePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9F6EC",
    paddingTop: 60,
    paddingHorizontal: 20,
  
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#04302B",
    marginBottom: 10,
    textAlign:"center",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    gap: 10,
  },
  monthText: {
    fontSize: 20,
    color: "#04302B",
    fontWeight: "100",
    marginBottom:10,
  },
  dateBar: { marginBottom: 25 },
  dayCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CFE7D3",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginRight: 10,
    height:100,
  },
  selectedDay: { backgroundColor: "#04302B" },
  dayName: { fontSize: 14, color: "#04302B", fontWeight: "600" },
  dayNum: { fontSize: 16, color: "#04302B", fontWeight: "bold" },
  selectedDayText: { color: "#FFFFFF" },
  sectionTitle: {
    fontSize: 18,
    color: "#04302B",
    fontWeight: "600",
    marginVertical: 10,
    marginTop:-100,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#04302B",
    borderRadius: 16,
    marginVertical: 8,
    overflow: "hidden",
    paddingRight: 5,
  },
  eventTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  eventTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "500" },
  eventTime: { color: "#B0EACD", fontSize: 15 },
  iconWrapper: {
    backgroundColor: "#04302B",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  noEvent: {
    textAlign: "center",
    color: "#777",
    marginTop: 50,
    fontSize: 16,
  },
  addButton: {
    position: "absolute",
    bottom: 40,
    right: 30,
    backgroundColor: "#04302B",
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  addText: { color: "white", fontSize: 32, fontWeight: "bold", marginTop: -2 },

  // 🔹 Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    
    padding: 20,
    width: "85%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#05361D",
    marginVertical: 8,
    textAlign: "center",
  },
  modalItem: {
    flex: 1,
    margin: 6,
    backgroundColor: "#E9F6EC",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalItemText: { fontSize: 16, color: "#05361D" },
  closeButton: {
    backgroundColor: "#05361D",
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
  },
  closeText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  eventLocation: {
    color: "#B0EACD",
    fontSize: 12,
    marginTop: 4,
  },
  dayWithEvent: {
    borderWidth: 2,
    borderColor: "#04302B",
  },
  eventDot: {
    position: "absolute",
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#04302B",
  },
});
