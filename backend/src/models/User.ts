export interface UserCreateInput {
  phoneNumber: string;
  alertPrefs?: AlertPreferences;
}

export interface UserUpdateInput {
  phoneNumber?: string;
  isVerified?: boolean;
  verificationCode?: string;
  alertPrefs?: AlertPreferences;
}

export interface AlertPreferences {
  enableSMS?: boolean;
  enableEmail?: boolean;
  enablePush?: boolean;
  dailyDigest?: boolean;
  instantAlerts?: boolean;
  priceDropAlerts?: boolean;
  newListingAlerts?: boolean;
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  maxAlertsPerDay?: number;
  alertFilters?: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number[];
    neighborhoods?: string[];
  };
}

export interface UserVerificationRequest {
  phoneNumber: string;
}

export interface UserVerificationConfirm {
  phoneNumber: string;
  verificationCode: string;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  isVerified: boolean;
  alertPrefs: AlertPreferences;
  createdAt: Date;
  updatedAt: Date;
  savedApartmentsCount?: number;
  notificationsCount?: number;
}