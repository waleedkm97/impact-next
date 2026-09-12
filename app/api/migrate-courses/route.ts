import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type IncomingCategory = {
  id: string;
  name: string;
  description?: string;
  published?: boolean;
};

type IncomingQuestion = {
  id: string;
  lessonId: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  order: number;
  points?: number;
};

type IncomingLesson = {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  type: 'video' | 'quiz' | 'text' | 'interactive';
  order: number;
  videoId?: string;
  videoDuration?: number;
  afterLessonId?: string;
  questions?: IncomingQuestion[];
  createdAt: string | Date;
  updatedAt: string | Date;
};

type IncomingAssessment = {
  id: string;
  courseId: string;
  assessmentType?: 'pre' | 'post' | 'evaluation';
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type IncomingCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId?: string;
  type: 'recorded' | 'training' | 'public';
  delivery: 'online' | 'in-person' | 'hybrid';
  trainingKind: 'public' | 'corporate';
  cities?: string[];
  price: number;
  oldPrice?: number;
  discount?: number;
  currency?: string;
  days?: number;
  hours?: number;
  videosCount?: number;
  objectives?: string[];
  outcomes?: string[];
  outline?: string;
  audience?: string;
  methodology?: string;
  materialUrl?: string;
  meetingLink?: string;
  image?: string;
  thumbnail?: string;
  certificateSettings?: unknown;
  materialsEnabled?: boolean;
  preAssessmentEnabled?: boolean;
  postAssessmentEnabled?: boolean;
  courseEvaluationEnabled?: boolean;
  attendanceEnabled?: boolean;
  featured?: boolean;
  published?: boolean;
  status?: 'draft' | 'published' | 'archived';
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  lessons?: IncomingLesson[];
  assessments?: IncomingAssessment[];
};

function toDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeDelivery(
  delivery: IncomingCourse['delivery'],
): 'online' | 'in_person' | 'hybrid' {
  if (delivery === 'in-person') {
    return 'in_person';
  }

  return delivery;
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === 'string',
      )
    : [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.categories)) {
      return Response.json(
        {
          success: false,
          error: 'categories array is required',
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.courses)) {
      return Response.json(
        {
          success: false,
          error: 'courses array is required',
        },
        { status: 400 },
      );
    }

    const categories =
      body.categories as IncomingCategory[];

    const courses =
      body.courses as IncomingCourse[];

    let categoriesImported = 0;
    let imported = 0;
    let skipped = 0;
    let lessonsImported = 0;
    let questionsImported = 0;
    let assessmentsImported = 0;

    /*
     * 1. Migrate categories first.
     * The same IDs are preserved so Course.categoryId
     * continues to point to the correct category.
     */
    for (const category of categories) {
      try {
        await prisma.category.upsert({
          where: {
            id: category.id,
          },
          create: {
            id: category.id,
            name: category.name,
            description: category.description ?? null,
            published: category.published ?? true,
          },
          update: {
            name: category.name,
            description: category.description ?? null,
            published: category.published ?? true,
          },
        });

        categoriesImported++;
      } catch (categoryError) {
        console.error(
          `Failed to migrate category ${category.id}:`,
          categoryError,
        );
      }
    }

    /*
     * 2. Migrate courses.
     */
    for (const course of courses) {
      try {
        const existingCategory = course.categoryId
          ? await prisma.category.findUnique({
              where: {
                id: course.categoryId,
              },
            })
          : null;

        const categoryId =
          existingCategory?.id ?? null;

        await prisma.course.upsert({
          where: {
            id: course.id,
          },

          create: {
            id: course.id,
            title: course.title,
            slug: course.slug || course.id,
            description: course.description ?? '',
            shortDescription: course.shortDescription,
            categoryId,
            type: course.type,
            delivery: normalizeDelivery(course.delivery),
            trainingKind: course.trainingKind,
            cities: cleanStringArray(course.cities),
            price: normalizeCoursePrice(course),
            oldPrice: course.oldPrice ?? null,
            discount: course.discount ?? null,
            currency: course.currency ?? 'SAR',
            days: course.days ?? null,
            hours: course.hours ?? null,
            videosCount: course.videosCount ?? 0,
            objectives: cleanStringArray(course.objectives),
            outcomes: cleanStringArray(course.outcomes),
            outline: course.outline ?? null,
            audience: course.audience ?? null,
            methodology: course.methodology ?? null,
            materialUrl: course.materialUrl ?? null,
            meetingLink: course.meetingLink ?? null,
            image: course.image ?? null,
            thumbnail: course.thumbnail ?? null,
            certificateSettings:
              course.certificateSettings == null
                ? Prisma.DbNull
                : course.certificateSettings,
            materialsEnabled:
              course.materialsEnabled ?? false,
            preAssessmentEnabled:
              course.preAssessmentEnabled ?? false,
            postAssessmentEnabled:
              course.postAssessmentEnabled ?? false,
            courseEvaluationEnabled:
              course.courseEvaluationEnabled ?? false,
            attendanceEnabled:
              course.attendanceEnabled ?? false,
            featured: course.featured ?? false,
            published: course.published ?? true,
            status: course.status ?? 'published',
            metaTitle: course.metaTitle ?? null,
            metaDescription:
              course.metaDescription ?? null,
            createdAt: toDate(course.createdAt),
            updatedAt: toDate(course.updatedAt),
          },

          update: {
            title: course.title,
            slug: course.slug || course.id,
            description: course.description ?? '',
            shortDescription: course.shortDescription,
            categoryId,
            type: course.type,
            delivery: normalizeDelivery(course.delivery),
            trainingKind: course.trainingKind,
            cities: cleanStringArray(course.cities),
            price: course.price ?? 0,
            oldPrice: course.oldPrice ?? null,
            discount: course.discount ?? null,
            currency: course.currency ?? 'SAR',
            days: course.days ?? null,
            hours: course.hours ?? null,
            videosCount: course.videosCount ?? 0,
            objectives: cleanStringArray(course.objectives),
            outcomes: cleanStringArray(course.outcomes),
            outline: course.outline ?? null,
            audience: course.audience ?? null,
            methodology: course.methodology ?? null,
            materialUrl: course.materialUrl ?? null,
            meetingLink: course.meetingLink ?? null,
            image: course.image ?? null,
            thumbnail: course.thumbnail ?? null,
            certificateSettings:
              course.certificateSettings == null
                ? Prisma.DbNull
                : course.certificateSettings,
            materialsEnabled:
              course.materialsEnabled ?? false,
            preAssessmentEnabled:
              course.preAssessmentEnabled ?? false,
            postAssessmentEnabled:
              course.postAssessmentEnabled ?? false,
            courseEvaluationEnabled:
              course.courseEvaluationEnabled ?? false,
            attendanceEnabled:
              course.attendanceEnabled ?? false,
            featured: course.featured ?? false,
            published: course.published ?? true,
            status: course.status ?? 'published',
            metaTitle: course.metaTitle ?? null,
            metaDescription:
              course.metaDescription ?? null,
          },
        });

        /*
         * Replace lessons/questions for this course.
         */
        await prisma.courseLesson.deleteMany({
          where: {
            courseId: course.id,
          },
        });

        for (const lesson of course.lessons ?? []) {
          await prisma.courseLesson.create({
            data: {
              id: lesson.id,
              courseId: course.id,
              title: lesson.title,
              description: lesson.description ?? null,
              type: lesson.type,
              order: lesson.order,
              videoId: lesson.videoId ?? null,
              videoDuration:
                lesson.videoDuration ?? null,
              afterLessonId:
                lesson.afterLessonId ?? null,
              createdAt: toDate(lesson.createdAt),
              updatedAt: toDate(lesson.updatedAt),
            },
          });

          lessonsImported++;

          for (const question of lesson.questions ?? []) {
            await prisma.lessonQuestion.create({
              data: {
                id: question.id,
                lessonId: lesson.id,
                question: question.question,
                type: question.type,
                options: cleanStringArray(
                  question.options,
                ),
                correctAnswer:
                  question.correctAnswer,
                explanation:
                  question.explanation ?? null,
                order: question.order,
                points: question.points ?? null,
              },
            });

            questionsImported++;
          }
        }

        /*
         * Replace course assessments for this course.
         */
        await prisma.courseAssessment.deleteMany({
          where: {
            courseId: course.id,
          },
        });

        for (const assessment of course.assessments ?? []) {
          await prisma.courseAssessment.create({
            data: {
              id: assessment.id,
              courseId: course.id,
              assessmentType:
                assessment.assessmentType ?? null,
              title: assessment.title,
              description:
                assessment.description ?? null,
              passingScore:
                assessment.passingScore ?? 0,
              timeLimit:
                assessment.timeLimit ?? null,
              createdAt: toDate(
                assessment.createdAt,
              ),
              updatedAt: toDate(
                assessment.updatedAt,
              ),
            },
          });

          assessmentsImported++;
        }

        imported++;
      } catch (courseError) {
        console.error(
          `Failed to migrate course ${course.id}:`,
          courseError,
        );

        skipped++;
      }
    }

    return Response.json({
      success: true,
      categoriesImported,
      imported,
      skipped,
      lessonsImported,
      questionsImported,
      assessmentsImported,
      total: courses.length,
    });
  } catch (error) {
    console.error(
      'Course migration failed:',
      error,
    );

    return Response.json(
      {
        success: false,
        error: 'Failed to migrate courses',
      },
      { status: 500 },
    );
  }
}
function normalizeCoursePrice(course: IncomingCourse): number {
  if (course.type === 'recorded') {
    return course.price ?? 0;
  }

  if (course.delivery === 'online') {
    return 3000;
  }

  if (course.delivery === 'in-person') {
    const cities = cleanStringArray(course.cities).map((city) =>
      city.trim().toLowerCase(),
    );

    const saudiCities = [
      'الرياض',
      'جدة',
      'الدمام',
      'riyadh',
      'jeddah',
      'dammam',
    ];

    if (
      cities.some((city) =>
        saudiCities.some((allowedCity) =>
          city.includes(allowedCity),
        ),
      )
    ) {
      return 5000;
    }
  }

  return course.price ?? 0;
}