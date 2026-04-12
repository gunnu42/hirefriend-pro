import React, { useEffect, useState, useRef } from 'react';
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
import { Heart } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

function PremiumSplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.85)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 8,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start()
  }, [])

  return (
    <View style={splashStyles.container}>
      <LinearGradient
        colors={['#EF4444', '#FF6B6B', '#FF8E8E']}
        style={splashStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[
          splashStyles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <View style={splashStyles.logoCircle}>
            <Heart size={52} color="#fff" fill="#fff" />
          </View>
          <Text style={splashStyles.logoText}>HireFriend</Text>
          <Text style={splashStyles.tagline}>
            Your companion for every moment
          </Text>
        </Animated.View>

        <Animated.View style={[
          splashStyles.bottomSection,
          { opacity: fadeAnim }
        ]}>
          <View style={splashStyles.progressTrack}>
            <Animated.View style={[
              splashStyles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} />
          </View>
          <Text style={splashStyles.loadingText}>
            Connecting you with friends...
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  )
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
    }, 5000);

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
      // Add small delay for smooth transition
      setTimeout(() => {
        setNavigationReady(true);
      }, 800);
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

  // Perform navigation with proper state checking
  useEffect(() => {
    if (!navigationReady || loading) return

    const inTabsGroup = segments[0] === '(tabs)'
    const inOnboarding = segments[0] === 'onboarding'
    const inAuthFlow = 
      segments[0] === 'login' ||
      segments[0] === 'onboarding'

    console.log('[Nav] Checking:', { 
      user: !!user, 
      profile_completed: user?.profile_completed,
      segment: segments[0] 
    })

    if (user) {
      // Check if profile is completed (ensure boolean type)
      const profileCompleted = Boolean(user.profile_completed)
      
      if (profileCompleted === true) {
        // Profile done → go to home
        if (!inTabsGroup) {
          const safeRoutes = [
            'edit-profile', 'wallet', 'notifications', 'settings',
            'kyc-verification', 'subscription', 'refer-earn',
            'billing-history', 'favorites-list', 'privacy', 'help',
            'about', 'payment-methods', 'friend', 'chat',
            'forgot-password', 'become-friend',
          ]
          if (!safeRoutes.includes(segments[0] ?? '')) {
            console.log('[Nav] Profile complete, redirecting to home')
            router.replace('/(tabs)' as any)
          }
        }
      } else {
        // Profile not done → go to onboarding
        if (!inOnboarding) {
          console.log('[Nav] Profile incomplete, redirecting to onboarding')
          router.replace('/onboarding' as any)
        }
      }
    } else {
      // Not logged in → go to login
      if (!inAuthFlow && !inTabsGroup) {
        console.log('[Nav] No user, redirecting to login')
        router.replace('/login' as any)
      }
    }

    initialNavigationDone.current = true
  }, [user, navigationReady, segments, router])

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

const splashStyles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#fff',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  bottomSection: {
    paddingBottom: 60,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
})

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
  },
})