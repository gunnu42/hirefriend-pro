import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert,
  KeyboardAvoidingView, Platform, Animated, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ArrowRight, Check, Phone, Mail, User, Calendar,
  MapPin, Pen, Languages, Heart, Briefcase, Camera, Upload,
  ShieldCheck, Image as ImageIcon, Video, ChevronDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const TOTAL_STEPS = 5;

const INTERESTS = [
  'Dining', 'Sports', 'Travel', 'Movies', 'Gaming', 'Music',
  'Hiking', 'Shopping', 'Photography', 'Dancing', 'Coffee',
  'Nightlife', 'Art', 'Yoga', 'Cooking', 'Reading',
];

const LANGUAGES = [
  'Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi',
  'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Rajasthani',
];

const PERSONALITY_TYPES = ['Introvert', 'Extrovert', 'Ambivert'];
const LOOKING_FOR = [
  'Casual Hangouts', 'Parties & Events', 'Food & Drinks', 'Games & Workouts',
  'Outdoor Fun', 'Trips & Local Places', 'Night Outs', 'Study Help',
  'Creative Activities', 'Emotional Support',
];

const I_AM_OPTIONS = [
  'Straight Male', 'Gay Male', 'Bi Male',
  'Straight Female', 'Gay Female', 'Bi Female',
];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

const STATE_CITIES: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Navi Mumbai'],
  'Delhi': ['New Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida', 'Prayagraj'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
  'Chandigarh': ['Chandigarh'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Kullu'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag'],
  'Puducherry': ['Puducherry'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Tirupati', 'Guntur'],
  'Arunachal Pradesh': ['Itanagar'],
  'Manipur': ['Imphal'],
  'Meghalaya': ['Shillong'],
  'Mizoram': ['Aizawl'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Sikkim': ['Gangtok'],
  'Tripura': ['Agartala'],
  'Ladakh': ['Leh'],
};

interface StepData {
  mobileOtp: string;
  mobileVerified: boolean;
  emailOtp: string;
  emailVerified: boolean;
  fullName: string;
  gender: string;
  dob: string;
  state: string;
  city: string;
  bio: string;
  interests: string[];
  languages: string[];
  personalityType: string;
  lookingFor: string[];
  iAm: string;
  serviceMode: 'local' | 'virtual' | '';
  hourlyRate: string;
  fullDayRate: string;
  fullDayEnabled: boolean;
  weekendRate: string;
  weekendEnabled: boolean;
  photos: string[];
  selfieCompleted: boolean;
  idUploaded: boolean;
  safetyAgreed: boolean;
}

const defaultData: StepData = {
  mobileOtp: '',
  mobileVerified: false,
  emailOtp: '',
  emailVerified: false,
  fullName: '',
  gender: '',
  dob: '',
  state: '',
  city: '',
  bio: '',
  interests: [],
  languages: [],
  personalityType: '',
  lookingFor: [],
  iAm: '',
  serviceMode: '',
  hourlyRate: '',
  fullDayRate: '',
  fullDayEnabled: false,
  weekendRate: '',
  weekendEnabled: false,
  photos: [],
  selfieCompleted: false,
  idUploaded: false,
  safetyAgreed: false,
};


export default function BecomeFriendScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<StepData>(defaultData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<string>('');
  const progressAnim = useRef(new Animated.Value(1)).current;

  const updateField = useCallback(<K extends keyof StepData>(key: K, value: StepData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const toggleArrayItem = useCallback((key: 'interests' | 'languages' | 'lookingFor', item: string) => {
    setData(prev => {
      const arr = prev[key];
      const next = arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
      return { ...prev, [key]: next };
    });
  }, []);

  const validateStep = useCallback((s: number): boolean => {
    const e: Record<string, string> = {};

    if (s === 1) {
      if (!data.mobileVerified) e.mobile = 'Mobile verification required';
      if (!data.emailVerified) e.email = 'Email verification required';
    } else if (s === 2) {
      if (!data.fullName.trim() || data.fullName.trim().length < 3) e.fullName = 'Full name must be at least 3 characters';
      if (!data.gender) e.gender = 'Gender is required';
      if (!data.dob) e.dob = 'Date of birth is required';
      else {
        const parts = data.dob.split('/');
        if (parts.length === 3) {
          const birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < 18) e.dob = 'You must be 18+ to join.';
        } else {
          e.dob = 'Use DD/MM/YYYY format';
        }
      }
      if (!data.state) e.state = 'State is required';
      if (!data.city) e.city = 'City is required';
    } else if (s === 3) {
      if (!data.bio.trim() || data.bio.trim().length < 50) e.bio = `Bio must be at least 50 characters (${data.bio.trim().length}/50)`;
      if (data.interests.length < 2) e.interests = 'Select at least 2 interests';
      if (data.languages.length < 1) e.languages = 'Select at least 1 language';
      if (!data.personalityType) e.personalityType = 'Personality type is required';
      if (data.lookingFor.length < 1) e.lookingFor = 'Select at least 1 purpose';
      if (!data.iAm) e.iAm = '"I Am" is required';
    } else if (s === 4) {
      if (!data.serviceMode) e.serviceMode = 'Select a service mode';
      if (!data.hourlyRate || isNaN(Number(data.hourlyRate)) || Number(data.hourlyRate) <= 0) e.hourlyRate = 'Valid hourly rate required';
    } else if (s === 5) {
      if (data.photos.length < 3) e.photos = 'Minimum 3 photos required';
      if (!data.selfieCompleted) e.selfie = 'Live selfie required';
      if (!data.idUploaded) e.id = 'ID upload required';
      if (!data.safetyAgreed) e.safety = 'You must agree to safety guidelines';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [data]);

  const canProceed = useMemo(() => {
    if (step === 1) return data.mobileVerified && data.emailVerified;
    if (step === 2) return data.fullName.trim().length >= 3 && data.gender && data.dob && data.state && data.city;
    if (step === 3) return data.bio.trim().length >= 50 && data.interests.length >= 2 && data.languages.length >= 1 && data.personalityType && data.lookingFor.length >= 1 && data.iAm;
    if (step === 4) return data.serviceMode && data.hourlyRate && Number(data.hourlyRate) > 0;
    if (step === 5) return data.photos.length >= 3 && data.selfieCompleted && data.idUploaded && data.safetyAgreed;
    return false;
  }, [step, data]);

  const handleNext = useCallback(() => {
    if (!validateStep(step)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < TOTAL_STEPS) {
      Animated.timing(progressAnim, { toValue: step + 1, duration: 300, useNativeDriver: false }).start();
      setStep(step + 1);
    }
  }, [step, validateStep, progressAnim]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      Animated.timing(progressAnim, { toValue: step - 1, duration: 300, useNativeDriver: false }).start();
      setStep(step - 1);
    } else {
      router.back();
    }
  }, [step, router, progressAnim]);

  const handleSubmit = useCallback(() => {
    if (!validateStep(5)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 2000);
  }, [validateStep]);

  const simulateVerify = useCallback((type: 'mobile' | 'email') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const otpKey = type === 'mobile' ? 'mobileOtp' : 'emailOtp';
    const otp = data[otpKey];
    if (otp.length !== 4) {
      setErrors(prev => ({ ...prev, [type]: 'Enter 4-digit OTP' }));
      return;
    }
    const verifiedKey = type === 'mobile' ? 'mobileVerified' : 'emailVerified';
    updateField(verifiedKey, true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [data, updateField]);

  const simulatePhotoAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dummyPhotos = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
    ];
    if (data.photos.length < 4) {
      updateField('photos', [...data.photos, dummyPhotos[data.photos.length]]);
    }
  }, [data.photos, updateField]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [1, TOTAL_STEPS],
    outputRange: ['20%', '100%'],
  });

  if (submitted) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check size={48} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Application Submitted Successfully</Text>
          <Text style={styles.successSub}>
            Our team will verify your KYC. You will go live in 24 hours.
          </Text>
          <Pressable style={styles.successBtn} onPress={() => router.back()} testID="done-btn">
            <Text style={styles.successBtnText}>Done</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.successContainer}>
          <Animated.View style={styles.loadingDots}>
            <View style={[styles.loadingDot, { backgroundColor: Colors.primary }]} />
            <View style={[styles.loadingDot, { backgroundColor: Colors.primary, opacity: 0.6 }]} />
            <View style={[styles.loadingDot, { backgroundColor: Colors.primary, opacity: 0.3 }]} />
          </Animated.View>
          <Text style={styles.loadingText}>Checking Details…</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Step {step} of {TOTAL_STEPS}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Dual Verification</Text>
              <Text style={styles.stepSubtitle}>Verify your mobile number and email to continue.</Text>

              <View style={styles.verifyCard}>
                <View style={styles.verifyHeader}>
                  <Phone size={18} color={Colors.primary} />
                  <Text style={styles.verifyLabel}>Mobile OTP</Text>
                  {data.mobileVerified && <View style={styles.verifiedBadge}><Check size={12} color="#fff" /></View>}
                </View>
                {!data.mobileVerified ? (
                  <>
                    <Pressable style={styles.sendOtpBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert('OTP Sent', 'A 4-digit OTP has been sent to your mobile.'); }}>
                      <Text style={styles.sendOtpText}>Send OTP</Text>
                    </Pressable>
                    <View style={styles.otpRow}>
                      <TextInput
                        style={styles.otpInput}
                        placeholder="Enter 4-digit OTP"
                        placeholderTextColor={Colors.textTertiary}
                        value={data.mobileOtp}
                        onChangeText={(v) => updateField('mobileOtp', v.replace(/[^0-9]/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        maxLength={4}
                        testID="mobile-otp"
                      />
                      <Pressable style={styles.verifyBtn} onPress={() => simulateVerify('mobile')} testID="verify-mobile">
                        <Text style={styles.verifyBtnText}>Verify</Text>
                      </Pressable>
                    </View>
                    {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
                  </>
                ) : (
                  <Text style={styles.verifiedText}>Mobile verified successfully</Text>
                )}
              </View>

              <View style={styles.verifyCard}>
                <View style={styles.verifyHeader}>
                  <Mail size={18} color={Colors.primary} />
                  <Text style={styles.verifyLabel}>Email Verification</Text>
                  {data.emailVerified && <View style={styles.verifiedBadge}><Check size={12} color="#fff" /></View>}
                </View>
                {!data.emailVerified ? (
                  <>
                    <Pressable style={styles.sendOtpBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert('OTP Sent', 'A 4-digit OTP has been sent to your email.'); }}>
                      <Text style={styles.sendOtpText}>Send OTP</Text>
                    </Pressable>
                    <View style={styles.otpRow}>
                      <TextInput
                        style={styles.otpInput}
                        placeholder="Enter 4-digit OTP"
                        placeholderTextColor={Colors.textTertiary}
                        value={data.emailOtp}
                        onChangeText={(v) => updateField('emailOtp', v.replace(/[^0-9]/g, '').slice(0, 4))}
                        keyboardType="number-pad"
                        maxLength={4}
                        testID="email-otp"
                      />
                      <Pressable style={styles.verifyBtn} onPress={() => simulateVerify('email')} testID="verify-email">
                        <Text style={styles.verifyBtnText}>Verify</Text>
                      </Pressable>
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </>
                ) : (
                  <Text style={styles.verifiedText}>Email verified successfully</Text>
                )}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Personal Identity</Text>
              <Text style={styles.stepSubtitle}>Tell us about yourself.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={[styles.inputRow, errors.fullName ? styles.inputError : null]}>
                  <User size={18} color={Colors.textTertiary} />
                  <TextInput style={styles.input} placeholder="Your full name" placeholderTextColor={Colors.textTertiary} value={data.fullName} onChangeText={(v) => updateField('fullName', v)} testID="fullname-input" />
                </View>
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.chipRow}>
                  {GENDERS.map(g => (
                    <Pressable key={g} style={[styles.chip, data.gender === g && styles.chipActive]} onPress={() => updateField('gender', g)}>
                      <Text style={[styles.chipText, data.gender === g && styles.chipTextActive]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Date of Birth * (DD/MM/YYYY)</Text>
                <View style={[styles.inputRow, errors.dob ? styles.inputError : null]}>
                  <Calendar size={18} color={Colors.textTertiary} />
                  <TextInput style={styles.input} placeholder="DD/MM/YYYY" placeholderTextColor={Colors.textTertiary} value={data.dob} onChangeText={(v) => updateField('dob', v)} keyboardType="numbers-and-punctuation" testID="dob-input" />
                </View>
                {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>State *</Text>
                <Pressable style={[styles.inputRow, errors.state ? styles.inputError : null]} onPress={() => setShowDropdown('state')}>
                  <MapPin size={18} color={Colors.textTertiary} />
                  <Text style={[styles.dropdownText, !data.state && styles.dropdownPlaceholder]}>
                    {data.state || 'Select your state'}
                  </Text>
                  <ChevronDown size={18} color={Colors.textTertiary} />
                </Pressable>
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>City *</Text>
                <Pressable style={[styles.inputRow, errors.city ? styles.inputError : null]} onPress={() => { if (data.state) setShowDropdown('city'); else Alert.alert('Select State', 'Please select a state first.'); }}>
                  <MapPin size={18} color={Colors.textTertiary} />
                  <Text style={[styles.dropdownText, !data.city && styles.dropdownPlaceholder]}>
                    {data.city || 'Select your city'}
                  </Text>
                  <ChevronDown size={18} color={Colors.textTertiary} />
                </Pressable>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Vibe & Interests</Text>
              <Text style={styles.stepSubtitle}>Help others know your personality.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Bio / About You * (min 50 chars)</Text>
                <TextInput
                  style={[styles.textArea, errors.bio ? styles.inputError : null]}
                  placeholder="Tell people about yourself, your interests, what you love doing..."
                  placeholderTextColor={Colors.textTertiary}
                  value={data.bio}
                  onChangeText={(v) => updateField('bio', v)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  testID="bio-input"
                />
                <Text style={styles.charCount}>{data.bio.length}/50 min</Text>
                {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Interests * (min 2)</Text>
                <View style={styles.chipRow}>
                  {INTERESTS.map(i => (
                    <Pressable key={i} style={[styles.chip, data.interests.includes(i) && styles.chipActive]} onPress={() => toggleArrayItem('interests', i)}>
                      <Text style={[styles.chipText, data.interests.includes(i) && styles.chipTextActive]}>{i}</Text>
                    </Pressable>
                  ))}
                </View>
                {errors.interests && <Text style={styles.errorText}>{errors.interests}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Languages * (min 1)</Text>
                <View style={styles.chipRow}>
                  {LANGUAGES.map(l => (
                    <Pressable key={l} style={[styles.chip, data.languages.includes(l) && styles.chipActive]} onPress={() => toggleArrayItem('languages', l)}>
                      <Text style={[styles.chipText, data.languages.includes(l) && styles.chipTextActive]}>{l}</Text>
                    </Pressable>
                  ))}
                </View>
                {errors.languages && <Text style={styles.errorText}>{errors.languages}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Personality Type *</Text>
                <View style={styles.chipRow}>
                  {PERSONALITY_TYPES.map(p => (
                    <Pressable key={p} style={[styles.chip, data.personalityType === p && styles.chipActive]} onPress={() => updateField('personalityType', p)}>
                      <Text style={[styles.chipText, data.personalityType === p && styles.chipTextActive]}>{p}</Text>
                    </Pressable>
                  ))}
                </View>
                {errors.personalityType && <Text style={styles.errorText}>{errors.personalityType}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Friend Hiring Purpose * (multi-select)</Text>
                <View style={styles.chipRow}>
                  {LOOKING_FOR.map(l => (
                    <Pressable key={l} style={[styles.chip, data.lookingFor.includes(l) && styles.chipActive]} onPress={() => toggleArrayItem('lookingFor', l)}>
                      <Text style={[styles.chipText, data.lookingFor.includes(l) && styles.chipTextActive]}>{l}</Text>
                    </Pressable>
                  ))}
                </View>
                {errors.lookingFor && <Text style={styles.errorText}>{errors.lookingFor}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>I Am *</Text>
                <Pressable style={[styles.inputRow, errors.iAm ? styles.inputError : null]} onPress={() => setShowDropdown('iAm')}>
                  <Heart size={18} color={Colors.textTertiary} />
                  <Text style={[styles.dropdownText, !data.iAm && styles.dropdownPlaceholder]}>
                    {data.iAm || 'Select identity'}
                  </Text>
                  <ChevronDown size={18} color={Colors.textTertiary} />
                </Pressable>
                {errors.iAm && <Text style={styles.errorText}>{errors.iAm}</Text>}
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Commercials</Text>
              <Text style={styles.stepSubtitle}>Set your rates and service mode.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Service Mode *</Text>
                <View style={styles.modeRow}>
                  <Pressable
                    style={[styles.modeCard, data.serviceMode === 'local' && styles.modeCardActive]}
                    onPress={() => updateField('serviceMode', 'local')}
                    testID="mode-local"
                  >
                    <MapPin size={24} color={data.serviceMode === 'local' ? '#fff' : Colors.primary} />
                    <Text style={[styles.modeTitle, data.serviceMode === 'local' && styles.modeTitleActive]}>Local Friend</Text>
                    <Text style={[styles.modeDesc, data.serviceMode === 'local' && styles.modeDescActive]}>In-person meetings</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modeCard, data.serviceMode === 'virtual' && styles.modeCardActive]}
                    onPress={() => updateField('serviceMode', 'virtual')}
                    testID="mode-virtual"
                  >
                    <Video size={24} color={data.serviceMode === 'virtual' ? '#fff' : Colors.teal} />
                    <Text style={[styles.modeTitle, data.serviceMode === 'virtual' && styles.modeTitleActive]}>Virtual Friend</Text>
                    <Text style={[styles.modeDesc, data.serviceMode === 'virtual' && styles.modeDescActive]}>Video / Call / Chat</Text>
                  </Pressable>
                </View>
                {errors.serviceMode && <Text style={styles.errorText}>{errors.serviceMode}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Standard Hourly Rate (₹) *</Text>
                <View style={[styles.inputRow, errors.hourlyRate ? styles.inputError : null]}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput style={styles.input} placeholder="e.g. 500" placeholderTextColor={Colors.textTertiary} value={data.hourlyRate} onChangeText={(v) => updateField('hourlyRate', v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" testID="hourly-rate" />
                </View>
                {errors.hourlyRate && <Text style={styles.errorText}>{errors.hourlyRate}</Text>}
              </View>

              <Pressable style={styles.toggleRow} onPress={() => updateField('fullDayEnabled', !data.fullDayEnabled)}>
                <View style={[styles.toggleBox, data.fullDayEnabled && styles.toggleBoxActive]}>
                  {data.fullDayEnabled && <Check size={14} color="#fff" />}
                </View>
                <Text style={styles.toggleLabel}>Full Day Rate</Text>
              </Pressable>
              {data.fullDayEnabled && (
                <View style={styles.inputRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput style={styles.input} placeholder="Full day rate" placeholderTextColor={Colors.textTertiary} value={data.fullDayRate} onChangeText={(v) => updateField('fullDayRate', v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" testID="fullday-rate" />
                </View>
              )}

              <Pressable style={styles.toggleRow} onPress={() => updateField('weekendEnabled', !data.weekendEnabled)}>
                <View style={[styles.toggleBox, data.weekendEnabled && styles.toggleBoxActive]}>
                  {data.weekendEnabled && <Check size={14} color="#fff" />}
                </View>
                <Text style={styles.toggleLabel}>2-Day / Weekend Rate</Text>
              </Pressable>
              {data.weekendEnabled && (
                <View style={styles.inputRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput style={styles.input} placeholder="Weekend rate" placeholderTextColor={Colors.textTertiary} value={data.weekendRate} onChangeText={(v) => updateField('weekendRate', v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" testID="weekend-rate" />
                </View>
              )}


            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Media & KYC</Text>
              <Text style={styles.stepSubtitle}>Upload photos and verify your identity.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Gallery Photos * (min 3)</Text>
                <View style={styles.photoGrid}>
                  {data.photos.map((_, idx) => (
                    <View key={idx} style={styles.photoSlot}>
                      <ImageIcon size={24} color={Colors.success} />
                      <Text style={styles.photoSlotText}>Photo {idx + 1}</Text>
                    </View>
                  ))}
                  {data.photos.length < 4 && (
                    <Pressable style={styles.addPhotoBtn} onPress={simulatePhotoAdd} testID="add-photo">
                      <Upload size={24} color={Colors.primary} />
                      <Text style={styles.addPhotoText}>Add Photo</Text>
                    </Pressable>
                  )}
                </View>
                {errors.photos && <Text style={styles.errorText}>{errors.photos}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Live Selfie *</Text>
                <Pressable
                  style={[styles.actionCard, data.selfieCompleted && styles.actionCardDone]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); updateField('selfieCompleted', true); }}
                  testID="selfie-btn"
                >
                  <Camera size={22} color={data.selfieCompleted ? Colors.success : Colors.primary} />
                  <Text style={[styles.actionCardText, data.selfieCompleted && styles.actionCardTextDone]}>
                    {data.selfieCompleted ? 'Selfie Captured' : 'Take Live Selfie'}
                  </Text>
                  {data.selfieCompleted && <Check size={18} color={Colors.success} />}
                </Pressable>
                {errors.selfie && <Text style={styles.errorText}>{errors.selfie}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>ID Upload (Aadhaar / PAN) *</Text>
                <Pressable
                  style={[styles.actionCard, data.idUploaded && styles.actionCardDone]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); updateField('idUploaded', true); }}
                  testID="id-upload-btn"
                >
                  <ShieldCheck size={22} color={data.idUploaded ? Colors.success : Colors.primary} />
                  <Text style={[styles.actionCardText, data.idUploaded && styles.actionCardTextDone]}>
                    {data.idUploaded ? 'ID Uploaded' : 'Upload ID Document'}
                  </Text>
                  {data.idUploaded && <Check size={18} color={Colors.success} />}
                </Pressable>
                {errors.id && <Text style={styles.errorText}>{errors.id}</Text>}
              </View>

              <Pressable style={styles.safetyRow} onPress={() => updateField('safetyAgreed', !data.safetyAgreed)}>
                <View style={[styles.toggleBox, data.safetyAgreed && styles.toggleBoxActive]}>
                  {data.safetyAgreed && <Check size={14} color="#fff" />}
                </View>
                <Text style={styles.safetyText}>
                  I agree to the Safety Guidelines & No-Responsibility Clause.
                </Text>
              </Pressable>
              {errors.safety && <Text style={styles.errorText}>{errors.safety}</Text>}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          {step < TOTAL_STEPS ? (
            <Pressable
              style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
              onPress={handleNext}
              disabled={!canProceed}
              testID="next-step-btn"
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <ArrowRight size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.submitBtn, !canProceed && styles.nextBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canProceed}
              testID="submit-btn"
            >
              <Text style={styles.submitBtnText}>Submit for Review</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </View>

      <Modal visible={showDropdown === 'state'} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown('')}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select State</Text>
            <ScrollView style={styles.modalScroll}>
              {INDIAN_STATES.map(s => (
                <Pressable key={s} style={styles.modalItem} onPress={() => { updateField('state', s); updateField('city', ''); setShowDropdown(''); }}>
                  <Text style={[styles.modalItemText, data.state === s && styles.modalItemTextActive]}>{s}</Text>
                  {data.state === s && <Check size={16} color={Colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showDropdown === 'city'} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown('')}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select City</Text>
            <ScrollView style={styles.modalScroll}>
              {(STATE_CITIES[data.state] ?? []).map(c => (
                <Pressable key={c} style={styles.modalItem} onPress={() => { updateField('city', c); setShowDropdown(''); }}>
                  <Text style={[styles.modalItemText, data.city === c && styles.modalItemTextActive]}>{c}</Text>
                  {data.city === c && <Check size={16} color={Colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showDropdown === 'iAm'} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown('')}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>I Am</Text>
            <ScrollView style={styles.modalScroll}>
              {I_AM_OPTIONS.map(o => (
                <Pressable key={o} style={styles.modalItem} onPress={() => { updateField('iAm', o); setShowDropdown(''); }}>
                  <Text style={[styles.modalItemText, data.iAm === o && styles.modalItemTextActive]}>{o}</Text>
                  {data.iAm === o && <Check size={16} color={Colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  safeTop: { backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.textSecondary },
  progressBg: {
    height: 4, backgroundColor: Colors.surfaceAlt, marginHorizontal: 16,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  stepContent: { gap: 18 },
  stepTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.text },
  stepSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: -10 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14,
    height: 52, borderWidth: 1.5, borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.danger },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  textArea: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    fontSize: 15, color: Colors.text, minHeight: 100, borderWidth: 1.5,
    borderColor: Colors.border,
  },
  charCount: { fontSize: 12, color: Colors.textTertiary, textAlign: 'right' },
  errorText: { fontSize: 12, color: Colors.danger, marginLeft: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  chipTextActive: { color: '#fff' },
  chipSmall: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border,
  },
  chipSmallText: { fontSize: 11, fontWeight: '500' as const, color: Colors.textSecondary },
  dropdownText: { flex: 1, fontSize: 15, color: Colors.text },
  dropdownPlaceholder: { color: Colors.textTertiary },
  currencySymbol: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  verifyCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  verifyLabel: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, flex: 1 },
  verifiedBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: { fontSize: 14, color: Colors.success, fontWeight: '600' as const },
  sendOtpBtn: {
    backgroundColor: Colors.tagBg, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', marginBottom: 10,
  },
  sendOtpText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
  otpRow: { flexDirection: 'row', gap: 10 },
  otpInput: {
    flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 10, height: 48,
    paddingHorizontal: 14, fontSize: 18, letterSpacing: 8, textAlign: 'center',
    color: Colors.text, fontWeight: '700' as const,
  },
  verifyBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20,
    height: 48, alignItems: 'center', justifyContent: 'center',
  },
  verifyBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#fff' },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 18,
    alignItems: 'center', gap: 8, borderWidth: 2, borderColor: Colors.border,
  },
  modeCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  modeTitleActive: { color: '#fff' },
  modeDesc: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  modeDescActive: { color: 'rgba(255,255,255,0.8)' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  toggleBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleBoxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleLabel: { fontSize: 15, fontWeight: '500' as const, color: Colors.text },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoSlot: {
    width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoSlotText: { fontSize: 10, color: Colors.success, fontWeight: '600' as const },
  addPhotoBtn: {
    width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: Colors.primary,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 10, color: Colors.primary, fontWeight: '600' as const },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  actionCardDone: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  actionCardText: { flex: 1, fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  actionCardTextDone: { color: Colors.success },
  safetyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  safetyText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottomBarInner: { paddingHorizontal: 20, paddingTop: 14 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, height: 52,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  submitBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.success, borderRadius: 14, height: 52,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  successIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.text, textAlign: 'center' },
  successSub: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 10, lineHeight: 22,
  },
  successBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 40,
    height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 32,
  },
  successBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  loadingDots: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  loadingDot: { width: 12, height: 12, borderRadius: 6 },
  loadingText: { fontSize: 18, fontWeight: '600' as const, color: Colors.textSecondary },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '60%', paddingTop: 20,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700' as const, color: Colors.text,
    paddingHorizontal: 20, marginBottom: 12,
  },
  modalScroll: { paddingHorizontal: 20, paddingBottom: 30 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  modalItemText: { fontSize: 16, color: Colors.text },
  modalItemTextActive: { color: Colors.primary, fontWeight: '700' as const },
});

