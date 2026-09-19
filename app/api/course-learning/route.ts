import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAssessmentAccess } from '@/lib/assessment-access';
import { issueCertificateForEnrollment } from '@/lib/certificate-service';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'معرف الدورة مطلوب.',
        },
        { status: 400 },
      );
    }

    const traineeId =
      request.headers.get('x-trainee-id') ||
      request.headers
        .get('cookie')
        ?.split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith('impact_trainee='))
        ?.split('=')
        .slice(1)
        .join('=') ||
      '';

    if (!traineeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'لم يتم العثور على جلسة المتدرب.',
        },
        { status: 401 },
      );
    }

    const [course, enrollment] = await Promise.all([
      prisma.course.findUnique({
        where: {
          id: courseId,
        },
        include: {
          assessments: {
            include: {
              questions: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          lessons: {
            include: {
              questions: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      }),

      prisma.courseEnrollment.findFirst({
        where: {
          traineeId,
          courseId,
        },
        include: {
          attendanceDays: {
            orderBy: {
              date: 'asc',
            },
          },
          certificate: true,
          group: true,
          schedule: {
            include: {
              sessions: {
                orderBy: {
                  date: 'asc',
                },
              },
            },
          },
          progressRecords: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'الدورة غير موجودة.',
        },
        { status: 404 },
      );
    }

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'لا يوجد تسجيل لهذه الدورة لدى المتدرب.',
        },
        { status: 404 },
      );
    }

    const certificateResult =
      await issueCertificateForEnrollment(enrollment.id);

    const trainee = await prisma.trainee.findUnique({
      where: {
        id: traineeId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        firstNameEnglish: true,
        lastNameEnglish: true,
        email: true,
        phone: true,
        companyName: true,
        companyId: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!trainee) {
      return NextResponse.json(
        {
          success: false,
          error: 'المتدرب غير موجود.',
        },
        { status: 404 },
      );
    }

    const assessmentAccess = (['pre', 'post', 'evaluation'] as const).map(
      (type) =>
        resolveAssessmentAccess({
          type,
          assessmentExists: course.assessments.some(
            (assessment) =>
              assessment.assessmentType === type &&
              assessment.questions.length > 0,
          ),
          enrollment,
          course,
          schedule: enrollment.schedule,
          group: enrollment.group,
        }),
    );

    const response = {
      success: true,

      trainee,

      course: {
        ...course,
        price: serializeDecimal(course.price),
        oldPrice: serializeDecimal(course.oldPrice),
        discount: serializeDecimal(course.discount),
        hours: serializeDecimal(course.hours),
        lessons: course.lessons.map((lesson) => ({
          ...lesson,
        })),
        assessments: course.assessments.map((assessment) => ({
          ...assessment,
        })),
      },

      assessmentAccess,

      enrollment: {
        ...enrollment,
        preAssessmentScore: serializeDecimal(
          enrollment.preAssessmentScore,
        ),
        postAssessmentScore: serializeDecimal(
          enrollment.postAssessmentScore,
        ),
        courseEvaluationScore: serializeDecimal(
          enrollment.courseEvaluationScore,
        ),
        enrolledAt: serializeDate(enrollment.enrolledAt),
        completedAt: serializeDate(enrollment.completedAt),
        lastAccessedAt: serializeDate(
          enrollment.lastAccessedAt,
        ),
        preAssessmentCompletedAt: serializeDate(
          enrollment.preAssessmentCompletedAt,
        ),
        postAssessmentCompletedAt: serializeDate(
          enrollment.postAssessmentCompletedAt,
        ),
        courseEvaluationCompletedAt: serializeDate(
          enrollment.courseEvaluationCompletedAt,
        ),
        attendanceDays:
          enrollment.attendanceDays.map((day) => ({
            ...day,
            date: serializeDate(day.date),
            markedAt: serializeDate(day.markedAt),
          })),
        progressRecords:
          enrollment.progressRecords.map((record) => ({
            ...record,
            score: serializeDecimal(record.score),
            completedAt: serializeDate(record.completedAt),
          })),
        certificate: certificateResult.certificate
          ? {
              ...certificateResult.certificate,
              issuedAt: serializeDate(
                certificateResult.certificate.issuedAt,
              ),
            }
          : null,
      },

      group: enrollment.group
        ? {
            ...enrollment.group,
          }
        : null,

      schedule: enrollment.schedule
        ? {
            ...enrollment.schedule,
            price: serializeDecimal(
              enrollment.schedule.price,
            ),
            startDate: serializeDate(
              enrollment.schedule.startDate,
            ),
            endDate: serializeDate(
              enrollment.schedule.endDate,
            ),
            confirmationDeadline: serializeDate(
              enrollment.schedule.confirmationDeadline,
            ),
            cancellationDeadline: serializeDate(
              enrollment.schedule.cancellationDeadline,
            ),
            sessions:
              enrollment.schedule.sessions.map((session) => ({
                ...session,
                date: serializeDate(session.date),
              })),
          }
        : null,

      certificate: certificateResult.certificate
        ? {
            ...certificateResult.certificate,
            issuedAt: serializeDate(
              certificateResult.certificate.issuedAt,
            ),
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      'GET /api/course-learning error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: 'تعذر تحميل بيانات الدورة.',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (
      !body.enrollmentId ||
      typeof body.dayIndex !== 'number' ||
      !body.status
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'enrollmentId و dayIndex و status مطلوبة.',
        },
        { status: 400 },
      );
    }

    if (
      body.status !== 'present' &&
      body.status !== 'absent'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'حالة الحضور غير صحيحة.',
        },
        { status: 400 },
      );
    }

    const enrollment =
      await prisma.courseEnrollment.findUnique({
        where: {
          id: body.enrollmentId,
        },
        include: {
          attendanceDays: {
            orderBy: {
              date: 'asc',
            },
          },
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

    let attendanceDays = enrollment.attendanceDays;

    if (attendanceDays.length <= body.dayIndex) {
      const course = await prisma.course.findUnique({
        where: {
          id: enrollment.courseId,
        },
        select: {
          days: true,
        },
      });

      const numberOfDays = Math.max(
        course?.days ?? 3,
        3,
      );

      const existingDates = new Set(
        attendanceDays.map((day) =>
          new Date(day.date).toISOString().slice(0, 10),
        ),
      );

      const baseDate = new Date(
        enrollment.enrolledAt,
      );

      const missingDays = [];

      for (
        let index = attendanceDays.length;
        index < numberOfDays;
        index += 1
      ) {
        const date = new Date(baseDate);
        date.setHours(0, 0, 0, 0);
        date.setDate(
          date.getDate() + index,
        );

        const key = date
          .toISOString()
          .slice(0, 10);

        if (existingDates.has(key)) {
          continue;
        }

        missingDays.push({
          id: crypto.randomUUID(),
          enrollmentId: enrollment.id,
          date,
          status: 'not_marked' as const,
        });
      }

      if (missingDays.length > 0) {
        await prisma.attendanceDay.createMany({
          data: missingDays,
          skipDuplicates: true,
        });
      }

      attendanceDays =
        await prisma.attendanceDay.findMany({
          where: {
            enrollmentId: enrollment.id,
          },
          orderBy: {
            date: 'asc',
          },
        });
    }

    const targetDay =
      attendanceDays[body.dayIndex];

    if (!targetDay) {
      return NextResponse.json(
        {
          success: false,
          error: 'يوم الحضور غير موجود.',
        },
        { status: 404 },
      );
    }

    const updatedDay =
      await prisma.attendanceDay.update({
        where: {
          id: targetDay.id,
        },
        data: {
          status: body.status,
          markedAt: new Date(),
        },
      });

    const updatedEnrollment =
      await prisma.courseEnrollment.findUnique({
        where: {
          id: enrollment.id,
        },
        include: {
          attendanceDays: {
            orderBy: {
              date: 'asc',
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      attendanceDay: {
        ...updatedDay,
        date: updatedDay.date.toISOString(),
        markedAt: updatedDay.markedAt
          ? updatedDay.markedAt.toISOString()
          : null,
      },
      enrollment: updatedEnrollment
        ? {
            ...updatedEnrollment,
            attendanceDays:
              updatedEnrollment.attendanceDays.map(
                (day) => ({
                  ...day,
                  date: day.date.toISOString(),
                  markedAt: day.markedAt
                    ? day.markedAt.toISOString()
                    : null,
                }),
              ),
          }
        : null,
    });
  } catch (error) {
    console.error(
      'PATCH /api/course-learning error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: 'تعذر حفظ الحضور.',
      },
      { status: 500 },
    );
  }
}
