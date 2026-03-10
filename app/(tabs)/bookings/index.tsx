import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Clock, Check, X, CalendarDays } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { bookings, Booking } from '@/mocks/bookings';

type TabType = 'upcoming' | 'completed' | 'cancelled';

const tabs: { key: TabType; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    router.push(`/friend/${booking.friendId}`);
  }, [booking.friendId, router, scaleAnim]);

  const handleConfirmDone = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Confirmed', `Session with ${booking.friendName} marked as complete!`);
  }, [booking.friendName]);

  const handleCancel = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking with ${booking.friendName}?`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel Booking', style: 'destructive', onPress: () => console.log('Cancelled:', booking.id) },
      ]
    );
  }, [booking.friendName, booking.id]);

  return (
    <Pressable onPress={handlePress} testID={`booking-${booking.id}`}>
      <Animated.View style={[styles.bookingCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.bookingTop}>
          <Image source={{ uri: booking.friendAvatar }} style={styles.bookingAvatar} />
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingName}>{booking.friendName}</Text>
            <Text style={styles.bookingActivity}>{booking.activity}</Text>
          </View>
          <Text style={styles.bookingPrice}>${booking.price}</Text>
        </View>
        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetail}>
            <Calendar size={13} color={Colors.textTertiary} />
            <Text style={styles.bookingDetailText}>{booking.date}</Text>
          </View>
          <View style={styles.bookingDetail}>
            <Clock size={13} color={Colors.textTertiary} />
            <Text style={styles.bookingDetailText}>{booking.time} · {booking.duration}h</Text>
          </View>
          <View style={styles.bookingDetail}>
            <MapPin size={13} color={Colors.textTertiary} />
            <Text style={styles.bookingDetailText} numberOfLines={1}>{booking.venue}</Text>
          </View>
        </View>
        {booking.status === 'upcoming' && (
          <View style={styles.bookingActions}>
            <Pressable style={styles.confirmDoneBtn} onPress={handleConfirmDone} testID={`confirm-${booking.id}`}>
              <Check size={16} color="#fff" />
              <Text style={styles.confirmDoneText}>Confirm Done</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={handleCancel} testID={`cancel-${booking.id}`}>
              <X size={16} color={Colors.danger} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        )}
        {booking.status === 'completed' && (
          <View style={styles.statusBadgeRow}>
            <View style={styles.completedBadge}>
              <Check size={12} color={Colors.success} />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          </View>
        )}
        {booking.status === 'cancelled' && (
          <View style={styles.statusBadgeRow}>
            <View style={styles.cancelledBadge}>
              <X size={12} color={Colors.danger} />
              <Text style={styles.cancelledText}>Cancelled</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const MemoizedBookingCard = React.memo(BookingCard);

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const filtered = useMemo(
    () => bookings.filter((b) => b.status === activeTab),
    [activeTab]
  );

  const handleTabPress = useCallback((tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <Text style={styles.title}>My Bookings</Text>
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => handleTabPress(tab.key)}
              testID={`tab-${tab.key}`}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MemoizedBookingCard booking={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <CalendarDays size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming'
                ? 'Book a friend to get started!'
                : activeTab === 'completed'
                ? 'Your completed sessions will appear here'
                : 'No cancelled bookings'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.card,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  bookingCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bookingActivity: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  bookingDetails: {
    marginTop: 14,
    gap: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingDetailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  confirmDoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingVertical: 10,
  },
  confirmDoneText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  statusBadgeRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.dangerLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cancelledText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});

