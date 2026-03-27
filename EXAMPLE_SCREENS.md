/**
 * Example Implementation Files for HireFriend Production App
 * These files demonstrate how to use the contexts and data in actual screens
 */

// ============================================================================
// EXAMPLE 1: Login Screen with Email + OTP
// ============================================================================
// File: app/login.tsx

import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import Colors from '@/constants/colors'

export default function LoginScreen() {
  const router = useRouter()
  const { signInEmail, sendEmailOTP, verifyEmailOTP, error, loading } = useAuth()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')

  const handleSendOTP = async () => {
    try {
      await sendEmailOTP(email)
      setStep('otp')
    } catch (err) {
      console.error('Error sending OTP:', err)
    }
  }

  const handleVerifyOTP = async () => {
    try {
      await verifyEmailOTP(email, otp)
      router.replace('/(tabs)/profile')
    } catch (err) {
      console.error('Error verifying OTP:', err)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>HireFriend</Text>

      {step === 'email' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter OTP sent to {email}</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('email')}>
            <Text style={styles.link}>Change Email</Text>
          </TouchableOpacity>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 12,
  },
  error: {
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },
})

// ============================================================================
// EXAMPLE 2: Wallet Screen with Real-Time Updates
// ============================================================================
// File: app/(tabs)/wallet.tsx

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, Animated } from 'react-native'
import { useWallet } from '@/contexts/WalletContext.production'
import Colors from '@/constants/colors'

export default function WalletScreen() {
  const { wallet, transactions, loading, error } = useWallet()
  const [animatedPoints] = useState(new Animated.Value(wallet?.points_balance || 0))

  // Animate points counter
  useEffect(() => {
    if (wallet?.points_balance) {
      Animated.timing(animatedPoints, {
        toValue: wallet.points_balance,
        duration: 600,
        useNativeDriver: false,
      }).start()
    }
  }, [wallet?.points_balance, animatedPoints])

  const points = animatedPoints.interpolate({
    inputRange: [0, wallet?.points_balance || 0],
    outputRange: ['0', String(wallet?.points_balance || 0)],
  })

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading wallet...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Your Points</Text>
        <Animated.Text style={styles.points}>{points}</Animated.Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.heading}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transaction}>
            <Text style={styles.txnType}>{item.transaction_type}</Text>
            <Text style={[styles.points, {color: item.points > 0 ? 'green' : 'red'}]}>
              {item.points > 0 ? '+' : ''}{item.points}
            </Text>
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.primary,
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  points: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  transaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  txnType: {
    fontSize: 14,
    fontWeight: '500',
  },
  error: {
    color: '#DC2626',
    marginBottom: 12,
  },
})

// ============================================================================
// EXAMPLE 3: Subscription Screen with Upgrade
// ============================================================================
// File: app/subscription.tsx

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useSubscription } from '@/contexts/SubscriptionContext'
import Colors from '@/constants/colors'
import { SUBSCRIPTION_PLANS, formatCurrency } from '@/constants/config'

export default function SubscriptionScreen() {
  const router = useRouter()
  const { subscription, upgradeToPremium, loading } = useSubscription()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true)
      await upgradeToPremium()
      // Show success toast
      router.back()
    } catch (err) {
      console.error('Upgrade failed:', err)
    } finally {
      setIsUpgrading(false)
    }
  }

  const freePlan = SUBSCRIPTION_PLANS.FREE
  const premiumPlan = SUBSCRIPTION_PLANS.PREMIUM

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Subscription</Text>

      {subscription?.plan === 'free' ? (
        <>
          <View style={[styles.card, { borderColor: Colors.primary }]}>
            <Text style={styles.planName}>Free Plan</Text>
            <Text style={styles.price}>₹0/month</Text>
            <View style={styles.features}>
              {Object.entries(freePlan.features).map(([key, value]) => (
                <Text key={key} style={styles.feature}>
                  {value ? '✓' : '✗'} {key}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.card}>
            <Text style={[styles.planName, { color: Colors.primary }]}>Premium Plan</Text>
            <Text style={styles.price}>{formatCurrency(premiumPlan.price)}/month</Text>
            <View style={styles.features}>
              {Object.entries(premiumPlan.features).map(([key, value]) => (
                <Text key={key} style={styles.feature}>
                  ✓ {key}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.upgradeText}>Upgrade Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={[styles.planName, { color: Colors.primary }]}>Premium</Text>
          <Text style={styles.price}>Active ✓</Text>
          <Text style={styles.description}>You're enjoying unlimited benefits!</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  features: {
    marginBottom: 16,
  },
  feature: {
    fontSize: 14,
    marginBottom: 8,
    color: Colors.textSecondary,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
})

// ============================================================================
// HOW TO USE THESE EXAMPLES
// ============================================================================

/*
1. Replace existing screen files with these examples
2. Ensure all contexts are wrapped in _layout.tsx:

import { AuthProvider } from '@/contexts/AuthContext'
import { WalletProvider } from '@/contexts/WalletContext.production'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <WalletProvider>
        <SubscriptionProvider>
          {/* Stack.Navigator or Tabs.Navigator */}
        </SubscriptionProvider>
      </WalletProvider>
    </AuthProvider>
  )
}

3. Import and use contexts in any screen:

import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext.production'
import { useSubscription } from '@/contexts/SubscriptionContext'

export default function MyScreen() {
  const { user, loading } = useAuth()
  const { wallet } = useWallet()
  const { subscription } = useSubscription()
  
  // Use the data in your UI
}

4. For production deployment:
   - Replace all mock data in existing screens
   - Remove all localStorage/AsyncStorage calls
   - Use contexts for state management
   - Enable RLS in Supabase dashboard
   - Deploy Edge Functions
*/
