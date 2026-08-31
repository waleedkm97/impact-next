/**
 * Settings type definitions
 * Application-wide configuration and settings
 */

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logo?: string;
  favicon?: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
}

export interface ContactSettings {
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  workingHours?: {
    sunday?: string;
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
  };
}

export interface PaymentSettings {
  enabledGateways: ('stripe' | 'paypal' | 'bank-transfer' | 'cash')[];
  defaultGateway: string;
  stripe?: {
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  paypal?: {
    clientId?: string;
    secretKey?: string;
    webhookUrl?: string;
  };
  bankTransfer?: {
    bankName: string;
    accountNumber: string;
    iban?: string;
    swiftCode?: string;
    accountName: string;
    instructions?: string;
  };
}

export interface EmailSettings {
  enabled: boolean;
  fromEmail: string;
  fromName: string;
  smtp?: {
    host: string;
    port: number;
    username: string;
    password: string;
    useTls: boolean;
  };
  templates?: {
    welcome?: string;
    orderConfirmation?: string;
    enrollment?: string;
    certificate?: string;
    passwordReset?: string;
  };
}

export interface CertificateSettings {
  defaultTemplateId: string;
  customTemplates?: {
    id: string;
    name: string;
    templateUrl: string;
  }[];
  autoGenerate: boolean;
  requireCompletion: boolean;
  requireAssessmentPass: boolean;
  validityPeriod?: number;
}

export interface SecuritySettings {
  requireEmailVerification: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface AnalyticsSettings {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  hotjarId?: string;
  enableTracking: boolean;
  anonymizeIp: boolean;
}

export interface NotificationSettings {
  emailNotifications: {
    newOrder: boolean;
    newEnrollment: boolean;
    lowStock: boolean;
    abandonedCart: boolean;
  };
  smsNotifications: {
    enabled: boolean;
    newOrder: boolean;
    newEnrollment: boolean;
  };
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  allowedIps?: string[];
  version: string;
  lastUpdated: Date;
}

export interface Settings {
  general: GeneralSettings;
  contact: ContactSettings;
  payment: PaymentSettings;
  email: EmailSettings;
  certificate: CertificateSettings;
  security: SecuritySettings;
  analytics: AnalyticsSettings;
  notifications: NotificationSettings;
  system: SystemSettings;

  updatedAt: Date;
  updatedBy?: string;
}