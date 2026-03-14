import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { Flame } from 'lucide-react-native';
import Colors from '@/constants/colors';
import DailyRewardItem from './DailyRewardItem';

interface DailyReward {
  day: number;
  pts: number;
  claimed: boolean;
}

interface InteractiveDailyRewardsProps {
  rewards: DailyReward[];
  currentStreak: number;
  canClaimToday: boolean;
  pointsToFreeConnection: number;
  isClaimableDay: (day: number) => boolean;
  onClaimReward: (day: number) => void;
  testID?: string;
}

export default function InteractiveDailyRewards({
  rewards,
  currentStreak,
  canClaimToday,
  pointsToFreeConnection,
  isClaimableDay,
  onClaimReward,
  testID,
}: InteractiveDailyRewardsProps) {
  const flatListRef = useRef<FlatList>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Flame size={18} color={Colors.primary} />
          <Text style={styles.title}>Daily Rewards</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{currentStreak} day streak</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {canClaimToday ? "Tap today's circle to claim!" : `Only ${pointsToFreeConnection} pts away from a free connection!`}
        </Text>
      </View>

      {/* Top slider removed per design (keeping bottom progress bar) */}

      {/* Scrollable Rewards */}
      <FlatList
        ref={flatListRef}
        data={rewards}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rewardsRow}
        keyExtractor={(item) => item.day.toString()}
        renderItem={({ item }) => (
          <DailyRewardItem
            day={item.day}
            points={item.pts}
            claimed={item.claimed}
            isClaimable={isClaimableDay(item.day)}
            onPress={() => onClaimReward(item.day)}
            testID={`daily-day-${item.day}`}
          />
        )}
        onScrollBeginDrag={() => setIsUserScrolling(true)}
        onScrollEndDrag={() => setIsUserScrolling(false)}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: 52 + 12,
          offset: (52 + 12) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          console.warn('ScrollToIndex failed for index:', info.index);
        }}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((500 - pointsToFreeConnection) / 500) * 100}%` },
            ]}
          />
        </View>
      </View>
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
    borderWidth: 1,
    borderColor: Colors.border,
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
  sliderContainer: {
    marginBottom: 16,
    gap: 8,
  },
  dayMarker: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayMarkerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  rewardsRow: {
    gap: 0,
    paddingVertical: 8,
  },
  progressContainer: {
    marginTop: 16,
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
});
