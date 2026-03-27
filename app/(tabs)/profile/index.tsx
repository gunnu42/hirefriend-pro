import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Alert, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Settings, ChevronRight, CreditCard, Shield, CircleHelp as HelpCircle,
  LogOut, Star, Users, Edit3, Bell, Heart, Crown, HandCoins, Gift, BadgeCheck,
  Wallet, ShieldCheck, Video, FileText, AlertTriangle, Info,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase, uploadToStorage } from '@/supabase';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';

interface MenuItem {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value?: string;
  onPress: () => void;
  color?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const { getProfilePhotos } = useProfile();
  const walletData = useWallet();

  const [isUploading, setIsUploading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentRating, setCurrentRating] = useState<number>(user?.rating ?? 0);
  const [currentReviewsCount, setCurrentReviewsCount] = useState<number>(user?.total_reviews ?? 0);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [friendsCount, setFriendsCount] = useState<number>(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const starScaleAnim = useRef(new Animated.Value(1)).current;
  const modalTranslateY = useRef(new Animated.Value(400)).current;
  const starAnim = useRef(new Animated.Value(1)).current;

  const kycStatus = walletData?.kycStatus ?? 'draft';
  const subscription = walletData?.subscription ?? 'free';
  const points = walletData?.points ?? 0;
  const credits = walletData?.credits ?? 0;
  const connectsRemaining = walletData?.connectsRemaining ?? 0;
  const isVerified = kycStatus === 'verified';
  const subLabel = subscription === 'free' ? null : subscription.charAt(0).toUpperCase() + subscription.slice(1);

  const profilePhoto = getProfilePhotos()[0];
  const avatarUri = user?.avatar_url || profilePhoto?.media_url ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face';

  // Fetch real profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;

      try {
        // Fetch bookings count
        const { count: bookingsCnt, error: bookingsError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id);

        if (!bookingsError) {
          setBookingsCount(bookingsCnt || 0);
        }

        // Fetch friends count (connections)
        const { count: friendsCnt, error: friendsError } = await supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted');

        if (!friendsError) {
          setFriendsCount(friendsCnt || 0);
        }

        // Fetch rating and reviews count
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('receiver_id', user.id);

        if (!reviewsError && reviewsData) {
          const totalReviews = reviewsData.length;
          const averageRating = totalReviews > 0
            ? reviewsData.reduce((sum: number, r: { rating?: number } | null) => sum + (r?.rating || 0), 0) / totalReviews
            : 0;

          setCurrentRating(Math.round(averageRating * 10) / 10);
          setCurrentReviewsCount(totalReviews);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  useEffect(() => {
    setCurrentRating(user?.rating ?? 0);
    setCurrentReviewsCount(user?.total_reviews ?? 0);
  }, [user?.rating, user?.total_reviews]);


  const displayName = user?.full_name || user?.email || 'HireFriend User';
  const displayLocation = user?.city || user?.current_city || 'Add your city';

  const handleOpenReviewModal = useCallback(() => {
    Animated.sequence([
      Animated.timing(starScaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(starScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setReviewModalOpen(true);
    Animated.spring(modalTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
  }, [starScaleAnim, modalTranslateY]);

  const handleCloseReviewModal = useCallback(() => {
    Animated.spring(modalTranslateY, {
      toValue: 400,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start(() => setReviewModalOpen(false));
  }, [modalTranslateY]);

  const handleStarPress = useCallback((star: number) => {
    setReviewScore(star);
    Animated.sequence([
      Animated.timing(starAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(starAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [starAnim]);


  const handlePickAvatar = useCallback(async () => {
    if (!user?.id) return;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow image access to upload your avatar.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      // expo-image-picker returns `canceled` in the result and includes URI on success
      if ('canceled' in pickerResult && pickerResult.canceled) return;
      if (!('assets' in pickerResult) || !pickerResult.assets?.[0]?.uri) return;

      setIsUploading(true);

      const imageUri = pickerResult.assets?.[0]?.uri;
      if (!imageUri) throw new Error('Selected image URI not found');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const path = `avatars/${user.id}_${Date.now()}.jpg`;
      const publicUrl = await uploadToStorage('avatars', path, blob);

      await updateProfile({ avatar_url: publicUrl });
      Alert.alert('Success', 'Avatar uploaded successfully.');
    } catch (err) {
      console.error('Avatar upload error:', err);
      Alert.alert('Error', 'Failed to upload avatar.');
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, updateProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/login' as any);
          } catch (err) {
            console.error('Logout error:', err);
          }
        },
      },
    ]);
  }, [router, signOut]);

  const handleSubmitReview = useCallback(async () => {
    if (!user?.id) return;
    if (!reviewComment.trim()) {
      Alert.alert('Validation', 'Please add a short review message.');
      return;
    }

    try {
      setIsSubmittingReview(true);

      const { error: reviewError } = await supabase.from('reviews').insert({
        reviewer_id: user.id,
        receiver_id: user.id,
        rating: reviewScore,
        comment: reviewComment.trim(),
        created_at: new Date().toISOString(),
      } as any);

      if (reviewError) throw reviewError;

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('receiver_id', user.id);

      if (ratingsError) throw ratingsError;

      const ratingsArray = ratingsData || [];
      const totalReviews = ratingsArray.length;
      const averageRating = totalReviews
        ? ratingsArray.reduce((sum: number, r: { rating?: number } | null) => sum + (r?.rating || 0), 0) / totalReviews
        : 0;

      await updateProfile({
        rating: Math.round(averageRating * 10) / 10,
        total_reviews: totalReviews,
      });

      setCurrentRating(Math.round(averageRating * 10) / 10);
      setCurrentReviewsCount(totalReviews);
      setReviewModalOpen(false);
      Alert.alert('Thank you!', 'Review has been saved successfully.');
    } catch (err) {
      console.error('Submit review error:', err);
      Alert.alert('Error', 'Unable to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  }, [reviewComment, reviewScore, user?.id, updateProfile]);

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: Heart, label: 'Favorites', onPress: () => router.push('/favorites-list' as any) },
        { icon: Wallet, label: 'Wallet & Rewards', value: `${credits} pts`, onPress: () => router.push('/wallet' as any) },
        { icon: CreditCard, label: 'Payment Methods', onPress: () => router.push('/payment-methods' as any) },
        { icon: Gift, label: 'Refer & Earn', value: '500 pts/invite', onPress: () => router.push('/refer-earn' as any) },
        { icon: Bell, label: 'Notifications', onPress: () => router.push('/notifications' as any) },
        { icon: FileText, label: 'Billing History', onPress: () => router.push('/billing-history' as any) },
      ],
    },
    {
      title: 'Verification & Safety',
      items: [
        {
          icon: ShieldCheck,
          label: 'KYC Verification',
          value: isVerified ? 'Verified ✓' : 'Not Verified',
          onPress: () => router.push('/kyc-verification' as any),
          color: isVerified ? Colors.success : Colors.gold,
        },
        { icon: Shield, label: 'Safety Agreement', onPress: () => router.push('/safety-agreement' as any) },
        { icon: Video, label: 'Upload Vibe', value: '+400 pts', onPress: () => router.push('/upload-vibe' as any) },
      ],
    },
    {
      title: 'General',
      items: [
        { icon: Shield, label: 'Privacy & Safety', onPress: () => router.push('/privacy' as any) },
        { icon: HelpCircle, label: 'Help & Support', onPress: () => router.push('/help' as any) },
        { icon: Settings, label: 'Settings', onPress: () => router.push('/settings' as any) },
        { icon: Info, label: 'About Us', onPress: () => router.push('/about' as any) },
      ],
    },
    {
      title: '',
      items: [
        { icon: LogOut, label: 'Log Out', onPress: handleLogout, color: '#EF4444' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <Pressable
            onPress={() => router.push('/settings' as any)}
            style={styles.settingsBtn}
            testID="settings-button"
          >
            <Settings size={22} color={Colors.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <Pressable onPress={() => router.push('/edit-profile' as any)} style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.profileAvatar}
            />
            {subLabel && (
              <View style={styles.subBadgeAvatar}>
                <Crown size={10} color="#fff" />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Edit3 size={12} color="#fff" />
            </View>
          </Pressable>
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{displayName}</Text>
            {isVerified && <BadgeCheck size={20} color={Colors.primary} />}
            {subLabel && (
              <View style={styles.subBadge}>
                <Crown size={12} color={Colors.gold} />
                <Text style={styles.subBadgeText}>{subLabel}</Text>
              </View>
            )}
          </View>
          {!isVerified && (
            <Pressable
              style={styles.kycWarningBadge}
              onPress={() => router.push('/kyc-verification' as any)}
              testID="kyc-badge"
            >
              <AlertTriangle size={14} color={Colors.gold} />
              <Text style={styles.kycWarningText}>Not Verified — Tap to complete KYC</Text>
            </Pressable>
          )}
          <Text style={styles.profileLocation}>{displayLocation}</Text>
          {subscription !== 'free' && (
            <View style={styles.connectsBadge}>
              <Text style={styles.connectsText}>You have {connectsRemaining} connects left</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bookingsCount}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{friendsCount}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconRow}>
                <Star size={14} color={Colors.star} fill={Colors.star} />
                <Text style={styles.statValue}>{currentRating.toFixed(1)}</Text>
              </View>
              <Text style={styles.statLabel}>{currentReviewsCount} reviews</Text>
            </View>
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile' as any)}
            testID="edit-profile-button"
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Beautiful Review Section */}
        <Pressable style={styles.reviewSection} onPress={handleOpenReviewModal}>
          <LinearGradient
            colors={['#F59E0B', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.reviewGradient}
          >
            <View style={styles.reviewShine} />
            <View style={styles.reviewContent}>
              <Animated.View style={[styles.reviewStar, { transform: [{ scale: starScaleAnim }] }]}>
                <Star size={28} color="#FFFFFF" fill="#FFFFFF" />
              </Animated.View>
              <View style={styles.reviewTextContainer}>
                <Text style={styles.reviewTitle}>Rate Your Experience</Text>
                <Text style={styles.reviewSubtitle}>Share your thoughts</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {reviewModalOpen && (
          <View style={styles.reviewModalBackdrop}>
            <Pressable style={styles.reviewModalDismiss} onPress={handleCloseReviewModal} />
            <Animated.View style={[styles.reviewModal, { transform: [{ translateY: modalTranslateY }] }]}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Write a Review</Text>
                <Pressable onPress={handleCloseReviewModal} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.modalLabel}>Rating</Text>
              <View style={styles.starRow}>
                {[1,2,3,4,5].map((star, index) => (
                  <Pressable
                    key={star}
                    onPress={() => handleStarPress(star)}
                    style={styles.starBtn}
                  >
                    <Animated.Text style={[styles.star, reviewScore >= star ? { color: '#F59E0B' } : { color: Colors.textTertiary }, { transform: [{ scale: star === reviewScore ? starAnim : 1 }] }]}>
                      {'★'}
                    </Animated.Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.modalLabel}>Comment</Text>
              <TextInput
                style={styles.reviewInput}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder="Tell others about your experience..."
                multiline
                maxLength={500}
              />
              <Text style={styles.charCount}>{reviewComment.length}/500</Text>
              <View style={styles.modalActions}>
                <Pressable onPress={handleCloseReviewModal} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <LinearGradient
                  colors={['#F59E0B', '#EF4444']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  <Pressable style={styles.submitBtnContent} onPress={handleSubmitReview} disabled={isSubmittingReview}>
                    <Text style={styles.submitBtnText}>
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </Text>
                  </Pressable>
                </LinearGradient>
              </View>
            </Animated.View>
          </View>
        )}

        <Pressable style={styles.proBanner} onPress={() => router.push('/subscription' as any)} testID="go-pro-banner">
          <View style={styles.proBannerLeft}>
            <View style={styles.proBannerIcon}>
              <Crown size={22} color={Colors.gold} />
            </View>
            <View style={styles.proBannerContent}>
              <Text style={styles.proBannerTitle}>
                {subscription === 'free' ? 'Go PRO' : `${subLabel} Member`}
              </Text>
              <Text style={styles.proBannerSub}>
                {subscription === 'free'
                  ? 'Silver ₹1,800 · Gold ₹3,500 · Platinum ₹5,000'
                  : 'View benefits & manage subscription'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.goldText} />
        </Pressable>

        <Pressable style={styles.friendBanner} onPress={() => router.push('/onboarding' as any)} testID="become-friend-banner">
          <View style={styles.friendBannerLeft}>
            <View style={styles.friendBannerIcon}>
              <HandCoins size={22} color={Colors.mint} />
            </View>
            <View style={styles.friendBannerContent}>
              <Text style={styles.friendBannerTitle}>Complete Premium Onboarding</Text>
              <Text style={styles.friendBannerSub}>Fast, smooth, AI-style setup</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.mintText} />
        </Pressable>

        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.menuSection}>
            {section.title ? <Text style={styles.menuSectionTitle}>{section.title}</Text> : null}
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <MenuRow key={idx} item={item} isLast={idx === section.items.length - 1} />
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.versionText}>HireFriend v2.0.0</Text>
      </ScrollView>
    </View>
  );
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComp = item.icon;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    item.onPress();
  }, [item, scaleAnim]);

  return (
    <Pressable onPress={handlePress} testID={`menu-${item.label.replace(/\s/g, '-')}`}>
      <Animated.View
        style={[
          styles.menuRow,
          !isLast && styles.menuRowBorder,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <IconComp size={20} color={item.color ?? Colors.textSecondary} />
        <Text style={[styles.menuLabel, item.color ? { color: item.color } : undefined]}>
          {item.label}
        </Text>
        <View style={styles.menuRight}>
          {item.value && <Text style={[styles.menuValue, item.color ? { color: item.color } : undefined]}>{item.value}</Text>}
          <ChevronRight size={16} color={Colors.textTertiary} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8,
  },
  title: { fontSize: 28, fontWeight: '800' as const, color: Colors.text },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 40 },
  profileCard: {
    alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: 16,
    borderRadius: 20, padding: 24,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  profileAvatar: { width: 88, height: 88, borderRadius: 44 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  subBadgeAvatar: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  profileName: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  subBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.goldLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  subBadgeText: { fontSize: 11, fontWeight: '700' as const, color: Colors.goldText },
  kycWarningBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: Colors.goldLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  kycWarningText: { fontSize: 12, fontWeight: '600' as const, color: Colors.goldText },
  profileLocation: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  connectsBadge: {
    marginTop: 10, backgroundColor: Colors.tagBg, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  connectsText: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 20 },
  statItem: { alignItems: 'center' },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  editBtn: {
    marginTop: 18, backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 32, paddingVertical: 10,
  },
  editBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#fff' },
  reviewSection: {
    marginHorizontal: 16, marginTop: 20, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  reviewGradient: {
    padding: 20,
  },
  reviewShine: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-10deg' }, { translateX: -50 }],
  },
  reviewContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  reviewStar: {},
  reviewTextContainer: { flex: 1 },
  reviewTitle: { fontSize: 18, fontWeight: '700' as const, color: '#FFFFFF' },
  reviewSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  proBanner: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: Colors.goldLight,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.goldBorder,
  },
  proBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  proBannerIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF0C2',
    alignItems: 'center', justifyContent: 'center',
  },
  proBannerContent: { flex: 1 },
  proBannerTitle: { fontSize: 17, fontWeight: '800' as const, color: Colors.goldText },
  proBannerSub: { fontSize: 12, color: Colors.goldText, marginTop: 2, opacity: 0.85, flexWrap: 'wrap' },
  friendBanner: {
    marginHorizontal: 16, marginTop: 10, backgroundColor: Colors.mintLight,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.mintBorder,
  },
  friendBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  friendBannerIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },
  friendBannerContent: { flex: 1 },
  friendBannerTitle: { fontSize: 17, fontWeight: '800' as const, color: Colors.mintText },
  friendBannerSub: { fontSize: 12, color: Colors.mintText, marginTop: 2, opacity: 0.85 },
  menuSection: { marginTop: 24, paddingHorizontal: 16 },
  menuSectionTitle: {
    fontSize: 14, fontWeight: '600' as const, color: Colors.textTertiary,
    marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  menuCard: { backgroundColor: Colors.card, borderRadius: 14, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 16, gap: 12,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' as const },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: 13, color: Colors.textTertiary },
  reviewModalBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
  },
  reviewModalDismiss: { flex: 1 },
  reviewModal: {
    backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: Colors.textTertiary },
  modalLabel: { fontSize: 16, color: Colors.textSecondary, marginTop: 16, marginBottom: 8 },
  starRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 32 },
  reviewInput: {
    minHeight: 100, borderColor: Colors.border, borderWidth: 1,
    borderRadius: 12, padding: 12, color: Colors.text, textAlignVertical: 'top',
    backgroundColor: Colors.surfaceAlt, fontSize: 16,
  },
  charCount: { fontSize: 12, color: Colors.textTertiary, textAlign: 'right', marginTop: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  cancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  submitBtn: { flex: 2, borderRadius: 12 },
  submitBtnContent: { paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  versionText: { textAlign: 'center', fontSize: 12, color: Colors.textTertiary, marginTop: 30 },
});

