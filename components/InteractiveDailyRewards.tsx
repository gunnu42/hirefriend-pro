import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, ScrollView } from 'react-native';
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
  currentDay: number;
  canClaimToday: boolean;
  streakCount: number;
  isClaimableDay: (day: number) => boolean;
  onClaimReward: (day: number) => void;
  testID?: string;
}

export default function InteractiveDailyRewards({
  rewards,
  currentDay,
  canClaimToday,
  streakCount,
  isClaimableDay,
  onClaimReward,
  testID,
}: InteractiveDailyRewardsProps) {
  const flatListRef = useRef<FlatList>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Scroll to current day when component mounts or currentDay changes
  React.useEffect(() => {
    if (flatListRef.current && !isUserScrolling) {
      const index = Math.max(0, currentDay - 3); // Show a few days before current
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [currentDay, isUserScrolling]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 52 + 12, // item width + margin
    offset: (52 + 12) * index,
    index,
  }), []);

  const onScrollToIndexFailed = useCallback((info: any) => {
    console.warn('ScrollToIndex failed for index:', info.index);
    // Fallback: scroll to a valid index
    const safeIndex = Math.min(info.index, rewards.length - 1);
    if (safeIndex >= 0) {
      flatListRef.current?.scrollToIndex({
        index: safeIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [rewards.length]);

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Flame size={18} color={Colors.primary} />
          <Text style={styles.title}>Daily Rewards</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{streakCount} day streak</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {canClaimToday ? "Tap today's circle to claim!" : `Come back tomorrow for Day ${currentDay}!`}
        </Text>
      </View>

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
            isActive={item.day === currentDay}
            onPress={() => onClaimReward(item.day)}
            testID={`daily-day-${item.day}`}
          />
        )}
        onScrollBeginDrag={() => setIsUserScrolling(true)}
        onScrollEndDrag={() => setIsUserScrolling(false)}
        onMomentumScrollEnd={() => setIsUserScrolling(false)}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed}
        snapToAlignment="center"
        snapToInterval={52 + 12}
        decelerationRate="fast"
        initialScrollIndex={Math.max(0, currentDay - 3)}
      />

      {/* Bottom orange line */}
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
  rewardsRow: {
    gap: 12,
    paddingVertical: 8,
  },
  bottomLine: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
    marginTop: 16,
  },
});
