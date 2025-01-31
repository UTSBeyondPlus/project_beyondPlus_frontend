import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EventInputModal = ({ visible, onClose, onSave, selectedTime }) => {
  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState(selectedTime ? `${selectedTime}:00` : '09:00');
  const [endTime, setEndTime] = useState(selectedTime ? `${parseInt(selectedTime) + 1}:00` : '10:00');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    if (!title || selectedDays.length === 0 || !startTime || !endTime || !location) {
      Alert.alert('Error', '모든 필수 항목을 입력해주세요.');
      return;
    }

    onSave({
      title,
      days: selectedDays,
      startTime,
      endTime,
      location,
      note
    });

    // Reset form
    setTitle('');
    setSelectedDays([]);
    setStartTime(selectedTime ? `${selectedTime}:00` : '09:00');
    setEndTime(selectedTime ? `${parseInt(selectedTime) + 1}:00` : '10:00');
    setLocation('');
    setNote('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Event</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.daysContainer}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day) && styles.selectedDay
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[
                    styles.dayText,
                    selectedDays.includes(day) && styles.selectedDayText
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeContainer}>
              <View style={styles.timeInput}>
                <Text style={styles.label}>Starts</Text>
                <TextInput
                  style={styles.timeText}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              
              <View style={styles.timeInput}>
                <Text style={styles.label}>Ends</Text>
                <TextInput
                  style={styles.timeText}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Location"
              value={location}
              onChangeText={setLocation}
            />

            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Note"
              value={note}
              onChangeText={setNote}
              multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 10,
    marginBottom: 20,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayButton: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    minWidth: 45,
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#7B68EE',
    borderColor: '#7B68EE',
  },
  dayText: {
    color: '#000',
  },
  selectedDayText: {
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInput: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  timeText: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 10,
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#7B68EE',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventInputModal; 