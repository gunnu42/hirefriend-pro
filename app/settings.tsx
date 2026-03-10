import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Bell, Shield, Globe, Eye, Moon, Sun, Trash2, ChevronRight, Ban,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { themeMode, setThemeMode, blockedUsers } = useWallet();
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false);
  const [locationSharing, setLocationSharing] = useState<boolean>(true);
  const [profileVisibility, setProfileVisibility] = useState<boolean>(true);
  const isDark = themeMode === 'dark';

  const handleToggleTheme = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Account deleted') },
      ]
    );
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={pushNotifications ? Colors.primary : Colors.surfaceAlt}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={emailNotifications ? Colors.primary : Colors.surfaceAlt}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Globe size={20} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Location Sharing</Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={locationSharing ? Colors.primary : Colors.surfaceAlt}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Eye size={20} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Profile Visible</Text>
            </View>
            <Switch
              value={profileVisibility}
              onValueChange={setProfileVisibility}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={profileVisibility ? Colors.primary : Colors.surfaceAlt}
            />
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => router.push('/blocked-users')} testID="blocked-users">
            <View style={styles.settingLeft}>
              <Ban size={20} color={Colors.textSecondary} />
              <Text style={styles.settingLabel}>Blocked Users</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{blockedUsers.length}</Text>
              <ChevronRight size={16} color={Colors.textTertiary} />
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {isDark ? <Moon size={20} color={Colors.textSecondary} /> : <Sun size={20} color={Colors.textSecondary} />}
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggleTheme}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={isDark ? Colors.primary : Colors.surfaceAlt}
              testID="theme-toggle"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.card}>
          <Pressable style={styles.settingRow} onPress={handleDeleteAccount} testID="delete-account">
            <View style={styles.settingLeft}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Delete Account</Text>
            </View>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 48,
  },
});

