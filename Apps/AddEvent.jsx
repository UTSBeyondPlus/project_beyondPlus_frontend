import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEvents } from '../contexts/EventContext';

const AddEvent = () => {
  const navigation = useNavigation();
  const { fetchEvents } = useEvents();
  const [newEvent, setNewEvent] = useState({
    title: '',
    location: '',
    notes: '',
    startTime: new Date(),
    endTime: new Date(),
  });
  
  const [selectedDays, setSelectedDays] = useState([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // 폼 유효성 검사
  useEffect(() => {
    setIsFormValid(
      newEvent.title.trim() !== '' && 
      selectedDays.length > 0 &&
      newEvent.startTime &&
      newEvent.endTime
    );
  }, [newEvent, selectedDays]);

  // 시간을 HHMM 형식의 문자열로 변환
  const formatTimeToString = (date) => {
    try {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`; // "HH:MM" 대신 "HHMM" 형식으로 반환
    } catch (error) {
      console.error('Error formatting time:', error);
      return '0000';
    }
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleTimeChange = (event, selectedTime, timeType) => {
    setShowStartPicker(false);
    setShowEndPicker(false);
    
    if (selectedTime) {
      setNewEvent(prev => ({
        ...prev,
        [timeType]: selectedTime
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userEmail = await SecureStore.getItemAsync('user_email');

      // 각 선택된 요일마다 개별 이벤트 생성
      for (const day of selectedDays) {
        const eventData = {
          user_email: userEmail,
          title: newEvent.title.trim(),
          day: day,  // 단일 요일로 저장
          starttime: formatTimeToString(newEvent.startTime),
          endtime: formatTimeToString(newEvent.endTime),
          location: newEvent.location?.trim() || null,
          notes: newEvent.notes?.trim() || null,
          session: 'Spring'
        };

        const response = await fetch('http://localhost:3000/timetables/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        });

        if (!response.ok) {
          throw new Error(`Failed to create event for ${day}`);
        }
      }

      await fetchEvents();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New Event</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            <Text style={[
              styles.addButton,
              !isFormValid && styles.addButtonDisabled
            ]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Title"
            value={newEvent.title}
            onChangeText={(text) => setNewEvent({...newEvent, title: text})}
            style={styles.input}
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Location"
            value={newEvent.location}
            onChangeText={(text) => setNewEvent({...newEvent, location: text})}
            style={styles.input}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.daysContainer}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDays.includes(day) && styles.selectedDayButton
              ]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[
                styles.dayButtonText,
                selectedDays.includes(day) && styles.selectedDayButtonText
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.timeContainer}>
          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.timeLabel}>Start Time</Text>
            <Text style={styles.timeText}>
              {formatTimeToString(newEvent.startTime)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.timeButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.timeLabel}>End Time</Text>
            <Text style={styles.timeText}>
              {formatTimeToString(newEvent.endTime)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            placeholder="Notes"
            value={newEvent.notes}
            onChangeText={(text) => setNewEvent({...newEvent, notes: text})}
            style={[styles.input, styles.notesInput]}
            multiline
          />
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={newEvent.startTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, 'startTime')}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={newEvent.endTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, 'endTime')}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',  // 보라색 배경
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 16,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  cancelButton: {
    fontSize: 17,
    color: '#FF3B30',
  },
  addButton: {
    fontSize: 17,
    color: '#007AFF',  // 
  },
  addButtonDisabled: {
    // color: 'rgba(255, 255, 255, 0.5)',  // 반투명 흰색
    color: '#a3a3a3',
  },
  formContainer: {
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  inputGroup: {
    borderRadius: 10,
    // marginBottom: 20,
    // backgroundColor: '#a3a3a3',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#a3a3a3',
  },
  notesInput: {
    backgroundColor: '#ffffff',
    height: 200,
    textAlignVertical: 'top',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 10,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e5ea',
  },
  selectedDayButton: {
    backgroundColor: '#7B68EE',
  },
  dayButtonText: {
    fontSize: 13,
    color: '#000',
  },
  selectedDayButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timeContainer: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 10,
  },
  timeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  timeLabel: {
    fontSize: 17,
    color: '#000',
  },
  timeText: {
    fontSize: 17,
    color: '#7B68EE',
  },
});

export default AddEvent;
