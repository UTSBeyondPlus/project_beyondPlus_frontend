import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './Apps/login';
import Main from './Apps/Main';
import SignIn from './Apps/signin'; 
import Review from './Apps/Review';
import Account from './Apps/Account';
import Activity from './Apps/Accounts/Activity';
import Help from './Apps/Accounts/Help'
import Settings from './Apps/Accounts/Settings'
import Resume from './Apps/Resume'
import Post from './Apps/Post'
import PostDetails from './Apps/PostDetails';
import Community from './Apps/Community';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store'; 

import { createNavigationContainerRef } from '@react-navigation/native';
const navigationRef = createNavigationContainerRef();

const Stack = createStackNavigator();

const App = () => {
  const checkAutoLogin = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token'); // Retrieve the token

      if (token) {
        // Verify token with the backend to check its validity
        const response = await fetch('http://localhost:3000/login/verify-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          navigationRef.navigate('Main'); // Navigate to Main if token is valid
        } else {
          navigationRef.navigate('Login'); // Invalid token, navigate to login
        }
      } else {
        navigationRef.navigate('Login'); // No token found, navigate to login
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      navigationRef.navigate('Login'); // On error, navigate to login
    }
  };

  useEffect(() => {
    checkAutoLogin(); // Check for token when app starts
  }, []);
  

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={Main}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignIn}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Review"
          component={Review}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Account"
          component={Account}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Resume"
          component={Resume}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PostDetails" 
          component={PostDetails}
          options={{ headerShown: false }}  
         />
         <Stack.Screen 
          name="Community" 
          component={Community}
          options={{ headerShown: false }}  
         />
        <Stack.Screen name="Activity" component={Activity} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Help" component={Help} />
        <Stack.Screen name="Post" component={Post} />
        
      </Stack.Navigator>
    </NavigationContainer>
  
    
  );
};

export default App;
