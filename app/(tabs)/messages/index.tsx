import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Animated, TextInput, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Crown, MessageCircle, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { supabase } from '@/supabase';
import { Message } from '@/mocks/friends';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';

function MessageItem({ item }: { item: Message }) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    // Allow reading messages for all users, only block sending in chat
    router.push(`/chat/${item.friendId}` as any);
  }, [item.friendId, router, scaleAnim]);

  return (
    <Pressable onPress={handlePress} testID={`message-${item.id}`}>
      <Animated.View style={[styles.messageRow, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.friendAvatar }} style={styles.avatar} />
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.messageInfo}>
          <View style={styles.messageTop}>
            <Text style={styles.messageName} numberOfLines={1}>{item.friendName}</Text>
            <Text style={styles.messageTime}>{item.timestamp}</Text>
          </View>
          <View style={styles.messageBottom}>
            <Text
              style={[styles.messageText, item.unread > 0 && styles.messageTextUnread]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const MemoizedMessageItem = React.memo(MessageItem);

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const walletData = useWallet();
  const subscription = walletData?.subscription ?? 'free';
  const isPremium = subscription !== 'free';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversations from Supabase
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      // For now, we'll fetch recent connections and create conversation stubs
      // In a real implementation, you'd have a messages/conversations table
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          requester:users!connections_requester_id_fkey(id, full_name, avatar_url, current_city),
          addressee:users!connections_addressee_id_fkey(id, full_name, avatar_url, current_city)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform connections into conversation format
      const formattedConversations = (connections || []).map((conn: any) => {
        const otherUser = conn.requester_id === user.id ? conn.addressee : conn.requester;
        return {
          id: conn.id,
          friendId: otherUser.id,
          friendName: otherUser.full_name || 'Unknown',
          friendAvatar: otherUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
          lastMessage: 'Tap to start chatting...', // Placeholder
          timestamp: 'Just now', // Placeholder
          unread: 0, // Placeholder
          isOnline: true, // Placeholder
          location: otherUser.current_city || 'Unknown',
        };
      });

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(m => m.friendName.toLowerCase().includes(q));
  }, [searchQuery, conversations]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.searchRow}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="message-search"
          />
        </View>
      </SafeAreaView>

      {!isPremium && (
        <Pressable style={styles.upgradeBanner} onPress={() => router.push('/subscription' as any)} testID="upgrade-banner">
          <Crown size={18} color={Colors.gold} />
          <View style={styles.upgradeBannerContent}>
            <Text style={styles.upgradeBannerTitle}>Unlock Messaging</Text>
            <Text style={styles.upgradeBannerSub}>Subscribe to chat with friends</Text>
          </View>
          <View style={styles.upgradeBannerBtn}>
            <Text style={styles.upgradeBannerBtnText}>Upgrade</Text>
          </View>
        </Pressable>
      )}

      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MemoizedMessageItem item={item} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <MessageCircle size={40} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>Connect with friends to start chatting</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  title: {
    fontSize: 28, fontWeight: '800' as const, color: Colors.text,
    paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.surfaceAlt,
    borderRadius: 12, paddingHorizontal: 14, height: 44,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text, height: '100%' },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 10, backgroundColor: Colors.goldLight,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  upgradeBannerContent: { flex: 1 },
  upgradeBannerTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.goldText },
  upgradeBannerSub: { fontSize: 12, color: Colors.goldText, opacity: 0.8, marginTop: 2 },
  upgradeBannerBtn: {
    backgroundColor: Colors.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  upgradeBannerBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#fff' },
  listContent: { paddingBottom: 20 },
  messageRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2, width: 14, height: 14,
    borderRadius: 7, backgroundColor: Colors.online, borderWidth: 2.5,
    borderColor: Colors.background,
  },
  messageInfo: { flex: 1, marginLeft: 14 },
  messageTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  messageName: {
    fontSize: 16, fontWeight: '600' as const, color: Colors.text, flex: 1, marginRight: 8,
  },
  messageTime: { fontSize: 12, color: Colors.textTertiary },
  messageBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4,
  },
  messageText: { fontSize: 14, color: Colors.textSecondary, flex: 1, marginRight: 8 },
  messageTextUnread: { fontWeight: '600' as const, color: Colors.text },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  lockedText: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },
  unreadBadge: {
    backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadText: { fontSize: 11, fontWeight: '700' as const, color: '#fff' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});

