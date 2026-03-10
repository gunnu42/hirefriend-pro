import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Animated, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Crown, MessageCircle, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { messages } from '@/mocks/friends';
import { useWallet } from '@/contexts/WalletContext';

function MessageItem({ item }: { item: typeof messages[0] }) {
  const router = useRouter();
  const { subscription } = useWallet();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isPremium = subscription !== 'free';

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    if (!isPremium) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/subscription');
    } else {
      router.push(`/chat/${item.friendId}`);
    }
  }, [item.friendId, router, scaleAnim, isPremium]);

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
            {!isPremium ? (
              <View style={styles.lockedRow}>
                <Lock size={12} color={Colors.textTertiary} />
                <Text style={styles.lockedText}>Subscribe to read messages</Text>
              </View>
            ) : (
              <Text
                style={[styles.messageText, item.unread > 0 && styles.messageTextUnread]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            )}
            {item.unread > 0 && isPremium && (
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
  const { subscription } = useWallet();
  const isPremium = subscription !== 'free';
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.friendName.toLowerCase().includes(q));
  }, [searchQuery]);

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
        <Pressable style={styles.upgradeBanner} onPress={() => router.push('/subscription')} testID="upgrade-banner">
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
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <MessageCircle size={40} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Start a conversation by hiring a friend</Text>
          </View>
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
});
