import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initialAssessmentStates } from '@/lib/assessment-access';

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
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