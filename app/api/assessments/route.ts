import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const assessments = await prisma.courseAssessment.findMany({
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

    return Response.json({
      success: true,
      assessments,
    });
  } catch (error) {
    console.error('Failed to load assessments:', error);

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
    const body = await request.json();

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

    if (!id || !courseId || !title) {
      return Response.json(
        {
          success: false,
          error: 'Missing required assessment fields',
        },
        {
          status: 400,
        },
      );
    }

    const courseExists = await prisma.course.findUnique({
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

    const assessment = await prisma.courseAssessment.upsert({
      where: {
        id,
      },
      create: {
        id,
        courseId,
        assessmentType: assessmentType ?? null,
        title,
        description: description ?? null,
        passingScore: Number(passingScore ?? 0),
        timeLimit:
          timeLimit === null || timeLimit === undefined
            ? null
            : Number(timeLimit),
        questions: {
          create: Array.isArray(questions)
            ? questions.map((question: any, index: number) => ({
                id: question.id,
                question: question.question,
                type: question.type,
                options: Array.isArray(question.options)
                  ? question.options
                  : [],
                correctAnswer:
                  question.correctAnswer ?? '',
                explanation:
                  question.explanation ?? null,
                order: index,
                points:
                  question.points === null ||
                  question.points === undefined
                    ? null
                    : Number(question.points),
              }))
            : [],
        },
      },
      update: {
        courseId,
        assessmentType: assessmentType ?? null,
        title,
        description: description ?? null,
        passingScore: Number(passingScore ?? 0),
        timeLimit:
          timeLimit === null || timeLimit === undefined
            ? null
            : Number(timeLimit),
        questions: {
          deleteMany: {},
          create: Array.isArray(questions)
            ? questions.map((question: any, index: number) => ({
                id: question.id,
                question: question.question,
                type: question.type,
                options: Array.isArray(question.options)
                  ? question.options
                  : [],
                correctAnswer:
                  question.correctAnswer ?? '',
                explanation:
                  question.explanation ?? null,
                order: index,
                points:
                  question.points === null ||
                  question.points === undefined
                    ? null
                    : Number(question.points),
              }))
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
    console.error('Failed to save assessment:', error);

    return Response.json(
      {
        success: false,
        error: 'Failed to save assessment',
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'Assessment id is required',
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
    console.error('Failed to delete assessment:', error);

    return Response.json(
      {
        success: false,
        error: 'Failed to delete assessment',
      },
      {
        status: 500,
      },
    );
  }
}