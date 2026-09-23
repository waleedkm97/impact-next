import { NextResponse } from 'next/server';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  dashboardPrisma?: PrismaClient;
};

function getPrisma() {
  if (globalForPrisma.dashboardPrisma) {
    return globalForPrisma.dashboardPrisma;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.dashboardPrisma = prisma;
  }

  return prisma;
}

const monthNames = Array.from({ length: 12 }, (_, index) =>
  new Date(2026, index, 1).toLocaleDateString('ar-SA', {
    month: 'long',
  }),
);

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

/**
 * السعر المعتمد للطلب.
 *
 * نستخدم total فقط لأنه يمثل السعر الحالي للطلب
 * بعد أي تعديل يتم على الطلب.
 *
 * لا نستخدم paymentAmount حتى لا يظهر مبلغ قديم
 * مثل 2400 بعد تعديل الطلب إلى 2225.
 */
function getCurrentOrderTotal(total: unknown) {
  const numeric = Number(total ?? 0);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return numeric;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const now = new Date();

    const year = parsePositiveInteger(
      url.searchParams.get('year'),
      now.getFullYear(),
    );

    const month = Math.min(
      12,
      parsePositiveInteger(
        url.searchParams.get('month'),
        now.getMonth() + 1,
      ),
    );

    const monthStart = new Date(
      year,
      month - 1,
      1,
      0,
      0,
      0,
      0,
    );

    const monthEnd = new Date(
      year,
      month,
      1,
      0,
      0,
      0,
      0,
    );

    const prisma = getPrisma();

    const [
      trainingCourses,
      recordedCourses,
      trainees,
      corporateGroups,
      categoryCount,
      couponCount,
      paidOrders,
      allSalesOrders,
      recentOrders,
    ] = await Promise.all([
      prisma.course.count({
        where: {
          type: 'training',
        },
      }),

      prisma.course.count({
        where: {
          type: 'recorded',
        },
      }),

      prisma.trainee.count(),

      prisma.trainingGroup.findMany({
        where: {
          companyName: {
            not: null,
          },
        },
        select: {
          companyName: true,
        },
        distinct: ['companyName'],
      }),

      prisma.category.count(),

      prisma.coupon.count(),

      /*
       * مبيعات الشهر المحدد فقط.
       *
       * هذا الرقم يتغير عند اختيار شهر مختلف.
       */
      prisma.order.findMany({
        where: {
          OR: [
            {
              paymentStatus: 'paid',
              OR: [
                {
                  paidAt: {
                    gte: monthStart,
                    lt: monthEnd,
                  },
                },
                {
                  paidAt: null,
                  createdAt: {
                    gte: monthStart,
                    lt: monthEnd,
                  },
                },
              ],
            },
            {
              status: {
                in: ['confirmed', 'completed'],
              },
              OR: [
                {
                  confirmedAt: {
                    gte: monthStart,
                    lt: monthEnd,
                  },
                },
                {
                  confirmedAt: null,
                  completedAt: {
                    gte: monthStart,
                    lt: monthEnd,
                  },
                },
                {
                  confirmedAt: null,
                  completedAt: null,
                  createdAt: {
                    gte: monthStart,
                    lt: monthEnd,
                  },
                },
              ],
            },
          ],
        },
        select: {
          total: true,
          paidAt: true,
          confirmedAt: true,
          completedAt: true,
          createdAt: true,
        },
      }),

      /*
       * إجمالي المبيعات بالكامل.
       *
       * لا يوجد فلتر شهر أو سنة هنا.
       *
       * يشمل جميع الطلبات المدفوعة أو المؤكدة أو المكتملة.
       *
       * المبلغ المعتمد دائمًا هو total الحالي للطلب.
       */
      prisma.order.findMany({
        where: {
          OR: [
            {
              paymentStatus: 'paid',
            },
            {
              status: {
                in: ['confirmed', 'completed'],
              },
            },
          ],
        },
        select: {
          total: true,
        },
      }),

      /*
       * آخر الطلبات.
       */
      prisma.order.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          paymentAmount: true,
          currency: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
          items: {
            orderBy: {
              id: 'asc',
            },
            take: 1,
            select: {
              title: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
        },
      }),
    ]);

    const companies = corporateGroups.filter(
      (group) =>
        typeof group.companyName === 'string' &&
        group.companyName.trim().length > 0,
    ).length;

    /**
     * المبيعات المحدد.
     *
     * المصدر الوحيد للمبلغ هو order.total.
     */
    const amount = paidOrders.reduce(
      (sum, order) => {
        return sum + getCurrentOrderTotal(order.total);
      },
      0,
    );

    /**
     * إجمالي جميع المبيعات.
     *
     * لا يتأثر بالشهر أو السنة المختارة.
     *
     * المصدر الوحيد للمبلغ هو order.total.
     */
    const totalAmount = allSalesOrders.reduce(
      (sum, order) => {
        return sum + getCurrentOrderTotal(order.total);
      },
      0,
    );

    /**
     * آخر الطلبات.
     *
     * نفس قاعدة المبلغ:
     * total فقط.
     */
    const normalizedRecentOrders = recentOrders.map((order) => {
      const amount = getCurrentOrderTotal(order.total);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        title: order.items[0]?.title ?? 'طلب',
        amount,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        status: order.status,
        createdAt: order.createdAt,
      };
    });

    return NextResponse.json({
      counts: {
        trainingCourses,
        recordedCourses,
        companies,
        trainees,
        categories: categoryCount,
        coupons: couponCount,
      },

      sales: {
        year,
        month,
        monthLabel: monthNames[month - 1],

        // مبيعات الشهر المختار فقط.
        amount,

        // إجمالي جميع المبيعات ولا يتغير بتغيير الشهر.
        totalAmount,

        paidOrders: paidOrders.length,
      },

      recentOrders: normalizedRecentOrders,
    });
  } catch (error) {
    console.error('Admin dashboard API error:', error);

    return NextResponse.json(
      {
        error: 'تعذر تحميل بيانات لوحة التحكم.',
      },
      {
        status: 500,
      },
    );
  }
}
