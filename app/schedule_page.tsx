import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from '@expo-google-fonts/arima-madurai';
import Footer from './footer';
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  date: number;
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([
    { id: '1', title: 'Go to Temple', time: '8.00 AM', date: new Date().getDate() },
    { id: '2', title: 'Go to Hospital', time: '4.00 PM', date: new Date().getDate() },
    { id: '3', title: 'Doctor Appointment', time: '10.00 AM', date: new Date().getDate() + 1 },
    { id: '4', title: 'Family Meeting', time: '2.00 PM', date: new Date().getDate() + 1 },
    { id: '5', title: 'Grocery Shopping', time: '5.00 PM', date: new Date().getDate() + 2 },
  ]);
  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });
  // ✅ Added state for footer active tab
  const [activeTab, setActiveTab] = useState('schedule');

  // Animation values for each event
  const animationValues = useRef<{[key: string]: Animated.Value}>({});
  // State to track which event's actions are visible
  const [visibleActions, setVisibleActions] = useState<{[key: string]: boolean}>({});

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCurrentDay = () => {
    return selectedDate.getDate();
  };

  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Filter events for selected date
  const getEventsForSelectedDate = () => {
    return events.filter(event => event.date === selectedDay);
  };

  // Format selected date with time
  const formatSelectedDateTime = () => {
    const currentMonth = selectedDate.toLocaleString('default', { month: 'long' });
    const currentYear = selectedDate.getFullYear();
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return `${currentMonth} ${selectedDay}, ${currentYear} at ${currentTime}`;
  };

  // Get month view with all days
  const getMonthDates = () => {
    const dates = [];
    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      dates.push({ day: null, fullDate: null, isToday: false, isPast: false, hasEvents: false });
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const hasEvents = events.some(event => event.date === day);
      
      dates.push({
        day: day,
        fullDate: date,
        isToday: isToday,
        isPast: isPast,
        hasEvents: hasEvents
      });
    }
    
    return dates;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Get or create animation value for an event
  const getAnimationValue = (id: string) => {
    if (!animationValues.current[id]) {
      animationValues.current[id] = new Animated.Value(1);
    }
    return animationValues.current[id];
  };

  // Get or create animation value for action buttons
  const getActionAnimationValue = (id: string) => {
    const key = `${id}_actions`;
    if (!animationValues.current[key]) {
      animationValues.current[key] = new Animated.Value(0);
    }
    return animationValues.current[key];
  };

  // Toggle action buttons visibility
  const toggleActions = (id: string) => {
    const isVisible = visibleActions[id];
    const animatedValue = getActionAnimationValue(id);
    
    if (isVisible) {
      // Hide actions for this card
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setVisibleActions(prev => ({ ...prev, [id]: false }));
      });
    } else {
      // Hide all other cards' actions first
      const hidePromises = Object.keys(visibleActions).map(otherId => {
        if (otherId !== id && visibleActions[otherId]) {
          const otherAnimatedValue = getActionAnimationValue(otherId);
          return new Promise<void>((resolve) => {
            Animated.timing(otherAnimatedValue, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start(() => {
              setVisibleActions(prev => ({ ...prev, [otherId]: false }));
              resolve();
            });
          });
        }
        return Promise.resolve();
      });

      // After hiding others, show current card's actions
      Promise.all(hidePromises).then(() => {
        setVisibleActions(prev => ({ ...prev, [id]: true }));
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleDeleteEvent = (id: string) => {
    const animatedValue = getAnimationValue(id);
    
    // Animate the card out
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove from state after animation
      setEvents(events.filter(event => event.id !== id));
      // Clean up animation value
      delete animationValues.current[id];
    });
  };

  const handleEditEvent = (id: string) => {
    const animatedValue = getAnimationValue(id);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('Edit event:', id);
    });
  };

  const handleAddEvent = () => {
    // Navigate to add schedule page
    // This would typically use navigation, but for now we'll show an alert
    console.log('Navigate to add schedule page');
  };

  // ✅ Footer tab handler
  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    console.log('Switched to tab:', tab);
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
        {/* Header Section */}
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

        {/* Monthly Calendar */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#2D5A27" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color="#2D5A27" />
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekDays}>
            <Text style={styles.weekDayText}>Su</Text>
            <Text style={styles.weekDayText}>Mo</Text>
            <Text style={styles.weekDayText}>Tu</Text>
            <Text style={styles.weekDayText}>We</Text>
            <Text style={styles.weekDayText}>Th</Text>
            <Text style={styles.weekDayText}>Fr</Text>
            <Text style={styles.weekDayText}>Sa</Text>
          </View>

          {/* Month Grid */}
          <View style={styles.monthGrid}>
            {getMonthDates().map((dateObj, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => dateObj.day && setSelectedDay(dateObj.day)}
                style={[
                  styles.dateButton,
                  dateObj.day === selectedDay && styles.selectedDateButton,
                  dateObj.isToday && styles.todayButton,
                  dateObj.isPast && styles.pastDateButton,
                  !dateObj.day && styles.emptyDateButton
                ]}
                disabled={!dateObj.day || dateObj.isPast}
              >
                {dateObj.day && (
                  <>
                    <Text
                      style={[
                        styles.dateNumber,
                        dateObj.day === selectedDay && styles.selectedDateText,
                        dateObj.isToday && styles.todayDateText,
                        dateObj.isPast && styles.pastDateText,
                      ]}
                    >
                      {dateObj.day}
                    </Text>
                    {dateObj.hasEvents && <View style={styles.eventDot} />}
                    {dateObj.day === selectedDay && <View style={styles.dateUnderline} />}
                    {dateObj.isToday && dateObj.day !== selectedDay && <View style={styles.todayDot} />}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Date Info */}
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateLabel}>Selected Date & Time:</Text>
          <Text style={styles.selectedDateTimeText}>{formatSelectedDateTime()}</Text>
        </View>

        {/* Scheduled Events */}
        <View style={styles.eventsSection}>
          {getEventsForSelectedDate().map((event) => (
            <Animated.View 
              key={event.id} 
              style={[
                styles.eventCard,
                {
                  transform: [{ scale: getAnimationValue(event.id) }],
                  opacity: getAnimationValue(event.id),
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.eventContent}
                onPress={() => toggleActions(event.id)}
                activeOpacity={0.8}
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
                        { 
                          scale: getActionAnimationValue(event.id),
                        },
                        {
                          translateX: getActionAnimationValue(event.id).interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          })
                        }
                      ],
                      opacity: getActionAnimationValue(event.id),
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditEvent(event.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={16} color="#2D5A27" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteEvent(event.id)}
                    activeOpacity={0.7}
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
      <TouchableOpacity style={styles.addButton} onPress={() => router.push("/add_schedule")}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>

      {/* Footer Navigation */}
      <Footer activeTab={activeTab} onTabPress={handleTabPress} />
      
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 70,
    paddingBottom: 20,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 32,
    color: '#2D5A27',
    marginBottom: 8,
  },
  dateText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 16,
    color: '#2D5A27',
    marginBottom: 4,
  },
  todayText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 20,
    fontWeight: '600',
    color: '#2D5A27',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCard: {
    fontFamily: 'ArimaMadurai_700Bold',
    backgroundColor: '#D4EDDA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 20,
    color: '#2D5A27',
    fontWeight: 'bold',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  pastDateButton: {
    opacity: 0.3,
  },
  emptyDateButton: {
    opacity: 0,
  },
  pastDateText: {
    color: '#999999',
  },
  eventDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
  },
  weekDays: {
    
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 14,
    fontWeight: '500',
    color: '#2D5A27',
  },
  weekDates: {
    fontFamily: 'ArimaMadurai_700Bold',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    width: '14.28%', // 7 days in a week
    minHeight: 40,
    justifyContent: 'center',
  },
  selectedDateButton: {
    position: 'relative',
  },
  dateNumber: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 16,
    color: '#2D5A27',
  },
  selectedDateText: {
    fontWeight: 'bold',
  },
  dateUnderline: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#2D5A27',
    borderRadius: 1,
  },
  selectedDateInfo: {
    backgroundColor: '#C8E6C9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 14,
    color: '#2D5A27',
    marginBottom: 4,
  },
  selectedDateTimeText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 16,
    color: '#2D5A27',
    fontWeight: '600',
  },
  todayButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  todayDateText: {
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  todayDot: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2D5A27',
  },
  eventsSection: {
    marginBottom: 100,
  },
  eventCard: {
    backgroundColor: '#2D5A27',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 18,
    fontWeight: '600',
    color: '#E8F5E8',
    marginBottom: 4,
  },
  eventTime: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 16,
    color: '#E8F5E8',
    opacity: 0.9,
  },
  eventActions: {
    flexDirection: 'column',
    gap: 8,
    position: 'absolute',
    right: 20,
    top: 20,
    bottom: 20,
    justifyContent: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#2D5A27',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: '#E8F5E8',
    fontSize: 18,
    fontWeight: '600',
  },
});
