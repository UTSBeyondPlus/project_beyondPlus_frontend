import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const Account = () => {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState({
    name: 'User',
    major_code: '',
    degree_name: ''
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        const email = await SecureStore.getItemAsync('user_email');

        // 사용자 정보 가져오기
        const userResponse = await fetch(`http://localhost:3000/users/${email}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // 전공 정보 가져오기 (엔드포인트 수정)
          const majorResponse = await fetch(
            `http://localhost:3000/majors/code/${userData.major_code}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (majorResponse.ok) {
            const majorData = await majorResponse.json();
            setUserInfo({
              name: userData.user_name || 'User',
              major_code: majorData.code || '',
              degree_name: majorData.degreeName || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleActivity = () => {
    navigation.navigate('Resume');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleHelp = () => {
    navigation.navigate('Help');
  };


  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user_email');
      // 로그인 페이지로 이동
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2b189e', '#5d4add', '#a38ef9']}
        style={styles.header}
      >
        <Text style={styles.headerText}>{userInfo.name}</Text>
        <Text style={styles.profileUniversity}>University of Technology Sydney</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.profileImageContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.profileImage} />
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{userInfo.major_code}</Text>
            <Text style={styles.infoLabel}>{userInfo.degree_name}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.menuItem} onPress={handleActivity}>
            <Ionicons name="heart-outline" size={24} color="#7B68EE" />
            <Text style={styles.menuText}>Your Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Ionicons name="star-outline" size={24} color="#7B68EE" />
            <Text style={styles.menuText}>Saved Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
            <Ionicons name="pricetag-outline" size={24} color="#7B68EE" />
            <Text style={styles.menuText}>Promotions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
            <Ionicons name="megaphone-outline" size={24} color="#7B68EE" />
            <Text style={styles.menuText}>Helps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={24} color="#7B68EE" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF6347" />
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    position: 'relative',
  },
  headerText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  profileUniversity: {
    fontSize: 16,
    color: 'white',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: -50, // Adjust this value to position the profile image correctly
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: '#f5f5f5',
  },
  body: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginTop: -30,
  },
  content: {
    padding: 16,
    marginTop: 2, // Adjust this value to create space for the profile image
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    marginTop: 5,
  },
  infoBox: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7B68EE',
  },
  infoLabel: {
    fontSize: 16,
    color: 'gray',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  menuText: {
    fontSize: 16,
    color: '#7B68EE',
    marginLeft: 10,
  },
});

export default Account;
