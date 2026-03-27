import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  marginTop?: number;
  marginBottom?: number;
  style?: any;
}

export default function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius = 8,
  marginTop = 0,
  marginBottom = 0,
  style,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          marginTop,
          marginBottom,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  count?: number;
  horizontal?: boolean;
}

export function SkeletonCard({ count = 1, horizontal = false }: SkeletonCardProps) {
  return (
    <View style={[styles.card, horizontal && styles.cardHorizontal]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.cardContent}>
          <SkeletonLoader width="100%" height={120} borderRadius={12} marginBottom={8} />
          <SkeletonLoader width="80%" height={14} marginBottom={6} />
          <SkeletonLoader width="60%" height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surfaceAlt,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardHorizontal: {
    flexDirection: 'row',
    gap: 12,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
});
