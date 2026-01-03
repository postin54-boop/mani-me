import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useThemeColors } from '../constants/theme';
import api from '../utils/api';
import logger from '../utils/logger';
import firebaseConfig from '../utils/firebaseConfig';

export default function ChatScreen({ route, navigation }) {
  const {
    shipment_id = null,
    customer_name = 'Customer',
    tracking_number = null,
  } = route?.params || {};
  
  const { colors, isDark } = useThemeColors();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const dbRef = useRef(null);

  // Initialize Firebase (using centralized config)
  useEffect(() => {
    if (!dbRef.current) {
      const app = initializeApp(firebaseConfig);
      dbRef.current = getFirestore(app);
    }
  }, []);

  useEffect(() => {
    if (!shipment_id) {
      Alert.alert('Error', 'No shipment ID provided');
      navigation.goBack();
      return;
    }

    if (!dbRef.current) return;

    logger.log("Setting up real-time listener for shipment_id:", shipment_id);
    
    // Create real-time listener for messages
    const messagesRef = collection(dbRef.current, 'messages');
    const q = query(
      messagesRef,
      where('shipment_id', '==', shipment_id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = [];
      snapshot.forEach((doc) => {
        newMessages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      logger.log("Real-time update: received", newMessages.length, "messages");
      setMessages(newMessages);
      
      // Auto-scroll to bottom on new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, (error) => {
      logger.error("Firebase listener error:", error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [shipment_id, dbRef.current]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const payload = {
        shipment_id,
        sender_id: user.id,
        sender_role: 'driver',
        sender_name: user.name,
        message: newMessage.trim(),
      };
      
      await api.post('/chat/send', payload);
      setNewMessage('');
      // Real-time listener will automatically update messages
    } catch (error) {
      logger.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const sendQuickMessage = (message) => {
    setNewMessage(message);
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === user.id;
    const messageTime = new Date(item.timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });

    return (
      <View style={[ 
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        <View style={[ 
          styles.messageBubble,
          isMyMessage
            ? { backgroundColor: colors.primary, borderTopRightRadius: 4 }
            : { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: '#83C5FA', borderTopLeftRadius: 4 }
        ]}>
          {!isMyMessage && (
            <Text style={[styles.senderName, { color: isDark ? colors.text : '#0B1A33' }]}> 
              {item.sender_name}
            </Text>
          )}
          <Text style={[ 
            styles.messageText,
            { color: isMyMessage ? '#fff' : colors.text }
          ]}>
            {item.message}
          </Text>
          <Text style={[ 
            styles.messageTime,
            { color: isMyMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{customer_name}</Text>
          <Text style={styles.headerSubtitle}>Parcel: {tracking_number}</Text>
        </View>
      </LinearGradient>

      {/* Quick Action Buttons - Driver questions */}
      <View style={[styles.quickActions, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: colors.background }]}
          onPress={() => sendQuickMessage("I'm on my way to pick up your parcel")}
        >
          <Ionicons name="car-outline" size={18} color={colors.primary} />
          <Text style={[styles.quickButtonText, { color: colors.text }]}>On my way</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: colors.background }]}
          onPress={() => sendQuickMessage("I've arrived. Where should I park?")}
        >
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={[styles.quickButtonText, { color: colors.text }]}>Arrived</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: colors.background }]}
          onPress={() => sendQuickMessage("What's your apartment/flat number?")}
        >
          <Ionicons name="home-outline" size={18} color={colors.primary} />
          <Text style={[styles.quickButtonText, { color: colors.text }]}>Apt #?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickButton, { backgroundColor: colors.background }]}
          onPress={() => sendQuickMessage("I'm running a few minutes late, sorry!")}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.quickButtonText, { color: colors.text }]}>Late</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No messages yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Start a conversation with the customer
            </Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}> 
          <View style={[styles.inputBox, { backgroundColor: colors.surface }]}> 
            <TextInput
              style={[styles.inputText, { color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: newMessage.trim() ? colors.primary : colors.border }]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || loading}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={22} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  quickButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
  },
  inputBox: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputText: {
    fontSize: 15,
    minHeight: 24,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
