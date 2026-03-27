import React, { useMemo, useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Modal,
  Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Heart, Star, MapPin, Clock, BadgeCheck,
  MessageCircle, Globe, Users, Calendar, Share2, X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { friends } from '@/mocks/friends';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSubscription } from '@/contexts/SubscriptionContextUnified';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabase';

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentPlan } = useSubscription();
  const { user } = useAuth();
  const heartAnim = useRef(new Animated.Value(1)).current;
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const isPremium = currentPlan !== 'free';

  const friend = useMemo(() => friends.find((f) => f.id === id), [id]);

  const favorited = friend ? isFavorite(friend.id) : false;

  const handleFavorite = useCallback(() => {
    if (!friend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    toggleFavorite(friend.id);
  }, [friend, toggleFavorite, heartAnim]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Share pressed');
  }, []);

  const handleRatePress = useCallback(() => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to rate this friend.');
      router.push('/login' as any);
      return;
    }
    setRatingModalVisible(true);
  }, [user, router]);

  const handleSubmitRating = useCallback(async () => {
    if (!user?.id || !friend || selectedRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setSubmittingRating(true);
      console.log('[Friend] Submitting rating:', { reviewer_id: user.id, reviewed_user_id: friend.id, rating: selectedRating });

      const { error } = await supabase
        .from('reviews')
        .upsert({
          reviewer_id: user.id,
          reviewed_user_id: friend.id,
          rating: selectedRating,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'reviewer_id, reviewed_user_id'
        });

      if (error) {
        console.error('[Friend] Rating error:', error);
        throw error;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `You rated ${friend.name} ${selectedRating} star${selectedRating > 1 ? 's' : ''}.`);
      setRatingModalVisible(false);
      setSelectedRating(0);
    } catch (err) {
      console.error('[Friend] Rating submission failed:', err);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  }, [user, friend, selectedRating]);

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
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.coverContainer}>
          <Image source={{ uri: friend.coverImage }} style={styles.coverImage} />
          <SafeAreaView edges={['top']} style={styles.coverOverlay}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <View style={styles.coverActions}>
              <Pressable onPress={handleShare} style={styles.actionBtn} testID="share-button">
                <Share2 size={20} color="#fff" />
              </Pressable>
              <Pressable onPress={handleFavorite} style={styles.actionBtn} testID="favorite-button">
                <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
                  <Heart
                    size={20}
                    color={favorited ? Colors.primary : '#fff'}
                    fill={favorited ? Colors.primary : 'transparent'}
                  />
                </Animated.View>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.profileSection}>
          <Image source={{ uri: friend.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{friend.name}, {friend.age}</Text>
              {friend.verified && <BadgeCheck size={20} color={Colors.primary} />}
            </View>
            <View style={styles.locationRow}>
              <MapPin size={14} color={Colors.textTertiary} />
              <Text style={styles.location}>{friend.location}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: friend.isOnline ? Colors.online : Colors.offline }]} />
              <Text style={styles.statusText}>
                {friend.isOnline ? 'Available Now' : 'Currently Offline'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Star size={16} color={Colors.star} fill={Colors.star} />
            <Text style={styles.statValue}>{friend.rating}</Text>
            <Text style={styles.statLabel}>{friend.reviewCount} reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Users size={16} color={Colors.primary} />
            <Text style={styles.statValue}>{friend.completedHires}</Text>
            <Text style={styles.statLabel}>hires</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Clock size={16} color={Colors.accent} />
            <Text style={styles.statValue}>{friend.responseTime}</Text>
            <Text style={styles.statLabel}>response</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Calendar size={16} color={Colors.textSecondary} />
            <Text style={styles.statValue}>{friend.memberSince}</Text>
            <Text style={styles.statLabel}>joined</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{friend.about}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <View style={styles.tagRow}>
            {friend.activities.map((activity) => (
              <View key={activity} style={styles.tag}>
                <Text style={styles.tagText}>{activity}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.tagRow}>
            {friend.languages.map((lang) => (
              <View key={lang} style={styles.langTag}>
                <Globe size={13} color={Colors.textSecondary} />
                <Text style={styles.langText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.reviewsRating}>
              <Star size={14} color={Colors.star} fill={Colors.star} />
              <Text style={styles.reviewsRatingText}>{friend.rating} ({friend.reviewCount})</Text>
            </View>
          </View>
          {friend.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>{review.userName}</Text>
                  <View style={styles.reviewMeta}>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          color={Colors.star}
                          fill={i < review.rating ? Colors.star : 'transparent'}
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
                <View style={styles.reviewActivity}>
                  <Text style={styles.reviewActivityText}>{review.activity}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}

          {/* Rate this friend button */}
          <Pressable
            onPress={handleRatePress}
            style={styles.rateButton}
            testID="rate-friend-button"
          >
            <Star size={18} color={Colors.primary} />
            <Text style={styles.rateButtonText}>Rate this friend</Text>
          </Pressable>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate {friend.name}</Text>
              <Pressable onPress={() => setRatingModalVisible(false)} disabled={submittingRating}>
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <Pressable
                  key={rating}
                  onPress={() => setSelectedRating(rating)}
                  disabled={submittingRating}
                >
                  <Star
                    size={48}
                    color={rating <= selectedRating ? Colors.primary : Colors.borderLight}
                    fill={rating <= selectedRating ? Colors.primary : 'transparent'}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.ratingText}>
              {selectedRating > 0 ? `You're rating: ${selectedRating} star${selectedRating > 1 ? 's' : ''}` : 'Select a rating'}
            </Text>

            <Pressable
              onPress={handleSubmitRating}
              disabled={selectedRating === 0 || submittingRating}
              style={[styles.submitRatingBtn, (selectedRating === 0 || submittingRating) && styles.submitRatingBtnDisabled]}
            >
              {submittingRating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitRatingBtnText}>Submit Rating</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <View style={styles.priceSection}>
            <Text style={styles.priceAmount}>₹{friend.pricePerHour}</Text>
            <Text style={styles.priceUnit}>/ hour</Text>
          </View>
          <View style={styles.bottomActions}>
            <Pressable
              onPress={() => isPremium ? router.push(`/chat/${friend.id}` as any) : router.push('/subscription' as any)}
              style={styles.messageBtn}
              testID="message-friend-button"
            >
              <MessageCircle size={20} color={Colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => router.push(`/booking/${friend.id}` as any)}
              style={styles.hireBtn}
              testID="hire-button"
            >
              <Text style={styles.hireBtnText}>Hire Now</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  coverContainer: {
    height: 220,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -36,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
    paddingBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.tagBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.tagText,
  },
  langTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  langText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsRatingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  reviewActivity: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reviewActivityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  priceUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messageBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginTop: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  rateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  submitRatingBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitRatingBtnDisabled: {
    opacity: 0.5,
  },
  submitRatingBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
