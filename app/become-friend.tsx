import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function BecomeFriend() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/onboarding' as any)
  }, [])
  return null
}

