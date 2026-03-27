import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Ban, UserX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';
import { friends } from '@/mocks/friends';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const walletData = useWallet();
  const blockedUsers = walletData?.blockedUsers ?? [];
  const unblockUser = walletData?.unblockUser ?? (() => {});

  const blockedFriends = friends.filter(f => blockedUsers.includes(f.id));

  const handleUnblock = useCallback((userId: string, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            unblockUser(userId);
          },
        },
      ]
    );
  }, [unblockUser]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Blocked Users</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <FlatList
        data={blockedFriends}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userLocation}>{item.location}</Text>
            </View>
            <Pressable
              style={styles.unblockBtn}
              onPress={() => handleUnblock(item.id, item.name)}
              testID={`unblock-${item.id}`}
            >
              <Text style={styles.unblockText}>Unblock</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <UserX size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Blocked Users</Text>
            <Text style={styles.emptySubtitle}>Users you block will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  userLocation: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  unblockBtn: {
    backgroundColor: Colors.dangerLight, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  unblockText: { fontSize: 13, fontWeight: '600' as const, color: Colors.danger },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
});

