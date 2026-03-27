import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Phone, Video } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabase';
import { friends } from '@/mocks/friends';

const MAX_DAILY_MESSAGES = 10;

interface ChatMessage {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: string;
  sender_id: string;
}

interface MessageRow {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const realtimeSubscriptionRef = useRef<any>(null);

  // Get friend from mocks
  const friend = friends.find((f) => f.id === id);

  // Load messages + realtime subscription
  useEffect(() => {
    if (!user?.id || !id) return;

    const loadAndSubscribeMessages = async () => {
      try {
        setLoading(true);

        const { data: messages, error } = await supabase
          .from('messages')
          .select('id, text, sender_id, receiver_id, created_at')
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`
          )
          .order('created_at', { ascending: true });

        if (error) {
          console.error('[Chat] Error loading messages:', error);
          return;
        }

        const rows = (messages ?? []) as MessageRow[];

        const formattedMessages: ChatMessage[] = rows.map((msg) => ({
          id: msg.id,
          text: msg.text,
          isMe: msg.sender_id === user.id,
          timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          }),
          sender_id: msg.sender_id,
        }));

        setChatMessages(formattedMessages);

        const today = new Date().toDateString();
        const todayCount = formattedMessages.filter(
          (msg) => msg.isMe && new Date(msg.timestamp).toDateString() === today
        ).length;
        setDailyMessageCount(todayCount);
        setDailyLimitReached(!isPremium && todayCount >= MAX_DAILY_MESSAGES);

        // Clean up previous channel
        if (realtimeSubscriptionRef.current) {
          supabase.removeChannel(realtimeSubscriptionRef.current);
        }

        const channel = supabase
          .channel(`chat-${user.id}-${id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload: { new: Record<string, any> }) => {
              const newMsg = payload.new as MessageRow;
              const isRelevant =
                (newMsg.sender_id === user.id && newMsg.receiver_id === id) ||
                (newMsg.sender_id === id && newMsg.receiver_id === user.id);
              if (!isRelevant) return;

              const formattedMsg: ChatMessage = {
                id: newMsg.id,
                text: newMsg.text,
                isMe: newMsg.sender_id === user.id,
                timestamp: new Date(newMsg.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                }),
                sender_id: newMsg.sender_id,
              };

              setChatMessages((prev) => [...prev, formattedMsg]);
              if (newMsg.sender_id === user.id) {
                setDailyMessageCount((prev) => prev + 1);
              }
            }
          )
          .subscribe();

        realtimeSubscriptionRef.current = channel;
      } catch (err) {
        console.error('[Chat] Exception loading messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAndSubscribeMessages();

    return () => {
      if (realtimeSubscriptionRef.current) {
        supabase.removeChannel(realtimeSubscriptionRef.current);
      }
    };
  }, [user?.id, id, isPremium]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !user?.id || !id) return;

    if (!isPremium && dailyMessageCount >= MAX_DAILY_MESSAGES) {
      Alert.alert(
        'Daily Limit Reached',
        `You can only send ${MAX_DAILY_MESSAGES} messages per day on the free plan. Upgrade for unlimited messaging.`,
        [
          { text: 'Upgrade', onPress: () => router.push('/subscription' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      setSending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: id,
        text: messageText.trim(),
        created_at: new Date().toISOString(),
      } as any);

      if (error) {
        console.error('[Chat] Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }

      setMessageText('');
      // Message will appear via realtime subscription
    } catch (err) {
      console.error('[Chat] Exception sending message:', err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [messageText, user?.id, id, isPremium, dailyMessageCount]);

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
            onPress={() => router.push(`/friend/${friend.id}` as any)}
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
              onPress={() =>
                router.push({ pathname: '/call' as any, params: { friendId: friend.id, method: 'voice' } })
              }
              testID="call-button"
            >
              <Phone size={20} color={Colors.text} />
            </Pressable>
            <Pressable
              style={styles.headerActionBtn}
              onPress={() =>
                router.push({ pathname: '/call' as any, params: { friendId: friend.id, method: 'video' } })
              }
              testID="video-button"
            >
              <Video size={20} color={Colors.text} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {!isPremium && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>
            Free: {dailyMessageCount}/{MAX_DAILY_MESSAGES} messages today
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <SafeAreaView edges={['bottom']} style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, dailyLimitReached && styles.inputDisabled]}
              value={messageText}
              onChangeText={setMessageText}
              placeholder={dailyLimitReached ? 'Daily limit reached' : 'Type a message...'}
              placeholderTextColor={Colors.textTertiary}
              multiline
              editable={!dailyLimitReached && !sending}
              testID="message-input"
            />
            <Pressable
              onPress={handleSend}
              style={[
                styles.sendBtn,
                (!messageText.trim() || dailyLimitReached || sending) && styles.sendBtnDisabled,
              ]}
              disabled={!messageText.trim() || dailyLimitReached || sending}
              testID="send-button"
            >
              {sending ? (
                <ActivityIndicator color={messageText.trim() ? '#fff' : Colors.textTertiary} />
              ) : (
                <Send
                  size={20}
                  color={messageText.trim() && !dailyLimitReached ? '#fff' : Colors.textTertiary}
                />
              )}
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
  limitBanner: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FBBF24',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  chatArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  inputDisabled: {
    opacity: 0.6,
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