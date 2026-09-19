import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasStaffPermission } from '@/lib/staff-authorization';

function normalizePaymentMethod(value: unknown) {
  if (
    value === 'online-payment' ||
    value === 'online_payment'
  ) {
    return 'online_payment';
  }

  if (
    value === 'bank-transfer' ||
    value === 'bank_transfer'
  ) {
    return 'bank_transfer';
  }

  if (value === 'credit_card' || value === 'cash') {
    return value;
  }

  return 'online_payment';
}

function serializeOrder(order: any) {
  return {
    ...order,

    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    paymentAmount: Number(order.paymentAmount),

    customer: {
      traineeId: order.traineeId || '',
      name: order.customerName || '',
      email: order.customerEmail || '',
      phone: order.customerPhone || '',
      company: order.customerCompany || '',
      responsibleName: order.responsibleName || '',
      responsibleEmail: order.responsibleEmail || '',
      responsiblePhone: order.responsiblePhone || '',
      groupId: order.groupId || undefined,
    },

    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      amount: Number(order.paymentAmount),
      currency: order.paymentCurrency,
      transactionId: order.transactionId || undefined,
    },

    metadata: order.metadata || undefined,

    items: (order.items || []).map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      discount:
        item.discount === null ||
        item.discount === undefined
          ? undefined
          : Number(item.discount),
      type:
        item.type === 'training_program'
          ? 'training-program'
          : item.type,
    })),
  };
}

export async function GET(request: Request) {
  try {
    if (!(await hasStaffPermission(request, 'viewOrders'))) {
      return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        schedule: true,
        trainee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map(serializeOrder),
    });
  } catch (error) {
    console.error('GET /api/orders error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'تعذر تحميل الطلبات.',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      traineeId,
      type,
      customer,
      items,
      subtotal,
      discount,
      tax,
      total,
      currency,
      payment,
      status,
      notes,
      scheduleId,
      bookingDate,
      metadata,
      expectedTrainees,
      groupId,
      companyId,
    } = body;

    if (!customer?.name || !customer?.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'بيانات العميل غير مكتملة.',
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'يجب أن يحتوي الطلب على دورة واحدة على الأقل.',
        },
        { status: 400 },
      );
    }

    if (!traineeId && !(await hasStaffPermission(request, 'editOrders'))) {
      return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }

    if (traineeId) {
      const trainee = await prisma.trainee.findUnique({
        where: {
          id: traineeId,
        },
        select: {
          id: true,
        },
      });

      if (!trainee) {
        return NextResponse.json(
          {
            success: false,
            error: 'المتدرب غير موجود في قاعدة البيانات.',
          },
          { status: 404 },
        );
      }
    }
let validScheduleId: string | null = null;

if (scheduleId) {
  const sqlSchedule = await prisma.schedule.findUnique({
    where: {
      id: scheduleId,
    },
    select: {
      id: true,
    },
  });

  if (sqlSchedule) {
    validScheduleId = sqlSchedule.id;
  }
}
    const order = await prisma.order.create({
      data: {
        id: crypto.randomUUID(),

        type:
          type === 'corporate'
            ? 'corporate'
            : 'public',

        orderNumber: `ORD-${Date.now()}`,

        traineeId,

        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || null,
        customerCompany: customer.company || null,

        companyId: companyId || null,
        groupId: groupId || null,

        responsibleName:
          customer.responsibleName || null,
        responsibleEmail:
          customer.responsibleEmail || null,
        responsiblePhone:
          customer.responsiblePhone || null,

        subtotal: Number(subtotal || 0),
        discount: Number(discount || 0),
        tax: Number(tax || 0),
        total: Number(total || 0),

        currency: currency || 'SAR',

        paymentMethod: normalizePaymentMethod(
          payment?.method,
        ),

        paymentStatus:
          payment?.status || 'pending',

        paymentAmount: Number(
          payment?.amount || total || 0,
        ),

        paymentCurrency:
          payment?.currency ||
          currency ||
          'SAR',

        transactionId:
          payment?.transactionId || null,

        status: status || 'pending',

        notes: notes || null,

        expectedTrainees:
          expectedTrainees === null || expectedTrainees === undefined || expectedTrainees === ''
            ? null
            : Number(expectedTrainees),

        scheduleId: validScheduleId,

        bookingDate: bookingDate
          ? new Date(bookingDate)
          : null,

        metadata: metadata || null,

        items: {
          create: items.map((item: any) => ({
            id:
              item.id ||
              crypto.randomUUID(),

            type:
              item.type ===
              'training-program'
                ? 'training_program'
                : item.type ===
                    'training_program'
                  ? 'training_program'
                  : item.type === 'service'
                    ? 'service'
                    : 'course',

            itemId: item.itemId,
            title: item.title,
            description:
              item.description || null,

            quantity: Number(
              item.quantity || 1,
            ),

            unitPrice: Number(
              item.unitPrice || 0,
            ),

            totalPrice: Number(
              item.totalPrice || 0,
            ),

            discount:
              item.discount !== undefined &&
              item.discount !== null
                ? Number(item.discount)
                : null,

            metadata:
              item.metadata || null,
          })),
        },
      },

      include: {
        items: true,
        schedule: true,
        trainee: true,
      },
    });

    return NextResponse.json({
      success: true,
      order: serializeOrder(order),
    });
  } catch (error) {
    console.error('POST /api/orders error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'تعذر إنشاء الطلب.',
      },
      { status: 500 },
    );
  }
}