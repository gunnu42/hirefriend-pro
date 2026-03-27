import React, { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, ActivityIndicator, Modal,
  FlatList, Dimensions, Animated, Switch
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { Check, ChevronDown, Camera, X } from 'lucide-react-native'
import { supabase } from '@/supabase'
import { useAuth } from '@/contexts/AuthContext'

const { width, height } = Dimensions.get('window')

const STATES_CITIES: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur','Nellore','Tirupati'],
  'Delhi': ['New Delhi','Dwarka','Rohini','Noida','Lajpat Nagar'],
  'Goa': ['Panaji','Margao','Vasco da Gama'],
  'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot','Gandhinagar'],
  'Haryana': ['Gurugram','Faridabad','Panipat','Ambala','Rohtak'],
  'Karnataka': ['Bangalore','Mysore','Hubli','Mangalore','Belgaum'],
  'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kannur'],
  'Madhya Pradesh': ['Bhopal','Indore','Gwalior','Jabalpur','Ujjain'],
  'Maharashtra': ['Mumbai','Pune','Nagpur','Nashik','Thane','Aurangabad'],
  'Punjab': ['Ludhiana','Amritsar','Jalandhar','Patiala','Chandigarh'],
  'Rajasthan': ['Jaipur','Jodhpur','Kota','Bikaner','Udaipur','Ajmer'],
  'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Salem','Tirunelveli'],
  'Telangana': ['Hyderabad','Warangal','Nizamabad','Karimnagar'],
  'Uttar Pradesh': ['Lucknow','Kanpur','Agra','Varanasi','Meerut','Noida','Ghaziabad','Allahabad','Mathura'],
  'Uttarakhand': ['Dehradun','Haridwar','Rishikesh','Roorkee'],
  'West Bengal': ['Kolkata','Howrah','Durgapur','Siliguri','Asansol'],
  'Bihar': ['Patna','Gaya','Bhagalpur','Muzaffarpur'],
  'Chhattisgarh': ['Raipur','Bhilai','Bilaspur','Korba'],
  'Jharkhand': ['Ranchi','Jamshedpur','Dhanbad','Bokaro'],
  'Odisha': ['Bhubaneswar','Cuttack','Rourkela','Berhampur'],
  'Assam': ['Guwahati','Silchar','Dibrugarh','Jorhat'],
  'Himachal Pradesh': ['Shimla','Manali','Dharamsala','Solan'],
  'Jammu & Kashmir': ['Srinagar','Jammu','Anantnag'],
  'Ladakh': ['Leh','Kargil'],
}

const INTERESTS = [
  'Travel','Music','Movies','Sports','Gaming',
  'Cooking','Photography','Fitness','Art','Tech',
  'Fashion','Food','Dance','Reading','Yoga',
  'Shopping','Comedy','Adventure','Pets','Writing'
]

const LANGUAGES = [
  'Hindi','English','Tamil','Telugu','Bengali',
  'Marathi','Gujarati','Punjabi','Kannada','Malayalam',
  'Urdu','Odia','Assamese'
]

const TOTAL_STEPS = 6

export default function OnboardingScreen() {
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const scrollRef = useRef<ScrollView>(null)
  const checkAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0)).current

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [gender, setGender] = useState(user?.gender || '')

  // Step 2
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [showStateModal, setShowStateModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [stateSearch, setStateSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')

  // Step 3
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])

  // Step 4
  const [avatarUri, setAvatarUri] = useState('')
  const [uploading, setUploading] = useState(false)

  // Step 5
  const [hourlyRate, setHourlyRate] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  const toggleItem = (
    list: string[],
    setter: (v: string[]) => void,
    item: string
  ) => {
    setter(list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item])
  }

  const validateStep = (): boolean => {
    if (step === 1) {
      if (fullName.trim().length < 2) {
        Alert.alert('Required', 'Please enter your full name')
        return false
      }
      if (!gender) {
        Alert.alert('Required', 'Please select your gender')
        return false
      }
      return true
    }
    if (step === 2) {
      if (!selectedState) {
        Alert.alert('Required', 'Please select your state')
        return false
      }
      if (!selectedCity) {
        Alert.alert('Required', 'Please select your city')
        return false
      }
      return true
    }
    if (step === 3) {
      if (bio.trim().length < 10) {
        Alert.alert('Required', 'Write at least 10 characters about yourself')
        return false
      }
      if (interests.length < 2) {
        Alert.alert('Required', 'Select at least 2 interests')
        return false
      }
      return true
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
      scrollRef.current?.scrollTo({ y: 0, animated: false })
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1)
      scrollRef.current?.scrollTo({ y: 0, animated: false })
    }
  }

  const handlePickImage = async (useCamera = false) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo access')
        return
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1,1], quality: 0.8
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true, aspect: [1,1], quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images
          })

      if (result.canceled || !result.assets?.[0]?.uri) return
      setUploading(true)
      const uri = result.assets[0].uri
      const response = await fetch(uri)
      const blob = await response.blob()
      const fileName = (user?.id || 'user') + '_' + Date.now() + '.jpg'
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage
          .from('avatars').getPublicUrl(fileName)
        setAvatarUri(urlData.publicUrl)
      }
    } catch (err) {
      console.error('Image pick error:', err)
      Alert.alert('Error', 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleComplete = async () => {
    try {
      setSaving(true)
      let dobString: string | null = null
      if (dobYear && dobMonth && dobDay) {
        dobString = dobYear + '-' +
          dobMonth.padStart(2,'0') + '-' +
          dobDay.padStart(2,'0')
      }

      await updateProfile({
        full_name: fullName.trim(),
        gender,
        city: selectedCity,
        state: selectedState,
        current_city: selectedCity,
        bio: bio.trim(),
        avatar_url: avatarUri || user?.avatar_url || '',
        hourly_rate: parseFloat(hourlyRate) || 0,
        is_friend_available: isAvailable,
        profile_completed: true,
      } as any)

      if (interests.length > 0) {
        await supabase.from('user_interests')
          .delete().eq('user_id', user?.id)
        await supabase.from('user_interests')
          .insert(interests.map(i => ({
            user_id: user?.id, interest: i
          })) as any)
      }

      if (languages.length > 0) {
        await supabase.from('user_languages')
          .delete().eq('user_id', user?.id)
        await supabase.from('user_languages')
          .insert(languages.map(l => ({
            user_id: user?.id, language: l
          })) as any)
      }

      // Animate checkmark
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, tension: 10,
          friction: 3, useNativeDriver: true
        }),
        Animated.timing(checkAnim, {
          toValue: 1, duration: 600,
          useNativeDriver: true
        })
      ]).start(() => {
        setTimeout(() => {
          router.replace('/(tabs)' as any)
        }, 1500)
      })

    } catch (err) {
      console.error('Onboarding error:', err)
      Alert.alert('Error', 'Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const filteredStates = Object.keys(STATES_CITIES)
    .filter(s => s.toLowerCase()
      .includes(stateSearch.toLowerCase()))

  const filteredCities = selectedState
    ? (STATES_CITIES[selectedState] || [])
        .filter(c => c.toLowerCase()
          .includes(citySearch.toLowerCase()))
    : []

  // Progress dots
  const ProgressBar = () => (
    <View style={s.progress}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const num = i + 1
        const done = num < step
        const active = num === step
        return (
          <View key={i} style={s.progressItem}>
            <View style={[
              s.dot,
              done && s.dotDone,
              active && s.dotActive
            ]}>
              {done
                ? <Check size={10} color="#fff" strokeWidth={3} />
                : <Text style={[
                    s.dotNum,
                    active && s.dotNumActive
                  ]}>{num}</Text>}
            </View>
            {i < TOTAL_STEPS - 1 && (
              <View style={[
                s.line,
                num < step && s.lineDone
              ]} />
            )}
          </View>
        )
      })}
    </View>
  )

  const Chip = ({ label, selected, onPress }: {
    label: string
    selected: boolean
    onPress: () => void
  }) => (
    <Pressable
      onPress={onPress}
      style={[s.chip, selected && s.chipSelected]}>
      <Text style={[
        s.chipText,
        selected && s.chipTextSelected
      ]}>{label}</Text>
    </Pressable>
  )

  // Step 6 success animation
  if (step === 6) {
    return (
      <SafeAreaView style={s.successScreen}>
        <LinearGradient
          colors={['#fff5f5', '#fff']}
          style={s.successGradient}>
          <Animated.View style={[
            s.successCircle,
            { transform: [{ scale: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1]
              }) }] }
          ]}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={s.successInner}>
              <Animated.View style={{
                opacity: checkAnim,
                transform: [{
                  scale: checkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1]
                  })
                }]
              }}>
                <Check size={60} color="#fff" strokeWidth={3} />
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          <Text style={s.successTitle}>
            You're all set! 🎉
          </Text>
          <Text style={s.successSub}>
            Welcome to HireFriend,{'\n'}
            {fullName || user?.full_name}!
          </Text>

          <View style={s.summaryCard}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={s.summaryAvatar} />
            ) : (
              <View style={s.summaryAvatarPlaceholder}>
                <Text style={s.summaryAvatarEmoji}>👤</Text>
              </View>
            )}
            <View style={s.summaryInfo}>
              <Text style={s.summaryName}>
                {fullName || user?.full_name}
              </Text>
              <Text style={s.summaryLocation}>
                📍 {selectedCity}, {selectedState}
              </Text>
              <Text style={s.summaryInterests}>
                ✨ {interests.length} interests
              </Text>
            </View>
          </View>

          <Pressable
            style={s.letsGoBtn}
            onPress={handleComplete}
            disabled={saving}>
            <LinearGradient
              colors={['#EF4444', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.letsGoBtnInner}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.letsGoBtnText}>
                    Let's Go! 🚀
                  </Text>}
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      <ProgressBar />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scroll}>

        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <View style={s.stepContainer}>
            <Text style={s.stepEmoji}>👋</Text>
            <Text style={s.stepTitle}>
              Let's set up your profile
            </Text>
            <Text style={s.stepSub}>
              Tell us a bit about yourself
            </Text>

            <View style={s.card}>
              <Text style={s.label}>Full Name *</Text>
              <TextInput
                style={s.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#aaa"
              />

              <Text style={s.label}>Date of Birth</Text>
              <View style={s.dobRow}>
                <TextInput
                  style={[s.input, s.dobInput]}
                  value={dobDay}
                  onChangeText={setDobDay}
                  placeholder="DD"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <TextInput
                  style={[s.input, s.dobInput]}
                  value={dobMonth}
                  onChangeText={setDobMonth}
                  placeholder="MM"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  maxLength={2}
                />
                <TextInput
                  style={[s.input, s.dobYearInput]}
                  value={dobYear}
                  onChangeText={setDobYear}
                  placeholder="YYYY"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <Text style={s.label}>Gender *</Text>
              <View style={s.genderRow}>
                {['Male','Female','Other'].map(g => (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      s.genderBtn,
                      gender === g && s.genderBtnActive
                    ]}>
                    <Text style={[
                      s.genderText,
                      gender === g && s.genderTextActive
                    ]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <View style={s.stepContainer}>
            <Text style={s.stepEmoji}>📍</Text>
            <Text style={s.stepTitle}>
              Where are you from?
            </Text>
            <Text style={s.stepSub}>
              Help friends find you nearby
            </Text>

            <View style={s.card}>
              <Text style={s.label}>State *</Text>
              <Pressable
                style={s.dropdown}
                onPress={() => setShowStateModal(true)}>
                <Text style={[
                  s.dropdownText,
                  !selectedState && s.dropdownPlaceholder
                ]}>
                  {selectedState || 'Select your state'}
                </Text>
                <ChevronDown size={18} color="#888" />
              </Pressable>

              <Text style={s.label}>City *</Text>
              <Pressable
                style={[
                  s.dropdown,
                  !selectedState && s.dropdownDisabled
                ]}
                onPress={() => {
                  if (selectedState) setShowCityModal(true)
                  else Alert.alert(
                    'Select State First',
                    'Please select your state first'
                  )
                }}>
                <Text style={[
                  s.dropdownText,
                  !selectedCity && s.dropdownPlaceholder
                ]}>
                  {selectedCity ||
                    (selectedState
                      ? 'Select your city'
                      : 'Select state first')}
                </Text>
                <ChevronDown size={18} color="#888" />
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP 3: About You */}
        {step === 3 && (
          <View style={s.stepContainer}>
            <Text style={s.stepEmoji}>✨</Text>
            <Text style={s.stepTitle}>Tell your story</Text>
            <Text style={s.stepSub}>
              Let people know what makes you unique
            </Text>

            <View style={s.card}>
              <Text style={s.label}>About Me *</Text>
              <TextInput
                style={[s.input, s.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="I love meeting new people and exploring new places..."
                placeholderTextColor="#aaa"
                multiline
                maxLength={300}
              />
              <Text style={s.charCount}>
                {bio.length}/300
              </Text>
            </View>

            <View style={s.card}>
              <Text style={s.label}>
                Interests * (pick 2+)
              </Text>
              <View style={s.chipWrap}>
                {INTERESTS.map(item => (
                  <Chip
                    key={item}
                    label={item}
                    selected={interests.includes(item)}
                    onPress={() => toggleItem(
                      interests, setInterests, item
                    )}
                  />
                ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.label}>
                Languages You Speak
              </Text>
              <View style={s.chipWrap}>
                {LANGUAGES.map(item => (
                  <Chip
                    key={item}
                    label={item}
                    selected={languages.includes(item)}
                    onPress={() => toggleItem(
                      languages, setLanguages, item
                    )}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: Photo */}
        {step === 4 && (
          <View style={s.stepContainer}>
            <Text style={s.stepEmoji}>📸</Text>
            <Text style={s.stepTitle}>Add your photo</Text>
            <Text style={s.stepSub}>
              Profiles with photos get 5x more views
            </Text>

            <View style={[s.card, s.photoCard]}>
              <Pressable
                onPress={() => handlePickImage(false)}
                style={s.avatarCircle}>
                {uploading ? (
                  <ActivityIndicator
                    color="#EF4444" size="large" />
                ) : avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={s.avatarImage}
                  />
                ) : (
                  <View style={s.avatarPlaceholder}>
                    <Text style={s.avatarEmoji}>👤</Text>
                    <Text style={s.avatarHint}>
                      Tap to add photo
                    </Text>
                  </View>
                )}
              </Pressable>

              <View style={s.photoButtons}>
                <Pressable
                  style={s.galleryBtn}
                  onPress={() => handlePickImage(false)}>
                  <Text style={s.galleryBtnText}>
                    📷 From Gallery
                  </Text>
                </Pressable>
                <Pressable
                  style={s.cameraBtn}
                  onPress={() => handlePickImage(true)}>
                  <LinearGradient
                    colors={['#EF4444','#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.cameraBtnInner}>
                    <Text style={s.cameraBtnText}>
                      🤳 Take Selfie
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>

            <Pressable onPress={handleNext}>
              <Text style={s.skipText}>
                Skip for now →
              </Text>
            </Pressable>
          </View>
        )}

        {/* STEP 5: Availability */}
        {step === 5 && (
          <View style={s.stepContainer}>
            <Text style={s.stepEmoji}>💰</Text>
            <Text style={s.stepTitle}>Ready to earn?</Text>
            <Text style={s.stepSub}>
              Set your availability and hourly rate
            </Text>

            <View style={s.card}>
              <View style={s.switchRow}>
                <View style={s.switchLeft}>
                  <Text style={s.switchLabel}>
                    Available as a Friend
                  </Text>
                  <Text style={s.switchSub}>
                    Appear in search results
                  </Text>
                </View>
                <Switch
                  value={isAvailable}
                  onValueChange={setIsAvailable}
                  trackColor={{
                    false: '#E5E5E5',
                    true: '#EF4444'
                  }}
                  thumbColor="#fff"
                />
              </View>

              {isAvailable && (
                <View style={s.rateSection}>
                  <Text style={s.label}>
                    Your Hourly Rate
                  </Text>
                  <View style={s.rateRow}>
                    <Text style={s.ratePrefix}>₹</Text>
                    <TextInput
                      style={[s.input, s.rateInput]}
                      value={hourlyRate}
                      onChangeText={setHourlyRate}
                      placeholder="500"
                      placeholderTextColor="#aaa"
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={s.rateHint}>
                    💡 Suggested: ₹300 - ₹1000/hr
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              style={s.completePreview}
              onPress={() => setStep(6)}>
              <Text style={s.completePreviewText}>
                👀 Preview & Complete
              </Text>
            </Pressable>
          </View>
        )}

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={s.bottomNav}>
        {step > 1 && step < 6 && (
          <Pressable
            style={s.backBtn}
            onPress={handleBack}>
            <Text style={s.backBtnText}>← Back</Text>
          </Pressable>
        )}
        {step < 5 && (
          <Pressable
            style={[
              s.nextBtn,
              step === 1 && { flex: 1 }
            ]}
            onPress={handleNext}>
            <LinearGradient
              colors={['#EF4444','#C62828']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.nextBtnInner}>
              <Text style={s.nextBtnText}>
                Continue →
              </Text>
            </LinearGradient>
          </Pressable>
        )}
        {step === 5 && (
          <Pressable
            style={[s.nextBtn, { flex: 1 }]}
            onPress={() => setStep(6)}>
            <LinearGradient
              colors={['#EF4444','#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.nextBtnInner}>
              <Text style={s.nextBtnText}>
                Almost Done! →
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        animationType="slide"
        transparent>
        <View style={s.modal}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                Select State
              </Text>
              <Pressable
                onPress={() => {
                  setShowStateModal(false)
                  setStateSearch('')
                }}>
                <X size={22} color="#1A1A1A" />
              </Pressable>
            </View>
            <TextInput
              style={s.modalSearch}
              value={stateSearch}
              onChangeText={setStateSearch}
              placeholder="Search state..."
              placeholderTextColor="#aaa"
            />
            <FlatList
              data={filteredStates}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <Pressable
                  style={s.modalItem}
                  onPress={() => {
                    setSelectedState(item)
                    setSelectedCity('')
                    setShowStateModal(false)
                    setStateSearch('')
                  }}>
                  <Text style={s.modalItemText}>
                    {item}
                  </Text>
                  {selectedState === item && (
                    <Check
                      size={16}
                      color="#EF4444"
                      strokeWidth={3}
                    />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* City Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent>
        <View style={s.modal}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                Select City
              </Text>
              <Pressable
                onPress={() => {
                  setShowCityModal(false)
                  setCitySearch('')
                }}>
                <X size={22} color="#1A1A1A" />
              </Pressable>
            </View>
            <TextInput
              style={s.modalSearch}
              value={citySearch}
              onChangeText={setCitySearch}
              placeholder="Search city..."
              placeholderTextColor="#aaa"
            />
            <FlatList
              data={filteredCities}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <Pressable
                  style={s.modalItem}
                  onPress={() => {
                    setSelectedCity(item)
                    setShowCityModal(false)
                    setCitySearch('')
                  }}>
                  <Text style={s.modalItemText}>
                    {item}
                  </Text>
                  {selectedCity === item && (
                    <Check
                      size={16}
                      color="#EF4444"
                      strokeWidth={3}
                    />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#FAFAFA'
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: '#EF4444' },
  dotDone: { backgroundColor: '#22C55E' },
  dotNum: {
    fontSize: 12, fontWeight: '700',
    color: '#888',
  },
  dotNumActive: { color: '#fff' },
  line: {
    width: 32, height: 2,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 3,
  },
  lineDone: { backgroundColor: '#22C55E' },
  scroll: { padding: 20, paddingBottom: 100 },
  stepContainer: { flex: 1 },
  stepEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 26, fontWeight: '800',
    color: '#1A1A1A', textAlign: 'center',
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 15, color: '#888',
    textAlign: 'center', marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  photoCard: { alignItems: 'center' },
  label: {
    fontSize: 13, fontWeight: '600',
    color: '#666', marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1, borderColor: '#E5E5E5',
    borderRadius: 12, padding: 14,
    fontSize: 16, color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12, color: '#aaa',
    textAlign: 'right', marginTop: 4,
  },
  dobRow: {
    flexDirection: 'row', gap: 8,
  },
  dobInput: { flex: 1, textAlign: 'center' },
  dobYearInput: {
    flex: 2, textAlign: 'center',
  },
  genderRow: {
    flexDirection: 'row', gap: 8,
  },
  genderBtn: {
    flex: 1, paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: '#EF4444' },
  genderText: {
    fontSize: 14, fontWeight: '600',
    color: '#666',
  },
  genderTextActive: { color: '#fff' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#E5E5E5',
    borderRadius: 12, padding: 14,
    backgroundColor: '#FAFAFA',
  },
  dropdownDisabled: { opacity: 0.5 },
  dropdownText: {
    fontSize: 16, color: '#1A1A1A', flex: 1,
  },
  dropdownPlaceholder: { color: '#aaa' },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap', gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  chipSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  chipText: {
    fontSize: 13, fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: { color: '#fff' },
  avatarCircle: {
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  avatarImage: { width: 140, height: 140 },
  avatarPlaceholder: {
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 48 },
  avatarHint: {
    fontSize: 12, color: '#888',
    marginTop: 4,
  },
  photoButtons: {
    flexDirection: 'row', gap: 12,
    width: '100%',
  },
  galleryBtn: {
    flex: 1, paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E5E5',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  galleryBtnText: {
    fontSize: 14, fontWeight: '600',
    color: '#333',
  },
  cameraBtn: { flex: 1, borderRadius: 12 },
  cameraBtnInner: {
    paddingVertical: 14, borderRadius: 12,
    alignItems: 'center',
  },
  cameraBtnText: {
    fontSize: 14, fontWeight: '600',
    color: '#fff',
  },
  skipText: {
    textAlign: 'center', marginTop: 12,
    fontSize: 14, color: '#888',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLeft: { flex: 1 },
  switchLabel: {
    fontSize: 16, fontWeight: '600',
    color: '#1A1A1A',
  },
  switchSub: {
    fontSize: 13, color: '#888', marginTop: 2,
  },
  rateSection: { marginTop: 16 },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center', gap: 8,
  },
  ratePrefix: {
    fontSize: 22, fontWeight: '700',
    color: '#1A1A1A',
  },
  rateInput: { flex: 1 },
  rateHint: {
    fontSize: 13, color: '#888', marginTop: 8,
  },
  completePreview: {
    marginTop: 16, alignItems: 'center',
  },
  completePreviewText: {
    fontSize: 15, color: '#EF4444',
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute', bottom: 0,
    left: 0, right: 0,
    flexDirection: 'row', gap: 12,
    padding: 16, paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backBtn: {
    flex: 1, paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 15, fontWeight: '600',
    color: '#666',
  },
  nextBtn: { flex: 2, borderRadius: 12 },
  nextBtnInner: {
    paddingVertical: 16, borderRadius: 12,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 16, fontWeight: '700',
    color: '#fff',
  },
  modal: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20, paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700',
    color: '#1A1A1A',
  },
  modalSearch: {
    margin: 12, padding: 12,
    borderWidth: 1, borderColor: '#E5E5E5',
    borderRadius: 12, fontSize: 15,
    color: '#1A1A1A',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  modalItemText: {
    fontSize: 16, color: '#1A1A1A',
  },
  successScreen: { flex: 1 },
  successGradient: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 24,
  },
  successCircle: {
    width: 120, height: 120,
    borderRadius: 60,
    marginBottom: 32,
    shadowColor: '#22C55E',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  successInner: {
    width: 120, height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 30, fontWeight: '800',
    color: '#1A1A1A', marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 16, color: '#666',
    textAlign: 'center', lineHeight: 24,
    marginBottom: 32,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    width: '100%', marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12, elevation: 3,
    gap: 16,
  },
  summaryAvatar: {
    width: 60, height: 60, borderRadius: 30,
  },
  summaryAvatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryAvatarEmoji: { fontSize: 28 },
  summaryInfo: { flex: 1 },
  summaryName: {
    fontSize: 18, fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryLocation: {
    fontSize: 14, color: '#666', marginTop: 2,
  },
  summaryInterests: {
    fontSize: 13, color: '#EF4444', marginTop: 2,
  },
  letsGoBtn: {
    width: '100%', borderRadius: 16,
    overflow: 'hidden',
  },
  letsGoBtnInner: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  letsGoBtnText: {
    fontSize: 18, fontWeight: '800',
    color: '#fff', letterSpacing: 0.5,
  },
})
