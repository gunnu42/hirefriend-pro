import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import {
  UtensilsCrossed, Dumbbell, Plane, Clapperboard,
  Gamepad2, Music, Mountain, ShoppingBag,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Category } from '@/mocks/friends';

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  UtensilsCrossed,
  Dumbbell,
  Plane,
  Clapperboard,
  Gamepad2,
  Music,
  Mountain,
  ShoppingBag,
};

interface CategoryCardProps {
  category: Category;
  onPress: (category: Category) => void;
}

export default React.memo(function CategoryCard({ category, onPress }: CategoryCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComponent = iconMap[category.icon];

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress(category);
  }, [category, onPress, scaleAnim]);

  return (
    <Pressable onPress={handlePress} testID={`category-${category.id}`}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconCircle, { backgroundColor: category.color + '15' }]}>
          {IconComponent && <IconComponent size={22} color={category.color} />}
        </View>
        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.count}>{category.count}</Text>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  count: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
});
