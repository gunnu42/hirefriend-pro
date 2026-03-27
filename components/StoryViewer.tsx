import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Dimensions, Animated,
  PanResponder, GestureResponderEvent,
} from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

const { width, height } = Dimensions.get('window');

interface StoryItem {
  id: string;
  content_url: string;
  duration?: number;
  created_at?: string;
}

interface StoryUser {
  id: string;
  full_name: string;
  avatar_url: string;
  is_friend?: boolean;
}

interface StoryViewerProps {
  userId: string;
  storyIds?: string[];
  onClose: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
}

export default function StoryViewer({
  userId,
  storyIds = [],
  onClose,
  onNavigateNext,
  onNavigatePrev,
}: StoryViewerProps) {
  const { user: currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [storyUser, setStoryUser] = useState<StoryUser | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Optional: show visual feedback on swipe
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 80) {
          // Swipe down to close
          onClose();
        }
      },
    })
  ).current;

  // Load user and stories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', userId)
          .single();

        if (!userError && userData) {
          setStoryUser(userData as StoryUser);
        }

        // Load stories
        if (storyIds.length > 0) {
          const { data: storiesData, error: storiesError } = await supabase
            .from('videos')
            .select('id, url, created_at, duration')
            .in('id', storyIds)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!storiesError && storiesData && Array.isArray(storiesData)) {
            setStories(storiesData.map((s: any) => ({
              id: s.id || '',
              content_url: s.url || '',
              duration: (s.duration as number) || 5000,
              created_at: s.created_at || '',
            })));
          }
        }
      } catch (err) {
        console.error('[StoryViewer] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, storyIds]);

  // Record story view
  useEffect(() => {
    if (!currentUser?.id || !stories.length) return;

    const recordView = async () => {
      try {
        await supabase.from('story_views').upsert([{
          viewer_id: currentUser.id,
          story_id: stories[currentIndex].id,
          viewed_at: new Date().toISOString(),
        }] as any, { onConflict: 'viewer_id,story_id' });
      } catch (err) {
        console.error('[StoryViewer] Error recording view:', err);
      }
    };

    recordView();
  }, [currentIndex, stories, currentUser?.id]);

  // Auto-advance timer
  useEffect(() => {
    if (loading || !stories.length || paused) return;

    const currentStory = stories[currentIndex];
    const duration = currentStory.duration || 5000;

    let startTime = Date.now();
    let pausedTime = 0;

    const interval = setInterval(() => {
      if (paused) {
        pausedTime = Date.now();
        return;
      }

      if (pausedTime > 0) {
        startTime += Date.now() - pausedTime;
        pausedTime = 0;
      }

      const elapsed = Date.now() - startTime;
      const percent = Math.min(elapsed / duration, 1);

      setProgress(percent);

      if (elapsed >= duration) {
        // Move to next story
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setProgress(0);
          onNavigateNext?.();
        } else {
          // All stories viewed, close
          onClose();
        }
      }
    }, 16);

    return () => clearInterval(interval);
  }, [currentIndex, stories, loading, paused, onClose, onNavigateNext]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
      onNavigatePrev?.();
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      onNavigateNext?.();
    } else {
      onClose();
    }
  };

  if (loading || !stories.length) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X size={28} color="#fff" strokeWidth={2} />
        </Pressable>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading story...</Text>
        </View>
      </View>
    );
  }

  const currentStory = stories[currentIndex];
  const progressPercent = Math.max(0, Math.min(progress, 1));

  return (
    <View
      style={styles.container}
      {...panResponder.panHandlers}
    >
      {/* Progress Bars */}
      <View style={styles.progressBarsContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarWrapper}>
            <View
              style={[
                styles.progressBar,
                {
                  width: index === currentIndex
                    ? `${progressPercent * 100}%`
                    : index < currentIndex
                    ? '100%'
                    : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Story Content */}
      <Image
        source={{ uri: currentStory.content_url }}
        style={styles.storyImage}
        resizeMode="cover"
      />

      {/* Top Gradient Overlay with User Info */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topOverlay}
      >
        <View style={styles.userInfoRow}>
          <Image
            source={{ uri: storyUser?.avatar_url || '' }}
            style={styles.userAvatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{storyUser?.full_name}</Text>
            {currentStory.created_at && (
              <Text style={styles.timestamp}>
                {getTimeAgo(currentStory.created_at)}
              </Text>
            )}
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={28} color="#fff" strokeWidth={2} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bottomOverlay}
      />

      {/* Navigation & Tap Areas */}
      <Pressable
        style={styles.leftTapArea}
        onPress={handlePrevious}
        hitSlop={40}
      >
        {currentIndex > 0 && (
          <View style={styles.navButton}>
            <ChevronLeft size={32} color="#fff" strokeWidth={2} />
          </View>
        )}
      </Pressable>

      <Pressable
        style={styles.centerTapArea}
        onPress={() => setPaused(!paused)}
      />

      <Pressable
        style={styles.rightTapArea}
        onPress={handleNext}
        hitSlop={40}
      >
        {currentIndex < stories.length - 1 && (
          <View style={styles.navButton}>
            <ChevronRight size={32} color="#fff" strokeWidth={2} />
          </View>
        )}
      </Pressable>

      {/* Pause Indicator */}
      {paused && (
        <View style={styles.pauseIndicator}>
          <Text style={styles.pauseText}>Paused</Text>
        </View>
      )}

      {/* Story Counter */}
      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {stories.length}
        </Text>
      </View>
    </View>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  progressBarsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 8,
    paddingTop: 10,
    zIndex: 10,
  },
  progressBarWrapper: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 45,
    paddingHorizontal: 16,
    zIndex: 5,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 5,
  },
  leftTapArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.3,
    justifyContent: 'center',
    zIndex: 3,
  },
  centerTapArea: {
    position: 'absolute',
    left: width * 0.3,
    top: 0,
    bottom: 0,
    width: width * 0.4,
    zIndex: 2,
  },
  rightTapArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.3,
    justifyContent: 'center',
    zIndex: 3,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  navButton: {
    opacity: 0.7,
  },
  pauseIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -35,
    marginTop: -20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 8,
  },
  pauseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 6,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
  },
});
