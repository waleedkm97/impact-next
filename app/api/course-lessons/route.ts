import { LessonType } from '@/lib/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

function normalizeQuestion(question: any, index: number, lessonId: string) {
  return {
    id: String(question.id ?? `${lessonId}-q-${index + 1}`),
    question: String(question.question ?? '').trim(),
    type: String(question.type ?? 'multiple-choice'),
    options: Array.isArray(question.options)
      ? question.options.map((item: unknown) => String(item))
      : [],
    correctAnswer: question.correctAnswer ?? '',
    explanation: question.explanation
      ? String(question.explanation).trim()
      : null,
    order: Number(question.order ?? index + 1),
    points:
      question.points === null || question.points === undefined
        ? 1
        : Number(question.points),
  };
}

function normalizeLesson(body: any, lessonId: string, courseId: string) {
  return {
    id: lessonId,
    courseId,
    title: String(body.title ?? '').trim(),
    description: body.description ? String(body.description).trim() : null,
    type: body.type === 'quiz' ? LessonType.quiz : LessonType.video,
    order: Number(body.order ?? 1),
    videoId: body.videoId ? String(body.videoId).trim() : null,
    videoDuration:
      body.videoDuration === null || body.videoDuration === undefined
        ? null
        : Number(body.videoDuration),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return Response.json(
        { success: false, error: 'courseId is required' },
        { status: 400 },
      );
    }

    const lessons = await prisma.courseLesson.findMany({
      where: { courseId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return Response.json({ success: true, lessons });
  } catch (error) {
    console.error('Failed to load course lessons:', error);
    return Response.json(
      { success: false, error: 'Failed to load course lessons' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lessonId = String(body.id ?? '').trim();
    const courseId = String(body.courseId ?? '').trim();

    if (!lessonId || !courseId || !body.title) {
      return Response.json(
        { success: false, error: 'id, courseId and title are required' },
        { status: 400 },
      );
    }

    const lesson = normalizeLesson(body, lessonId, courseId);
    const questions = Array.isArray(body.questions)
      ? body.questions.map((question: any, index: number) =>
          normalizeQuestion(question, index, lessonId),
        )
      : [];

    const saved = await prisma.$transaction(async (tx) => {
      const result = await tx.courseLesson.upsert({
        where: { id: lessonId },
        create: lesson,
        update: lesson,
      });

      if (Array.isArray(body.questions)) {
        await tx.lessonQuestion.deleteMany({
          where: { lessonId },
        });

        if (questions.length) {
          await tx.lessonQuestion.createMany({
            data: questions.map((question: ReturnType<typeof normalizeQuestion>) => ({
              ...question,
              lessonId,
            })),
          });
        }
      }

      return result;
    });

    return Response.json({ success: true, lesson: saved });
  } catch (error) {
    console.error('Failed to save course lesson:', error);
    return Response.json(
      { success: false, error: 'Failed to save course lesson' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { success: false, error: 'id is required' },
        { status: 400 },
      );
    }

    await prisma.courseLesson.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to delete course lesson:', error);
    return Response.json(
      { success: false, error: 'Failed to delete course lesson' },
      { status: 500 },
    );
  }
}
