import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, TextInput, TouchableWithoutFeedback, Keyboard, Button, ScrollView } from 'react-native';
import SecureStore from 'expo-secure-store'; // SecureStore 사용
import TimeTableView, { genTimeBlock } from 'react-native-timetable';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment-timezone';

const ScheduleScreen = () => {
  // 상태 관리
  const [currentDate, setCurrentDate] = useState(moment.tz('Australia/Sydney').toDate());
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(moment().tz('Australia/Sydney').format('MMMM'));
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    day: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [token, setToken] = useState(null); // 토큰 저장 상태
  const navigation = useNavigation();

  const semesterStartDate = moment.tz('Australia/Sydney').startOf('day');
  const totalWeeks = 12;

  // 토큰 불러오기 함수
  const getToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      console.log('Token:', storedToken);
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Error getting token', error);
    }
  };

  // 이벤트 불러오기 함수
  const fetchEvents = async () => {
    if (!token) {
      console.error('No token available');
      return;
    }

    const userEmail = await SecureStore.getItemAsync('email');
    try {
      const response = await fetch(`http://localhost:3000/timetables/${userEmail}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        console.error('Failed to fetch events', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    getToken(); // 페이지 로드 시 토큰 불러오기
  }, []);

  useEffect(() => {
    if (token) {
      fetchEvents(); // 토큰을 불러온 후 이벤트 가져오기
    }
  }, [token]);

  // + 버튼 클릭 시 이벤트 저장 함수
  const handleAddEvent = async () => {
    const { title, day, startTime, endTime, location } = newEvent;
    if (title && day && startTime && endTime && location) {
      const newEventObj = {
        title,
        day: day.toUpperCase(),
        startTime: genTimeBlock(day.toUpperCase(), parseInt(startTime)),
        endTime: genTimeBlock(day.toUpperCase(), parseInt(endTime)),
        location,
        extra_descriptions: [],
        color: '#f8bbd0',
      };

      try {
        const response = await fetch('http://localhost:3000/timetables/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEventObj),
        });

        if (response.ok) {
          setEvents([...events, newEventObj]); // 새 이벤트 추가
          setModalVisible(false); // 모달 닫기
        } else {
          Alert.alert('Error', 'Failed to add event. Please try again.');
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields.');
    }
  };

  const handleDayPress = (date) => {
    setSelectedDay(date);
    setCurrentDate(date);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient colors={['#2b189e', '#5d4add', '#a38ef9']} style={styles.header}>
          <Text style={styles.headerText}>BEYOND⁺</Text>
          <View style={styles.headerCenter}>
            <TouchableOpacity onPress={() => setMonthPickerVisible(!isMonthPickerVisible)}>
              <Text style={styles.headerCenterText}>{selectedMonth}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Add Event Modal */}
        <Modal visible={isModalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Event</Text>
                <ScrollView>
                  <TextInput placeholder="Title" value={newEvent.title} onChangeText={(text) => setNewEvent({ ...newEvent, title: text })} style={styles.input} />
                  <TextInput placeholder="Day (e.g., MON)" value={newEvent.day} onChangeText={(text) => setNewEvent({ ...newEvent, day: text })} style={styles.input} />
                  <TextInput placeholder="Start Time (Hour, e.g., 10)" value={newEvent.startTime} onChangeText={(text) => setNewEvent({ ...newEvent, startTime: text })} style={styles.input} keyboardType="numeric" />
                  <TextInput placeholder="End Time (Hour, e.g., 12)" value={newEvent.endTime} onChangeText={(text) => setNewEvent({ ...newEvent, endTime: text })} style={styles.input} keyboardType="numeric" />
                  <TextInput placeholder="Location" value={newEvent.location} onChangeText={(text) => setNewEvent({ ...newEvent, location: text })} style={styles.input} />
                </ScrollView>
                <View style={styles.buttonContainer}>
                  <Button title="Add Event" onPress={handleAddEvent} />
                  <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={() => setCurrentDate(new Date())}>
            <Text style={styles.weekText}>Week {currentWeek} of {totalWeeks}</Text>
          </TouchableOpacity>
          <ProgressBar progress={currentWeek / totalWeeks} color="#7B68EE" style={styles.progressBar} />
        </View>

        {/* Custom Header */}
        <CustomHeader currentDate={currentDate} selectedDay={selectedDay} onDayPress={handleDayPress} />

        {/* TimeTable */}
        <TimeTableView events={events} pivotTime={9} pivotEndTime={20} pivotDate={genTimeBlock('mon')} nDays={7} locale="en" timeStep={60} styles={timetableStyles} />
      </View>
    </TouchableWithoutFeedback>
  );
};

// CustomHeader 컴포넌트
const CustomHeader = ({ currentDate, selectedDay, onDayPress }) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const datesOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay() + i + 1);
    return date;
  });

  return (
    <View style={styles.customHeaderContainer}>
      {daysOfWeek.map((day, index) => {
        const date = datesOfWeek[index];
        const isToday = date.toDateString() === moment().tz('Australia/Sydney').toDate().toDateString();
        const isSelected = selectedDay && date.toDateString() === selectedDay.toDateString();
        return (
          <TouchableOpacity key={index} style={styles.dayContainer} onPress={() => onDayPress(date)}>
            <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText]}>{day}</Text>
            <Text style={[styles.dateText, isToday && styles.todayDateText, isSelected && styles.selectedDateText]}>{date.getDate()}</Text>
            {isToday && <View style={styles.todayIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

//Styles

const timetableStyles = {
  container: {
    flex: 1,
  },
  eventCell: {
    borderRadius: 18,
    padding: 10,
  },
  eventTitle: {
    fontSize: 16,
    color: '#ffffff',
  },
  headerStyle: {
    backgroundColor: '#D5D6EA',
    height: 8,
    fontWeight: 'bold',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: '13%',
    backgroundColor: '#7B68EE',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 35,
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCenterText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
    paddingleft: 4,
  },
  customHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayText: {
    color: '#aaa',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#00aaff',
  },
  todayDateText: {
    color: '#00aaff',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    backgroundColor: '#00aaff',
    borderRadius: 2,
    marginTop: 4,
  },
  selectedDayText: {
    fontWeight: 'bold',
    color: '#7B68EE', // 보라색으로 표시
  },
  selectedDateText: {
    color: '#7B68EE', // 보라색으로 표시
  },
  progressContainer: {
    padding: 8,
    backgroundColor: '#ffffff',
  },
  weekText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D3D3D3',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#7B68EE'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ScheduleScreen;
