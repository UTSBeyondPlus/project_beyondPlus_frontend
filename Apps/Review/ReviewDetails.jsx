import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ReviewDetails = ({ route }) => {
  const { review } = route.params;

  // Ensure comments is always an array
  const [comments, setComments] = useState(Array.isArray(review.comments) ? review.comments : []);
  const [newComment, setNewComment] = useState('');
  const [recommend, setRecommend] = useState(false);  // Using a boolean for recommend

  const addComment = () => {
    if (newComment.trim()) {
      const updatedComments = [
        ...comments,
        {
          id: comments.length + 1,
          text: newComment.trim(),
          user: 'Current User', // Replace with actual user information if available
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
        },
      ];
      setComments(updatedComments);
      setNewComment(''); // Clear the input
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#2b189e', '#5d4add', '#a38ef9']} style={styles.header}>
        <Text style={styles.headerTitle}>{review.title}</Text>
      </LinearGradient>

      <View style={styles.detailsContainer}>
        <View style={styles.reviewSection}>
          <Image source={{ uri: review.image || 'https://via.placeholder.com/150' }} style={styles.reviewImage} />
          <Text style={styles.user}>By {review.user}</Text>
          <Text style={styles.reviewText}>{review.review}</Text>
        </View>

        <View style={styles.recommendSection}>
          <Text style={styles.sectionTitle}>Would you recommend this lecture?</Text>
          <TouchableOpacity 
            style={styles.checkBoxContainer}
            onPress={() => setRecommend(!recommend)}
          >
            <Ionicons
              name={recommend ? "checkbox" : "square-outline"}
              size={24}
              color={recommend ? "#4A3FAB" : "#ccc"}
            />
            <Text style={styles.checkBoxLabel}>I recommend this lecture</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentHeader}>Comments</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity style={styles.addButton} onPress={addComment}>
            <Ionicons name="send" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Display comments */}
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <View key={comment.id || index} style={styles.commentItem}>
                <Text style={styles.commentUser}>{comment.user}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentDate}>
                  {comment.date} {comment.time}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>No comments yet.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, paddingTop: 40, paddingBottom: 20, backgroundColor: '#4A3FAB' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  detailsContainer: { padding: 16 },
  reviewSection: { marginBottom: 20, alignItems: 'center' },
  reviewImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  user: { fontSize: 16, color: '#7B68EE', marginBottom: 5 },
  reviewText: { textAlign: 'center', fontSize: 16, marginBottom: 10 },
  recommendSection: { marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  checkBoxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkBoxLabel: { marginLeft: 8, fontSize: 16 },
  commentsSection: { marginTop: 20 },
  commentHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  commentInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, marginBottom: 10 },
  addButton: {
    backgroundColor: '#7B68EE',
    padding: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  commentItem: { marginBottom: 10, backgroundColor: '#f1f1f1', padding: 10, borderRadius: 8 },
  commentUser: { fontWeight: 'bold', color: '#7B68EE' },
  commentText: { marginLeft: 10, color: '#333' },
  commentDate: { fontSize: 12, color: 'grey', marginLeft: 10 },
  noCommentsText: { color: 'grey', textAlign: 'center', marginTop: 10 },
});

export default ReviewDetails;
