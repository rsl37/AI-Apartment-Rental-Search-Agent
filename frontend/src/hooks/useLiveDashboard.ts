import { useState, useEffect, useCallback } from 'react'
import { type Timezone } from '@/utils/timezoneUtils'

interface DashboardStats {
  totalListings: number
  newToday: number
  avgPrice: number
  verifiedUsers: number
  totalListingsChange: string
  newTodayChange: string
  avgPriceChange: string
  verifiedUsersChange: string
}

interface Activity {
  id: string
  action: string
  time: Date
  details: string
  status: string
}

interface SearchHealth {
  apiStatus: number
  scraperSuccessRate: number
  filterAccuracy: number
  lastUpdated: Date
}

interface DashboardData {
  stats: DashboardStats
  activities: Activity[]
  searchHealth: SearchHealth
  isLoading: boolean
  error: string | null
  lastRefresh: Date
}

export const useLiveDashboard = (_timezone: Timezone, refreshInterval = 30000) => {
  const [data, setData] = useState<DashboardData>({
    stats: {
      totalListings: 142,
      newToday: 8,
      avgPrice: 3245,
      verifiedUsers: 5,
      totalListingsChange: '+12%',
      newTodayChange: '+25%',
      avgPriceChange: '-2%',
      verifiedUsersChange: '+1',
    },
    activities: [
      {
        id: '1',
        action: 'New listing found',
        time: new Date(Date.now() - 2 * 60 * 1000),
        details: '1BR in SoHo - $3,200/month',
        status: '🟢',
      },
      {
        id: '2',
        action: 'Price drop alert',
        time: new Date(Date.now() - 60 * 60 * 1000),
        details: 'Studio in East Village - Now $2,800',
        status: '🟡',
      },
      {
        id: '3',
        action: 'User verification',
        time: new Date(Date.now() - 3 * 60 * 60 * 1000),
        details: 'New verified user added',
        status: '🔵',
      },
      {
        id: '4',
        action: 'Daily report generated',
        time: new Date(Date.now() - 6 * 60 * 60 * 1000),
        details: '15 new listings processed',
        status: '⚪',
      },
    ],
    searchHealth: {
      apiStatus: 100,
      scraperSuccessRate: 94,
      filterAccuracy: 98,
      lastUpdated: new Date(Date.now() - 5 * 60 * 1000),
    },
    isLoading: false,
    error: null,
    lastRefresh: new Date(),
  })

  const fetchDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Simulate API call - in real app, this would fetch from the backend
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Simulate dynamic data changes
      const now = Date.now()
      const randomChange = () => Math.floor(Math.random() * 5) + 1
      
      setData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalListings: prev.stats.totalListings + (Math.random() > 0.7 ? randomChange() : 0),
          newToday: prev.stats.newToday + (Math.random() > 0.8 ? 1 : 0),
          avgPrice: prev.stats.avgPrice + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 50 : -50) : 0),
          verifiedUsers: prev.stats.verifiedUsers + (Math.random() > 0.95 ? 1 : 0),
        },
        activities: [
          // Add new activity occasionally
          ...(Math.random() > 0.8 ? [{
            id: `activity_${now}`,
            action: 'Live update',
            time: new Date(),
            details: 'Dashboard data refreshed automatically',
            status: '🔄',
          }] : []),
          ...prev.activities.slice(0, 4), // Keep only recent activities
        ],
        searchHealth: {
          ...prev.searchHealth,
          apiStatus: Math.random() > 0.95 ? 95 + Math.floor(Math.random() * 5) : 100,
          scraperSuccessRate: 92 + Math.floor(Math.random() * 8),
          filterAccuracy: 96 + Math.floor(Math.random() * 4),
          lastUpdated: new Date(),
        },
        isLoading: false,
        lastRefresh: new Date(),
      }))
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
      }))
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    const interval = setInterval(fetchDashboardData, refreshInterval)
    
    return () => clearInterval(interval)
  }, [fetchDashboardData, refreshInterval])

  return {
    ...data,
    refresh: fetchDashboardData,
  }
}