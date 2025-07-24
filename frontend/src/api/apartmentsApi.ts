import apiClient from '@/utils/apiClient'

export interface Apartment {
  id: string
  externalId: string
  source: 'streeteasy' | 'zillow' | 'apartments'
  url: string
  title: string
  address: string
  neighborhood?: string
  borough: string
  latitude?: number
  longitude?: number
  price: number
  brokerFee?: number
  securityDeposit?: number
  bedrooms: number
  bathrooms: number
  sqft?: number
  floor?: string
  totalFloors?: string
  isDoorman: boolean
  hasConcierge: boolean
  hasAC: boolean
  hasDishwasher: boolean
  hasElevator: boolean
  hasLaundryUnit: boolean
  hasLaundryBuilding: boolean
  isCatFriendly: boolean
  availableFrom?: string
  availableTo?: string
  hasAsbestos: boolean
  hasLeadPaint: boolean
  hasBedbugs: boolean
  hasMold: boolean
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  description?: string
  images: string[]
  features: string[]
  isActive: boolean
  isArchived: boolean
  lastScraped: string
  createdAt: string
  updatedAt: string
}

export interface ApartmentFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  minPrice?: number
  maxPrice?: number
  bedrooms?: number[]
  bathrooms?: number
  minSqft?: number
  neighborhoods?: string[]
  borough?: string
  isDoorman?: boolean
  hasConcierge?: boolean
  hasAC?: boolean
  hasDishwasher?: boolean
  hasElevator?: boolean
  hasLaundryUnit?: boolean
  hasLaundryBuilding?: boolean
  isCatFriendly?: boolean
  availableFrom?: string
  availableTo?: string
  excludeHealthIssues?: boolean
  search?: string
}

export interface ApartmentResponse {
  apartments: Apartment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const apartmentsApi = {
  // Get apartments with filters
  getApartments: async (filters: ApartmentFilters = {}): Promise<ApartmentResponse> => {
    const response = await apiClient.get('/apartments', { params: filters })
    return response.data
  },

  // Get single apartment
  getApartment: async (id: string): Promise<Apartment> => {
    const response = await apiClient.get(`/apartments/${id}`)
    return response.data
  },

  // Export apartments to CSV
  exportCSV: async (): Promise<Blob> => {
    const response = await apiClient.get('/apartments/export/csv', {
      responseType: 'blob',
    })
    return response.data
  },

  // Create apartment (admin only)
  createApartment: async (data: Partial<Apartment>): Promise<Apartment> => {
    const response = await apiClient.post('/apartments', data)
    return response.data
  },

  // Update apartment (admin only)
  updateApartment: async (id: string, data: Partial<Apartment>): Promise<Apartment> => {
    const response = await apiClient.put(`/apartments/${id}`, data)
    return response.data
  },

  // Delete apartment (admin only)
  deleteApartment: async (id: string): Promise<void> => {
    await apiClient.delete(`/apartments/${id}`)
  },
}