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
import { closestIndexTo } from 'date-fns/fp';

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
      id: '',
      user_email: '',
      title: '',
      day: '',
      startday: null,
      endday: null,
      semester: '',
      starttime: '',
      endtime: '',
      location: '',
      init_date: null,
      post_id: null,
    },
  ],
  newEvent: {
    title: '',
    day: '',
    startday: null,
    endday: null,
    semester: '',
    starttime: '',
    endtime: '',
    location: '',
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

const getUserEmail = async () => {
  try {
    const email = await SecureStore.getItemAsync('user_email');
    console.log('Retrieved email:', email);
    return email;
  } catch (error) {
    console.error('Error retrieving email:', error);
    return null;
  }
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
  const [storedToken, setStoredToken] = useState(null); // 상태 정의
  const [isEditMode, setIsEditMode] = useState(false);
  const [userEmail, setUserEmail] = useState(null);


  //Sever 주소 
  const serverUrl = 'http://3.26.235.216:3000';

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
    getToken();

    const fetchUserEmail = async () => {
      const email = await getUserEmail();
      setUserEmail(email);
    };
    fetchUserEmail();

    fetchEventsFromDatabase();

    const sydneyCurrent = moment(currentDate).tz('Australia/Sydney').startOf('day');
    const lastDayOfMonth = sydneyCurrent.clone().endOf('month').date();
    const currentWeek = calculateCurrentWeek(semesterStartDate, sydneyCurrent.toDate());

    if (sydneyCurrent.date() === lastDayOfMonth) {
      const newDate = sydneyCurrent.add(1, 'day').toDate();
      dispatch({ type: 'SET_DATE', payload: newDate });
      dispatch({ type: 'SET_MONTH', payload: months[newDate.getMonth()] });
    }

    dispatch({ type: 'SET_WEEK', payload: currentWeek > 12 ? currentWeek % 12 : currentWeek });
  }, [currentDate]);

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

  const handleUpdateEvent = async (eventId, updatedEventData) => {
    try {
      const response = await fetch(`${serverUrl}/timetables/${eventId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEventData),
      });

      if (response.ok) {
        console.log('Event updated successfully');
        // 이벤트 목록 새로고침
        fetchEventsFromDatabase();
        setIsEditMode(false);
        setEventModalVisible(false);
      } else {
        console.error('Failed to update event:', response.statusText);
        Alert.alert('Error', 'Failed to update event. Please try again.');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleEditEvent = () => {
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (selectedEvent) {
      handleUpdateEvent(selectedEvent.id, selectedEvent);
    }
  };



  // 이벤트 삭제 함수
  const handleDeleteEvent = async (eventId) => {
    console.log('Deleting event with ID:', eventId);
    console.log('Event ID type:', typeof eventId);
  
    try {
      const token = await getToken();
      const response = await fetch(`${serverUrl}/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      console.log('Delete response status:', response.status);
      const responseText = await response.text();
      console.log('Delete response text:', responseText);
  
      if (response.ok) {
        console.log('Event deleted successfully');
        fetchEventsFromDatabase(); // 이벤트 목록 새로고침
      } else {
        console.error('Failed to delete event:', responseText);
        Alert.alert('Error', `Failed to delete event: ${responseText}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', `An error occurred while deleting the event: ${error.message}`);
    }
  };

  const renderEventModal = () => (
    <Modal
      visible={isEventModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setEventModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {isEditMode ? (
            <>
              <TextInput
                style={styles.input}
                value={selectedEvent?.title}
                onChangeText={(text) => setSelectedEvent({...selectedEvent, title: text})}
                placeholder="Title"
              />
              <TextInput
                style={styles.input}
                value={selectedEvent?.location}
                onChangeText={(text) => setSelectedEvent({...selectedEvent, location: text})}
                placeholder="Location"
              />
              {/* 필요한 다른 필드들도 추가 */}
              <View style={styles.buttonContainer}>
                <Button title="Save" onPress={handleSaveEdit} />
                <Button title="Cancel" onPress={handleCancelEdit} color="red" />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
              <Text style={styles.modalText}>Location: {selectedEvent?.location}</Text>
              {/* 다른 이벤트 정보 표시 */}
              <View style={styles.buttonContainer}>
                <Button title="Edit" onPress={handleEditEvent} />
                <Button title="Delete" onPress={handleDeleteEvent} color="red" />
                <Button title="Close" onPress={() => setEventModalVisible(false)} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // 데이터베이스에서 이벤트 가져오기
  const fetchEventsFromDatabase = async () => {
    try {
      const userEmail = await getUserEmail();
      const token = await getToken();
      
      console.log('Fetching events for email:', userEmail);
      console.log('Token:', token);
  
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }
  
      const response = await fetch(
        `${serverUrl}/timetables/${userEmail}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
  
      if (response.ok) {
        const events = JSON.parse(responseText);
        console.log('Parsed events:', events);
  
        if (events.length === 0) {
          console.log('사용자의 이벤트가 없습니다. 이는 정상적인 상황일 수 있습니다.');
          dispatch({ type: 'SET_EVENTS', payload: [] });
        } else {
          const formattedEvents = events.map(event => {
            // 시간 문자열을 파싱하는 함수
            const parseTime = (timeString) => {
              const [hours, minutes] = timeString.split(':');
              return { hours: parseInt(hours, 10), minutes: parseInt(minutes, 10) };
            };
  
            // starttime과 endtime 파싱
            const startTime = parseTime(event.starttime);
            const endTime = parseTime(event.endtime);
  
            console.log(`Event: ${event.title}`);
            console.log(`Start Time - Hours: ${startTime.hours}, Minutes: ${startTime.minutes}`);
            console.log(`End Time - Hours: ${endTime.hours}, Minutes: ${endTime.minutes}`);
  
            return {
              id: event.id,
              user_email: event.user_email,
              title: event.title,
              day: event.day.toUpperCase(),
              startday: event.startday,
              endday: event.endday,
              semester: event.semester,
              startTime: genTimeBlock(event.day, startTime.hours, startTime.minutes),
              endTime: genTimeBlock(event.day, endTime.hours, endTime.minutes),
              location: event.location,
              init_date: event.init_date,
              post_id: event.post_id,
              color: '#f8bbd0', // 기본 색상 설정
            };
          });
  
          dispatch({ type: 'SET_EVENTS', payload: formattedEvents });
        }
      } else {
        console.log('이벤트 가져오기 실패', response.statusText);
        console.error(`이벤트 가져오기 실패. 상태: ${response.status}`);
      }
    } catch (error) {
      console.log('네트워크 오류:', error);
      console.error(`이벤트 가져오기 실패: ${error.message || "예기치 못한 오류가 발생했습니다."}`);
    }
  };
  
  const handleAddEvent = async () => {
    const { title, day, starttime, endtime, location, semester } = newEvent;
    const userEmail = await getUserEmail();
    console.log('For handle Add Event: User email:', userEmail);

    if (!userEmail) {
      Alert.alert('Error', 'User email not found. Please log in again.');
      return;
    }
  
  
    if (title && day && starttime && endtime && location && semester) {
      const days = day.split(',').map(d => d.trim().toUpperCase());
      let conflictFound = false;
  
      for (const singleDay of days) {
        const newEventObj = {
          user_email: userEmail,  // 여기에 userEmail 추가
          title,
          day: singleDay,
          startday: new Date().toISOString().split('T')[0],
          endday: new Date().toISOString().split('T')[0],
          semester,
          starttime,
          endtime,
          location,
        };

        console.log('Events from handleAddEvent:', newEventObj);
        
        try {
          const response = await fetch(`${serverUrl}/timetables/create`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${storedToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(newEventObj),
            }
          );
  
          console.log('Response status:', response.status);
          const responseText = await response.text();
          console.log('Response text:', responseText);
  
          if (response.status === 409) {
            conflictFound = true;
            Alert.alert('시간표 충돌', `${singleDay}요일 ${starttime}~${endtime}에 이미 일정이 있습니다.`);
            break;
          } else if (!response.ok) {
            console.log('Server Error:', responseText);
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
          starttime: '',
          endtime: '',
          location: '',
          semester: '',
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

        {/* Add Event Modal */}
        <Modal
          visible={isModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => dispatch({ type: 'TOGGLE_MODAL' })}
        >
          <TouchableWithoutFeedback onPress={() => dispatch({ type: 'TOGGLE_MODAL' })}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Event</Text>
                <ScrollView>
                  <TextInput
                    placeholder="Title"
                    value={newEvent.title}
                    onChangeText={(text) => dispatch({ type: 'SET_NEW_EVENT', payload: { title: text } })}
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Day (e.g., MON, WED)"
                    value={newEvent.day}
                    onChangeText={(text) => dispatch({ type: 'SET_NEW_EVENT', payload: { day: text } })}
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Start Time (HH:MM)"
                    value={newEvent.starttime}
                    onChangeText={(text) => dispatch({ type: 'SET_NEW_EVENT', payload: { starttime: text } })}
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="End Time (HH:MM)"
                    value={newEvent.endtime}
                    onChangeText={(text) => dispatch({ type: 'SET_NEW_EVENT', payload: { endtime: text } })}
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Location"
                    value={newEvent.location}
                    onChangeText={(text) => dispatch({ type: 'SET_NEW_EVENT', payload: { location: text } })}
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Semester"
                    value={newEvent.semester}
                    onChangeText={(text) => dispatch({ type: 'SET_NEW_EVENT', payload: { semester: text } })}
                    style={styles.input}
                  />
                </ScrollView>
                <View style={styles.buttonContainer}>
                  <Button title="Add Event" onPress={handleAddEvent} />
                  <Button title="Cancel" onPress={() => dispatch({ type: 'TOGGLE_MODAL' })} color="red" />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {renderEventModal()}

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
            pivotTime={8}
            pivotEndTime={22}
            pivotDate={genTimeBlock('mon')}
            nDays={7}
            onEventPress={onEventPress}
            locale="en"
            timeStep={30}
            // styles={timetableStyles}
            headerStyle={{height: 0}}
            containerStyle={{paddingTop: 0}}
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
      </View>
  );
};

const timetableStyles = {
  container: {
    backgroundColor: 'pink',
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
