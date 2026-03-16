import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
  RefreshControl, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, MapPin, ChevronRight, Shield, Zap, Crown, Flame, Lock, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { friends, categories } from '@/mocks/friends';
import FriendCard from '@/components/FriendCard';
import CategoryCard from '@/components/CategoryCard';
import SearchBar from '@/components/SearchBar';
import InteractiveDailyRewards from '@/components/InteractiveDailyRewards';
import { useWallet } from '@/contexts/WalletContext';
import { useDailyRewards } from '@/contexts/DailyRewardsContext';

const stories = friends.filter(f => f.isFeatured).slice(0, 6).map(f => ({
  id: f.id,
  name: f.name.split(' ')[0],
  avatar: f.avatar,
  isOnline: f.isOnline,
}));

const vlogs = [
  { id: 'v1', title: 'Street Food Walk in Mumbai', user: 'Priya S.', avatar: friends[0].avatar, thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop', views: '2.3K', duration: '0:28' },
  { id: 'v2', title: 'Hiking Sahyadris with Vikas', user: 'Vikas J.', avatar: friends[7].avatar, thumbnail: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=300&h=200&fit=crop', views: '1.8K', duration: '0:22' },
  { id: 'v3', title: 'Goa Beach Sunset', user: 'Tanvi D.', avatar: friends[12].avatar, thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop', views: '3.1K', duration: '0:15' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { credits, claimDailyReward: addPointsToWallet, subscription } = useWallet();
  const {
    rewards,
    currentDay,
    canClaimToday,
    streakCount,
    isClaimableDay,
    claimReward,
    loaded,
  } = useDailyRewards();

  const featuredFriends = friends.filter((f) => f.isFeatured);
  const nearbyFriends = friends.filter((f) => f.isOnline);
  const isPremium = subscription !== 'free';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const handleCategoryPress = useCallback(
    (category: { id: string; name: string }) => {
      router.push({
        pathname: `/category/${encodeURIComponent(category.name)}`,
      });
    },
    [router]
  );

  const handleSearchFocus = useCallback(() => {
    router.push('/explore');
  }, [router]);

  const handleClaimDaily = useCallback(async (day: number) => {
    if (!canClaimToday) {
      router.push('/refer-earn');
      return;
    }

    const result = await claimReward(day);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addPointsToWallet(result.points);
      Alert.alert('Claimed!', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  }, [canClaimToday, claimReward, addPointsToWallet, router]);

  const handleStoryPress = useCallback((storyId: string) => {
    if (!isPremium) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/subscription');
    } else {
      router.push(`/friend/${storyId}`);
    }
  }, [isPremium, router]);

  const handleVlogPress = useCallback(() => {
    router.push('/upload-vibe');
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarShadow}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face' }}
                style={styles.headerAvatar}
              />
            </View>
            <View>
              <Text style={styles.greeting}>Good morning</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={Colors.primary} />
                <Text style={styles.locationText}>New York, NY</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.creditBadge}
              onPress={() => router.push('/wallet')}
              testID="credits-badge"
            >
              <Zap size={14} color={Colors.gold} />
              <Text style={styles.creditText}>{credits}</Text>
            </Pressable>
            <Pressable
              style={styles.bellBtn}
              testID="notifications-button"
              onPress={() => router.push('/notifications')}
            >
              <Bell size={22} color={Colors.text} />
              <View style={styles.bellDot} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Pressable onPress={handleSearchFocus}>
          <View pointerEvents="none">
            <SearchBar value={search} onChangeText={setSearch} placeholder="Find a friend for any activity..." />
          </View>
        </Pressable>

        <View style={styles.storiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stories</Text>
            {!isPremium && (
              <View style={styles.lockBadge}>
                <Lock size={10} color={Colors.gold} />
                <Text style={styles.lockBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
            {stories.map((story) => (
              <Pressable
                key={story.id}
                style={styles.storyItem}
                onPress={() => handleStoryPress(story.id)}
                testID={`story-${story.id}`}
              >
                <View style={[styles.storyRing, story.isOnline && styles.storyRingActive]}>
                  <Image source={{ uri: story.avatar }} style={[styles.storyAvatar, !isPremium && styles.storyAvatarBlurred]} blurRadius={!isPremium ? 8 : 0} />
                  {!isPremium && (
                    <View style={styles.storyLockOverlay}>
                      <Lock size={14} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.storyName} numberOfLines={1}>{story.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loaded && (
          <InteractiveDailyRewards
            rewards={rewards}
            currentDay={currentDay}
            canClaimToday={canClaimToday}
            streakCount={streakCount}
            isClaimableDay={isClaimableDay}
            onClaimReward={handleClaimDaily}
            testID="daily-rewards"
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable
              onPress={() => router.push('/explore')}
              style={styles.seeAllBtn}
              testID="see-all-categories"
            >
              <Text style={styles.seeAll}>See all</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </Pressable>
          </View>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryCard category={item} onPress={handleCategoryPress} />
            )}
          />
        </View>

        <Pressable style={styles.proBanner} onPress={() => router.push('/subscription')} testID="pro-banner">
          <View style={styles.proBannerLeft}>
            <View style={styles.proBannerIcon}>
              <Crown size={20} color={Colors.gold} />
            </View>
            <View style={styles.proBannerText}>
              <Text style={styles.proBannerTitle}>Upgrade to PRO</Text>
              <Text style={styles.proBannerSub}>Unlock 20 Connections for ₹1,800!</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.goldText} />
        </Pressable>

        <Pressable style={styles.safetyBanner} onPress={() => router.push('/safety-agreement')} testID="safety-banner">
          <View style={styles.safetyBannerLeft}>
            <View style={styles.safetyBannerIcon}>
              <Shield size={20} color={Colors.teal} />
            </View>
            <View style={styles.safetyBannerText}>
              <Text style={styles.safetyBannerTitle}>Your Safety Matters</Text>
              <Text style={styles.safetyBannerSub}>Verified Friends & SOS Support</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.teal} />
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vlogs</Text>
            <Pressable onPress={handleVlogPress} style={styles.seeAllBtn} testID="upload-vlog">
              <Text style={styles.seeAll}>Upload +400pts</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vlogRow}>
            {vlogs.map((vlog) => (
              <Pressable key={vlog.id} style={styles.vlogCard} onPress={handleVlogPress} testID={`vlog-${vlog.id}`}>
                <View style={styles.vlogImageContainer}>
                  <Image source={{ uri: vlog.thumbnail }} style={styles.vlogImage} />
                  <View style={styles.vlogPlayBtn}>
                    <Play size={16} color="#fff" fill="#fff" />
                  </View>
                  <View style={styles.vlogDuration}>
                    <Text style={styles.vlogDurationText}>{vlog.duration}</Text>
                  </View>
                </View>
                <View style={styles.vlogInfo}>
                  <Image source={{ uri: vlog.avatar }} style={styles.vlogAvatar} />
                  <View style={styles.vlogMeta}>
                    <Text style={styles.vlogTitle} numberOfLines={1}>{vlog.title}</Text>
                    <Text style={styles.vlogUser}>{vlog.user} · {vlog.views} views</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Friends</Text>
            <Pressable
              onPress={() => router.push('/explore')}
              style={styles.seeAllBtn}
              testID="see-all-featured"
            >
              <Text style={styles.seeAll}>See all</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </Pressable>
          </View>
          <FlatList
            data={featuredFriends}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FriendCard friend={item} />}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Now</Text>
            <Pressable
              onPress={() => router.push('/explore')}
              style={styles.seeAllBtn}
              testID="see-all-nearby"
            >
              <Text style={styles.seeAll}>See all</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </Pressable>
          </View>
          <FlatList
            data={nearbyFriends}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FriendCard friend={item} />}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, borderRadius: 22,
  },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  greeting: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: { fontSize: 13, color: Colors.textSecondary },
  creditBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.goldLight, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  creditText: { fontSize: 13, fontWeight: '700' as const, color: Colors.goldText },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  bellDot: {
    position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.surfaceAlt,
  },
  scrollContent: { paddingTop: 4 },
  storiesSection: { marginTop: 12, paddingHorizontal: 16 },
  storiesRow: { gap: 14, paddingTop: 8 },
  storyItem: { alignItems: 'center', width: 68 },
  storyRing: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 2.5,
    borderColor: Colors.border, padding: 2, position: 'relative',
  },
  storyRingActive: { borderColor: Colors.primary },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 28 },
  storyAvatarBlurred: { opacity: 0.6 },
  storyLockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  storyName: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' as const },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.goldLight, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  lockBadgeText: { fontSize: 10, fontWeight: '700' as const, color: Colors.goldText },
  dailyRewardCard: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: Colors.card,
    borderRadius: 16, padding: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  dailyRewardHeader: { marginBottom: 12 },
  dailyRewardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dailyRewardTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, flex: 1 },
  streakBadge: { backgroundColor: Colors.tagBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  streakText: { fontSize: 11, fontWeight: '700' as const, color: Colors.primary },
  dailyRewardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  dailyRewardRow: { gap: 8, paddingBottom: 12 },
  dailyDot: {
    width: 42, height: 52, borderRadius: 10, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  dailyDotClaimed: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dailyDotNext: { borderColor: Colors.primary, borderStyle: 'dashed' as const },
  dailyDotDay: { fontSize: 10, fontWeight: '600' as const, color: Colors.textTertiary },
  dailyDotDayClaimed: { color: 'rgba(255,255,255,0.8)' },
  dailyDotPts: { fontSize: 13, fontWeight: '700' as const, color: Colors.text, marginTop: 1 },
  dailyDotPtsClaimed: { color: '#fff' },
  progressBarBg: {
    height: 6, backgroundColor: Colors.surfaceAlt, borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '600' as const },
  categoryList: { paddingHorizontal: 16 },
  friendList: { paddingHorizontal: 16 },
  proBanner: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: Colors.goldLight,
    borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.goldBorder,
  },
  proBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  proBannerIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF0C2',
    alignItems: 'center', justifyContent: 'center',
  },
  proBannerText: { flex: 1 },
  proBannerTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.goldText },
  proBannerSub: { fontSize: 12, color: Colors.goldText, marginTop: 2, opacity: 0.8 },
  safetyBanner: {
    marginHorizontal: 16, marginTop: 10, backgroundColor: Colors.tealLight,
    borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.tealBorder,
  },
  safetyBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  safetyBannerIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#CCFBF1',
    alignItems: 'center', justifyContent: 'center',
  },
  safetyBannerText: { flex: 1 },
  safetyBannerTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.teal },
  safetyBannerSub: { fontSize: 12, color: Colors.teal, marginTop: 2, opacity: 0.8 },
  vlogRow: { paddingHorizontal: 16, gap: 14 },
  vlogCard: {
    width: 220, backgroundColor: Colors.card, borderRadius: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  vlogImageContainer: { position: 'relative' },
  vlogImage: { width: '100%', height: 130, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  vlogPlayBtn: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -18, marginLeft: -18,
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  vlogDuration: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  vlogDurationText: { fontSize: 11, color: '#fff', fontWeight: '600' as const },
  vlogInfo: { flexDirection: 'row', padding: 10, gap: 8, alignItems: 'center' },
  vlogAvatar: { width: 28, height: 28, borderRadius: 14 },
  vlogMeta: { flex: 1 },
  vlogTitle: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  vlogUser: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
});
