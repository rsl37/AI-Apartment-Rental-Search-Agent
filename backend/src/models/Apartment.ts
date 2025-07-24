export interface ApartmentFilter {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number[];
  bathrooms?: number;
  minSqft?: number;
  neighborhoods?: string[];
  borough?: string;
  isDoorman?: boolean;
  hasConcierge?: boolean;
  hasAC?: boolean;
  hasDishwasher?: boolean;
  hasElevator?: boolean;
  hasLaundryUnit?: boolean;
  hasLaundryBuilding?: boolean;
  isCatFriendly?: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  excludeHealthIssues?: boolean; // Exclude apartments with asbestos, lead, bedbugs, mold
}

export interface ApartmentCreateInput {
  externalId: string;
  source: 'streeteasy' | 'zillow' | 'apartments' | 'redfin' | 'trulia';
  url: string;
  title: string;
  address: string;
  neighborhood?: string;
  borough?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  brokerFee?: number;
  securityDeposit?: number;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  floor?: string;
  totalFloors?: string;
  isDoorman?: boolean;
  hasConcierge?: boolean;
  hasAC?: boolean;
  hasDishwasher?: boolean;
  hasElevator?: boolean;
  hasLaundryUnit?: boolean;
  hasLaundryBuilding?: boolean;
  isCatFriendly?: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  hasAsbestos?: boolean;
  hasLeadPaint?: boolean;
  hasBedbugs?: boolean;
  hasMold?: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  images?: string[];
  features?: string[];
}

export interface ApartmentUpdateInput extends Partial<ApartmentCreateInput> {
  isActive?: boolean;
  isArchived?: boolean;
}

export interface ApartmentSortOptions {
  field: 'price' | 'createdAt' | 'updatedAt' | 'sqft' | 'bedrooms' | 'bathrooms';
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ApartmentSearchResult {
  apartments: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}