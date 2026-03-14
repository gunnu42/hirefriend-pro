import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import Colors from '@/constants/colors';

interface InteractiveSliderProps {
  minValue: number;
  maxValue: number;
  currentValue: number;
  onValueChange: (value: number) => void;
  containerHeight?: number;
  thumbSize?: number;
}

const THUMB_SIZE = 20;
const TRACK_HEIGHT = 6;

export default function InteractiveSlider({
  minValue,
  maxValue,
  currentValue,
  onValueChange,
  containerHeight = 80,
  thumbSize = THUMB_SIZE,
}: InteractiveSliderProps) {
  const containerWidth = Dimensions.get('window').width - 32; // Account for padding
  const trackWidth = containerWidth;
  const range = maxValue - minValue;
  const percentage = (currentValue - minValue) / range;
  const thumbX = percentage * trackWidth;

  const [isDragging, setIsDragging] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (e, { dx }) => {
        const newX = Math.max(0, Math.min(thumbX + dx, trackWidth));
        const newPercentage = newX / trackWidth;
        const newValue = Math.round(minValue + newPercentage * range);
        const clampedValue = Math.max(minValue, Math.min(newValue, maxValue));
        onValueChange(clampedValue);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const updateFromPosition = useCallback(
    (e: any) => {
      const { locationX } = e.nativeEvent;
      const newPercentage = Math.max(0, Math.min(locationX / trackWidth, 1));
      const newValue = Math.round(minValue + newPercentage * range);
      const clampedValue = Math.max(minValue, Math.min(newValue, maxValue));
      onValueChange(clampedValue);
    },
    [trackWidth, minValue, range, maxValue, onValueChange]
  );

  return (
    <View style={styles.container}>
      <View
        style={[styles.track, { width: trackWidth }]}
        onTouchEnd={updateFromPosition}
      >
        {/* Background track */}
        <View style={[styles.trackBg, { width: '100%' }]} />

        {/* Active fill (red) */}
        <View
          style={[
            styles.trackFill,
            { width: `${percentage * 100}%` },
          ]}
        />

        {/* Draggable thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: Math.max(
                -thumbSize / 2,
                Math.min(thumbX - thumbSize / 2, trackWidth - thumbSize / 2)
              ),
              width: thumbSize,
              height: thumbSize,
              opacity: isDragging ? 1 : 0.7,
              transform: [{ scale: isDragging ? 1.2 : 1 }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Inner circle for visual effect */}
          <View style={styles.thumbInner} />
        </View>
      </View>

      {/* Value label */}
      <View style={styles.labelContainer}>
        <View style={styles.dayLabel}>
          <View style={styles.dayLabelBg}>
            <View style={styles.dayValue} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'relative',
    overflow: 'visible',
  },
  trackBg: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: TRACK_HEIGHT / 2,
    top: 0,
    left: 0,
  },
  trackFill: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    backgroundColor: Colors.primary, // Red line
    borderRadius: TRACK_HEIGHT / 2,
    top: 0,
    left: 0,
  },
  thumb: {
    position: 'absolute',
    top: TRACK_HEIGHT / 2 - THUMB_SIZE / 2,
    backgroundColor: '#fff',
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  labelContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  dayLabel: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayLabelBg: {
    alignItems: 'center',
  },
  dayValue: {
    width: 0,
    height: 0,
  },
});
