import React, { useState, useEffect, useReducer } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, TextInput, TouchableWithoutFeedback, Keyboard, Button, FlatList,ScrollView } from 'react-native';
import TimeTableView, { genTimeBlock } from 'react-native-timetable';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { differenceInWeeks, format } from 'date-fns';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';
import EventInputModal from './components/EventInputModal';
import { useEvents } from '../contexts/EventContext';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const initialState = {
  currentDate: moment.tz('Australia/Sydney').toDate(),
  currentWeek: 1,
  isDatePickerVisible: false,
  isMonthPickerVisible: false,
  isModalVisible: false,
  // selectedMonth: 'August',
  selectedMonth: moment().tz('Australia/Sydney').format('MMMM'),
  
  events: [
    {
      title: '',
      day: '',
      startTime: '',
      endTime: '',
      location: '',
      extra_descriptions: ["Kim", "Lee"],
      color: "#e1bee7",
    },
  ],
  newEvent: {
    title: '',
    day: '',
    startTime: '',
    endTime: '',
    location: '',
    startday: '',
    endday: '',
    semester: '',
  },
  selectedDay: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_WEEK':
      return { ...state, currentWeek: action.payload };
    case 'TOGGLE_DATE_PICKER':
      return { ...state, isDatePickerVisible: !state.isDatePickerVisible };
    case 'TOGGLE_MONTH_PICKER':
      return { ...state, isMonthPickerVisible: !state.isMonthPickerVisible };
    case 'SET_MONTH':
      return { ...state, selectedMonth: action.payload };
    case 'TOGGLE_MODAL':
      return { ...state, isModalVisible: !state.isModalVisible };
    case 'SET_NEW_EVENT':
      return { ...state, newEvent: { ...state.newEvent, ...action.payload } };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload], isModalVisible: false, newEvent: initialState.newEvent };
    case 'SET_SELECTED_DAY':
      return { ...state, selectedDay: action.payload };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'UPDATE_NEW_EVENT':
      return { ...state, newEvent: { ...state.newEvent, ...action.payload } };
    default:
      return state;
  }
}

const getSydneyDate = (date) => {
  const sydneyDate = moment(date).tz('Australia/Sydney').toDate();
  return sydneyDate;
};

const calculateCurrentWeek = (startDate, currentDate) => {
  const weeks = Math.ceil(differenceInWeeks(currentDate, startDate) + 1);
  return weeks;
};

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
        const isToday = date.toDateString() === getSydneyDate(new Date()).toDateString();
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

const ScheduleScreen = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { currentDate, currentWeek, isDatePickerVisible, isMonthPickerVisible, isModalVisible, selectedMonth, events, setEvents, newEvent } = state;
  const [isEventModalVisible, setEventModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState([]);
  const navigation = useNavigation();
  const semesterStartDate = getSydneyDate(new Date('2024-07-01'));
  const totalWeeks = 12;
  const [selectedDay, setSelectedDay] = useState(currentDate);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [storedToken, setStoredToken] = useState(null); // 상태 정의
  const { fetchEvents } = useEvents();

  // 토큰 불러오기 함수
  const getToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      setStoredToken(token);
      console.log('Retrieved token:', token);
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };

  // useEffect 함수 
  useEffect(() => {
    const checkAuthAndFetchEvents = async () => {
      try {
        const userEmail = await SecureStore.getItemAsync('user_email');
        const token = await SecureStore.getItemAsync('access_token');

        console.log('Checking stored credentials:');
        console.log('Email:', userEmail);
        console.log('Token exists:', !!token);

        if (!userEmail || !token) {
          // 저장된 인증 정보가 없으면 로그인 페이지로 이동
          navigation.replace('Login');
          return;
        }

        await fetchEvents();
      } catch (error) {
        console.error('Auth check error:', error);
        navigation.replace('Login');
      }
    };

    checkAuthAndFetchEvents();
  }, []);

  const handleMonthSelect = (month) => {
    const newDate = moment.tz('Australia/Sydney').set({
      'year': currentDate.getFullYear(),
      'month': months.indexOf(month),
      'date': 1
    }).toDate();
    dispatch({ type: 'SET_DATE', payload: newDate });
    dispatch({ type: 'SET_MONTH', payload: month });
    dispatch({ type: 'TOGGLE_MONTH_PICKER' });
  };

  const handleDayPress = (date) => {
    setSelectedDay(date);
    dispatch({ type: 'SET_DATE', payload: date });
  };

  const handleResetToToday = () => {
    const today = getSydneyDate(new Date());
    setSelectedDay(today);
    dispatch({ type: 'SET_DATE', payload: today });
    dispatch({ type: 'SET_MONTH', payload: months[today.getMonth()] });
  };

  // 이벤트 모달 닫기 함수
  const handleCloseEventModal =() => {
    setEventModalVisible(false);
    setSelectedEvent(null);
  }

  // 이벤트 삭제 함수
  const handleDeleteEvent = () => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete the event "${selectedEvent?.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(`Deleting event with id: ${selectedEvent.id}`); // Additional log
              const response = await fetch(`http://localhost:3000/api/events/${selectedEvent.id}`, {
                method: 'DELETE',
              });
  
              if (response.ok) {
                console.log('Event deleted successfully'); // Additional log
                setEvents(events.filter(event => event.id !== selectedEvent.id));
                
                handleCloseEventModal();
                updateTimetable(); 
              } else {
                console.error('Failed to delete event:', response.statusText); // Additional log
                Alert.alert('Error', 'Failed to delete event.');
              }
            } catch (error) {
              console.error('Something went wrong:', error); // Additional log
              Alert.alert('Error', 'Something went wrong. Please try again.');
            }
          }
        }
      ]
    );
  };

  // 데이터베이스에서 이벤트 가져오기
  const fetchEventsFromDatabase = async () => {
    try {
      const userEmail = await SecureStore.getItemAsync('user_email');
      const token = await SecureStore.getItemAsync('access_token');

      console.log('Current logged in user:', userEmail); // 현재 로그인된 사용자 확인

      const response = await fetch(
        `http://localhost:3000/timetables/${userEmail}`, // 실제 로그인한 사용자의 이메일 사용
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.status === 401) {
        console.log('Token expired or invalid');
        // 토큰이 만료되었을 때의 처리 (예: 로그인 페이지로 이동)
        return;
      }

      if (response.ok) {
        const events = await response.json();
        console.log('Raw events from DB:', events);

        // DB 데이터를 TimeTableView 형식으로 변환
        const formattedEvents = events.map(event => {
          // 시간 문자열을 시간과 분으로 분리 (예: "1030" -> {hour: 10, minute: 30})
          const parseTime = (timeStr) => {
            if (!timeStr) return { hour: 0, minute: 0 };

            let hour, minute;

            // 입력된 문자열의 길이에 따라 처리
            switch(timeStr.length) {
              case 1:  // "9" -> "09:00"
              case 2:  // "12" -> "12:00"
                hour = timeStr.padStart(2, '0');
                minute = "00";
                break;
              case 3:  // "930" -> "09:30"
                hour = timeStr.substring(0, 1).padStart(2, '0');
                minute = timeStr.substring(1);
                break;
              case 4:  // "1030" -> "10:30"
                hour = timeStr.substring(0, 2);
                minute = timeStr.substring(2);
                break;
              default:
                return { hour: 0, minute: 0 };
            }

            return {
              hour: parseInt(hour),
              minute: parseInt(minute)
            };
          };

          const startTime = parseTime(event.starttime);
          const endTime = parseTime(event.endtime);

          return {
            title: event.title,
            day: event.day,
            startTime: genTimeBlock(
              event.day,
              startTime.hour,
              startTime.minute
            ),
            endTime: genTimeBlock(
              event.day,
              endTime.hour,
              endTime.minute
            ),
            location: event.location,
            extra_descriptions: [],
            color: '#f8bbd0',
          };
        });

        console.log('Formatted events:', formattedEvents);
        dispatch({ type: 'SET_EVENTS', payload: formattedEvents });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // 이벤트 추가 함수
  const handleAddEvent = async () => {
    const { title, day, startTime, endTime, location } = newEvent;
    const userEmail = await SecureStore.getItemAsync("user_email");
    const token = await SecureStore.getItemAsync("access_token"); // 토큰 가져오기
  
    if (title && day && startTime && endTime && location) {
      const days = day.split(',').map(d => d.trim().toUpperCase());
      let conflictFound = false;
  
      // 현재 날짜 가져오기
      const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD 형식
  
      for (const singleDay of days) {
        const newEventObj = {
          email: userEmail,
          title,
          day: singleDay,
          startTime: parseInt(startTime),
          endTime: parseInt(endTime),
          location,
          startday: today,          // 빈 값이 아닌 현재 날짜로 설정
          endday: today,            // 빈 값이 아닌 현재 날짜로 설정
          semester: '2024-1',       // 빈 값이 아닌 현재 학기로 설정
          color: '#f8bbd0',
        };
  
        try {
          const response = await fetch(
            "http://localhost:3000/timetables/create",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(newEventObj),
            }
          );
          
          console.log('Response status:', response.status); // 디버깅
          
          if (response.status === 409) {
            conflictFound = true;
            Alert.alert('시간표 충돌', `${singleDay}요일 ${startTime}:00~${endTime}:00에 이미 일정이 있습니다.`);
            break;
          } else if (!response.ok) {
            const errorText = await response.text();
            console.log('Server Error:', errorText);
            Alert.alert('Error', `Failed to add event for ${singleDay}. Please try again.`);
            return;
          }
        } catch (error) {
          console.log('Network Error:', error);
          Alert.alert('Error', `Failed to add event for ${singleDay}: ${error.message || "Unexpected error occurred."}`);
          return;
        }
      }
  
      if (!conflictFound) {
        dispatch({ type: 'SET_NEW_EVENT', payload: {
          title: '',
          day: '',
          startTime: '',
          endTime: '',
          location: '',
        }});
        Alert.alert('Success', 'Events added successfully');
        dispatch({ type: 'TOGGLE_MODAL' });
        fetchEventsFromDatabase();
      }
    } else {
      Alert.alert('Error', 'Fill in all fields.');
    }
  };

  // 등록된 이벤트 모달 클릭해서 여는 함수
  const onEventPress = (evt) => {
    //Alert.alert("onEventPress", JSON.stringify(evt));
    setSelectedEvent(evt);
    setEventModalVisible(true);
  };

  // 리뷰 페이지 이동 함수
  const handleReview = () => {
    navigation.navigate('Review');
  };
  
  // TimeTableView 컴포넌트 사용 부분
  const formattedEvents = events.map(event => ({
    ...event,
    startTime: genTimeBlock(event.day, event.startTime),
    endTime: genTimeBlock(event.day, event.endTime)
  }));

  const handleCellPress = (evt) => {
    // evt에서 시간과 요일 정보 추출
    const { hour, day } = evt;
    
    console.log('Cell pressed:', evt); // 디버깅용
    
    // 선택된 시간 설정
    setSelectedTime(hour);
    setSelectedCell({ hour, day });
    
    // 모달 표시
    setEventModalVisible(true);
  };

  const handleSaveEvent = async (eventData) => {
    const userEmail = await SecureStore.getItemAsync('user_email');
    const token = await SecureStore.getItemAsync('access_token');

    const newEventObj = {
      email: userEmail,
      title: eventData.title,
      day: eventData.days.join(','),
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      location: eventData.location,
      startday: moment().format('YYYY-MM-DD'),
      endday: moment().format('YYYY-MM-DD'),
      semester: '2024-1',
      note: eventData.note
    };

    try {
      const response = await fetch('http://localhost:3000/timetables/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEventObj)
      });

      if (response.ok) {
        fetchEventsFromDatabase();
        setEventModalVisible(false);
      } else {
        Alert.alert('Error', 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    }
  };

  return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#2b189e', '#5d4add', '#a38ef9']}
          style={styles.header}
        >
          <Text style={styles.headerText}>BEYOND⁺</Text>
          <View style={styles.headerCenter}>
            <TouchableOpacity onPress={() => dispatch({ type: 'TOGGLE_MONTH_PICKER' })}>
              <Text style={styles.headerCenterText}>{selectedMonth}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => dispatch({ type: 'TOGGLE_MODAL' })}>
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Account')}>
              <Ionicons name="person" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Month Picker Modal */}
        <Modal
          visible={isMonthPickerVisible}
          animationType="slide"
          transparent={true}
        >
          <TouchableWithoutFeedback onPress={() => dispatch({ type: 'TOGGLE_MONTH_PICKER' })}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <FlatList 
                  data={months}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleMonthSelect(item)}>
                      <Text style={styles.modalItemText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
                <Button title="Close" onPress={() => dispatch({ type: 'TOGGLE_MONTH_PICKER' })} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        

        <View style={styles.progressContainer}>
          <TouchableOpacity onPress={handleResetToToday}>
            <Text style={styles.weekText}>Week {currentWeek} of {totalWeeks}</Text>
          </TouchableOpacity>
          <ProgressBar 
            progress={currentWeek / totalWeeks} 
            color="#7B68EE" 
            style={styles.progressBar}
          />
        </View>
        <CustomHeader 
          currentDate={currentDate} 
          selectedDay={selectedDay} 
          onDayPress={handleDayPress}
        />
        <TimeTableView
            events={events}
            pivotTime={9}
            pivotEndTime={20}
            pivotDate={genTimeBlock('mon')}
            nDays={7}
            onEventPress={onEventPress}
            onTimeSelect={(evt) => handleCellPress(evt)}
            locale="en"
            timeStep={60}
            styles={timetableStyles}
        />

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Main')}>
            <Ionicons name="calendar" size={24} color="white" />
            <Text style={styles.navText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Review')}>
            <Ionicons name="search" size={24} color="white" />
            <Text style={styles.navText}>Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Review')}>
            <Ionicons name="chatbubble" size={24} color="white" />
            <Text style={styles.navText}>Review</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.fab}>
          <Ionicons name="share" size={24} color="white" />
        </TouchableOpacity>

        <EventInputModal
          visible={isEventModalVisible}
          onClose={handleCloseEventModal}
          onSave={handleSaveEvent}
          selectedTime={selectedTime}
        />
      </View>
  );
};

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
  timeTableCell: {
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#E6E6E6'
  },
  timeTableCellToday: {
    backgroundColor: '#F5F5F5'
  }
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    width: '90%',
    backgroundColor: '#9986FF',
    borderRadius: 30,
    position: 'absolute',
    left: 24,
    right: 0,
    bottom: 20,
    shadowColor: '#171717',
    shadowOffset: {width: -2, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  navItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: 'white',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: '#7B68EE',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171717',
    shadowOffset: {width: -2, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  close: {
    marginTop: '-19%',
    marginLeft: '88%',

  },
  modalText: {
    fontSize: 14,
    marginVertical: 6,
  },
  modalItemText: {
    fontSize: 16,
    padding: 10,
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
