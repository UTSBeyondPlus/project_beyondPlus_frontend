import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

const UserInfoForm = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [majorCode, setMajorCode] = useState('');
  const [majorInfo, setMajorInfo] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [session, setSession] = useState('Spring');
  const [showDropdown, setShowDropdown] = useState(false);

  const searchMajor = async (code) => {
    if (code.length > 0) {
      try {
        const response = await fetch(
          `http://localhost:3000/majors/search?query=${encodeURIComponent(code)}`
        );
        const data = await response.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching major:', error);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setMajorInfo(null);
    }
  };

  const selectMajor = (major) => {
    setMajorCode(major.code);
    setMajorInfo(major);
    setShowDropdown(false);
  };

  const handleMajorCodeChange = (text) => {
    setMajorCode(text.toUpperCase());
    searchMajor(text);
  };

  const handleSubmit = async () => {
    if (!userName || !majorInfo || !session) {
      Alert.alert('Error', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('access_token');
      const email = await SecureStore.getItemAsync('user_email');
      
      console.log('Sending data:', {
        email,
        user_name: userName,
        major_code: majorInfo.code,
        session
      });

      const response = await fetch('http://localhost:3000/users/update-info', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          user_name: userName,
          major_code: majorInfo.code,
          session
        })
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        Alert.alert('Success', '사용자 정보가 저장되었습니다.');
        navigation.navigate('Main');
      } else {
        Alert.alert('Error', data.message || '사용자 정보 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving user info:', error);
      Alert.alert('Error', '서버 연결에 실패했습니다.');
    }
  };

  return (
    <LinearGradient
      colors={['#2b189e', '#5d4add', '#a38ef9']}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>사용자 정보 입력</Text>
        
        <TextInput
          style={styles.input}
          placeholder="이름"
          value={userName}
          onChangeText={setUserName}
          placeholderTextColor="#666"
        />

        <View style={styles.majorContainer}>
          <TextInput
            style={styles.input}
            placeholder="전공 코드 (예: C10235)"
            value={majorCode}
            onChangeText={handleMajorCodeChange}
            autoCapitalize="characters"
            placeholderTextColor="#666"
          />
          
          {majorInfo && (
            <View style={styles.majorInfo}>
              <Text style={styles.majorName}>{majorInfo.degreeName}</Text>
            </View>
          )}
          
          {showDropdown && searchResults.length > 0 && (
            <View style={styles.dropdown}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => selectMajor(item)}
                  >
                    <Text style={styles.codeText}>{item.code}</Text>
                    <Text style={styles.majorNameText}>{item.degreeName}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <View style={styles.sessionContainer}>
          <TouchableOpacity
            style={[styles.sessionButton, session === 'Spring' && styles.selectedSession]}
            onPress={() => setSession('Spring')}
          >
            <Text style={[styles.sessionText, session === 'Spring' && styles.selectedSessionText]}>
              Spring
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sessionButton, session === 'Autumn' && styles.selectedSession]}
            onPress={() => setSession('Autumn')}
          >
            <Text style={[styles.sessionText, session === 'Autumn' && styles.selectedSessionText]}>
              Autumn
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>저장</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2b189e',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  majorContainer: {
    position: 'relative',
    width: '100%',
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  majorInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  majorCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  majorName: {
    fontSize: 16,
    color: '#333',
  },
  sessionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sessionButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedSession: {
    backgroundColor: '#2b189e',
    borderColor: '#2b189e',
  },
  sessionText: {
    color: '#333',
  },
  selectedSessionText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#2b189e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  codeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2b189e',
  },
  majorNameText: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  }
});

export default UserInfoForm; 