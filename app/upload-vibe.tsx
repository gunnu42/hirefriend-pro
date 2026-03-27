import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Video, Upload, Zap, CheckCircle2, Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabase';

interface VideoRecord {
  id: string;
  user_id: string;
  video_url: string;
  caption: string;
  status: 'pending' | 'verified' | 'rejected';
  points_awarded: number;
  created_at: string;
}

export default function UploadVibeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [uploaded, setUploaded] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [previousVideos, setPreviousVideos] = useState<VideoRecord[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Load previous videos on mount
  React.useEffect(() => {
    if (!user?.id) return;
    loadPreviousVideos();
  }, [user?.id]);

  // Real-time listener for video status updates
  React.useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`videos-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const updatedVideo = payload.new as VideoRecord;
          setPreviousVideos((prev) =>
            prev.map((v) => (v.id === updatedVideo.id ? updatedVideo : v))
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const loadPreviousVideos = async () => {
    try {
      setLoadingVideos(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPreviousVideos(data ?? []);
    } catch (err) {
      console.error('[Upload] Load videos error:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleUpload = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset.uri) throw new Error('No video URI');

      setUploading(true);
      setProgress(0);
      progressAnim.setValue(0);

      // Simulate upload progress
      const steps = [0.15, 0.35, 0.55, 0.75, 0.9, 1.0];
      let stepIndex = 0;

      // Upload video to storage
      const fileName = `vlogs/${user?.id}/${Date.now()}.mp4`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const uploadInterval = setInterval(() => {
        if (stepIndex < steps.length - 1) {
          const val = steps[stepIndex];
          setProgress(Math.round(val * 100));
          Animated.timing(progressAnim, {
            toValue: val,
            duration: 300,
            useNativeDriver: false,
          }).start();
          stepIndex++;
        } else if (stepIndex === steps.length - 1) {
          setProgress(100);
          clearInterval(uploadInterval);
        }
      }, 600);

      const { error: uploadError } = await supabase.storage
        .from('vlogs')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vlogs')
        .getPublicUrl(fileName);

      // Create video record
      const { error: dbError } = await supabase.from('videos').insert({
        user_id: user?.id,
        video_url: urlData.publicUrl,
        caption: 'My HireFriend meetup vibe',
        status: 'pending',
        points_awarded: 0,
      });

      if (dbError) throw dbError;

      setUploading(false);
      setUploaded(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadPreviousVideos();
    } catch (err) {
      console.error('[Upload] Error:', err);
      setUploading(false);
      Alert.alert('Upload Failed', 'Please try again');
    }
  }, [user?.id, progressAnim]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Upload Vibe</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Video size={36} color={Colors.teal} />
          </View>
          <Text style={styles.heroTitle}>Share Your Experience</Text>
          <Text style={styles.heroSub}>Upload a 15-30 second video of your meetup and earn 400 Points instantly!</Text>
          <View style={styles.rewardBadge}>
            <Zap size={16} color={Colors.gold} />
            <Text style={styles.rewardText}>+400 Points</Text>
          </View>
        </View>

        {/* Rules */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Guidelines</Text>
          <Text style={styles.rule}>• Video must be 15-30 seconds long</Text>
          <Text style={styles.rule}>• Must show your actual meetup experience</Text>
          <Text style={styles.rule}>• Both participants should be visible (with consent)</Text>
          <Text style={styles.rule}>• No inappropriate content</Text>
          <Text style={styles.rule}>• Points awarded after review (usually within 1 hour)</Text>
        </View>

        {/* Upload State */}
        {uploading ? (
          <View style={styles.uploadingCard}>
            <Video size={32} color={Colors.primary} />
            <Text style={styles.uploadingTitle}>Uploading...</Text>
            <Text style={styles.uploadingPercent}>{progress}%</Text>
            <View style={styles.uploadProgressBg}>
              <Animated.View
                style={[
                  styles.uploadProgressFill,
                  { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                ]}
              />
            </View>
            <Text style={styles.uploadingSub}>Please wait while your video is being uploaded</Text>
          </View>
        ) : uploaded ? (
          <View style={styles.successCard}>
            <CheckCircle2 size={40} color={Colors.success} />
            <Text style={styles.successTitle}>Vibe Uploaded!</Text>
            <Text style={styles.successSub}>Your video is Under Review. You'll earn 400 points when verified.</Text>
            <Pressable style={styles.walletBtn} onPress={() => router.push('/wallet' as any)}>
              <Zap size={16} color="#fff" />
              <Text style={styles.walletBtnText}>View Wallet</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.uploadBox} onPress={handleUpload}>
            <Upload size={36} color={Colors.primary} />
            <Text style={styles.uploadText}>Tap to upload your vibe video</Text>
            <Text style={styles.uploadSub}>MP4, MOV · Max 30 seconds</Text>
          </Pressable>
        )}

        {/* Previous Vibes */}
        {!loadingVideos && previousVideos.length > 0 && (
          <View style={styles.previousVibes}>
            <Text style={styles.prevTitle}>Your Videos</Text>
            {previousVideos.map((video) => (
              <View key={video.id} style={styles.vibeRow}>
                <View style={styles.vibeThumb}>
                  <Video size={20} color={Colors.textTertiary} />
                </View>
                <View style={styles.vibeInfo}>
                  <Text style={styles.vibeName}>{video.caption}</Text>
                  <Text style={styles.vibeDate}>{new Date(video.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.vibeStatus}>
                  {video.status === 'verified' ? (
                    <>
                      <CheckCircle2 size={14} color={Colors.success} />
                      <Text style={styles.vibeStatusText}>+{video.points_awarded}</Text>
                    </>
                  ) : video.status === 'pending' ? (
                    <>
                      <Clock size={14} color={Colors.gold} />
                      <Text style={[styles.vibeStatusText, { color: Colors.gold }]}>Review</Text>
                    </>
                  ) : (
                    <Text style={[styles.vibeStatusText, { color: Colors.danger }]}>Rejected</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  scrollContent: { paddingHorizontal: 16 },
  heroCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.tealLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  heroSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  rewardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    backgroundColor: Colors.goldLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  rewardText: { fontSize: 16, fontWeight: '800' as const, color: Colors.goldText },
  rulesCard: {
    marginTop: 16, backgroundColor: Colors.card, borderRadius: 16, padding: 18,
  },
  rulesTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  rule: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  uploadBox: {
    marginTop: 20, alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 16, padding: 32,
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed' as const,
  },
  uploadText: { fontSize: 16, fontWeight: '600' as const, color: Colors.primary },
  uploadSub: { fontSize: 12, color: Colors.textTertiary },
  uploadingCard: {
    marginTop: 20, alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: Colors.border,
  },
  uploadingTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  uploadingPercent: { fontSize: 28, fontWeight: '800' as const, color: Colors.primary },
  uploadProgressBg: {
    width: '100%', height: 8, backgroundColor: Colors.surfaceAlt,
    borderRadius: 4, overflow: 'hidden', marginTop: 4,
  },
  uploadProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  uploadingSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  successCard: {
    marginTop: 20, alignItems: 'center', gap: 10,
    backgroundColor: Colors.successLight, borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  successTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.success },
  successSub: { fontSize: 14, color: '#065F46', textAlign: 'center', lineHeight: 20 },
  walletBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: Colors.success, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
  },
  walletBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#fff' },
  previousVibes: { marginTop: 24 },
  prevTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  vibeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  vibeThumb: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  vibeInfo: { flex: 1 },
  vibeName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  vibeDate: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  vibeStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vibeStatusText: { fontSize: 12, fontWeight: '700' as const, color: Colors.success },
});

