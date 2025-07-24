import apiClient from '@/utils/apiClient'

export interface User {
  id: string
  phoneNumber: string
  isVerified: boolean
  alertPrefs: AlertPreferences
  createdAt: string
  updatedAt: string
  savedApartmentsCount?: number
  notificationsCount?: number
}

export interface AlertPreferences {
  enableSMS?: boolean
  enableEmail?: boolean
  enablePush?: boolean
  dailyDigest?: boolean
  instantAlerts?: boolean
  priceDropAlerts?: boolean
  newListingAlerts?: boolean
  quietHours?: {
    start: string
    end: string
  }
  maxAlertsPerDay?: number
  alertFilters?: {
    minPrice?: number
    maxPrice?: number
    bedrooms?: number[]
    neighborhoods?: string[]
  }
}

export interface UserRegistration {
  phoneNumber: string
  alertPrefs?: AlertPreferences
}

export interface UserVerification {
  phoneNumber: string
  verificationCode: string
}

export const userApi = {
  // Register phone number
  register: async (data: UserRegistration): Promise<{ message: string; userId: string }> => {
    const response = await apiClient.post('/users/register', data)
    return response.data
  },

  // Verify phone number
  verify: async (data: UserVerification): Promise<{ message: string; user: User }> => {
    const response = await apiClient.post('/users/verify', data)
    return response.data
  },

  // Resend verification code
  resendVerification: async (phoneNumber: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/users/resend-verification', { phoneNumber })
    return response.data
  },

  // Get user profile
  getProfile: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`)
    return response.data
  },

  // Update alert preferences
  updatePreferences: async (userId: string, alertPrefs: AlertPreferences): Promise<{ message: string; alertPrefs: AlertPreferences }> => {
    const response = await apiClient.put(`/users/${userId}/preferences`, { alertPrefs })
    return response.data
  },

  // Save apartment
  saveApartment: async (userId: string, apartmentId: string, notes?: string, priority?: string, status?: string): Promise<any> => {
    const response = await apiClient.post(`/users/${userId}/saved-apartments`, {
      apartmentId,
      notes,
      priority,
      status,
    })
    return response.data
  },

  // Remove saved apartment
  removeSavedApartment: async (userId: string, apartmentId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/users/${userId}/saved-apartments/${apartmentId}`)
    return response.data
  },

  // Unsubscribe user
  unsubscribe: async (phoneNumber: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/users/${phoneNumber}/unsubscribe`)
    return response.data
  },
}