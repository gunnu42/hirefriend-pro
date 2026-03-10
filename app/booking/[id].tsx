import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Calendar, Clock, Star, BadgeCheck, Check,
  MapPin, Video,
} from 'lucide-react-native';
import { TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { friends } from '@/mocks/friends';

const durationPresets = [1, 2, 3, 4, 6, 8, 12, 24];

type ServiceType = 'local' | 'virtual';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const confirmAnim = useRef(new Animated.Value(1)).current;

  const friend = useMemo(() => friends.find((f) => f.id === id), [id]);

  const today = new Date();
  const dates = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [selectedAmPm, setSelectedAmPm] = useState<string>('AM');
  const [duration, setDuration] = useState<number>(2);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceType>('local');

  const total = friend ? friend.pricePerHour * (customDuration ? Number(customDuration) || 2 : duration) : 0;
  const virtualDiscount = serviceType === 'virtual' ? 0.7 : 1;
  const finalTotal = Math.round(total * virtualDiscount);

  const actualDuration = customDuration ? Number(customDuration) : duration;
  const selectedTime = selectedHour ? `${selectedHour}:${selectedMinute} ${selectedAmPm}` : '';

  const handleConfirm = useCallback(() => {
    if (!selectedHour) {
      Alert.alert('Select Time', 'Please select a time to continue.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(confirmAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(confirmAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    Alert.alert(
      'Booking Confirmed!',
      `Your ${serviceType === 'virtual' ? 'virtual' : 'in-person'} booking with ${friend?.name} has been confirmed for ${dates[selectedDate].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${selectedTime} (${actualDuration}h).`,
      [{ text: 'Great!', onPress: () => router.back() }]
    );
  }, [selectedHour, selectedMinute, selectedAmPm, friend, dates, selectedDate, actualDuration, router, confirmAnim, serviceType, selectedTime]);

  const getDayName = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  if (!friend) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
        </SafeAreaView>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Friend not found</Text>
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
          <Text style={styles.headerTitle}>Book a Session</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.friendSummary}>
          <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
          <View style={styles.friendInfo}>
            <View style={styles.friendNameRow}>
              <Text style={styles.friendName}>{friend.name}</Text>
              {friend.verified && <BadgeCheck size={16} color={Colors.primary} />}
            </View>
            <View style={styles.friendRating}>
              <Star size={13} color={Colors.star} fill={Colors.star} />
              <Text style={styles.friendRatingText}>{friend.rating} ({friend.reviewCount} reviews)</Text>
            </View>
          </View>
          <Text style={styles.friendPrice}>₹{friend.pricePerHour}/hr</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Type</Text>
          <View style={styles.serviceTypeRow}>
            <Pressable
              style={[styles.serviceCard, serviceType === 'local' && styles.serviceCardActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setServiceType('local'); }}
              testID="service-local"
            >
              <MapPin size={22} color={serviceType === 'local' ? '#fff' : Colors.primary} />
              <Text style={[styles.serviceCardTitle, serviceType === 'local' && styles.serviceCardTitleActive]}>Local</Text>
              <Text style={[styles.serviceCardDesc, serviceType === 'local' && styles.serviceCardDescActive]}>In-Person Meet</Text>
            </Pressable>
            <Pressable
              style={[styles.serviceCard, serviceType === 'virtual' && styles.serviceCardActiveVirtual]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setServiceType('virtual'); }}
              testID="service-virtual"
            >
              <Video size={22} color={serviceType === 'virtual' ? '#fff' : Colors.teal} />
              <Text style={[styles.serviceCardTitle, serviceType === 'virtual' && styles.serviceCardTitleActive]}>Virtual</Text>
              <Text style={[styles.serviceCardDesc, serviceType === 'virtual' && styles.serviceCardDescActive]}>Video / Call</Text>
            </Pressable>
          </View>
          {serviceType === 'virtual' && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>30% off for virtual sessions!</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((date, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDate(idx);
                }}
                style={[styles.dateCard, selectedDate === idx && styles.dateCardActive]}
                testID={`date-${idx}`}
              >
                <Text style={[styles.dateDayName, selectedDate === idx && styles.dateTextActive]}>
                  {getDayName(date)}
                </Text>
                <Text style={[styles.dateDay, selectedDate === idx && styles.dateTextActive]}>
                  {date.getDate()}
                </Text>
                <Text style={[styles.dateMonth, selectedDate === idx && styles.dateTextActive]}>
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Select Time</Text>
          </View>
          <View style={styles.timePickerRow}>
            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>Hour</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChipRow}>
                {['1','2','3','4','5','6','7','8','9','10','11','12'].map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedHour(h); }}
                    style={[styles.timeChip, selectedHour === h && styles.timeSlotActive]}
                    testID={`hour-${h}`}
                  >
                    <Text style={[styles.timeText, selectedHour === h && styles.timeTextActive]}>{h}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>Minute</Text>
              <View style={styles.timeChipWrap}>
                {['00','15','30','45'].map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedMinute(m); }}
                    style={[styles.timeChip, selectedMinute === m && styles.timeSlotActive]}
                    testID={`min-${m}`}
                  >
                    <Text style={[styles.timeText, selectedMinute === m && styles.timeTextActive]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>AM/PM</Text>
              <View style={styles.timeChipWrap}>
                {['AM','PM'].map((ap) => (
                  <Pressable
                    key={ap}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedAmPm(ap); }}
                    style={[styles.timeChip, selectedAmPm === ap && styles.timeSlotActive]}
                    testID={`ampm-${ap}`}
                  >
                    <Text style={[styles.timeText, selectedAmPm === ap && styles.timeTextActive]}>{ap}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          {selectedHour ? (
            <View style={styles.selectedTimeBadge}>
              <Text style={styles.selectedTimeText}>Selected: {selectedHour}:{selectedMinute} {selectedAmPm}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <Text style={styles.durationHint}>Select preset or enter custom hours (1-24+)</Text>
          <View style={styles.durationRow}>
            {durationPresets.map((h) => (
              <Pressable
                key={h}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDuration(h);
                  setCustomDuration('');
                }}
                style={[styles.durationChip, duration === h && !customDuration && styles.durationChipActive]}
                testID={`duration-${h}`}
              >
                <Text style={[styles.durationText, duration === h && !customDuration && styles.durationTextActive]}>
                  {h}h
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.customDurationRow}>
            <TextInput
              style={styles.customDurationInput}
              placeholder="Custom hours"
              placeholderTextColor={Colors.textTertiary}
              value={customDuration}
              onChangeText={(v) => setCustomDuration(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              testID="custom-duration"
            />
            <Text style={styles.customDurationLabel}>hours</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type</Text>
            <View style={styles.serviceTypeBadge}>
              {serviceType === 'local' ? <MapPin size={12} color={Colors.primary} /> : <Video size={12} color={Colors.teal} />}
              <Text style={styles.serviceTypeBadgeText}>{serviceType === 'local' ? 'In-Person' : 'Virtual'}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>
              {dates[selectedDate].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>{selectedTime || 'Not selected'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{actualDuration} hour{actualDuration > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate</Text>
            <Text style={styles.summaryValue}>₹{friend.pricePerHour}/hr</Text>
          </View>
          {serviceType === 'virtual' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Virtual Discount</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>-30%</Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{finalTotal}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomTotal}>₹{finalTotal}</Text>
            <Text style={styles.bottomSubtext}>{actualDuration}h · {serviceType === 'local' ? 'In-Person' : 'Virtual'}</Text>
          </View>
          <Pressable onPress={handleConfirm} testID="confirm-booking">
            <Animated.View style={[styles.confirmBtn, { transform: [{ scale: confirmAnim }] }]}>
              <Check size={20} color="#fff" />
              <Text style={styles.confirmText}>Confirm Booking</Text>
            </Animated.View>
          </Pressable>
        </SafeAreaView>
      </View>
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
  scrollContent: { paddingBottom: 20 },
  friendSummary: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    marginHorizontal: 16, borderRadius: 16, padding: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  friendAvatar: { width: 52, height: 52, borderRadius: 26 },
  friendInfo: { flex: 1, marginLeft: 12 },
  friendNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  friendName: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  friendRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  friendRatingText: { fontSize: 13, color: Colors.textSecondary },
  friendPrice: { fontSize: 16, fontWeight: '700' as const, color: Colors.primary },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  serviceTypeRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  serviceCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 18,
    alignItems: 'center', gap: 6, borderWidth: 2, borderColor: Colors.border,
  },
  serviceCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  serviceCardActiveVirtual: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  serviceCardTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  serviceCardTitleActive: { color: '#fff' },
  serviceCardDesc: { fontSize: 12, color: Colors.textSecondary },
  serviceCardDescActive: { color: 'rgba(255,255,255,0.8)' },
  discountBadge: {
    backgroundColor: Colors.successLight, borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 6, marginTop: 10, alignSelf: 'flex-start',
  },
  discountText: { fontSize: 13, fontWeight: '600' as const, color: Colors.success },
  dateRow: { gap: 10 },
  dateCard: {
    width: 64, paddingVertical: 12, borderRadius: 14, backgroundColor: Colors.card,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDayName: { fontSize: 12, color: Colors.textTertiary, fontWeight: '500' as const },
  dateDay: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginVertical: 2 },
  dateMonth: { fontSize: 11, color: Colors.textTertiary },
  dateTextActive: { color: '#fff' },
  timePickerRow: { gap: 14 },
  timePickerCol: { gap: 6 },
  timePickerLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  timeChipRow: { gap: 8 },
  timeChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
  },
  timeSlotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeText: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  timeTextActive: { color: '#fff' },
  selectedTimeBadge: {
    marginTop: 10, backgroundColor: Colors.tagBg, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  selectedTimeText: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  durationHint: { fontSize: 12, color: Colors.textTertiary, marginBottom: 4 },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  customDurationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
  },
  customDurationInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12, height: 48,
    paddingHorizontal: 16, fontSize: 15, color: Colors.text,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  customDurationLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  durationChip: {
    paddingHorizontal: 14, height: 44, borderRadius: 12, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  durationChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationText: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  durationTextActive: { color: '#fff' },
  summaryCard: {
    backgroundColor: Colors.card, marginHorizontal: 16, marginTop: 28,
    borderRadius: 16, padding: 18,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  summaryTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  serviceTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceAlt, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  serviceTypeBadgeText: { fontSize: 12, fontWeight: '600' as const, color: Colors.text },
  summaryDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: '800' as const, color: Colors.primary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottomBarInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14,
  },
  bottomTotal: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  bottomSubtext: { fontSize: 12, color: Colors.textTertiary },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, height: 48,
  },
  confirmText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 18, color: Colors.textSecondary },
});

