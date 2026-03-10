import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Star, MapPin, Heart, BadgeCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Friend } from '@/mocks/friends';
import { useFavorites } from '@/contexts/FavoritesContext';

interface FriendCardProps {
  friend: Friend;
  variant?: 'default' | 'compact';
}

export default React.memo(function FriendCard({ friend, variant = 'default' }: FriendCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const favorited = isFavorite(friend.id);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    router.push(`/friend/${friend.id}`);
  }, [friend.id, router, scaleAnim]);

  const handleFavorite = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    toggleFavorite(friend.id);
  }, [friend.id, toggleFavorite, heartAnim]);

  if (variant === 'compact') {
    return (
      <Pressable onPress={handlePress} testID={`friend-card-compact-${friend.id}`}>
        <Animated.View style={[styles.compactCard, { transform: [{ scale: scaleAnim }] }]}>
          <Image source={{ uri: friend.avatar }} style={styles.compactAvatar} />
          <View style={styles.compactInfo}>
            <View style={styles.compactNameRow}>
              <Text style={styles.compactName} numberOfLines={1}>{friend.name}</Text>
              {friend.verified && <BadgeCheck size={14} color={Colors.primary} />}
            </View>
            <View style={styles.compactLocationRow}>
              <MapPin size={12} color={Colors.textTertiary} />
              <Text style={styles.compactLocation}>{friend.location}</Text>
            </View>
            <View style={styles.compactBottom}>
              <View style={styles.ratingRow}>
                <Star size={12} color={Colors.star} fill={Colors.star} />
                <Text style={styles.compactRating}>{friend.rating}</Text>
                <Text style={styles.compactReviews}>({friend.reviewCount})</Text>
              </View>
              <Text style={styles.compactPrice}>${friend.pricePerHour}/hr</Text>
            </View>
          </View>
          <Pressable onPress={handleFavorite} style={styles.compactHeart} hitSlop={12}>
            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
              <Heart
                size={18}
                color={favorited ? Colors.primary : Colors.textTertiary}
                fill={favorited ? Colors.primary : 'transparent'}
              />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} testID={`friend-card-${friend.id}`}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: friend.avatar }} style={styles.avatar} />
          {friend.isOnline && <View style={styles.onlineBadge} />}
          <Pressable onPress={handleFavorite} style={styles.heartBtn} hitSlop={12}>
            <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
              <Heart
                size={20}
                color={favorited ? Colors.primary : '#fff'}
                fill={favorited ? Colors.primary : 'rgba(0,0,0,0.3)'}
              />
            </Animated.View>
          </Pressable>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{friend.name}, {friend.age}</Text>
            {friend.verified && <BadgeCheck size={16} color={Colors.primary} />}
          </View>
          <View style={styles.locationRow}>
            <MapPin size={13} color={Colors.textTertiary} />
            <Text style={styles.location}>{friend.location}</Text>
          </View>
          <Text style={styles.bio} numberOfLines={2}>{friend.bio}</Text>
          <View style={styles.footer}>
            <View style={styles.ratingRow}>
              <Star size={14} color={Colors.star} fill={Colors.star} />
              <Text style={styles.rating}>{friend.rating}</Text>
              <Text style={styles.reviews}>({friend.reviewCount})</Text>
            </View>
            <Text style={styles.price}>${friend.pricePerHour}<Text style={styles.priceUnit}>/hr</Text></Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginRight: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  location: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  bio: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviews: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  price: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  compactCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  compactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  compactLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  compactLocation: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  compactBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  compactRating: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  compactReviews: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  compactHeart: {
    padding: 8,
  },
});

