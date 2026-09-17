import { prisma } from '@/lib/prisma';

const SETTINGS_ID = 'default';

const DEFAULT_SETTINGS = {
  general: {
    siteName: 'Impact Training',
    siteDescription: '',
    siteUrl: '',
    logo: '',
    favicon: '',
    defaultLanguage: 'ar',
    timezone: 'Asia/Riyadh',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    currency: 'SAR',
  },
 contact: {
  email: 'info@impacttrainingsa.com',
  phone: '',
  whatsapp: '',
  socialMedia: {},
},
  payment: {},
  email: {
    enabled: false,
    fromEmail: 'info@impacttrainingsa.com',
    fromName: 'Impact Training',
  },
  certificate: {},
  security: {},
  analytics: {},
  notifications: {},
  system: {},
};

async function getSettings() {
  const existing = await prisma.appSettings.findUnique({
    where: {
      id: SETTINGS_ID,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.appSettings.create({
    data: {
      id: SETTINGS_ID,
      general: DEFAULT_SETTINGS.general,
      contact: DEFAULT_SETTINGS.contact,
      payment: DEFAULT_SETTINGS.payment,
      email: DEFAULT_SETTINGS.email,
      certificate: DEFAULT_SETTINGS.certificate,
      security: DEFAULT_SETTINGS.security,
      analytics: DEFAULT_SETTINGS.analytics,
      notifications: DEFAULT_SETTINGS.notifications,
      system: DEFAULT_SETTINGS.system,
    },
  });
}

export async function GET() {
  try {
    const settings = await getSettings();

    return Response.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Failed to load settings:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر تحميل إعدادات الموقع.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const current = await getSettings();

    const currentGeneral =
      current.general &&
      typeof current.general === 'object'
        ? current.general
        : {};

    const currentContact =
      current.contact &&
      typeof current.contact === 'object'
        ? current.contact
        : {};

    const general =
      body.general &&
      typeof body.general === 'object'
        ? {
            ...currentGeneral,
            ...body.general,
          }
        : currentGeneral;

    const contact =
      body.contact &&
      typeof body.contact === 'object'
        ? {
            ...currentContact,
            ...body.contact,
          }
        : currentContact;

    const updated = await prisma.appSettings.update({
      where: {
        id: SETTINGS_ID,
      },
      data: {
        general,
        contact,
      },
    });

    return Response.json({
      success: true,
      settings: updated,
    });
  } catch (error) {
    console.error('Failed to update settings:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر حفظ إعدادات الموقع.',
      },
      {
        status: 500,
      },
    );
  }
}