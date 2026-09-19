import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getDelivery(
  schedule: { city: string | null; onlineMeetingLink: string | null } | null,
  courseDelivery: string,
) {
  const online = schedule
    ? Boolean(
        schedule.onlineMeetingLink ||
          schedule.city?.trim().toLowerCase() === 'online' ||
          schedule.city?.trim() === 'أونلاين',
      )
    : courseDelivery === 'online';

  return {
    label: online ? 'أونلاين' : 'حضوري',
    hours: online ? 9 : 15,
  };
}

export async function GET(request: Request) {
  try {
    const certificateNumber = new URL(request.url).searchParams
      .get('certificateNumber')
      ?.trim();

    if (!certificateNumber) {
      return NextResponse.json(
        { success: false, error: 'رقم الشهادة مطلوب.' },
        { status: 400 },
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { certificateNumber },
      select: {
        certificateNumber: true,
        issuedAt: true,
        verified: true,
        courseTitle: true,
        trainee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        course: {
          select: {
            title: true,
            delivery: true,
          },
        },
        enrollment: {
          select: {
            schedule: {
              select: {
                city: true,
                onlineMeetingLink: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على شهادة بهذا الرقم.' },
        { status: 404 },
      );
    }

    const delivery = getDelivery(
      certificate.enrollment?.schedule ?? null,
      certificate.course.delivery,
    );

    return NextResponse.json({
      success: true,
      certificate: {
        status: certificate.verified
          ? 'شهادة صحيحة / Valid Certificate'
          : 'شهادة غير موثقة / Unverified Certificate',
        certificateNumber: certificate.certificateNumber,
        traineeName: `${certificate.trainee.firstName} ${certificate.trainee.lastName}`.trim(),
        courseTitle: certificate.courseTitle || certificate.course.title,
        issuedAt: certificate.issuedAt.toISOString(),
        duration: '3 أيام',
        delivery: delivery.label,
        hours: delivery.hours,
      },
    });
  } catch (error) {
    console.error('GET /api/certificate-verification error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر التحقق من الشهادة.' },
      { status: 500 },
    );
  }
}
