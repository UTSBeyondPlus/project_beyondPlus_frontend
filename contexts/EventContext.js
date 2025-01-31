import React, { createContext, useContext, useReducer } from 'react';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';

// Context의 타입 정의
const EventContext = createContext({
  events: [],
  fetchEvents: async () => {},
  addEvent: async () => {},
  updateEvent: async () => {},
  deleteEvent: async () => {},
  formatTimeToString: () => {},
});

// 초기 상태 정의
const initialState = {
  events: []
};

// 리듀서 정의
const eventReducer = (state, action) => {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event => 
          event.id === action.payload.id ? action.payload : event
        )
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };
    default:
      return state;
  }
};

export const EventProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  // AddEvent.jsx에서 가져온 시간 포맷 함수
  const formatTimeToString = (date) => {
    try {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '0000';
    }
  };


  // Main.jsx의 fetchEventsFromDatabase 함수 기반
  const fetchEvents = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const email = await SecureStore.getItemAsync('user_email');

      const response = await fetch(`http://localhost:3000/timetables/${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      dispatch({ type: 'SET_EVENTS', payload: data });
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  // AddEvent.jsx의 handleAddEvent 함수 기반
  const addEvent = async (eventData) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const email = await SecureStore.getItemAsync('user_email');

      const formattedEvent = {
        user_email: email,
        title: eventData.title.trim(),
        day: eventData.days.join(','),
        starttime: formatTimeToString(eventData.startTime),
        endtime: formatTimeToString(eventData.endTime),
        location: eventData.location?.trim() || null,
        notes: eventData.notes?.trim() || null,
        session: 'Spring'
      };

      const response = await fetch('http://localhost:3000/timetables/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedEvent)
      });

      if (!response.ok) throw new Error('Failed to create event');

      const newEvent = await response.json();
      dispatch({ type: 'ADD_EVENT', payload: newEvent });
      return newEvent;
    } catch (error) {
      console.error('Add event error:', error);
      throw error;
    }
  };
  // 새로운 updateEvent 함수
  const updateEvent = async (eventId, eventData) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');

      const response = await fetch(`http://localhost:3000/timetables/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) throw new Error('Failed to update event');

      const updatedEvent = await response.json();
      dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
      return updatedEvent;
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  };
  
  // 새로운 deleteEvent 함수
  const deleteEvent = async (eventId) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');

      const response = await fetch(`http://localhost:3000/timetables/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete event');

      dispatch({ type: 'DELETE_EVENT', payload: eventId });
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  };

  return (
    <EventContext.Provider value={{
      events: state.events,
      fetchEvents,
      addEvent,
      updateEvent,
      deleteEvent,
      formatTimeToString,
      
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};