import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, FlatList, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { RadioButton } from 'react-native-paper';  // react-native-paper 라이브러리 추가 필요

const AcademicInfo = () => {
  const navigation = useNavigation();
  const [major, setMajor] = useState('');
  const [filteredMajors, setFilteredMajors] = useState([]);
  const [showMajorList, setShowMajorList] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [enrollmentDate, setEnrollmentDate] = useState(new Date());
  const [graduationDate, setGraduationDate] = useState(new Date());
  
  const [showEnrollmentPicker, setShowEnrollmentPicker] = useState(false);
  const [showGraduationPicker, setShowGraduationPicker] = useState(false);
  const [currentSession, setCurrentSession] = useState('Autumn');
  

  const majors = [
    'Computer Science', 'Information Technology', 'Data Science', 'Software Engineering',
    'Artificial Intelligence', 'Cybersecurity', 'Network Engineering', 'Business Information Systems'
  ];

  useEffect(() => {
    
    if (major.length > 0) {
      const filtered = majors.filter(item => 
        item.toLowerCase().includes(major.toLowerCase())
      );
      setFilteredMajors(filtered);
      setShowMajorList(true);
    } else {
      setShowMajorList(false);
    }
  }, [major, isEditing]);

  
  const handleMajorSelect = (selectedMajor) => {
    setMajor(selectedMajor);
    setShowMajorList(false);
    setIsEditing(false);
  };
  
  const handleMajorPress = () => {
    setIsEditing(true);
    setMajor('');
  };

  const handleEnrollmentDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || enrollmentDate;
    setShowEnrollmentPicker(Platform.OS === 'ios');
    setEnrollmentDate(currentDate);
  };

  const handleGraduationDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || graduationDate;
    setShowGraduationPicker(Platform.OS === 'ios');
    setGraduationDate(currentDate);
  };

  const showEnrollmentDatepicker = () => {
    setShowEnrollmentPicker(true);
  };

  const showGraduationDatepicker = () => {
    setShowGraduationPicker(true);
  };

  const hideEnrollmentDatePicker = () => {
    setShowEnrollmentPicker(false);
  };

  const hideGraduationDatePicker = () => {
    setShowGraduationPicker(false);
  };

  const formatEnrollmentDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatGraduationDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const renderDatePicker = (date, onChange, show, hide, format, mode = 'date') => (
    Platform.OS === 'ios' ? (
      <Modal
        transparent={true}
        visible={show}
        onRequestClose={hide}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackground} onPress={hide} />
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={date}
              mode={mode}
              display="spinner"
              onChange={onChange}
              style={styles.datePicker}
              textColor="#000000"
            />
            <TouchableOpacity onPress={hide} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ) : (
      show && (
        <DateTimePicker
          value={date}
          mode={mode}
          display="default"
          onChange={onChange}
        />
      )
    )
  );

  const handleSessionSelect = (selectedSession) => {
    setSession(selectedSession);
    if (selectedSession === 'Autumn') {
      setSessionDates({
        startDate: '2024-02-19 Monday',
        endDate: 'Friday 17 May 2024'
      });
    } else if (selectedSession === 'Spring') {
      setSessionDates({
        startDate: 'Monday 5 August 2024',
        endDate: 'Friday 1 November 2024'
      });
    }
  };

  const handleSave = () => {
    if (!major || !enrollmentDate || !graduationDate || !session) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    // Here you would typically save the data to your backend or local storage
    console.log('Saving academic info:', { major, enrollmentDate, graduationDate, session, sessionDates });
    navigation.navigate('Main');
  };

  return (
    <LinearGradient
      colors={['#2b189e', '#5d4add', '#a38ef9']}
      style={styles.container}
    >
     <View style={styles.content}>
      <Text style={styles.title}>Academic Information</Text>
      
      {/* Major 입력 부분 */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputRow}>
            <View style={styles.label}>
                <Text style={styles.labelText}>Major:</Text>
            </View>
            <View style={styles.inputContainer}>
                {isEditing ? (
                <TextInput
                    style={styles.input}
                    placeholder="Enter your major"
                    value={major}
                    onChangeText={setMajor}
                />
                ) : (
                <TouchableOpacity onPress={handleMajorPress}>
                    <Text style={styles.selectedMajor}>{major}</Text>
                </TouchableOpacity>
                )}
            </View>
        </View>

        {showMajorList && isEditing && (
          <View style={styles.listContainer}>
            <FlatList
              data={filteredMajors.length > 0 ? filteredMajors : ['No result']}
              renderItem={({ item }) => (
                <TouchableOpacity
                onPress={() => item !== 'No result' && handleMajorSelect(item)}
                disabled={item === 'No result'}>
                  <Text style={styles.listItem}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item}
              nestedScrollEnabledte
            />
          </View>
        )}
      </View>

       {/* Enrollment Date 입력 부분 */}
       <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <View style={styles.label}>
              <Text style={styles.labelText}>Enrollment Date:</Text>
            </View>
            <TouchableOpacity 
              style={styles.inputContainer} 
              onPress={showEnrollmentDatepicker}
            >
              <Text style={styles.input}>
                {formatEnrollmentDate(enrollmentDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Graduation Date 입력 부분 */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <View style={styles.label}>
              <Text style={styles.labelText}>Graduation Date:</Text>
            </View>
            <TouchableOpacity 
              style={styles.inputContainer} 
              onPress={showGraduationDatepicker}
            >
              <Text style={styles.input}>
                {formatGraduationDate(graduationDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderDatePicker(enrollmentDate, handleEnrollmentDateChange, showEnrollmentPicker, hideEnrollmentDatePicker, formatEnrollmentDate)}
        {renderDatePicker(graduationDate, handleGraduationDateChange, showGraduationPicker, hideGraduationDatePicker, formatGraduationDate, 'date')}


        {/* Current Session 선택 */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <View style={styles.label}>
              <Text style={styles.labelText}>Current Session:</Text>
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setCurrentSession('Autumn')}
                >
                  <View style={styles.radio}>
                    {currentSession === 'Autumn' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>Autumn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setCurrentSession('Spring')}
                >
                  <View style={styles.radio}>
                    {currentSession === 'Spring' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>Spring</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save and Continue</Text>
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
  content: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  inputWrapper: {
    marginBottom: 20,
    zIndex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    width: 80,  // 너비를 줄여서 텍스트가 줄바꿈되도록 함
    height: 'auto',  // 높이를 자동으로 조절
    minHeight: 40,  // 최소 높이 설정
    justifyContent: 'center',
    // alignItems: 'center',
    marginRight: 10,
    padding: 5,  // 내부 여백 추가
    
  },
  labelText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    // textAlign: 'center',
    flexWrap: 'wrap',
  },
  inputContainer: {
    flex: 1,
    height: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    height: '100%',
    color: '#333',
  },
  listContainer: {
    marginTop: 5,
    maxHeight: 140,
    backgroundColor: '#f0f0f0',
    zIndex: 2,
  },
  listItem:{
    fontSize: 14,
    color: '#333',
    padding: 10,
    margin: 5,
    // backgroundColor: 'green',
    textAlignVertical: 'center',
  },
  selectedMajor: {
    fontSize: 14,
    color: '#333',
    paddingTop: 10,
    // backgroundColor: 'green',
    height: '100%',
    textAlignVertical: 'center',
  },
  modalBackground:{
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 반투명 배경 추가
  },

  datePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    position: 'relative', // 이 부분 추가
    zIndex: 1, // 이 부분 추가
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
  doneButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  radioGroup: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7B68EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#7B68EE',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#7B68EE',
    padding: 15,
    marginTop: 40,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AcademicInfo;