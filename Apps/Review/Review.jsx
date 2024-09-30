import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, toLowerCase, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const initialReviews = [
  {
    id: 1,
    title: 'Beyond+',
    user: 'User',
    review: 'Beyond+ is a React Native application designed to manage and review class schedules, user activities, and settings. It provides a user-friendly interface for selecting times, viewing timetables, and managing user accounts.',
    rating: 5.0,
    image: '',
    comments: 3,
    time: '2 days ago',
  },
  {
    id: 2,
    title: 'Design Thinking',
    user: 'Steven',
    review: 'Great class! Highly recommended.',
    rating: 4.8,
    image: 'https://via.placeholder.com/150',
    comments: 1,
    time: '1 week ago',
  },
  {
    id: 3,
    title: 'Machine Learning',
    user: 'Charlie',
    review: 'Very informative but challenging.',
    rating: 4.5,
    image: 'https://via.placeholder.com/150',
    comments: 2,
    time: '3 weeks ago',
  },
];

const Review = () => {
  const [reviews, setReviews] = useState(initialReviews);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const filteredReviews = reviews.filter(review =>
    review.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (review) => {
    navigation.navigate('ReviewDetails', { review });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2b189e', '#5d4add', '#a38ef9']}
        style={styles.header}
      >
        <TextInput
          style={styles.searchBar}
          placeholder="Search lecture or major"
          placeholderTextColor="#ccc"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </LinearGradient>
      <ScrollView style={styles.body}>
        {filteredReviews.map((review) => (
          <TouchableOpacity key={review.id} style={styles.card} onPress={() => handleViewDetails(review)}>
            <View style={styles.cardContent}>
              <Image source={{ uri: review.image || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
              <View style={styles.cardText}>
                <Text style={styles.title}>{review.title}</Text>
                <Text style={styles.user}>By {review.user}</Text>
                <View style={styles.footer}>
                  <Text style={styles.rating}><Ionicons name="star" size={14} color="gold" /> {review.rating}</Text>
                  <Text style={styles.comment}><Ionicons name="chatbubble-outline" size={14} color="grey" /> {review.comments} Comments</Text>
                </View>
                <Text style={styles.time}>{review.time}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, paddingTop: 40 },
  searchBar: { backgroundColor: 'white', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 18, color: 'black' },
  body: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 8, marginBottom: 16, padding: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardImage: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  cardText: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: 16 },
  user: { color: '#7B68EE', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  rating: { color: 'grey', fontSize: 14 },
  comment: { color: 'grey', fontSize: 14 },
  time: { marginTop: 5, color: 'grey', fontSize: 12 },
});

export default Review;
