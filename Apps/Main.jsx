import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, TextInput, TouchableWithoutFeedback, Keyboard, Button, FlatList,ScrollView } from 'react-native';
import TimeTableView, { genTimeBlock } from 'react-native-timetable';
import { useNavigation } from '@react-navigation/native';
import { useEvents } from '../contexts/EventContext';
import { LinearGradient } from 'expo-linear-gradient';
import { differenceInWeeks, format } from 'date-fns';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';
import EventInputModal from './components/EventInputModal';


const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const initialState = {
  currentDate: moment.tz('Australia/Sydney').toDate(),
  currentWeek: 1,
  isDatePickerVisible: false,
  isMonthPickerVisible: false,
  isModalVisible: false,
  // selectedMonth: 'August',
  selectedMonth: moment().tz('Australia/Sydney').format('MMMM'),
  
  events: [],
  newEvent: {
    title: '',
    day: '',
    startTime: '',
    endTime: '',
    location: '',
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
    case 'SET_RAW_EVENTS':
      return { ...state, rawEvents: action.payload };
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

const CustomHeader = ({ currentDate, onHeaderDatePress }) => {
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
        const isToday = date.toDateString() === new Date().toDateString();

        const handlePress = () => {
          if (day === 'Mon') {
            onHeaderDatePress('prev');
          } else if (day === 'Sun') {
            onHeaderDatePress('next');
          }
        };

        return (
          <TouchableOpacity
            key={index}
            style={styles.dayContainer}
            onPress={handlePress}
            disabled={day !== 'Mon' && day !== 'Sun'}
          >
            <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
            <Text style={[styles.dateText, isToday && styles.todayDateText]}>{date.getDate()}</Text>
            {isToday && <View style={styles.todayIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ScheduleScreen = () => {
  const { events, fetchEvents } = useEvents();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { currentDate, currentWeek } = state;
  const [selectedDay, setSelectedDay] = useState(currentDate);
  const [weekOffset, setWeekOffset] = useState(0);

  const navigation = useNavigation();

  const stableFetchEvents = useCallback(fetchEvents, []);

  const fetchEventsFromDatabase = async () => {
    try {
      const userEmail = await SecureStore.getItemAsync('user_email');
      const token = await SecureStore.getItemAsync('access_token');

      const response = await fetch(
        `http://localhost:3000/timetables/${userEmail}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.ok) {
        const events = await response.json();
        const formattedEvents = events.map(event => ({
          id: event.id,
          title: event.title,
          day: event.day,
          startTime: genTimeBlock(
            event.day,
            parseInt(event.starttime.split(':')[0]),
            parseInt(event.starttime.split(':')[1])
          ),
          endTime: genTimeBlock(
            event.day,
            parseInt(event.endtime.split(':')[0]),
            parseInt(event.endtime.split(':')[1])
          ),
          location: event.location,
          notes: event.notes,
          session: event.session
        }));
        
        dispatch({ type: 'SET_RAW_EVENTS', payload: events }); // 원본 데이터 저장
        dispatch({ type: 'SET_EVENTS', payload: formattedEvents });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEventsFromDatabase();
  }, []);

  const onEventPress = (evt) => {
    console.log('Clicked event:', evt);
    navigation.navigate('EditEvent', {
      event: {
        id: evt.id,
        title: evt.title,
        day: evt.day,
        startTime: evt.startTime,
        endTime: evt.endTime,
        location: evt.location || '',
        notes: evt.notes || '',
        session: evt.session || 'Spring'
      }
    });
  };

  const handleResetToToday = () => {
    const today = getSydneyDate(new Date());
    setSelectedDay(today);
    dispatch({ type: 'SET_DATE', payload: today });
    dispatch({ type: 'SET_MONTH', payload: months[today.getMonth()] });
    setWeekOffset(0); // Reset week offset
  };

  const onHeaderDatePress = (direction) => {
    if (direction === 'prev') {
      setWeekOffset(prev => prev - 1);
    } else if (direction === 'next') {
      setWeekOffset(prev => prev + 1);
    }
  };

  const adjustedDate = moment().add(weekOffset, 'weeks').toDate();
  const currentMonth = months[adjustedDate.getMonth()];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2b189e', '#5d4add', '#a38ef9']}
        style={styles.header}
      >
        <Text style={styles.headerText}>BEYOND⁺</Text>
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={handleResetToToday}>
            <Text style={styles.headerCenterText}>{currentMonth}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('AddEvent')}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Account')}>
            <Ionicons name="person" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <CustomHeader
        currentDate={adjustedDate}
        onHeaderDatePress={onHeaderDatePress}
      />
      <TimeTableView
        events={state.events}
        pivotTime={9}
        pivotEndTime={20}
        pivotDate={genTimeBlock('mon')}
        nDays={7}
        onEventPress={onEventPress}
        locale="en"
        timeStep={60}
        styles={timetableStyles}
        disableDateSelection={true}
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
