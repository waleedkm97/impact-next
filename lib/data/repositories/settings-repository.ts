/**
 * Settings Repository
 * LocalStorage implementation for application settings.
 */

import { Settings } from '@/types/settings';

export interface ISettingsRepository {
  findAll(): Promise<Settings>;
  update(settings: Partial<Settings>): Promise<Settings>;
  reset(): Promise<Settings>;

  getGeneralSettings(): Promise<Settings['general']>;
  updateGeneralSettings(
    settings: Partial<Settings['general']>
  ): Promise<Settings['general']>;

  getContactSettings(): Promise<Settings['contact']>;
  updateContactSettings(
    settings: Partial<Settings['contact']>
  ): Promise<Settings['contact']>;

  getPaymentSettings(): Promise<Settings['payment']>;
  updatePaymentSettings(
    settings: Partial<Settings['payment']>
  ): Promise<Settings['payment']>;

  getEmailSettings(): Promise<Settings['email']>;
  updateEmailSettings(
    settings: Partial<Settings['email']>
  ): Promise<Settings['email']>;

  getCertificateSettings(): Promise<Settings['certificate']>;
  updateCertificateSettings(
    settings: Partial<Settings['certificate']>
  ): Promise<Settings['certificate']>;

  getSecuritySettings(): Promise<Settings['security']>;
  updateSecuritySettings(
    settings: Partial<Settings['security']>
  ): Promise<Settings['security']>;

  getAnalyticsSettings(): Promise<Settings['analytics']>;
  updateAnalyticsSettings(
    settings: Partial<Settings['analytics']>
  ): Promise<Settings['analytics']>;

  getNotificationSettings(): Promise<Settings['notifications']>;
  updateNotificationSettings(
    settings: Partial<Settings['notifications']>
  ): Promise<Settings['notifications']>;

  getSystemSettings(): Promise<Settings['system']>;
  updateSystemSettings(
    settings: Partial<Settings['system']>
  ): Promise<Settings['system']>;

  exportSettings(): Promise<string>;
  importSettings(json: string): Promise<Settings>;
}

const DEFAULT_SETTINGS: Settings = {
  general: {
    siteName: 'Impact Training',
    siteDescription: '',
    siteUrl: '',
    logo: 'assets/logos/logo_white-remove.png',
    favicon: '',
    defaultLanguage: 'ar',
    timezone: 'Asia/Riyadh',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    currency: 'SAR',
  },

  contact: {
    email: 'info@impacttraining.com',
    phone: '+966 11 234 5678',
    socialMedia: {
      instagram: '@impactlearning',
      linkedin: 'linkedin.com/company/impactlearning',
    },
  },

  payment: {
    enabledGateways: [],
    defaultGateway: 'bank-transfer',
    bankTransfer: {
      bankName: '',
      accountNumber: '',
      iban: '',
      swiftCode: '',
      accountName: '',
      instructions: '',
    },
  },

  email: {
    enabled: false,
    fromEmail: 'info@impacttraining.com',
    fromName: 'Impact Training',
  },

  certificate: {
    defaultTemplateId: '',
    autoGenerate: false,
    requireCompletion: true,
    requireAssessmentPass: false,
  },

  security: {
    requireEmailVerification: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
  },

  analytics: {
    enableTracking: false,
    anonymizeIp: true,
  },

  notifications: {
    emailNotifications: {
      newOrder: true,
      newEnrollment: true,
      lowStock: true,
      abandonedCart: false,
    },
    smsNotifications: {
      enabled: false,
      newOrder: false,
      newEnrollment: false,
    },
  },

  system: {
    maintenanceMode: false,
    maintenanceMessage: '',
    allowedIps: [],
    version: '1.0.0',
    lastUpdated: new Date(),
  },

  updatedAt: new Date(),
};

let settings: Settings = structuredClone(DEFAULT_SETTINGS);

export class SettingsRepository implements ISettingsRepository {
  async findAll(): Promise<Settings> {
    return this.normalizeSettings(settings);
  }

  async update(settings: Partial<Settings>): Promise<Settings> {
    const current = await this.findAll();

    const updated: Settings = {
      ...current,

      ...settings,

      general: {
        ...current.general,
        ...(settings.general ?? {}),
      },

      contact: {
        ...current.contact,
        ...(settings.contact ?? {}),
        socialMedia: {
          ...current.contact.socialMedia,
          ...(settings.contact?.socialMedia ?? {}),
        },
        address: settings.contact?.address
          ? {
              ...current.contact.address,
              ...settings.contact.address,
            }
          : current.contact.address,
        workingHours: settings.contact?.workingHours
          ? {
              ...current.contact.workingHours,
              ...settings.contact.workingHours,
            }
          : current.contact.workingHours,
      },

      payment: {
        ...current.payment,
        ...(settings.payment ?? {}),
        enabledGateways:
          settings.payment?.enabledGateways ??
          current.payment.enabledGateways,
        stripe: settings.payment?.stripe
          ? {
              ...current.payment.stripe,
              ...settings.payment.stripe,
            }
          : current.payment.stripe,
        paypal: settings.payment?.paypal
          ? {
              ...current.payment.paypal,
              ...settings.payment.paypal,
            }
          : current.payment.paypal,
        bankTransfer: settings.payment?.bankTransfer
          ? {
              ...current.payment.bankTransfer,
              ...settings.payment.bankTransfer,
            }
          : current.payment.bankTransfer,
      },

      email: {
        ...current.email,
        ...(settings.email ?? {}),
        smtp: settings.email?.smtp
          ? {
              ...current.email.smtp,
              ...settings.email.smtp,
            }
          : current.email.smtp,
        templates: settings.email?.templates
          ? {
              ...current.email.templates,
              ...settings.email.templates,
            }
          : current.email.templates,
      },

      certificate: {
        ...current.certificate,
        ...(settings.certificate ?? {}),
        customTemplates:
          settings.certificate?.customTemplates ??
          current.certificate.customTemplates,
      },

      security: {
        ...current.security,
        ...(settings.security ?? {}),
      },

      analytics: {
        ...current.analytics,
        ...(settings.analytics ?? {}),
      },

      notifications: {
        ...current.notifications,
        ...(settings.notifications ?? {}),
        emailNotifications: {
          ...current.notifications.emailNotifications,
          ...(settings.notifications?.emailNotifications ?? {}),
        },
        smsNotifications: {
          ...current.notifications.smsNotifications,
          ...(settings.notifications?.smsNotifications ?? {}),
        },
      },

      system: {
        ...current.system,
        ...(settings.system ?? {}),
        allowedIps:
          settings.system?.allowedIps ??
          current.system.allowedIps,
      },

      updatedAt: new Date(),
    };

    settings = updated;

    return updated;
  }

  async reset(): Promise<Settings> {
    const defaults = this.cloneDefaults();

    settings = defaults;

    return defaults;
  }

  async getGeneralSettings(): Promise<Settings['general']> {
    const settings = await this.findAll();
    return settings.general;
  }

  async updateGeneralSettings(
    settings: Partial<Settings['general']>
  ): Promise<Settings['general']> {
    const current = await this.findAll();

    const updated = await this.update({
      general: {
        ...current.general,
        ...settings,
      },
    });

    return updated.general;
  }

  async getContactSettings(): Promise<Settings['contact']> {
    const settings = await this.findAll();
    return settings.contact;
  }

  async updateContactSettings(
    settings: Partial<Settings['contact']>
  ): Promise<Settings['contact']> {
    const current = await this.findAll();

    const updated = await this.update({
      contact: {
        ...current.contact,
        ...settings,
        socialMedia: {
          ...current.contact.socialMedia,
          ...(settings.socialMedia ?? {}),
        },
      },
    });

    return updated.contact;
  }

  async getPaymentSettings(): Promise<Settings['payment']> {
    const settings = await this.findAll();
    return settings.payment;
  }

  async updatePaymentSettings(
    settings: Partial<Settings['payment']>
  ): Promise<Settings['payment']> {
    const current = await this.findAll();

    const updated = await this.update({
      payment: {
        ...current.payment,
        ...settings,
        enabledGateways:
          settings.enabledGateways ??
          current.payment.enabledGateways,
      },
    });

    return updated.payment;
  }

  async getEmailSettings(): Promise<Settings['email']> {
    const settings = await this.findAll();
    return settings.email;
  }

  async updateEmailSettings(
    settings: Partial<Settings['email']>
  ): Promise<Settings['email']> {
    const current = await this.findAll();

    const updated = await this.update({
      email: {
        ...current.email,
        ...settings,
      },
    });

    return updated.email;
  }

  async getCertificateSettings(): Promise<Settings['certificate']> {
    const settings = await this.findAll();
    return settings.certificate;
  }

  async updateCertificateSettings(
    settings: Partial<Settings['certificate']>
  ): Promise<Settings['certificate']> {
    const current = await this.findAll();

    const updated = await this.update({
      certificate: {
        ...current.certificate,
        ...settings,
      },
    });

    return updated.certificate;
  }

  async getSecuritySettings(): Promise<Settings['security']> {
    const settings = await this.findAll();
    return settings.security;
  }

  async updateSecuritySettings(
    settings: Partial<Settings['security']>
  ): Promise<Settings['security']> {
    const current = await this.findAll();

    const updated = await this.update({
      security: {
        ...current.security,
        ...settings,
      },
    });

    return updated.security;
  }

  async getAnalyticsSettings(): Promise<Settings['analytics']> {
    const settings = await this.findAll();
    return settings.analytics;
  }

  async updateAnalyticsSettings(
    settings: Partial<Settings['analytics']>
  ): Promise<Settings['analytics']> {
    const current = await this.findAll();

    const updated = await this.update({
      analytics: {
        ...current.analytics,
        ...settings,
      },
    });

    return updated.analytics;
  }

  async getNotificationSettings(): Promise<Settings['notifications']> {
    const settings = await this.findAll();
    return settings.notifications;
  }

  async updateNotificationSettings(
    settings: Partial<Settings['notifications']>
  ): Promise<Settings['notifications']> {
    const current = await this.findAll();

    const updated = await this.update({
      notifications: {
        ...current.notifications,
        ...settings,
        emailNotifications: {
          ...current.notifications.emailNotifications,
          ...(settings.emailNotifications ?? {}),
        },
        smsNotifications: {
          ...current.notifications.smsNotifications,
          ...(settings.smsNotifications ?? {}),
        },
      },
    });

    return updated.notifications;
  }

  async getSystemSettings(): Promise<Settings['system']> {
    const settings = await this.findAll();
    return settings.system;
  }

  async updateSystemSettings(
    settings: Partial<Settings['system']>
  ): Promise<Settings['system']> {
    const current = await this.findAll();

    const updated = await this.update({
      system: {
        ...current.system,
        ...settings,
      },
    });

    return updated.system;
  }

  async exportSettings(): Promise<string> {
    const settings = await this.findAll();

    return JSON.stringify(
      settings,
      (_, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }

        return value;
      },
      2
    );
  }

  async importSettings(json: string): Promise<Settings> {
    const parsed = JSON.parse(json) as Partial<Settings>;

    return this.update(parsed);
  }

  private cloneDefaults(): Settings {
    return {
      ...DEFAULT_SETTINGS,

      general: {
        ...DEFAULT_SETTINGS.general,
      },

      contact: {
        ...DEFAULT_SETTINGS.contact,
        socialMedia: DEFAULT_SETTINGS.contact.socialMedia
          ? {
              ...DEFAULT_SETTINGS.contact.socialMedia,
            }
          : undefined,
        address: DEFAULT_SETTINGS.contact.address
          ? {
              ...DEFAULT_SETTINGS.contact.address,
            }
          : undefined,
        workingHours: DEFAULT_SETTINGS.contact.workingHours
          ? {
              ...DEFAULT_SETTINGS.contact.workingHours,
            }
          : undefined,
      },

      payment: {
        ...DEFAULT_SETTINGS.payment,
        enabledGateways: [
          ...DEFAULT_SETTINGS.payment.enabledGateways,
        ],
        stripe: DEFAULT_SETTINGS.payment.stripe
          ? {
              ...DEFAULT_SETTINGS.payment.stripe,
            }
          : undefined,
        paypal: DEFAULT_SETTINGS.payment.paypal
          ? {
              ...DEFAULT_SETTINGS.payment.paypal,
            }
          : undefined,
        bankTransfer: DEFAULT_SETTINGS.payment.bankTransfer
          ? {
              ...DEFAULT_SETTINGS.payment.bankTransfer,
            }
          : undefined,
      },

      email: {
        ...DEFAULT_SETTINGS.email,
        smtp: DEFAULT_SETTINGS.email.smtp
          ? {
              ...DEFAULT_SETTINGS.email.smtp,
            }
          : undefined,
        templates: DEFAULT_SETTINGS.email.templates
          ? {
              ...DEFAULT_SETTINGS.email.templates,
            }
          : undefined,
      },

      certificate: {
        ...DEFAULT_SETTINGS.certificate,
        customTemplates:
          DEFAULT_SETTINGS.certificate.customTemplates
            ? DEFAULT_SETTINGS.certificate.customTemplates.map(
                template => ({
                  ...template,
                })
              )
            : undefined,
      },

      security: {
        ...DEFAULT_SETTINGS.security,
      },

      analytics: {
        ...DEFAULT_SETTINGS.analytics,
      },

      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        emailNotifications: {
          ...DEFAULT_SETTINGS.notifications.emailNotifications,
        },
        smsNotifications: {
          ...DEFAULT_SETTINGS.notifications.smsNotifications,
        },
      },

      system: {
        ...DEFAULT_SETTINGS.system,
        allowedIps: DEFAULT_SETTINGS.system.allowedIps
          ? [...DEFAULT_SETTINGS.system.allowedIps]
          : undefined,
        lastUpdated: new Date(),
      },

      updatedAt: new Date(),
    };
  }

  private normalizeSettings(settings: Settings): Settings {
    const defaults = this.cloneDefaults();

    return {
      ...defaults,
      ...settings,

      general: {
        ...defaults.general,
        ...(settings.general ?? {}),
      },

      contact: {
        ...defaults.contact,
        ...(settings.contact ?? {}),
        socialMedia: {
          ...defaults.contact.socialMedia,
          ...(settings.contact?.socialMedia ?? {}),
        },
        address: settings.contact?.address
          ? {
              ...defaults.contact.address,
              ...settings.contact.address,
            }
          : defaults.contact.address,
        workingHours: settings.contact?.workingHours
          ? {
              ...defaults.contact.workingHours,
              ...settings.contact.workingHours,
            }
          : defaults.contact.workingHours,
      },

      payment: {
        ...defaults.payment,
        ...(settings.payment ?? {}),
        enabledGateways:
          settings.payment?.enabledGateways ??
          defaults.payment.enabledGateways,
        stripe: settings.payment?.stripe
          ? {
              ...defaults.payment.stripe,
              ...settings.payment.stripe,
            }
          : defaults.payment.stripe,
        paypal: settings.payment?.paypal
          ? {
              ...defaults.payment.paypal,
              ...settings.payment.paypal,
            }
          : defaults.payment.paypal,
        bankTransfer: settings.payment?.bankTransfer
          ? {
              ...defaults.payment.bankTransfer,
              ...settings.payment.bankTransfer,
            }
          : defaults.payment.bankTransfer,
      },

      email: {
        ...defaults.email,
        ...(settings.email ?? {}),
        smtp: settings.email?.smtp
          ? {
              ...defaults.email.smtp,
              ...settings.email.smtp,
            }
          : defaults.email.smtp,
        templates: settings.email?.templates
          ? {
              ...defaults.email.templates,
              ...settings.email.templates,
            }
          : defaults.email.templates,
      },

      certificate: {
        ...defaults.certificate,
        ...(settings.certificate ?? {}),
        customTemplates:
          settings.certificate?.customTemplates ??
          defaults.certificate.customTemplates,
      },

      security: {
        ...defaults.security,
        ...(settings.security ?? {}),
      },

      analytics: {
        ...defaults.analytics,
        ...(settings.analytics ?? {}),
      },

      notifications: {
        ...defaults.notifications,
        ...(settings.notifications ?? {}),
        emailNotifications: {
          ...defaults.notifications.emailNotifications,
          ...(settings.notifications?.emailNotifications ?? {}),
        },
        smsNotifications: {
          ...defaults.notifications.smsNotifications,
          ...(settings.notifications?.smsNotifications ?? {}),
        },
      },

      system: {
        ...defaults.system,
        ...(settings.system ?? {}),
        allowedIps:
          settings.system?.allowedIps ??
          defaults.system.allowedIps,
      },

      updatedAt: settings.updatedAt
        ? new Date(settings.updatedAt)
        : defaults.updatedAt,
    };
  }
}

export const settingsRepository = new SettingsRepository();