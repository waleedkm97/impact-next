import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueCertificateForEnrollment } from '@/lib/certificate-service';

function traineeIdFromRequest(request: Request) {
  return (
    request.headers.get('x-trainee-id')?.trim() ||
    request.headers
      .get('cookie')
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('impact_sql_trainee='))
      ?.split('=')
      .slice(1)
      .join('=') ||
    ''
  );
}

async function buildView(enrollmentId: string, adminOverride: boolean) {
  const result = await issueCertificateForEnrollment(
    enrollmentId,
    adminOverride,
  );

  if (!result.enrollment) return null;

  const [trainee, course] = await Promise.all([
    prisma.trainee.findUnique({
      where: { id: result.enrollment.traineeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        firstNameEnglish: true,
        lastNameEnglish: true,
        email: true,
        phone: true,
        status: true,
        emailVerified: true,
      },
    }),
    prisma.course.findUnique({
      where: { id: result.enrollment.courseId },
    }),
  ]);

  if (!trainee || !course || !result.certificate) return null;

  return {
    trainee,
    enrollment: result.enrollment,
    certificate: result.certificate,
    course,
    eligible: result.eligible,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminOverride = searchParams.get('admin') === 'true';
    const requestedTraineeId = searchParams.get('traineeId')?.trim() || '';
    const courseId = searchParams.get('courseId')?.trim() || '';
    const enrollmentId = searchParams.get('enrollmentId')?.trim() || '';
    const groupId = searchParams.get('groupId')?.trim() || '';
    const sessionTraineeId = traineeIdFromRequest(request);

    if (!adminOverride && requestedTraineeId && requestedTraineeId !== sessionTraineeId) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن عرض شهادة متدرب آخر.' },
        { status: 403 },
      );
    }

    const targetTraineeId = adminOverride
      ? requestedTraineeId
      : sessionTraineeId;

    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        ...(enrollmentId ? { id: enrollmentId } : {}),
        ...(courseId ? { courseId } : {}),
        ...(groupId ? { groupId } : {}),
        ...(targetTraineeId ? { traineeId: targetTraineeId } : {}),
      },
      orderBy: { enrolledAt: 'desc' },
    });

    if (!enrollments.length) {
      return NextResponse.json(
        { success: false, error: 'لا يوجد تسجيل مطابق للشهادة.' },
        { status: 404 },
      );
    }

    const views = (await Promise.all(
      enrollments.map((enrollment) =>
        buildView(enrollment.id, adminOverride),
      ),
    )).filter(Boolean);

    if (!views.length) {
      return NextResponse.json(
        { success: false, error: 'الشهادة غير متاحة بعد.' },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, items: views });
  } catch (error) {
    console.error('GET /api/certificates error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر تحميل الشهادة.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const enrollmentId = String(body?.enrollmentId || '').trim();
    const adminOverride = body?.adminOverride === true;

    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: 'معرف التسجيل مطلوب.' },
        { status: 400 },
      );
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { traineeId: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'التسجيل غير موجود.' },
        { status: 404 },
      );
    }

    if (!adminOverride && enrollment.traineeId !== traineeIdFromRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'التسجيل لا يخص المتدرب الحالي.' },
        { status: 403 },
      );
    }

    const view = await buildView(enrollmentId, adminOverride);

    if (!view?.certificate) {
      return NextResponse.json(
        { success: false, error: 'الشهادة غير متاحة بعد.' },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, ...view });
  } catch (error) {
    console.error('POST /api/certificates error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر إصدار الشهادة.' },
      { status: 500 },
    );
  }
}
