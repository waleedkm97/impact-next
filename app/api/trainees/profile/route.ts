import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const email = String(body?.email || '')
      .trim()
      .toLowerCase();

    const firstName = String(body?.firstName || '').trim();
    const lastName = String(body?.lastName || '').trim();
    const firstNameEnglish = String(body?.firstNameEnglish || '').trim();
    const lastNameEnglish = String(body?.lastNameEnglish || '').trim();
    const phone = String(body?.phone || '').trim();

    if (!email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب.' },
        { status: 400 },
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'الاسم الأول واسم العائلة مطلوبان.' },
        { status: 400 },
      );
    }

    const trainees = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
      }>
    >`
      SELECT "id", "email"
      FROM "Trainee"
      WHERE LOWER("email") = ${email}
      LIMIT 1
    `;

    const trainee = trainees[0];

    if (!trainee) {
      return NextResponse.json(
        { error: 'حساب المتدرب غير موجود.' },
        { status: 404 },
      );
    }

    await prisma.$executeRaw`
      UPDATE "Trainee"
      SET
        "firstName" = ${firstName},
        "lastName" = ${lastName},
        "firstNameEnglish" = ${firstNameEnglish || null},
        "lastNameEnglish" = ${lastNameEnglish || null},
        "phone" = ${phone || null},
        "updatedAt" = ${new Date()}
      WHERE "id" = ${trainee.id}
    `;

    return NextResponse.json({
      message: 'تم حفظ بيانات المتدرب بنجاح.',
      trainee: {
        id: trainee.id,
        email: trainee.email,
        firstName,
        lastName,
        firstNameEnglish: firstNameEnglish || null,
        lastNameEnglish: lastNameEnglish || null,
        phone: phone || null,
      },
    });
  } catch (error) {
    console.error('Update trainee profile error:', error);

    return NextResponse.json(
      { error: 'تعذر حفظ بيانات المتدرب.' },
      { status: 500 },
    );
  }
}