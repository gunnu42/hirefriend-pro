import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Alert, ActivityIndicator, Switch
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { ChevronLeft, Camera } from 'lucide-react-native'
import { supabase } from '@/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function EditProfileScreen() {
  const router = useRouter()
  const { user, updateProfile } = useAuth()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [city, setCity] = useState(
    user?.city || user?.current_city || '')
  const [gender, setGender] = useState(user?.gender || '')
  const [hourlyRate, setHourlyRate] = useState(
    user?.hourly_rate?.toString() || '')
  const [isAvailable, setIsAvailable] = useState(
    user?.is_friend_available || false)
  const [avatarUri, setAvatarUri] = useState(
    user?.avatar_url || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handlePickAvatar = useCallback(async () => {
    try {
      const perm = await ImagePicker
        .requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert('Permission needed',
          'Allow photo access to upload avatar')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      })
      if (result.canceled || !result.assets?.[0]?.uri) return

      setUploading(true)
      const uri = result.assets[0].uri
      const response = await fetch(uri)
      const blob = await response.blob()
      const fileName = user?.id + '_' + Date.now() + '.jpg'

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setAvatarUri(urlData.publicUrl)
      Alert.alert('✅', 'Photo uploaded!')
    } catch (err) {
      console.error('Avatar upload error:', err)
      Alert.alert('Error', 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }, [user?.id])

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your name')
      return
    }
    try {
      setSaving(true)
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        city: city.trim(),
        current_city: city.trim(),
        gender,
        hourly_rate: parseFloat(hourlyRate) || 0,
        is_friend_available: isAvailable,
        avatar_url: avatarUri || user?.avatar_url,
      })
      Alert.alert('Success ✅', 'Profile saved!', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (err) {
      Alert.alert('Error', 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }, [fullName, phone, bio, city, gender,
    hourlyRate, isAvailable, avatarUri, updateProfile, router])

  const genders = ['Male', 'Female', 'Other']

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} style={s.saveBtn}
          disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <Text style={s.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <Pressable onPress={handlePickAvatar} style={s.avatarWrap}>
            <Image
              source={{ uri: avatarUri ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
              style={s.avatar}
            />
            <View style={s.cameraOverlay}>
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Camera size={20} color="#fff" />}
            </View>
          </Pressable>
          <Text style={s.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Personal Info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Personal Info</Text>

          <Text style={s.label}>Full Name *</Text>
          <TextInput style={s.input} value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name" />

          <Text style={s.label}>Phone</Text>
          <TextInput style={s.input} value={phone}
            onChangeText={setPhone}
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad" />

          <Text style={s.label}>Gender</Text>
          <View style={s.genderRow}>
            {genders.map(g => (
              <Pressable key={g}
                onPress={() => setGender(g)}
                style={[s.genderBtn,
                  gender === g && s.genderBtnActive]}>
                <Text style={[s.genderText,
                  gender === g && s.genderTextActive]}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>About Me</Text>
          <TextInput style={[s.input, s.bioInput]}
            value={bio} onChangeText={setBio}
            placeholder="Tell people what makes you a great friend..."
            multiline maxLength={200} />
          <Text style={s.charCount}>{bio.length}/200</Text>
        </View>

        {/* Location */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Location & Availability</Text>

          <Text style={s.label}>Your City</Text>
          <TextInput style={s.input} value={city}
            onChangeText={setCity}
            placeholder="Mumbai, Delhi, Bangalore..." />

          <View style={s.switchRow}>
            <View>
              <Text style={s.label}>Available as a Friend</Text>
              <Text style={s.switchSub}>
                Show up in friend listings</Text>
            </View>
            <Switch value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ true: '#EF4444' }}
              thumbColor="#fff" />
          </View>

          <Text style={s.label}>Hourly Rate (₹)</Text>
          <View style={s.rateRow}>
            <Text style={s.ratePrefix}>₹</Text>
            <TextInput style={[s.input, s.rateInput]}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="500"
              keyboardType="numeric" />
          </View>
        </View>

        {/* Save Button */}
        <Pressable style={s.saveFullBtn}
          onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveFullBtnText}>Save Changes</Text>}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700',
    color: '#1A1A1A' },
  saveBtn: { padding: 4 },
  saveBtnText: { fontSize: 16, fontWeight: '600',
    color: '#EF4444' },
  scroll: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint: { fontSize: 13, color: '#888', marginTop: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700',
    color: '#1A1A1A', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600',
    color: '#666', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#E5E5E5',
    borderRadius: 12, padding: 14,
    fontSize: 16, color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#888',
    textAlign: 'right', marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  genderBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, backgroundColor: '#F5F5F5',
  },
  genderBtnActive: { backgroundColor: '#EF4444' },
  genderText: { fontSize: 14, color: '#666',
    fontWeight: '600' },
  genderTextActive: { color: '#fff' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 12,
  },
  switchSub: { fontSize: 12, color: '#888', marginTop: 2 },
  rateRow: { flexDirection: 'row', alignItems: 'center',
    gap: 8 },
  ratePrefix: { fontSize: 20, fontWeight: '700',
    color: '#1A1A1A' },
  rateInput: { flex: 1 },
  saveFullBtn: {
    backgroundColor: '#EF4444', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8,
  },
  saveFullBtnText: { fontSize: 16, fontWeight: '700',
    color: '#fff' },
})
