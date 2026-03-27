import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter, useSegments, Slot } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ConnectionProvider } from '@/contexts/ConnectionContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContextUnified';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { DailyRewardsProvider } from '@/contexts/DailyRewardsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

function PremiumSplashScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [particleAnim1] = useState(new Animated.Value(0));
  const [particleAnim2] = useState(new Animated.Value(0));
  const [particleAnim3] = useState(new Animated.Value(0));

  useEffect(() => {
    // Logo scale-in animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 10,
      friction: 3,
      useNativeDriver: true,
    }).start();

    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Floating particles animation
    const animateParticles = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(particleAnim1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim1, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(particleAnim2, {
            toValue: 1,
            duration: 2500,
            delay: 500,
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim2, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(particleAnim3, {
            toValue: 1,
            duration: 3000,
            delay: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim3, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateParticles();
  }, []);

  const particleStyle1 = {
    transform: [
      {
        translateY: particleAnim1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20],
        }),
      },
      {
        translateX: particleAnim1.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 10],
        }),
      },
    ],
    opacity: particleAnim1.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0],
    }),
  };

  const particleStyle2 = {
    transform: [
      {
        translateY: particleAnim2.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -15],
        }),
      },
      {
        translateX: particleAnim2.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -15],
        }),
      },
    ],
    opacity: particleAnim2.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0],
    }),
  };

  const particleStyle3 = {
    transform: [
      {
        translateY: particleAnim3.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -25],
        }),
      },
      {
        translateX: particleAnim3.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
      },
    ],
    opacity: particleAnim3.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0],
    }),
  };

  return (
    <View style={styles.splashContainer}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark, Colors.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating particles */}
        <Animated.View style={[styles.particle, styles.particle1, particleStyle1]}>
          <Sparkles size={12} color="#ffffff" />
        </Animated.View>
        <Animated.View style={[styles.particle, styles.particle2, particleStyle2]}>
          <Heart size={10} color="#ffffff" />
        </Animated.View>
        <Animated.View style={[styles.particle, styles.particle3, particleStyle3]}>
          <Sparkles size={8} color="#ffffff" />
        </Animated.View>

        {/* Logo container with glow */}
        <View style={styles.logoContainer}>
          <View style={styles.glowContainer}>
            <Animated.View style={[styles.logoWrapper, { transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.logoIcon}>
                <Heart size={48} color="#ffffff" fill="#ffffff" />
              </View>
              <Animated.Text style={[styles.logoText, { opacity: fadeAnim }]}>
                HireFriend
              </Animated.Text>
            </Animated.View>
          </View>
        </View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineContainer, { opacity: fadeAnim }]}>
          <Text style={styles.tagline}>Your companion for every moment</Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
          <Text style={styles.loadingText}>Connecting you with friends...</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

function RootLayoutContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [navigationReady, setNavigationReady] = useState(false);
  const navigationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialNavigationDone = React.useRef(false);

  console.log('[RootLayout] Auth state:', { user: user?.id, loading, segments: segments[0], navigationReady, initialNavigationDone: initialNavigationDone.current });

  // Initialize navigation timeout on mount
  useEffect(() => {
    // Force navigation after 3 seconds even if loading is true
    navigationTimeoutRef.current = setTimeout(() => {
      console.warn('[RootLayout] ⏱️ Navigation timeout - forcing redirect');
      setNavigationReady(true);
    }, 3000);

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Clear timeout and set navigation ready when loading completes
  useEffect(() => {
    if (!loading) {
      console.log('[RootLayout] ✅ Loading complete');
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      setNavigationReady(true);
    }
  }, [loading]);

  // 5-second loading timeout - force navigation to login if still loading
  useEffect(() => {
    const loadingTimeoutId = setTimeout(() => {
      if (loading) {
        console.warn('[RootLayout] ⚠️ 5-second loading timeout reached - forcing login');
        setNavigationReady(true);
      }
    }, 5000);

    return () => {
      clearTimeout(loadingTimeoutId);
    };
  }, [loading]);

  // Perform navigation ONLY ONCE when auth state is first determined
  useEffect(() => {
    if (!navigationReady) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inAuthFlow = segments[0] === 'login' ||
      segments[0] === 'signup' ||
      segments[0] === 'onboarding';

    if (user) {
      if (!user.profile_completed && !inOnboarding) {
        router.replace('/onboarding' as any);
      } else if (user.profile_completed && !inTabsGroup) {
        router.replace('/(tabs)' as any);
      }
    } else {
      if (!inAuthFlow) {
        router.replace('/login' as any);
      }
    }

    initialNavigationDone.current = true;
  }, [user, navigationReady, segments, router]);

  // Show splash screen until navigation is ready
  if (!navigationReady) {
    console.log('[RootLayout] Showing splash screen');
    return <PremiumSplashScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WalletProvider>
          <SubscriptionProvider>
            <NotificationProvider>
              <ConnectionProvider>
                <MessagingProvider>
                  <FavoritesProvider>
                    <DailyRewardsProvider>
                      <ProfileProvider>
                        <RootLayoutContent />
                      </ProfileProvider>
                    </DailyRewardsProvider>
                  </FavoritesProvider>
                </MessagingProvider>
              </ConnectionProvider>
            </NotificationProvider>
          </SubscriptionProvider>
        </WalletProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  particle: {
    position: 'absolute',
  },
  particle1: {
    top: height * 0.3,
    left: width * 0.2,
  },
  particle2: {
    top: height * 0.4,
    right: width * 0.25,
  },
  particle3: {
    top: height * 0.5,
    left: width * 0.7,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  glowContainer: {
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  taglineContainer: {
    marginBottom: 60,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingBar: {
    width: 200,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '70%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

