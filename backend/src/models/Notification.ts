export interface NotificationCreateInput {
  userId: string;
  type: 'sms' | 'email' | 'push';
  title: string;
  message: string;
  payload?: Record<string, any>;
}

export interface NotificationUpdateInput {
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
}

export interface NotificationFilter {
  userId?: string;
  type?: 'sms' | 'email' | 'push';
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SMSNotificationPayload {
  apartmentId?: string;
  reportId?: string;
  verificationType?: 'phone_verification';
  actionUrl?: string;
}

export interface EmailNotificationPayload {
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  data?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}