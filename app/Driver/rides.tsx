import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
  useFonts,
} from "@expo-google-fonts/arima-madurai";
import { MaterialIcons } from "@expo/vector-icons";
import scheduleEventEmitter from "../Family/scheduleEventEmitter"; // same emitter used in Family Schedule
import DriverFooter from "../Footer/DriverFooter"; // ✅ Import footer

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EventItem {
  title: string;
  time: string;
  date: string;
}

const DriverSchedulePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  useEffect(() => {
    const subscription = scheduleEventEmitter.addListener(
      "eventAdded",
      (newEvent: EventItem & { editIndex?: number }) => {
        setEvents((prev) => {
          if (newEvent.editIndex !== undefined) {
            return prev.map((e, i) => (i === newEvent.editIndex ? newEvent : e));
          }
          return [...prev, newEvent];
        });
      }
    );

    return () => subscription.remove();
  }, []);

  const today = new Date();
  const todayStr = today.toDateString();

  const todayEvents = events.filter(
    (e) => e.date === selectedDate.toDateString()
  );

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

    setSelectedDate(new Date());
  }, []);

  const changeMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const toggleOpen = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

  const currentMonth = selectedDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Schedule</Text>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <MaterialIcons name="chevron-left" size={28} color="#05361D" />
        </TouchableOpacity>

        <Text style={styles.monthText}>{currentMonth}</Text>

        <TouchableOpacity onPress={() => changeMonth(1)}>
          <MaterialIcons name="chevron-right" size={28} color="#05361D" />
        </TouchableOpacity>
      </View>

      {/* Date Bar */}
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
              onPress={() => setSelectedDate(day)}
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

      {/* Events List */}
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
                  <MaterialIcons name="event" size={22} color="#CFE7D3" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.noEvent}>No events for this day</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* ✅ Footer */}
<View style={{ marginHorizontal: -20 }}>
  <DriverFooter activeTab="rides" />
</View>
    </View>
  );
};

export default DriverSchedulePage;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9F6EC",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    color: "#04302B",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "ArimaMadurai_700Bold",
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
    marginBottom: 10,
    fontFamily: "ArimaMadurai_400Regular",
  },
  dateBar: { marginBottom: 25 },
  dayCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CFE7D3",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginRight: 10,
    height: 100,
  },
  selectedDay: { backgroundColor: "#04302B" },
  dayName: {
    fontSize: 14,
    color: "#04302B",
    fontWeight: "600",
    fontFamily: "ArimaMadurai_400Regular",
  },
  dayNum: {
    fontSize: 16,
    color: "#04302B",
    fontWeight: "bold",
    fontFamily: "ArimaMadurai_400Regular",
  },
  selectedDayText: { color: "#FFFFFF" },
  sectionTitle: {
    fontSize: 18,
    color: "#04302B",
    fontWeight: "600",
    marginVertical: 10,
    marginTop: -100,
    fontFamily: "ArimaMadurai_700Bold",
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
  eventTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "ArimaMadurai_400Regular",
  },
  eventTime: {
    color: "#B0EACD",
    fontSize: 15,
    fontFamily: "ArimaMadurai_400Regular",
  },
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
    fontFamily: "ArimaMadurai_400Regular",
  },
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
    fontFamily: "ArimaMadurai_700Bold",
  },
  modalItem: {
    flex: 1,
    margin: 6,
    backgroundColor: "#E9F6EC",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 16,
    color: "#05361D",
    fontFamily: "ArimaMadurai_400Regular",
  },
  closeButton: {
    backgroundColor: "#05361D",
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
  },
  closeText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "ArimaMadurai_700Bold",
  },
});
