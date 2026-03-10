import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Calendar, Star, Gift, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Notification {
  id: string;
  type: 'booking' | 'review' | 'promo' | 'safety' | 'referral';
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your session with Sarah Mitchell is confirmed for Mar 2 at 7 PM.',
    time: '2 min ago',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '2',
    type: 'review',
    title: 'New Review',
    message: 'Marcus Johnson left you a 5-star review!',
    time: '1 hour ago',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '3',
    type: 'referral',
    title: 'Referral Bonus!',
    message: 'Mike T. signed up using your code. You earned 500 points!',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '4',
    type: 'promo',
    title: 'Weekend Special',
    message: 'Get 20% off on all bookings this weekend. Use code WEEKEND20.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: '5',
    type: 'safety',
    title: 'Verification Complete',
    message: 'Your profile has been verified. You now have the verified badge!',
    time: '2 days ago',
    read: true,
  },
  {
    id: '6',
    type: 'booking',
    title: 'Upcoming Reminder',
    message: 'Don\'t forget your hiking session with James Chen tomorrow at 8 AM.',
    time: '2 days ago',
    read: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
];

function getNotifIcon(type: string) {
  switch (type) {
    case 'booking': return Calendar;
    case 'review': return Star;
    case 'promo': return Gift;
    case 'safety': return Shield;
    case 'referral': return Gift;
    default: return Bell;
  }
}

function getNotifColor(type: string) {
  switch (type) {
    case 'booking': return Colors.primary;
    case 'review': return Colors.star;
    case 'promo': return Colors.gold;
    case 'safety': return Colors.teal;
    case 'referral': return Colors.success;
    default: return Colors.textSecondary;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const IconComp = getNotifIcon(item.type);
          const iconColor = getNotifColor(item.type);
          return (
            <Pressable
              style={[styles.notifRow, !item.read && styles.notifRowUnread]}
              onPress={() => {
                if (item.type === 'booking') {
                  router.push('/bookings');
                } else if (item.type === 'referral') {
                  router.push('/refer-earn');
                }
              }}
              testID={`notif-${item.id}`}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.notifAvatar} />
              ) : (
                <View style={[styles.notifIconBox, { backgroundColor: iconColor + '15' }]}>
                  <IconComp size={20} color={iconColor} />
                </View>
              )}
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>{item.title}</Text>
                <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No notifications</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  notifRowUnread: {
    backgroundColor: Colors.tagBg + '30',
  },
  notifAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notifIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    marginLeft: 12,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  notifTitleUnread: {
    fontWeight: '700' as const,
  },
  notifMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});

