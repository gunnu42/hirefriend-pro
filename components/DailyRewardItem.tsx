import React from 'react';
import { Pressable, View, Text, StyleSheet, Platform } from 'react-native';
import { Check } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface DailyRewardItemProps {
  day: number;
  points: number;
  claimed: boolean;
  isClaimable: boolean;
  isActive: boolean;
  onPress: (day: number) => void;
  testID?: string;
}

export default function DailyRewardItem({
  day,
  points,
  claimed,
  isClaimable,
  isActive,
  onPress,
  testID,
}: DailyRewardItemProps) {
  const [hovered, setHovered] = React.useState(false);

  const getCardState = () => {
    if (claimed) return 'claimed';
    if (isActive) return 'active';
    return 'upcoming';
  };

  const state = getCardState();

  return (
    <Pressable
      onPress={() => isClaimable && onPress(day)}
      disabled={!isClaimable}
      style={[styles.pressable, hovered && styles.pressableHover]}
      testID={testID}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <View
        style={[
          styles.dailyDot,
          state === 'claimed' && styles.dailyDotClaimed,
          state === 'active' && styles.dailyDotActive,
          state === 'upcoming' && styles.dailyDotUpcoming,
          hovered && styles.dailyDotHover,
        ]}
      >
        {claimed ? (
          <Check size={16} color="#fff" style={styles.checkIcon} />
        ) : (
          <>
            <Text style={[
              styles.dailyDotDay,
              state === 'claimed' && styles.dailyDotDayClaimed,
              state === 'active' && styles.dailyDotDayActive,
              state === 'upcoming' && styles.dailyDotDayUpcoming,
            ]}>
              D{day}
            </Text>
            <Text style={[
              styles.dailyDotPts,
              state === 'claimed' && styles.dailyDotPtsClaimed,
              state === 'active' && styles.dailyDotPtsActive,
              state === 'upcoming' && styles.dailyDotPtsUpcoming,
            ]}>
              {points}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: 6,
  },
  pressableHover: {
    transform: [{ scale: 1.05 }],
  },
  dailyDot: {
    width: 52,
    height: 68,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        // No shadow for web fallback
      },
    }),
  },
  dailyDotClaimed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dailyDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  dailyDotUpcoming: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  dailyDotHover: Platform.OS === 'web' ? {
    borderColor: Colors.primary,
    borderWidth: 2.5,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 12px rgba(232, 96, 76, 0.3)`,
      },
    }),
  } : {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  checkIcon: {
    marginBottom: 2,
  },
  dailyDotDay: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  dailyDotDayClaimed: {
    color: 'rgba(255,255,255,0.9)',
  },
  dailyDotDayActive: {
    color: '#fff',
  },
  dailyDotDayUpcoming: {
    color: Colors.textTertiary,
  },
  dailyDotPts: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 1,
  },
  dailyDotPtsClaimed: {
    color: '#fff',
  },
  dailyDotPtsActive: {
    color: '#fff',
  },
  dailyDotPtsUpcoming: {
    color: Colors.textSecondary,
  },
});
