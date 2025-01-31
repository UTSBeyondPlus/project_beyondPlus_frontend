import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store'; // Import SecureStore for token storage

const Login = () => {
  const navigation = useNavigation();
  const [emailPrefix, setEmailPrefix] = useState('');
  const [code, setCode] = useState(new Array(6).fill(''));
  const [codeSent, setCodeSent] = useState(false);
  const inputs = useRef([]);

  const sendVerificationCode = async () => {
    if (emailPrefix) {
      // const email = `${emailPrefix}@gmail.com`;
      const email = `${emailPrefix}@student.uts.edu.au`;
      console.log('Sending verification code to:', email); // 디버깅용 로그 추가

      try {
        const response = await fetch('http://localhost:3000/login/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        console.log('Server response status:', response.status); // 응답 상태 확인

        const responseText = await response.text();
        console.log('Server response:', responseText); // 서버 응답 확인

        try {
          const data = JSON.parse(responseText);
          if (response.ok) {
            setCodeSent(true);
            Alert.alert('Verification', 'A verification code has been sent to your email.');
          } else {
            Alert.alert('Error', data.message || 'Failed to send verification code');
            console.error('Server error:', data); // 서버 에러 로깅
          }
        } catch (jsonError) {
          console.error('Failed to parse JSON:', responseText);
          Alert.alert('Error', 'Server response was not in JSON format');
        }
      } catch (error) {
        console.error('Network error:', error);
        Alert.alert('Error', 'Failed to connect to the server. Please check your internet connection.');
      }
    } else {
      Alert.alert('Invalid Email', 'Please enter your student ID before the domain.');
    }
  };


  const verifyCode = async () => {
    const email = `${emailPrefix}@student.uts.edu.au`;
    const verificationCode = code.join('');
    const password = "1234";
    
    try {
      const response = await fetch('http://localhost:3000/login/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, verificationCode, password })
      });
      
      const data = await response.json();
  
      if (response.ok) {
        const token = response.headers.get('authorization').split(' ')[1];
        await SecureStore.setItemAsync('access_token', token);
        await SecureStore.setItemAsync('user_email', email);

          // master 계정 체크
          if (email === 'master@student.uts.edu.au') {
            navigation.navigate('Main');
            return;
          }

        // 일반 사용자 프로필 정보 확인
        const profileResponse = await fetch(`http://localhost:3000/users/${email}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const profileData = await profileResponse.json();

        // is_profile_complete 값을 확인
        if (!profileData.is_profile_complete) {
          navigation.navigate('UserInfo');
        } else {
          navigation.navigate('Main');
        }
      } else {
        Alert.alert('Error', data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      Alert.alert('Error', 'Failed to verify code');
    }
  };
  

// 일반 로그인 
  const handleLogin = async () => {
    if (!emailPrefix) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const email = `${emailPrefix}@student.uts.edu.au`;
    // const email = `${emailPrefix}@gmail.com`;
    const password = "1234";

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      // 응답 상태 코드 확인
      if (!response.ok) {
        const errorText = await response.text(); // 응답을 텍스트로 읽기
        console.error('Login error:', errorText);
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Login successful:', data);

      const token = response.headers.get('authorization').split(' ')[1];
      await SecureStore.setItemAsync('access_token', token);
      await SecureStore.setItemAsync('user_email', email);

        // master 계정 체크
        if (email === 'master@student.uts.edu.au') {
            navigation.navigate('Main');
            return;
        }

      // 일반 사용자 프로필 정보 확인
      const profileResponse = await fetch(`http://localhost:3000/users/${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const profileData = await profileResponse.json();

      // is_profile_complete 값을 확인
      if (!profileData.is_profile_complete) {
        navigation.navigate('UserInfo');
      } else {
        navigation.navigate('Main');
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const focusNext = (index, value) => {
    setCode(code.map((c, i) => (i === index ? value : c)));
    if (index < 5 && value) {
      inputs.current[index + 1].focus();
    }
  };

  const main = () => {
    navigation.navigate('Main');
  };

  const goBackToEmailInput = () => {
    setCodeSent(false); // Reset the state to show the email input screen again
    setCode(new Array(6).fill('')); // Clear the code input field
  };

  return (
    <LinearGradient
      colors={['#2b189e', '#5d4add', '#a38ef9']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
      </View>

      {!codeSent ? (
        <View style={styles.inputBoxContainer}>
          <Text style={styles.titleText}>Verification</Text>
          <Text style={styles.descriptionText}>Please, enter your phone and we will create an account for you</Text>
          <View style={styles.emailInputContainer}>
            <TextInput
              placeholder="Student ID"
              value={emailPrefix}
              onChangeText={setEmailPrefix}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.domainText}>@student.uts.edu.au</Text>
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={sendVerificationCode}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.applyButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputBoxContainer}>
          <Text style={styles.titleText}>Verification</Text>
          <Text style={styles.descriptionText}>Please, enter the code from the email we sent you</Text>
          <View style={styles.codeContainer}>
            {code.map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => inputs.current[index] = ref}
                style={styles.codeInput}
                maxLength={1}
                keyboardType="numeric"
                onChangeText={(text) => focusNext(index, text)}
                value={code[index]}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={verifyCode}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendNewCodeButton} onPress={sendVerificationCode}>
            <Text style={styles.sendNewCodeButtonText}>Send new code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goBackButton} onPress={goBackToEmailInput}>
            <Text style={styles.goBackButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 110,
  },
  inputBoxContainer: {
    backgroundColor: '#faf6ff',
    padding: 20,
    borderRadius: 25,
    width: '80%',
    height: '42%',
    alignItems: 'center',
    elevation: 5, // For shadow on Android
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 5, // For shadow on iOS
    marginBottom: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#7B68EE',
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 35,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 30,
    paddingHorizontal: 10,
    backgroundColor: '#f7f7f7',
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: 'transparent',
  },
  domainText: {
    fontSize: 16,
    color: '#7B68EE'
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  codeInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 24,
    borderRadius: 8,
    backgroundColor: '#f7f7f7',
  },
  applyButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  loginButton: {
    backgroundColor: '#b5a8ed',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f7f7f7',
  },
  sendNewCodeButton: {
    marginTop: 15,
  },
  sendNewCodeButtonText: {
    fontSize: 14,
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  goBackButton: {
    marginTop: 15,
  },
  goBackButtonText: {
    fontSize: 14,
    color: '#3498db',
  },
});

export default Login;
