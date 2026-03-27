import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, Pressable, Alert, Animated } from 'react-native';
import { Flame, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabase';

interface DailyRewardData {
  user_id: string;
  current_streak: number;
  last_claim_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function InteractiveDailyRewards() {
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const today = new Date().toISOString().split('T')[0];
  const canClaimToday = lastClaimDate !== today;
  const currentDay = streakCount + 1;

  const rewards = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    pts: (i + 1) * 10, // 10, 20, 30... 300 points
    claimed: i < streakCount,
  }));

  // Load initial data
  useEffect(() => {
    if (!user?.id) {
      // No user - set default values and stop loading
      setStreakCount(0);
      setLastClaimDate(null);
      setLoading(false);
      return;
    }

    // Set timeout to ensure loading never exceeds 3 seconds
    const timeoutId = setTimeout(() => {
      console.warn('[DailyRewards] Loading timeout - showing default UI');
      setStreakCount(0);
      setLastClaimDate(null);
      setLoading(false);
    }, 3000);

    loadRewards().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [user?.id]);

  // Real-time listener
  useEffect(() => {
    if (!user?.id) return;

    let channel: any = null;
    try {
      channel = (supabase as any)
        .channel(`daily-rewards-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'daily_rewards',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            try {
              const newData = payload.new as DailyRewardData;
              setStreakCount(newData.current_streak);
              setLastClaimDate(newData.last_claim_date);
            } catch (err) {
              console.error('[DailyRewards] Error processing real-time update:', err);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.error('[DailyRewards] Error setting up real-time listener:', err);
    }

    return () => {
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (err) {
          console.error('[DailyRewards] Error unsubscribing:', err);
        }
      }
    };
  }, [user?.id]);

  // Pulse animation for claim button
  useEffect(() => {
    if (!canClaimToday) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [canClaimToday, pulseAnim]);

  const loadRewards = async () => {
    if (!user?.id) {
      setStreakCount(0);
      setLastClaimDate(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const rewardData = data as any;
        setStreakCount(rewardData.current_streak || 0);
        setLastClaimDate(rewardData.last_claim_date || null);
      } else {
        setStreakCount(0);
        setLastClaimDate(null);
      }
    } catch (err) {
      console.error('[DailyRewards] Load error:', err);
      setStreakCount(0);
      setLastClaimDate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = useCallback(async () => {
    if (!canClaimToday || !user?.id || claiming) return;

    try {
      setClaiming(true);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      const newStreak = streakCount + 1;
      const userId = user.id;

      const { error } = await (supabase as any)
        .from('daily_rewards')
        .upsert(
          {
            user_id: userId,
            current_streak: newStreak,
            last_claim_date: today,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      Alert.alert(
        '🎉 Reward Claimed!',
        `You earned ${newStreak * 10} points!\n🔥 ${newStreak} day streak!`
      );
      console.log('[DailyRewards] Reward claimed:', newStreak);
    } catch (err) {
      console.error('[DailyRewards] Claim error:', err);
      Alert.alert('Error', 'Failed to claim reward. Please try again.');
    } finally {
      setClaiming(false);
    }
  }, [canClaimToday, user?.id, claiming, streakCount, today, scaleAnim]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 90,
    offset: (90 + 8) * index,
    index,
  }), []);

  const renderRewardDay = ({ item }: { item: any }) => {
    const isToday = item.day === currentDay;
    const isClaimed = item.claimed;
    const isFuture = item.day > currentDay;

    return (
      <Animated.View
        style={[
          styles.dayCard,
          isToday && canClaimToday && { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Pressable
          onPress={() => isToday && canClaimToday && handleClaimReward()}
          style={styles.dayCardPressable}
        >
          <Animated.View
            style={[
              styles.dayCircle,
              {
                backgroundColor: isToday && canClaimToday ? Colors.primary : isClaimed ? Colors.success : isFuture ? Colors.surfaceAlt : '#E5E7EB',
                transform: isToday && canClaimToday ? [{ scale: pulseAnim }] : [],
              },
            ]}
          >
            {isFuture ? (
              <Lock size={20} color={Colors.textTertiary} />
            ) : (
              <Text style={[styles.dayNumber, isClaimed && { color: '#fff' }]}>{item.day}</Text>
            )}
          </Animated.View>
          <Text style={[
            styles.pointsLabel,
            isToday && canClaimToday && { fontWeight: '800' },
            isClaimed && { color: Colors.success, fontWeight: '700' },
          ]}>
            {isFuture ? '?' : `+${item.pts}`}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Flame size={20} color={Colors.primary} />
          <Text style={styles.title}>Daily Rewards</Text>
          <View style={styles.streakBadge}>
            <Flame size={14} color={Colors.gold} />
            <Text style={styles.streakText}> {streakCount} day</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {canClaimToday ? '✨ Claim your reward!' : '🎯 Come back tomorrow!'}
        </Text>
      </View>

      {/* Progress to milestone */}
      <View style={styles.milestoneRow}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(streakCount % 7) * 14.28}%` }]} />
        </View>
        <Text style={styles.milestoneText}>
          {streakCount % 7 === 0 && streakCount > 0 ? '🏆 Milestone!' : `${7 - (streakCount % 7)} more for 7-day bonus`}
        </Text>
      </View>

      {/* Day cards carousel */}
      <FlatList
        ref={flatListRef}
        data={rewards}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rewardsRow}
        keyExtractor={(item) => item.day.toString()}
        renderItem={renderRewardDay}
        scrollEventThrottle={16}
        snapToAlignment="center"
        snapToInterval={90 + 8}
        getItemLayout={getItemLayout}
        initialScrollIndex={Math.max(0, currentDay - 2)}
        onScrollToIndexFailed={() => {}}
      />

      {/* Bottom accent */}
      <View style={styles.bottomLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: Platform.OS === 'web' ? {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  } : {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  streakBadge: {
    backgroundColor: Colors.tagBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  milestoneRow: {
    gap: 8,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  milestoneText: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 6,
    fontWeight: '500' as const,
  },
  rewardsRow: {
    gap: 12,
    paddingVertical: 8,
  },
  dayCard: {
    alignItems: 'center',
    width: 52,
    marginHorizontal: 6,
  },
  dayCardPressable: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  bottomLine: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
    marginTop: 16,
  },
  loadingText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
