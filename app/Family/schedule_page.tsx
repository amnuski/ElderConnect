import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  ArimaMadurai_400Regular,
  ArimaMadurai_700Bold,
} from "@expo-google-fonts/arima-madurai";
import Footer from "../Footer/footer";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  date: string; // YYYY-MM-DD format
}

export default function SchedulePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function formatKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<ScheduleEvent[]>([
    {
      id: "1",
      title: "Go to Temple",
      time: "8.00 AM",
      date: formatKey(today),
    },
    {
      id: "2",
      title: "Go to Hospital",
      time: "4.00 PM",
      date: formatKey(today),
    },
    {
      id: "3",
      title: "Doctor Appointment",
      time: "10.00 AM",
      date: formatKey(new Date(today.getTime() + 86400000)), // tomorrow
    },
  ]);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  const [activeTab, setActiveTab] = useState("schedule");
  const animationValues = useRef<{ [key: string]: Animated.Value }>({});
  const [visibleActions, setVisibleActions] = useState<{ [key: string]: boolean }>({});

  const dateScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const todayIndex = today.getDate() - 1;
    const scrollX = todayIndex * 68;
    setTimeout(() => {
      dateScrollRef.current?.scrollTo({ x: scrollX, animated: true });
    }, 100);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEventsForSelectedDate = () => {
    return events.filter((event) => event.date === formatKey(selectedDate));
  };

  const getAnimationValue = (id: string) => {
    if (!animationValues.current[id]) {
      animationValues.current[id] = new Animated.Value(1);
    }
    return animationValues.current[id];
  };

  const getActionAnimationValue = (id: string) => {
    const key = `${id}_actions`;
    if (!animationValues.current[key]) {
      animationValues.current[key] = new Animated.Value(0);
    }
    return animationValues.current[key];
  };

  const toggleActions = (id: string) => {
    const isVisible = visibleActions[id];
    const animatedValue = getActionAnimationValue(id);

    if (isVisible) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setVisibleActions((prev) => ({ ...prev, [id]: false }));
      });
    } else {
      setVisibleActions({});
      setVisibleActions((prev) => ({ ...prev, [id]: true }));
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleDeleteEvent = (id: string) => {
    const animatedValue = getAnimationValue(id);
    Animated.sequence([
      Animated.timing(animatedValue, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setEvents(events.filter((event) => event.id !== id));
      delete animationValues.current[id];
    });
  };

  const handleEditEvent = (id: string) => {
    const animatedValue = getAnimationValue(id);
    Animated.sequence([
      Animated.timing(animatedValue, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      console.log("Edit event:", id);
    });
  };

  const isPastDate = (date: Date) => {
    const todayCopy = new Date();
    todayCopy.setHours(0, 0, 0, 0);
    return date < todayCopy;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#B6DDB3"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>My Schedule</Text>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <Text style={styles.todayText}>Today</Text>
            </View>
            <TouchableOpacity style={styles.notificationIcon}>
              <Ionicons name="notifications" size={24} color="#2D5A27" />
            </TouchableOpacity>
          </View>

          {/* Month Selector */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
            >
              <Text style={styles.monthNav}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
            >
              <Text style={styles.monthNav}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Date Scroll */}
          <ScrollView
            ref={dateScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateScroll}
          >
            {Array.from(
              { length: new Date(currentYear, currentMonth + 1, 0).getDate() },
              (_, i) => {
                const date = new Date(currentYear, currentMonth, i + 1);
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = date.getDate();
                const isSelected = formatKey(date) === formatKey(selectedDate);
                const past = isPastDate(date);
                const hasEvent = events.some((e) => e.date === formatKey(date));

                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dayItem,
                      hasEvent && styles.hasEventDay,
                      isSelected && styles.selectedDay,
                      past && styles.pastDay,
                    ]}
                    disabled={past}
                    onPress={() => {
                      setSelectedDate(date);
                      const dateKey = formatKey(date);
                      if (!events.find((e) => e.date === dateKey) && !past) {
                        Alert.alert(
                          "No Events",
                          "Do you want to add an event?",
                          [
                            { text: "Cancel", style: "cancel" },
                            { text: "Add", onPress: () => router.push("/Family/add_schedule") },
                          ]
                        );
                      }
                    }}
                  >
                    <Text style={[
                      styles.dayName,
                      isSelected && styles.selectedDayText,
                      past && styles.pastDayText,
                    ]}>
                      {dayName.slice(0, 2)}
                    </Text>
                    <Text style={[
                      styles.dayNum,
                      isSelected && styles.selectedDayText,
                      past && styles.pastDayText,
                    ]}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>

          {/* Events */}
          <View style={styles.eventsSection}>
            {getEventsForSelectedDate().map((event) => (
              <Animated.View
                key={event.id}
                style={[
                  styles.eventCard,
                  {
                    transform: [{ scale: getAnimationValue(event.id) }],
                    opacity: getAnimationValue(event.id),
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.eventContent}
                  onPress={() => toggleActions(event.id)}
                >
                  <View style={styles.eventTextContainer}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>{event.time}</Text>
                  </View>
                </TouchableOpacity>

                {visibleActions[event.id] && (
                  <Animated.View
                    style={[
                      styles.eventActions,
                      {
                        transform: [
                          { scale: getActionAnimationValue(event.id) },
                          {
                            translateX: getActionAnimationValue(event.id).interpolate({
                              inputRange: [0, 1],
                              outputRange: [50, 0],
                            }),
                          },
                        ],
                        opacity: getActionAnimationValue(event.id),
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditEvent(event.id)}
                    >
                      <Ionicons name="pencil" size={16} color="#2D5A27" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteEvent(event.id)}
                    >
                      <Ionicons name="trash" size={16} color="#2D5A27" />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/Family/add_schedule")}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>

        <Footer activeTab={activeTab} onTabPress={setActiveTab} />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 70,
    paddingBottom: 20,
  },
  titleSection: { flex: 1 },
  title: { fontFamily: "ArimaMadurai_700Bold", fontSize: 32, color: "#04302B", marginBottom: 8 },
  dateText: { fontFamily: "ArimaMadurai_700Bold", fontSize: 16, color: "#04302B" },
  todayText: { fontFamily: "ArimaMadurai_700Bold", fontSize: 20, color: "#04302B" },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#C8E6C9",
    justifyContent: "center",
    alignItems: "center",
  },

  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthText: { fontSize: 20, fontWeight: "700", color: "#04302B" },
  monthNav: { fontSize: 22, fontWeight: "bold", color: "#04302B", paddingHorizontal: 10 },
  dateScroll: { marginBottom: 20 },

  dayItem: {
    width: 60,
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: "#D4EDDA",
  },
  hasEventDay: {
    borderWidth: 2,
    borderColor: "#2D5A27",
  },
  dayName: { fontSize: 14, fontWeight: "600", color: "#2D5A27" },
  dayNum: { fontSize: 16, fontWeight: "700", color: "#2D5A27", marginTop: 4 },
  selectedDay: { backgroundColor: "#04302B" },
  selectedDayText: { color: "#fff", fontWeight: "bold" },
  pastDay: { backgroundColor: "#98b1ae60" },
  pastDayText: { color: "#04302bb9" },

  eventsSection: { marginBottom: 100 },
  eventCard: {
    backgroundColor: "#04302B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  eventContent: { flex: 1 },
  eventTextContainer: { flex: 1 },
  eventTitle: { fontFamily: "ArimaMadurai_700Bold", fontSize: 18, color: "#E8F5E8" },
  eventTime: { fontFamily: "ArimaMadurai_700Bold", fontSize: 16, color: "#E8F5E8" },
  eventActions: {
    flexDirection: "column",
    gap: 8,
    position: "absolute",
    right: 20,
    top: 20,
    bottom: 20,
    justifyContent: "center",
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#C8E6C9",
    justifyContent: "center",
    alignItems: "center",
  },

  addButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#04302B",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 4,
  },
  addButtonText: { color: "#E8F5E8", fontSize: 18, fontWeight: "600" },
});
