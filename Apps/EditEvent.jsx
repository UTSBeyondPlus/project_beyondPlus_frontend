import React, { useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEvents } from '../contexts/EventContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SecureStore from 'expo-secure-store';

const EditEvent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { event } = route.params;
  const { fetchEvents } = useEvents();
  
  console.log('Received event data:', JSON.stringify(event, null, 2)); // 받은 이벤트 데이터 확인
  
  const [editedEvent, setEditedEvent] = useState({
    title: event.title,
    location: event.location || '',
    notes: event.notes || '',
    startTime: event.startTime,
    endTime: event.endTime,
  });
  
  const [selectedDays, setSelectedDays] = useState([event.day]); // 단일 요일만 선택
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formatTimeToString = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleTimeChange = (event, selectedTime, timeType) => {
    if (timeType === 'startTime') setShowStartPicker(false);
    if (timeType === 'endTime') setShowEndPicker(false);
    
    if (selectedTime) {
      setEditedEvent(prev => ({
        ...prev,
        [timeType]: selectedTime
      }));
    }
  };

  const handleUpdate = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userEmail = await SecureStore.getItemAsync('user_email');
      
      console.log('Updating event with ID:', event.id); // 디버깅용

      if (!editedEvent.title || selectedDays.length === 0) {
        Alert.alert('Error', 'Please fill in title and select a day');
        return;
      }

      const eventData = {
        user_email: userEmail,
        title: editedEvent.title.trim(),
        day: selectedDays[0], // 단일 요일
        starttime: formatTimeToString(editedEvent.startTime),
        endtime: formatTimeToString(editedEvent.endTime),
        location: editedEvent.location?.trim() || null,
        notes: editedEvent.notes?.trim() || null,
        session: 'Spring'
      };

      const response = await fetch(`http://localhost:3000/timetables/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }

      await fetchEvents(); // 데이터 새로고침
      
      Alert.alert(
        'Success',
        'Event updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update event');
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
        <Text style={styles.headerTitle}>Edit Event</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          onPress={handleUpdate}
        >
          <Text style={[
            styles.addButton
          ]}>
            Update
          </Text>
        </TouchableOpacity>
      </View>
    </View>

    <ScrollView style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <TextInput
          placeholder="Title"
          value={editedEvent.title}
          onChangeText={(text) => setEditedEvent({...editedEvent, title: text})}
          style={styles.input}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Location"
          value={editedEvent.location}
          onChangeText={(text) => setEditedEvent({...editedEvent, location: text})}
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
            {formatTimeToString(editedEvent.startTime)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.timeButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={styles.timeLabel}>End Time</Text>
          <Text style={styles.timeText}>
            {formatTimeToString(editedEvent.endTime)}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          placeholder="Notes"
          value={editedEvent.notes}
          onChangeText={(text) => setEditedEvent({...editedEvent, notes: text})}
          style={[styles.input, styles.notesInput]}
          multiline
        />
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={editedEvent.startTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => handleTimeChange(event, selectedTime, 'startTime')}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={editedEvent.endTime}
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

export default EditEvent; 