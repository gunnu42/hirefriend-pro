import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Dimensions,
  FlatList, ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Shield, Zap, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  bg: string;
  iconBg: string;
  iconColor: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Hire a Friend\nFor Any Occasion',
    subtitle: 'Find verified companions for dining, travel, sports, events and more. Real people, real experiences.',
    icon: Users,
    bg: '#FFF5F3',
    iconBg: '#FFE0DB',
    iconColor: Colors.primary,
  },
  {
    id: '2',
    title: 'Safe & Verified\nConnections',
    subtitle: 'Every friend is KYC-verified with live selfie match. Meet in public places with SOS support always available.',
    icon: Shield,
    bg: '#E6FFFA',
    iconBg: '#B2F5EA',
    iconColor: Colors.teal,
  },
  {
    id: '3',
    title: 'Earn Rewards\nEvery Day',
    subtitle: 'Daily check-ins, referrals, vlogs — earn points and unlock free connections. Start your journey now!',
    icon: Zap,
    bg: '#FFF8E7',
    iconBg: '#FEEBC8',
    iconColor: Colors.gold,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.replace('/login');
    }
  }, [activeIndex, router]);

  const handleSkip = useCallback(() => {
    router.replace('/login');
  }, [router]);

  const renderSlide = useCallback(({ item }: { item: Slide }) => {
    const IconComp = item.icon;
    return (
      <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
        <View style={styles.slideContent}>
          <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
            <IconComp size={56} color={item.iconColor} />
          </View>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>HireFriend</Text>
          {activeIndex < slides.length - 1 && (
            <Pressable onPress={handleSkip} testID="skip-btn">
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.nextBtn} onPress={handleNext} testID="next-btn">
          <Text style={styles.nextBtnText}>
            {activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  safeTop: { backgroundColor: 'transparent', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  logo: { fontSize: 22, fontWeight: '800' as const, color: Colors.primary },
  skipText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  slide: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  slideContent: { alignItems: 'center', marginTop: -40 },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center', marginBottom: 40,
  },
  slideTitle: {
    fontSize: 32, fontWeight: '800' as const, color: Colors.text,
    textAlign: 'center', lineHeight: 40,
  },
  slideSubtitle: {
    fontSize: 16, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 16, lineHeight: 24, paddingHorizontal: 10,
  },
  bottomSection: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20 },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border,
  },
  dotActive: { width: 28, backgroundColor: Colors.primary },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 16, height: 56,
    marginBottom: 8,
  },
  nextBtnText: { fontSize: 17, fontWeight: '700' as const, color: '#fff' },
});

