import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/apiClient'

interface PremiumStatus {
  has_premium: boolean
  premium_expires_at?: string
  is_premium_active: boolean
  days_remaining: number
}

export const usePremiumStatus = () => {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkPremiumStatus = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/payment/subscription-status')
      const status = response.data
      setPremiumStatus(status)
      return status
    } catch (error) {
      console.error('Error checking premium status:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPremiumStatus = useCallback(async () => {
    return await checkPremiumStatus()
  }, [checkPremiumStatus])

  useEffect(() => {
    checkPremiumStatus()
  }, [checkPremiumStatus])

  // Listen for custom events to refresh premium status
  useEffect(() => {
    const handlePremiumUpdate = () => {
      refreshPremiumStatus()
    }

    window.addEventListener('premium-status-updated', handlePremiumUpdate)
    
    return () => {
      window.removeEventListener('premium-status-updated', handlePremiumUpdate)
    }
  }, [refreshPremiumStatus])

  return {
    premiumStatus,
    loading,
    refreshPremiumStatus,
    hasPremium: premiumStatus?.has_premium || false,
    isPremiumActive: premiumStatus?.is_premium_active || false
  }
} 