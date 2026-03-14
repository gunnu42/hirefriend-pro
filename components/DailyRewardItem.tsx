import React from 'react';
import { Pressable, View, Text, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';

interface DailyRewardItemProps {
  day: number;
  points: number;
  claimed: boolean;
  isClaimable: boolean;
  onPress: (day: number) => void;
  testID?: string;
}

export default function DailyRewardItem({ day, points, claimed, isClaimable, onPress, testID, }: DailyRewardItemProps) {
  const [hovered, setHovered] = React.useState(false);

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
          claimed && styles.dailyDotClaimed,
          isClaimable && styles.dailyDotClaimable,
          hovered && styles.dailyDotHover,
        ]}
      >
        <Text style={[styles.dailyDotDay, claimed && styles.dailyDotDayClaimed]}>D{day}</Text>
        <Text style={[styles.dailyDotPts, claimed && styles.dailyDotPtsClaimed]}>{points}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: 6,
  },
  pressableHover: {
    transform: [{ scale: 1.03 }],
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
  },
  dailyDotClaimed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dailyDotClaimable: {
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
    borderWidth: 2,
  },
  dailyDotHover: Platform.OS === 'web' ? {
    borderColor: Colors.primary,
    borderWidth: 2.5,
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  dailyDotDay: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  dailyDotDayClaimed: {
    color: 'rgba(255,255,255,0.8)',
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
});
