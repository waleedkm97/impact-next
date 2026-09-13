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
          courseType === 'training'
            ? body.courseEvaluationEnabled !== false
            : false,
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
          courseType === 'training'
            ? body.courseEvaluationEnabled !== false
            : false,
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

      await prisma.courseAssessment.upsert({
        where: {
          id: assessmentId,
        },
        create: {
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
        update: {
          courseId: course.id,
          assessmentType: 'evaluation',
          title: 'تقييم الدورة',
          description:
            'قياس رضا المتدرب عن المدرب والمحتوى والتنظيم.',
          passingScore: 0,
          timeLimit: null,
          questions: {
            deleteMany: {},
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