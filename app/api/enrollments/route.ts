import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initialAssessmentStates } from '@/lib/assessment-access';
export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const traineeId =
      searchParams.get('traineeId')?.trim() || '';

    if (!traineeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'traineeId مطلوب.',
        },
        { status: 400 },
      );
    }

    const enrollments =
      await prisma.courseEnrollment.findMany({
        where: {
          traineeId,
        },
        include: {
          course: true,
          schedule: true,
          group: true,
          certificate: true,
          progressRecords: true,
          attendanceDays: true,
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      });

    return NextResponse.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    console.error(
      'GET /api/enrollments error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'تعذر تحميل تسجيلات المتدرب.',
      },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const traineeId = String(body?.traineeId || '').trim();
    const courseId = String(body?.courseId || '').trim();
    const scheduleId = body?.scheduleId
      ? String(body.scheduleId).trim()
      : null;
    const groupId = body?.groupId
      ? String(body.groupId).trim()
      : null;

    if (!traineeId || !courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'traineeId و courseId مطلوبان.',
        },
        { status: 400 },
      );
    }

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

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        trainingKind: true,
        assessments: {
          select: { assessmentType: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'الدورة غير موجودة.',
        },
        { status: 404 },
      );
    }

    const schedule = scheduleId
      ? await prisma.schedule.findUnique({
        where: {
          id: scheduleId,
        },
        })
      : null;

    if (scheduleId && !schedule) {
        return NextResponse.json(
          {
            success: false,
            error: 'الموعد غير موجود.',
          },
          { status: 404 },
        );
    }

    if (scheduleId) {
      if (schedule?.courseId !== courseId) {
        return NextResponse.json(
          {
            success: false,
            error: 'الموعد لا ينتمي إلى هذه الدورة.',
          },
          { status: 400 },
        );
      }
    }

    const group = groupId
      ? await prisma.trainingGroup.findUnique({ where: { id: groupId } })
      : null;

    if (groupId && (!group || group.courseId !== courseId)) {
      return NextResponse.json(
        { success: false, error: 'المجموعة لا تنتمي إلى هذه الدورة.' },
        { status: 400 },
      );
    }

    const existing = await prisma.courseEnrollment.findFirst({
      where: {
        traineeId,
        courseId,
        ...(scheduleId
          ? {
              scheduleId,
            }
          : {}),
        ...(groupId
          ? {
              groupId,
            }
          : {}),
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        created: false,
        enrollment: existing,
      });
    }

    const states = initialAssessmentStates({
      assessmentTypes: course.assessments.flatMap((item) =>
        item.assessmentType === 'pre' || item.assessmentType === 'post' || item.assessmentType === 'evaluation'
          ? [item.assessmentType]
          : [],
      ),
      enrollment: { scheduleId, groupId },
      course,
      schedule,
      group,
    });

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        id: crypto.randomUUID(),
        traineeId,
        courseId,
        courseTitle: course.title,
        scheduleId,
        groupId,
        status: 'active',
        progress: 0,
        ...states,
      },
    });

    return NextResponse.json({
      success: true,
      created: true,
      enrollment,
    });
  } catch (error) {
    console.error(
      'POST /api/enrollments error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'تعذر إنشاء تسجيل الدورة.',
      },
      { status: 500 },
    );
  }
}