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
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import scheduleEventEmitter from "./scheduleEventEmitter";
import api from "../../constants/api";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EventItem {
  title: string;
  time: string;
  date: string;
}

const SchedulePage = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const subscription = scheduleEventEmitter.addListener(
      "eventAdded",
      (newEvent: EventItem & { editIndex?: number }) => {
        if (newEvent.editIndex !== undefined) {
          setEvents((prev) =>
            prev.map((e, i) => (i === newEvent.editIndex ? newEvent : e))
          );
        } else setEvents((prev) => [...prev, newEvent]);
      }
    );
    return () => subscription.remove();
  }, []);

  // Load schedules from backend on mount
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const response = await api.getSchedules();
        if (response?.schedules) {
          // Map backend schedules to EventItem shape
          const mapped = response.schedules.map((s: any) => ({
            title: s.title,
            time: s.time,
            date: new Date(s.date).toDateString(),
          }));
          setEvents(mapped);
        }
      } catch (e) {
        console.warn('Failed to load schedules', e);
      }
    };

    loadSchedules();
  }, []);

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

  const handleDelete = (index: number) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setEvents((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  };

  const handleEdit = (item: EventItem, index: number) => {
    router.push({
      pathname: "/Family/add_schedule",
      params: {
        selectedDate: selectedDate.toISOString(),
        editMode: "true",
        eventIndex: index.toString(),
        title: item.title,
        time: item.time,
      },
    });
  };

  const toggleOpen = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
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
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dayCard, isSelected && styles.selectedDay]}
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
      <FlatList
        data={todayEvents}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => {
          const isOpen = openIndex === index;
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => toggleOpen(index)}
              style={styles.eventCard}
            >
              <View style={styles.eventTextContainer}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>{item.time}</Text>
              </View>

              {isOpen && (
                <View style={styles.iconWrapper}>
                  <TouchableOpacity onPress={() => handleEdit(item, index)}>
                    <MaterialIcons name="edit" size={20} color="#CFE7D3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(index)}
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
});
