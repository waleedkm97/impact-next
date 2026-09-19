import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ enrollmentId: string }>;
  },
) {
  try {
    const { enrollmentId } = await params;

    const enrollment =
      await prisma.courseEnrollment.findUnique({
        where: {
          id: enrollmentId,
        },
      });

    if (!enrollment) {
      return Response.json(
        {
          success: false,
          error: 'التسجيل غير موجود.',
        },
        {
          status: 404,
        },
      );
    }

    return Response.json({
      success: true,
      enrollment,
    });
  } catch (error) {
    console.error(
      'GET /api/enrollments/[enrollmentId] error:',
      error,
    );

    return Response.json(
      {
        success: false,
        error: 'تعذر تحميل بيانات التسجيل.',
      },
      {
        status: 500,
      },
    );
  }
}