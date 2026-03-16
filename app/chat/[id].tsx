import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Phone, Video } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { friends } from '@/mocks/friends';

interface ChatMessage {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: string;
}

const initialMessages: ChatMessage[] = [
  { id: '1', text: 'Hey! I saw your profile and would love to hang out!', isMe: true, timestamp: '10:30 AM' },
  { id: '2', text: 'Hi there! That sounds great! What activity were you thinking?', isMe: false, timestamp: '10:32 AM' },
  { id: '3', text: 'I was thinking maybe we could grab some food and explore the city?', isMe: true, timestamp: '10:35 AM' },
  { id: '4', text: "That's perfect! I know some amazing hidden spots. When works for you?", isMe: false, timestamp: '10:36 AM' },
  { id: '5', text: 'How about this Saturday afternoon?', isMe: true, timestamp: '10:38 AM' },
  { id: '6', text: "Saturday works! Let's meet at 2pm. I'll send you the location details closer to the date.", isMe: false, timestamp: '10:40 AM' },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messageText, setMessageText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const flatListRef = useRef<FlatList>(null);

  const friend = useMemo(() => friends.find((f) => f.id === id), [id]);

  const handleSend = useCallback(() => {
    if (!messageText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      isMe: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    setMessageText('');

    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sounds great! Looking forward to it! 😊',
        isMe: false,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 1500);
  }, [messageText]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageBubble, item.isMe ? styles.myMessage : styles.theirMessage]}>
      <Text style={[styles.messageText, item.isMe ? styles.myMessageText : styles.theirMessageText]}>
        {item.text}
      </Text>
      <Text style={[styles.messageTime, item.isMe ? styles.myMessageTime : styles.theirMessageTime]}>
        {item.timestamp}
      </Text>
    </View>
  ), []);

  if (!friend) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Chat not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/friend/${friend.id}`)}
            style={styles.headerProfile}
            testID="chat-profile"
          >
            <Image source={{ uri: friend.avatar }} style={styles.headerAvatar} />
            <View>
              <Text style={styles.headerName}>{friend.name}</Text>
              <Text style={styles.headerStatus}>
                {friend.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerActionBtn}
              onPress={() => router.push({ pathname: '/call', params: { friendId: friend.id, method: 'voice' } })}
              testID="call-button"
            >
              <Phone size={20} color={Colors.text} />
            </Pressable>
            <Pressable
              style={styles.headerActionBtn}
              onPress={() => router.push({ pathname: '/call', params: { friendId: friend.id, method: 'video' } })}
              testID="video-button"
            >
              <Video size={20} color={Colors.text} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <SafeAreaView edges={['bottom']} style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              testID="message-input"
            />
            <Pressable
              onPress={handleSend}
              style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
              testID="send-button"
            >
              <Send size={20} color={messageText.trim() ? '#fff' : Colors.textTertiary} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: Colors.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right' as const,
  },
  theirMessageTime: {
    color: Colors.textTertiary,
  },
  inputArea: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceAlt,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
});

