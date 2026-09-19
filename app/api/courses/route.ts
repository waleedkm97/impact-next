import { prisma } from '@/lib/prisma';

const RATING_OPTIONS = [
  '1 - ضعيف جدًا',
  '2 - ضعيف',
  '3 - جيد',
  '4 - جيد جدًا',
  '5 - ممتاز',
];

const UNIFIED_EVALUATION_QUESTIONS = [
  'كيف تقيّم الدورة التدريبية بشكل عام؟',
  'كيف تقيّم المدرب وطريقة تقديمه للمحتوى؟',
  'كيف تقيّم المادة التدريبية والمحتوى؟',
  'كيف تقيّم وضوح وتنظيم المحتوى؟',
  'كيف تقيّم الجانب العملي والتطبيقات؟',
  'كيف تقيّم مدة البرنامج ووقت التدريب؟',
  'كيف تقيّم تنظيم وتجهيز البرنامج؟',
  'ما مدى استفادتك من البرنامج؟',
  'ما مدى توصيتك بهذا البرنامج لزملائك؟',
  'ما رأيك أو اقتراحاتك لتحسين البرنامج؟',
];

export async function GET(request: Request) {
  try {
    const courseId = new URL(request.url).searchParams.get('id')?.trim();

    if (!courseId) {
      return Response.json(
        { success: false, error: 'معرف الدورة مطلوب.' },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        assessments: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!course) {
      return Response.json(
        { success: false, error: 'الدورة غير موجودة.' },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('GET /api/courses error:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر تحميل الدورة من قاعدة البيانات.',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.id || !body.title || !body.slug || !body.type) {
      return Response.json(
        {
          success: false,
          error: 'Missing required course fields',
        },
        { status: 400 },
      );
    }

    const courseType =
      body.type === 'recorded'
        ? 'recorded'
        : 'training';

    const course = await prisma.course.upsert({
      where: {
        id: body.id,
      },
      create: {
        id: body.id,
        title: body.title,
        slug: body.slug,
        description: body.description ?? '',
        shortDescription: body.shortDescription ?? null,
        categoryId: body.categoryId ?? null,
        type: courseType,
        delivery:
          body.delivery === 'online'
            ? 'online'
            : body.delivery === 'hybrid'
              ? 'hybrid'
              : 'in_person',
        trainingKind:
          body.trainingKind === 'corporate'
            ? 'corporate'
            : 'public',
        cities: Array.isArray(body.cities)
          ? body.cities
          : [],
        price: Number(body.price ?? 0),
        oldPrice:
          body.oldPrice === null ||
          body.oldPrice === undefined
            ? null
            : Number(body.oldPrice),
        discount:
          body.discount === null ||
          body.discount === undefined
            ? null
            : Number(body.discount),
        currency: body.currency ?? 'SAR',
        days:
          body.days === null ||
          body.days === undefined
            ? null
            : Number(body.days),
        hours: Number(body.hours ?? 0),
        videosCount: Number(body.videosCount ?? 0),
        objectives: Array.isArray(body.objectives)
          ? body.objectives
          : [],
        outcomes: Array.isArray(body.outcomes)
          ? body.outcomes
          : [],
        outline: body.outline ?? null,
        audience: body.audience ?? null,
        methodology: body.methodology ?? null,
        materialUrl: body.materialUrl ?? null,
        meetingLink: body.meetingLink ?? null,
        image: body.image ?? null,
        thumbnail: body.thumbnail ?? null,
        certificateSettings:
          body.certificateSettings ?? null,
        materialsEnabled:
          body.materialsEnabled === true,
        preAssessmentEnabled:
          body.preAssessmentEnabled === true,
        postAssessmentEnabled:
          body.postAssessmentEnabled === true,
        courseEvaluationEnabled:
  body.courseEvaluationEnabled === true,
        attendanceEnabled:
          body.attendanceEnabled === true,
        featured: body.featured === true,
        published: body.published !== false,
        status:
          body.status === 'draft'
            ? 'draft'
            : body.status === 'archived'
              ? 'archived'
              : 'published',
        metaTitle: body.metaTitle ?? null,
        metaDescription:
          body.metaDescription ?? null,
        createdAt: body.createdAt
          ? new Date(body.createdAt)
          : new Date(),
      },
      update: {
        title: body.title,
        slug: body.slug,
        description: body.description ?? '',
        shortDescription: body.shortDescription ?? null,
        categoryId: body.categoryId ?? null,
        type: courseType,
        delivery:
          body.delivery === 'online'
            ? 'online'
            : body.delivery === 'hybrid'
              ? 'hybrid'
              : 'in_person',
        trainingKind:
          body.trainingKind === 'corporate'
            ? 'corporate'
            : 'public',
        cities: Array.isArray(body.cities)
          ? body.cities
          : [],
        price: Number(body.price ?? 0),
        oldPrice:
          body.oldPrice === null ||
          body.oldPrice === undefined
            ? null
            : Number(body.oldPrice),
        discount:
          body.discount === null ||
          body.discount === undefined
            ? null
            : Number(body.discount),
        currency: body.currency ?? 'SAR',
        days:
          body.days === null ||
          body.days === undefined
            ? null
            : Number(body.days),
        hours: Number(body.hours ?? 0),
        videosCount: Number(body.videosCount ?? 0),
        objectives: Array.isArray(body.objectives)
          ? body.objectives
          : [],
        outcomes: Array.isArray(body.outcomes)
          ? body.outcomes
          : [],
        outline: body.outline ?? null,
        audience: body.audience ?? null,
        methodology: body.methodology ?? null,
        materialUrl: body.materialUrl ?? null,
        meetingLink: body.meetingLink ?? null,
        image: body.image ?? null,
        thumbnail: body.thumbnail ?? null,
        certificateSettings:
          body.certificateSettings ?? null,
        materialsEnabled:
          body.materialsEnabled === true,
        preAssessmentEnabled:
          body.preAssessmentEnabled === true,
        postAssessmentEnabled:
          body.postAssessmentEnabled === true,
       courseEvaluationEnabled:
  body.courseEvaluationEnabled === true,
        attendanceEnabled:
          body.attendanceEnabled === true,
        featured: body.featured === true,
        published: body.published !== false,
        status:
          body.status === 'draft'
            ? 'draft'
            : body.status === 'archived'
              ? 'archived'
              : 'published',
        metaTitle: body.metaTitle ?? null,
        metaDescription:
          body.metaDescription ?? null,
      },
    });

    if (courseType === 'training') {
  const assessmentId = `assessment_${course.id}_evaluation`;

  const existingEvaluation =
    await prisma.courseAssessment.findUnique({
      where: {
        id: assessmentId,
      },
      select: {
        id: true,
      },
    });

  if (!existingEvaluation) {
    await prisma.courseAssessment.create({
      data: {
        id: assessmentId,
        courseId: course.id,
        assessmentType: 'evaluation',
        title: 'تقييم الدورة',
        description:
          'قياس رضا المتدرب عن المدرب والمحتوى والتنظيم.',
        passingScore: 0,
        timeLimit: null,
        questions: {
          create: UNIFIED_EVALUATION_QUESTIONS.map(
            (question, index) => ({
              id: `${assessmentId}_q_${index + 1}`,
              question,
              type:
                index ===
                UNIFIED_EVALUATION_QUESTIONS.length - 1
                  ? 'text'
                  : 'multiple-choice',
              options:
                index ===
                UNIFIED_EVALUATION_QUESTIONS.length - 1
                  ? []
                  : RATING_OPTIONS,
              correctAnswer: '',
              explanation: '',
              order: index,
              points: 0,
            }),
          ),
        },
      },
    });
  }
}

    return Response.json({
      success: true,
      course,
      evaluationCreated: courseType === 'training',
    });
  } catch (error) {
    console.error('Failed to save course:', error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save course',
      },
      { status: 500 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const courseId = String(
      body?.id || '',
    ).trim();

    if (!courseId) {
      return Response.json(
        {
          success: false,
          error: 'معرف الدورة مطلوب.',
        },
        { status: 400 },
      );
    }

    const data: Record<string, boolean> = {};

    if (
      typeof body.preAssessmentEnabled ===
      'boolean'
    ) {
      data.preAssessmentEnabled =
        body.preAssessmentEnabled;
    }

    if (
      typeof body.postAssessmentEnabled ===
      'boolean'
    ) {
      data.postAssessmentEnabled =
        body.postAssessmentEnabled;
    }

    if (
      typeof body.courseEvaluationEnabled ===
      'boolean'
    ) {
      data.courseEvaluationEnabled =
        body.courseEvaluationEnabled;
    }

    if (
      typeof body.attendanceEnabled ===
      'boolean'
    ) {
      data.attendanceEnabled =
        body.attendanceEnabled;
    }

    if (!Object.keys(data).length) {
      return Response.json(
        {
          success: false,
          error:
            'لم يتم إرسال أي إعداد للتحديث.',
        },
        { status: 400 },
      );
    }

    const course =
      await prisma.course.update({
        where: {
          id: courseId,
        },
        data,
      });

    return Response.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error(
      'PATCH /api/courses error:',
      error,
    );

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'تعذر تحديث إعدادات الدورة.',
      },
      { status: 500 },
    );
  }
}