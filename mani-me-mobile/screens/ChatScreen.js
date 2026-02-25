import React, { useState, useEffect, useRef } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import api from '../src/api';

export default function ChatScreen({ route, navigation }) {
  const {
    shipment_id = null,
    driver_name = 'Support',
    tracking_number = null,
  } = route?.params || {};
  
  // Determine if this is a support chat or shipment chat
  const isSupportChat = !shipment_id;
  const { colors, isDark } = useThemeColors();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  // Get user ID - handle both 'id' and '_id' formats
  const userId = user?.id || user?._id;
  
  // Generate conversation_id for support chats
  const conversation_id = isSupportChat ? `support_${userId}` : shipment_id;

  useEffect(() => {
    if (!userId) {
      logger.log("No user ID → skipping listener setup");
      return;
    }

    logger.log("Setting up real-time listener for:", isSupportChat ? `support chat (${conversation_id})` : `shipment ${shipment_id}`);
    
    // Create real-time listener for messages
    const messagesRef = collection(db, 'messages');
    
    // Use conversation_id for support chats, shipment_id for shipment chats
    const q = isSupportChat 
      ? query(
          messagesRef,
          where('conversation_id', '==', conversation_id),
          orderBy('timestamp', 'asc')
        )
      : query(
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
  }, [shipment_id, conversation_id, userId, isSupportChat]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // Get user ID - handle both 'id' and '_id' formats
    const userId = user?.id || user?._id;
    
    if (!userId) {
      logger.error('No user ID found. User object:', user);
      Alert.alert('Error', 'Please log in to send messages.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        shipment_id: isSupportChat ? null : shipment_id,
        chat_type: isSupportChat ? 'support' : 'shipment',
        sender_id: userId,
        sender_role: 'user',
        sender_name: user?.name || user?.fullName || 'Customer',
        message: newMessage.trim(),
      };
      
      logger.log('Sending message payload:', payload);

      const response = await api.post('/chat/send', payload);
      logger.log('Message sent successfully:', response.data);
      setNewMessage('');
      // Real-time listener will automatically update messages
    } catch (error) {
      logger.error('Error sending message:', error?.response?.data || error.message);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Could not send your message. Please try again.';
      
      if (error?.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.error || 'Invalid message data.';
      } else if (error?.isOffline || error?.message?.includes('Network')) {
        errorMessage = 'No internet connection. Please check your network.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      Alert.alert('Send failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendQuickMessage = (message) => {
    setNewMessage(message);
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === userId;
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
            ? { backgroundColor: colors.primary, borderTopRightRadius: 4, borderTopLeftRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 18, alignSelf: 'flex-end', borderWidth: 0 }
            : { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: '#83C5FA', borderTopLeftRadius: 4, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 18, alignSelf: 'flex-start' }
        ]}>
          {!isMyMessage && (
            <Text style={[styles.senderName, { color: '#0B1A33' }]}> 
              {item.sender_name}
            </Text>
          )}
          <Text style={[ 
            styles.messageText,
            isMyMessage
              ? { color: '#fff', fontWeight: '500' }
              : { color: '#0B1A33', fontWeight: '500' }
          ]}>
            {item.message}
          </Text>
          <Text style={[ 
            styles.messageTime,
            isMyMessage
              ? { color: 'rgba(255,255,255,0.7)' }
              : { color: '#3A5BA0' }
          ]}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  // Determine header text based on chat type
  const headerTitle = isSupportChat ? 'Support Team' : (driver_name || 'Driver');
  const headerSubtitle = isSupportChat ? 'We typically reply within minutes' : `Parcel: ${tracking_number}`;

  // Quick actions based on chat type
  const quickActions = isSupportChat ? [
    { icon: 'help-circle-outline', text: 'Track order', message: 'I need help tracking my order' },
    { icon: 'calendar-outline', text: 'Reschedule', message: 'I need to reschedule my pickup' },
    { icon: 'pricetag-outline', text: 'Pricing', message: 'I have a question about pricing' },
  ] : [
    { icon: 'home-outline', text: "I'm ready", message: "I'm home and ready for pickup" },
    { icon: 'car-outline', text: 'Parking', message: 'You can park in front of the house' },
    { icon: 'call-outline', text: 'Call me', message: 'Please call me when you arrive' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <LinearGradient
        colors={isSupportChat ? ['#10B981', '#059669'] : [colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isSupportChat && (
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="headset-outline" size={18} color="#FFFFFF" />
              </View>
            )}
            <View>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Action Buttons */}
      <View style={[styles.quickActions, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {quickActions.map((action, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.quickButton, { backgroundColor: colors.background }]}
            onPress={() => sendQuickMessage(action.message)}
          >
            <Ionicons name={action.icon} size={18} color={isSupportChat ? '#10B981' : colors.primary} />
            <Text style={[styles.quickButtonText, { color: colors.text }]}>{action.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[styles.messagesList, { paddingBottom: 100 }]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={isSupportChat ? "headset-outline" : "chatbubbles-outline"} 
              size={64} 
              color={isSupportChat ? '#10B981' : colors.textSecondary} 
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isSupportChat ? 'How can we help?' : 'No messages yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {isSupportChat 
                ? 'Send us a message and we\'ll respond shortly' 
                : 'Start a conversation with your driver'}
            </Text>
          </View>
        }
      />

      {/* Input Area - Fixed at bottom */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom || 16 }]}> 
          <View style={[styles.inputBox, { backgroundColor: colors.surface, shadowColor: colors.primary }]}> 
            <TextInput
              style={[styles.inputText, { color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              underlineColorAndroid="transparent"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: newMessage.trim() ? colors.primary : colors.border, shadowColor: colors.primary }]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || loading}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={26} color={colors.accent} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  inputBox: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 8,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  inputText: {
    fontSize: 16,
    minHeight: 28,
    maxHeight: 100,
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...SHADOWS.medium,
  },
  backButton: {
    marginRight: 15,
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
    padding: 15,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 5,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    ...SHADOWS.small,
    marginBottom: 2,
    borderWidth: 0,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
