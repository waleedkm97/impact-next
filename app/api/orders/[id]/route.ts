import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initialAssessmentStates } from '@/lib/assessment-access';
import { hasStaffPermission } from '@/lib/staff-authorization';

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    if (!(await hasStaffPermission(request, 'editOrders'))) {
      return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }
    const { id } = await context.params;

    const body = await request.json();
    const status = body?.status;

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'الطلب غير موجود.',
        },
        { status: 404 },
      );
    }

    if (body?.mode === 'details') {
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          type: body.type === 'corporate' ? 'corporate' : 'public',
          customerName: body.customer?.name || order.customerName,
          customerEmail: body.customer?.email || order.customerEmail,
          customerPhone: body.customer?.phone || null,
          customerCompany: body.customer?.company || null,
          responsibleName: body.customer?.responsibleName || null,
          responsibleEmail: body.customer?.responsibleEmail || null,
          responsiblePhone: body.customer?.responsiblePhone || null,
          subtotal: Number(body.subtotal ?? order.subtotal),
          total: Number(body.total ?? order.total),
          scheduleId: body.scheduleId || null,
          notes: body.notes || null,
          expectedTrainees:
            body.expectedTrainees === null || body.expectedTrainees === undefined || body.expectedTrainees === ''
              ? null
              : Number(body.expectedTrainees),
          metadata: body.metadata || null,
          items: {
            deleteMany: {},
            create: (body.items ?? []).map((item: any) => ({
              id: item.id || crypto.randomUUID(),
              type: item.type === 'training-program' || item.type === 'training_program'
                ? 'training_program'
                : item.type === 'service'
                  ? 'service'
                  : 'course',
              itemId: item.itemId,
              title: item.title,
              quantity: Number(item.quantity || 1),
              unitPrice: Number(item.unitPrice || 0),
              totalPrice: Number(item.totalPrice || 0),
              discount: item.discount == null ? null : Number(item.discount),
            })),
          },
        },
        include: {
          items: true,
          schedule: true,
          trainee: true,
        },
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    if (status === 'confirmed') {
      if (!order.traineeId) {
        return NextResponse.json(
          {
            success: false,
            error:
              'لا يوجد متدرب مرتبط بهذا الطلب.',
          },
          { status: 400 },
        );
      }

      const courseItem = order.items.find(
        (item) =>
          item.type === 'course' ||
          item.type === 'training_program',
      );

      if (!courseItem) {
        return NextResponse.json(
          {
            success: false,
            error:
              'لا توجد دورة مرتبطة بهذا الطلب.',
          },
          { status: 400 },
        );
      }

      const course =
        await prisma.course.findUnique({
          where: {
            id: courseItem.itemId,
          },
          select: {
            id: true,
            title: true,
            type: true,
            trainingKind: true,
            assessments: { select: { assessmentType: true } },
          },
        });

      if (!course) {
        return NextResponse.json(
          {
            success: false,
            error:
              'الدورة المرتبطة بالطلب غير موجودة.',
          },
          { status: 404 },
        );
      }

      const existingEnrollment =
        await prisma.courseEnrollment.findFirst({
          where: {
            traineeId: order.traineeId,
            courseId: course.id,
            ...(order.scheduleId
              ? {
                  scheduleId:
                    order.scheduleId,
                }
              : {}),
            ...(order.groupId
              ? {
                  groupId: order.groupId,
                }
              : {}),
          },
          orderBy: {
            enrolledAt: 'desc',
          },
        });

      let enrollment =
        existingEnrollment;

      if (!enrollment) {
        const schedule = order.scheduleId
          ? await prisma.schedule.findUnique({ where: { id: order.scheduleId } })
          : null;
        const group = order.groupId
          ? await prisma.trainingGroup.findUnique({ where: { id: order.groupId } })
          : null;
        const states = initialAssessmentStates({
          assessmentTypes: course.assessments.flatMap((item) =>
            item.assessmentType === 'pre' || item.assessmentType === 'post' || item.assessmentType === 'evaluation'
              ? [item.assessmentType]
              : [],
          ),
          enrollment: { scheduleId: order.scheduleId || null, groupId: order.groupId || null },
          course,
          schedule,
          group,
        });

        enrollment =
          await prisma.courseEnrollment.create({
            data: {
              id: crypto.randomUUID(),

              traineeId:
                order.traineeId,

              courseId: course.id,

              courseTitle:
                course.title,

              scheduleId:
                order.scheduleId || null,

              groupId:
                order.groupId || null,

              status: 'active',

              progress: 0,

              ...states,
            },
          });
      }

      const updatedOrder =
        await prisma.order.update({
          where: {
            id,
          },
          data: {
            status: 'confirmed',
            confirmedAt: new Date(),
          },
          include: {
            items: true,
            schedule: true,
            trainee: true,
          },
        });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        enrollment,
      });
    }

    if (
      status === 'cancelled' ||
      status === 'processing' ||
      status === 'completed' ||
      status === 'refunded' ||
      status === 'pending'
    ) {
      const updatedOrder =
        await prisma.order.update({
          where: {
            id,
          },
          data: {
            status,

            ...(status === 'cancelled'
              ? {
                  cancelledAt:
                    new Date(),
                }
              : {}),

            ...(status === 'completed'
              ? {
                  completedAt:
                    new Date(),
                }
              : {}),
          },

          include: {
            items: true,
            schedule: true,
            trainee: true,
          },
        });

      return NextResponse.json({
        success: true,
        order: updatedOrder,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'حالة الطلب غير صالحة.',
      },
      { status: 400 },
    );
  } catch (error) {
    console.error(
      'PATCH /api/orders/[id] error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'تعذر تحديث الطلب.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    if (!(await hasStaffPermission(_request, 'editOrders'))) {
      return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }
    const { id } = await context.params;

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'تعذر حذف الطلب.',
      },
      { status: 500 },
    );
  }
}