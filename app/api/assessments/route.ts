import { prisma } from '@/lib/prisma';
import { resolveAssessmentAccess } from '@/lib/assessment-access';
import { canAccessCourse } from '@/lib/staff-scope';
import { hasStaffPermission } from '@/lib/staff-authorization';

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const courseId =
      searchParams.get('courseId');
    const enrollmentId = searchParams.get('enrollmentId');
    const traineeId = request.headers.get('x-trainee-id')?.trim();

    if (
      request.headers.get('cookie')?.includes('impact_staff=') &&
      !(await hasStaffPermission(request, 'viewAssessments'))
    ) {
      return Response.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }

    if (courseId && request.headers.get('cookie')?.includes('impact_staff=')) {
      if (!(await canAccessCourse(request, courseId))) {
        return Response.json({ success: false, error: 'الدورة خارج نطاق الإسناد.' }, { status: 403 });
      }
    }

    const assessments =
      await prisma.courseAssessment.findMany({
        where: courseId
          ? {
              courseId,
            }
          : undefined,
        include: {
          questions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

    let course = null;

    if (courseId) {
      course =
        await prisma.course.findUnique({
          where: {
            id: courseId,
          },
         select: {
  id: true,
  type: true,
  trainingKind: true,
  postAssessmentEnabled: true,
  courseEvaluationEnabled: true,
},
        });
    }

    let access = null;

    if (enrollmentId) {
      if (!courseId || !traineeId) {
        return Response.json({ success: false, error: 'جلسة المتدرب مطلوبة.' }, { status: 401 });
      }

      const enrollment = await prisma.courseEnrollment.findFirst({
        where: { id: enrollmentId, traineeId, courseId },
        include: { schedule: true, group: true },
      });

      if (!enrollment) {
        return Response.json({ success: false, error: 'التسجيل لا يخص هذا المتدرب أو هذه الدورة.' }, { status: 403 });
      }

      access = (['pre', 'post', 'evaluation'] as const).map((type) =>
        resolveAssessmentAccess({
          type,
          assessmentExists: assessments.some(
            (assessment) =>
              assessment.assessmentType === type &&
              assessment.questions.length > 0,
          ),
          enrollment,
          course: course ?? {},
          schedule: enrollment.schedule,
          group: enrollment.group,
        }),
      );
    }

    return Response.json({
      success: true,
      assessments,
      course,
      access,
    });
  } catch (error) {
    console.error(
      'Failed to load assessments:',
      error,
    );

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (
      request.headers.get('cookie')?.includes('impact_staff=') &&
      !(await hasStaffPermission(request, 'editAssessments'))
    ) {
      return Response.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }
    const body =
      await request.json();

    if (body.courseId && request.headers.get('cookie')?.includes('impact_staff=')) {
      if (!(await canAccessCourse(request, String(body.courseId)))) {
        return Response.json({ success: false, error: 'الدورة خارج نطاق الإسناد.' }, { status: 403 });
      }
    }

    const {
      id,
      courseId,
      assessmentType,
      title,
      description,
      passingScore,
      timeLimit,
      questions,
    } = body;

    if (
      !id ||
      !courseId ||
      !title
    ) {
      return Response.json(
        {
          success: false,
          error:
            'Missing required assessment fields',
        },
        {
          status: 400,
        },
      );
    }

    const courseExists =
      await prisma.course.findUnique({
        where: {
          id: courseId,
        },
        select: {
          id: true,
        },
      });

    if (!courseExists) {
      return Response.json(
        {
          success: false,
          error: 'Course not found',
        },
        {
          status: 404,
        },
      );
    }

    const assessment =
      await prisma.courseAssessment.upsert({
        where: {
          id,
        },
        create: {
          id,
          courseId,
          assessmentType:
            assessmentType ?? null,
          title,
          description:
            description ?? null,
          passingScore:
            Number(
              passingScore ?? 0,
            ),
          timeLimit:
            timeLimit === null ||
            timeLimit === undefined
              ? null
              : Number(timeLimit),
          questions: {
            create:
              Array.isArray(
                questions,
              )
                ? questions.map(
                    (
                      question: any,
                      index: number,
                    ) => ({
                      id: question.id,
                      question:
                        question.question,
                      type:
                        question.type,
                      options:
                        Array.isArray(
                          question.options,
                        )
                          ? question.options
                          : [],
                      correctAnswer:
                        question.correctAnswer ??
                        '',
                      explanation:
                        question.explanation ??
                        null,
                      order: index,
                      points:
                        question.points ===
                          null ||
                        question.points ===
                          undefined
                          ? null
                          : Number(
                              question.points,
                            ),
                    }),
                  )
                : [],
          },
        },
        update: {
          courseId,
          assessmentType:
            assessmentType ?? null,
          title,
          description:
            description ?? null,
          passingScore:
            Number(
              passingScore ?? 0,
            ),
          timeLimit:
            timeLimit === null ||
            timeLimit === undefined
              ? null
              : Number(timeLimit),
          questions: {
            deleteMany: {},
            create:
              Array.isArray(
                questions,
              )
                ? questions.map(
                    (
                      question: any,
                      index: number,
                    ) => ({
                      id: question.id,
                      question:
                        question.question,
                      type:
                        question.type,
                      options:
                        Array.isArray(
                          question.options,
                        )
                          ? question.options
                          : [],
                      correctAnswer:
                        question.correctAnswer ??
                        '',
                      explanation:
                        question.explanation ??
                        null,
                      order: index,
                      points:
                        question.points ===
                          null ||
                        question.points ===
                          undefined
                          ? null
                          : Number(
                              question.points,
                            ),
                    }),
                  )
                : [],
          },
        },
        include: {
          questions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

    return Response.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error(
      'Failed to save assessment:',
      error,
    );

    return Response.json(
      {
        success: false,
        error:
          'Failed to save assessment',
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get('id');

    if (!id) {
      return Response.json(
        {
          success: false,
          error:
            'Assessment id is required',
        },
        {
          status: 400,
        },
      );
    }

    await prisma.courseAssessment.delete({
      where: {
        id,
      },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Failed to delete assessment:',
      error,
    );

    return Response.json(
      {
        success: false,
        error:
          'Failed to delete assessment',
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
) {
  try {
    const body =
      await request.json();

    if (
      !body.enrollmentId ||
      !body.type
    ) {
      return Response.json(
        {
          success: false,
          error:
            'Missing enrollmentId or assessment type',
        },
        {
          status: 400,
        },
      );
    }

    const traineeId = request.headers.get('x-trainee-id')?.trim();
    if (!traineeId) {
      return Response.json({ success: false, error: 'جلسة المتدرب مطلوبة.' }, { status: 401 });
    }

    if (!['pre', 'post', 'evaluation'].includes(body.type)) {
      return Response.json({ success: false, error: 'نوع التقييم غير صحيح.' }, { status: 400 });
    }

    const targetEnrollment = await prisma.courseEnrollment.findFirst({
      where: { id: body.enrollmentId, traineeId },
      include: {
        course: {
          include: {
            assessments: {
              select: {
                assessmentType: true,
                questions: { select: { id: true } },
              },
            },
          },
        },
        schedule: true,
        group: true,
      },
    });

    if (!targetEnrollment) {
      return Response.json({ success: false, error: 'التسجيل لا يخص المتدرب الحالي.' }, { status: 403 });
    }

    const access = resolveAssessmentAccess({
      type: body.type,
      assessmentExists: targetEnrollment.course.assessments.some(
        (assessment) =>
          assessment.assessmentType === body.type &&
          assessment.questions.length > 0,
      ),
      enrollment: targetEnrollment,
      course: targetEnrollment.course,
      schedule: targetEnrollment.schedule,
      group: targetEnrollment.group,
    });

    if (!access.available) {
      return Response.json({ success: false, error: access.reason || 'التقييم غير متاح حاليًا.' }, { status: 403 });
    }

    const data: Record<
      string,
      unknown
    > = {};

    if (body.type === 'pre') {
      data.preAssessment =
        'completed';

      data.preAssessmentScore =
        Number(
          body.score ?? 0,
        );

      data.preAssessmentAnswers =
        body.answers ?? null;

      data.preAssessmentCompletedAt =
        new Date();
    } else if (
      body.type === 'post'
    ) {
      data.postAssessment =
        'completed';

      data.postAssessmentScore =
        Number(
          body.score ?? 0,
        );

      data.postAssessmentAnswers =
        body.answers ?? null;

      data.postAssessmentCompletedAt =
        new Date();
    } else if (
      body.type === 'evaluation'
    ) {
      data.courseEvaluation =
        'completed';

      data.courseEvaluationScore =
        Number(
          body.score ?? 0,
        );

      data.courseEvaluationAnswers =
        body.answers ?? null;

      data.courseEvaluationCompletedAt =
        new Date();
    } else {
      return Response.json(
        {
          success: false,
          error:
            'Invalid assessment type',
        },
        {
          status: 400,
        },
      );
    }

    const enrollment =
      await prisma.courseEnrollment.update(
        {
          where: {
            id: body.enrollmentId,
          },
          data,
        },
      );

    return Response.json({
      success: true,
      enrollment,
    });
  } catch (error) {
    console.error(
      'Failed to save assessment result:',
      error,
    );

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save assessment result',
      },
      {
        status: 500,
      },
    );
  }
}
