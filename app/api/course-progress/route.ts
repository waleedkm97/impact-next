import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function serializeDecimal(value: unknown) {
  if (value === null || value === undefined) {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber?: unknown }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return value;
}

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const {
      enrollmentId,
      lessonId,
      completed = true,
      timeSpent = 0,
      score = null,
      attempts = 1,
    } = body;

    if (!enrollmentId || !lessonId) {
      return NextResponse.json(
        {
          success: false,
          error: 'enrollmentId و lessonId مطلوبة.',
        },
        { status: 400 },
      );
    }

    const enrollment =
      await prisma.courseEnrollment.findUnique({
        where: {
          id: enrollmentId,
        },
      });

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'التسجيل غير موجود.',
        },
        { status: 404 },
      );
    }

    const lesson = await prisma.courseLesson.findUnique({
      where: {
        id: lessonId,
      },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!lesson) {
      return NextResponse.json(
        {
          success: false,
          error: 'الدرس غير موجود.',
        },
        { status: 404 },
      );
    }

    if (lesson.courseId !== enrollment.courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'الدرس لا ينتمي إلى هذه الدورة.',
        },
        { status: 400 },
      );
    }

    const existingProgress =
      await prisma.courseProgress.findFirst({
        where: {
          enrollmentId,
          lessonId,
        },
      });

    const progress = existingProgress
      ? await prisma.courseProgress.update({
          where: {
            id: existingProgress.id,
          },
          data: {
            completed: Boolean(completed),
            completedAt: completed
              ? new Date()
              : null,
            timeSpent: Number(timeSpent ?? 0),
            score:
              score === null || score === undefined
                ? null
                : Number(score),
            attempts: Number(attempts ?? 1),
          },
        })
      : await prisma.courseProgress.create({
          data: {
            id: crypto.randomUUID(),
            traineeId: enrollment.traineeId,
            courseId: enrollment.courseId,
            enrollmentId,
            lessonId,
            completed: Boolean(completed),
            completedAt: completed
              ? new Date()
              : null,
            timeSpent: Number(timeSpent ?? 0),
            score:
              score === null || score === undefined
                ? null
                : Number(score),
            attempts: Number(attempts ?? 1),
          },
        });

    const allLessons =
      await prisma.courseLesson.findMany({
        where: {
          courseId: enrollment.courseId,
        },
        select: {
          id: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

    const completedProgress =
      await prisma.courseProgress.findMany({
        where: {
          enrollmentId,
          completed: true,
        },
        select: {
          lessonId: true,
        },
      });

    const completedLessonIds = new Set(
      completedProgress.map(
        (item) => item.lessonId,
      ),
    );

    const totalLessons = allLessons.length;

    const completedLessons = allLessons.filter(
      (lessonItem) =>
        completedLessonIds.has(lessonItem.id),
    ).length;

    const progressPercentage =
      totalLessons > 0
        ? Math.round(
            (completedLessons / totalLessons) * 100,
          )
        : 0;

    const updatedEnrollment =
      await prisma.courseEnrollment.update({
        where: {
          id: enrollmentId,
        },
        data: {
          progress: progressPercentage,
          lastAccessedAt: new Date(),
          ...(progressPercentage >= 100
            ? {
                completedAt:
                  enrollment.completedAt ??
                  new Date(),
              }
            : {}),
        },
      });

    return NextResponse.json({
      success: true,
      progress: {
        ...progress,
        score: serializeDecimal(progress.score),
        completedAt: serializeDate(
          progress.completedAt,
        ),
      },
      enrollment: {
        ...updatedEnrollment,
        preAssessmentScore:
          serializeDecimal(
            updatedEnrollment.preAssessmentScore,
          ),
        postAssessmentScore:
          serializeDecimal(
            updatedEnrollment.postAssessmentScore,
          ),
        courseEvaluationScore:
          serializeDecimal(
            updatedEnrollment.courseEvaluationScore,
          ),
        enrolledAt: serializeDate(
          updatedEnrollment.enrolledAt,
        ),
        completedAt: serializeDate(
          updatedEnrollment.completedAt,
        ),
        lastAccessedAt: serializeDate(
          updatedEnrollment.lastAccessedAt,
        ),
      },
      progressPercentage,
      completedLessons,
      totalLessons,
    });
  } catch (error) {
    console.error(
      'PATCH /api/course-progress error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'تعذر حفظ تقدم الدورة.',
      },
      { status: 500 },
    );
  }
}