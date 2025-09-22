import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, ArimaMadurai_400Regular, ArimaMadurai_700Bold } from '@expo-google-fonts/arima-madurai';
import Footer from './footer';
import { LinearGradient } from "expo-linear-gradient";

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  date: number;
}

interface AddScheduleProps {
  onAddEvent?: (event: ScheduleEvent) => void;
  onGoBack?: () => void;
}

export default function AddSchedulePage({ onAddEvent, onGoBack }: AddScheduleProps) {
  const [eventName, setEventName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [selectedTime, setSelectedTime] = useState('');
  const [activeTab, setActiveTab] = useState('add_schedule');

  let [fontsLoaded] = useFonts({
    ArimaMadurai_400Regular,
    ArimaMadurai_700Bold,
  });

  // Get current month dates (current and future only)
  const getMonthDates = () => {
    const dates = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      dates.push({ day: null, fullDate: null, isToday: false, isPast: false });
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      
      // Only include current and future dates
      if (!isPast) {
        dates.push({
          day: day,
          fullDate: date,
          isToday: isToday,
          isPast: false
        });
      } else {
        dates.push({ day: null, fullDate: null, isToday: false, isPast: true });
      }
    }
    
    return dates;
  };

  // Format selected date
  const formatSelectedDate = () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    return `${currentMonth} ${selectedDate}, ${currentYear}`;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter event name');
      return;
    }
    if (!selectedTime.trim()) {
      Alert.alert('Error', 'Please enter event time');
      return;
    }

    const newEvent: ScheduleEvent = {
      id: Date.now().toString(),
      title: eventName.trim(),
      time: selectedTime.trim(),
      date: selectedDate,
    };

    if (onAddEvent) {
      onAddEvent(newEvent);
    }
    
    Alert.alert('Success', 'Event added successfully!', [
      { text: 'OK', onPress: () => {
        setEventName('');
        setSelectedTime('');
        if (onGoBack) onGoBack();
      }}
    ]);
  };

  // Footer tab handler
  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'schedule' && onGoBack) {
      onGoBack();
    }
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onGoBack}
            >
              <Ionicons name="arrow-back" size={24} color="#2D5A27" />
            </TouchableOpacity>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Add New Event</Text>
              <Text style={styles.subtitle}>Schedule your activities</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Event Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Event Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#2D5A27" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter event name (e.g., Go to Temple)"
                placeholderTextColor="#7B7B7B"
                value={eventName}
                onChangeText={setEventName}
              />
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Select Date</Text>
            <View style={styles.calendarCard}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.weekDays}>
                <Text style={styles.weekDayText}>Su</Text>
                <Text style={styles.weekDayText}>Mo</Text>
                <Text style={styles.weekDayText}>Tu</Text>
                <Text style={styles.weekDayText}>We</Text>
                <Text style={styles.weekDayText}>Th</Text>
                <Text style={styles.weekDayText}>Fr</Text>
                <Text style={styles.weekDayText}>Sa</Text>
              </View>
              <View style={styles.monthDates}>
                {getMonthDates().map((dateObj, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => dateObj.day && setSelectedDate(dateObj.day)}
                    style={[
                      styles.dateButton,
                      dateObj.day === selectedDate && styles.selectedDateButton,
                      dateObj.isToday && styles.todayButton,
                      !dateObj.day && styles.emptyDateButton
                    ]}
                    disabled={!dateObj.day}
                  >
                    {dateObj.day && (
                      <>
                        <Text
                          style={[
                            styles.dateNumber,
                            dateObj.day === selectedDate && styles.selectedDateText,
                            dateObj.isToday && styles.todayDateText,
                          ]}
                        >
                          {dateObj.day}
                        </Text>
                        {dateObj.day === selectedDate && <View style={styles.dateUnderline} />}
                        {dateObj.isToday && dateObj.day !== selectedDate && <View style={styles.todayDot} />}
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={styles.selectedDateLabel}>Selected: {formatSelectedDate()}</Text>
          </View>

          {/* Time Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Event Time</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="time-outline" size={20} color="#2D5A27" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter time (e.g., 8.00 AM)"
                placeholderTextColor="#7B7B7B"
                value={selectedTime}
                onChangeText={setSelectedTime}
              />
            </View>
          </View>

          {/* Quick Time Buttons */}
          <View style={styles.quickTimeSection}>
            <Text style={styles.inputLabel}>Quick Time Selection</Text>
            <View style={styles.quickTimeButtons}>
              {['8.00 AM', '10.00 AM', '12.00 PM', '2.00 PM', '4.00 PM', '6.00 PM'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.quickTimeButton,
                    selectedTime === time && styles.selectedQuickTimeButton
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[
                    styles.quickTimeText,
                    selectedTime === time && styles.selectedQuickTimeText
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Event</Text>
          </TouchableOpacity>
        </ScrollView>

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
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 28,
    color: '#2D5A27',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 16,
    color: '#2D5A27',
    opacity: 0.7,
  },
  placeholder: {
    width: 40,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputLabel: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 18,
    color: '#2D5A27',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 16,
    color: '#2D5A27',
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  calendarCard: {
    backgroundColor: '#D4EDDA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
  },
  monthHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  monthTitle: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 20,
    color: '#2D5A27',
    fontWeight: 'bold',
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
  monthDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  emptyDateButton: {
    opacity: 0,
  },
  selectedDateButton: {
    position: 'relative',
  },
  todayButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  dateNumber: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 16,
    color: '#2D5A27',
  },
  selectedDateText: {
    fontWeight: 'bold',
  },
  todayDateText: {
    fontWeight: 'bold',
    color: '#1B5E20',
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
  selectedDateLabel: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 14,
    color: '#2D5A27',
    textAlign: 'center',
  },
  quickTimeSection: {
    marginBottom: 30,
  },
  quickTimeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickTimeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  selectedQuickTimeButton: {
    backgroundColor: '#2D5A27',
    borderColor: '#2D5A27',
  },
  quickTimeText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 14,
    color: '#2D5A27',
    textAlign: 'center',
  },
  selectedQuickTimeText: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#2D5A27',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonText: {
    fontFamily: 'ArimaMadurai_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
