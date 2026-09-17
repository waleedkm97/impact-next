export async function GET() {
  try {
    const trainees = await prisma.trainee.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        enrollments: true,
      },
    });

    return NextResponse.json({
      success: true,
      trainees,
    });
  } catch (error) {
    console.error('Admin trainees GET error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'تعذر تحميل المتدربين.',
      },
      { status: 500 },
    );
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function safeTrainee(trainee: any) {
  return {
    id: trainee.id,
    firstName: trainee.firstName,
    lastName: trainee.lastName,
    firstNameEnglish: trainee.firstNameEn,
    lastNameEnglish: trainee.lastNameEn,
    email: trainee.email,
    phone: trainee.phone,
    status: trainee.status,
    emailVerified: trainee.emailVerified,
    createdAt: trainee.createdAt,
    updatedAt: trainee.updatedAt,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = normalizeEmail(body.email);
    const password =
      typeof body.password === 'string' ? body.password : '';

    if (!body.firstName || !body.lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'الاسم الأول واسم العائلة والبريد الإلكتروني مطلوبة.' },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور مطلوبة.' },
        { status: 400 },
      );
    }

    const existing = await prisma.trainee.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'يوجد متدرب بهذا البريد الإلكتروني بالفعل.' },
        { status: 409 },
      );
    }

    const trainee = await prisma.trainee.create({
      data: {
        id:
          typeof body.id === 'string' && body.id.trim()
            ? body.id.trim()
            : undefined,
        firstName: String(body.firstName).trim(),
        lastName: String(body.lastName).trim(),
        firstNameEnglish:
          typeof body.firstNameEn === 'string'
            ? body.firstNameEn.trim()
            : null,
        lastNameEnglish:
          typeof body.lastNameEn === 'string'
            ? body.lastNameEn.trim()
            : null,
        email,
        phone:
          typeof body.phone === 'string' ? body.phone.trim() : null,
        passwordHash: hashPassword(password),
        status: body.status === 'inactive' ? 'inactive' : 'active',
        emailVerified: body.emailVerified !== false,
      },
    });

    return NextResponse.json({
      success: true,
      trainee: safeTrainee(trainee),
    });
  } catch (error) {
    console.error('Admin trainee create error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء إنشاء المتدرب.',
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const email = normalizeEmail(body.email);
    const password =
      typeof body.password === 'string' ? body.password : '';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المتدرب مطلوب.' },
        { status: 400 },
      );
    }

    const existing = await prisma.trainee.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المتدرب غير موجود في قاعدة البيانات.' },
        { status: 404 },
      );
    }

    if (email && email !== existing.email) {
      const emailOwner = await prisma.trainee.findUnique({
        where: { email },
      });

      if (emailOwner && emailOwner.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: 'البريد الإلكتروني مستخدم من متدرب آخر.',
          },
          { status: 409 },
        );
      }
    }

    const data: any = {
      firstName:
        typeof body.firstName === 'string'
          ? body.firstName.trim()
          : existing.firstName,
      lastName:
        typeof body.lastName === 'string'
          ? body.lastName.trim()
          : existing.lastName,
      firstNameEnglish:
        typeof body.firstNameEn === 'string'
          ? body.firstNameEn.trim()
          : existing.firstNameEnglish,
      lastNameEnglish:
        typeof body.lastNameEn === 'string'
          ? body.lastNameEn.trim()
          : existing.lastNameEnglish,
      email: email || existing.email,
      phone:
        typeof body.phone === 'string'
          ? body.phone.trim()
          : existing.phone,
      status:
        body.status === 'inactive'
          ? 'inactive'
          : body.status === 'active'
            ? 'active'
            : existing.status,
      emailVerified:
        typeof body.emailVerified === 'boolean'
          ? body.emailVerified
          : existing.emailVerified,
    };

    if (password) {
      data.passwordHash = hashPassword(password);
    }

    const trainee = await prisma.trainee.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      trainee: safeTrainee(trainee),
    });
  } catch (error) {
    console.error('Admin trainee update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء تحديث المتدرب.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id = typeof body.id === 'string' ? body.id.trim() : '';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المتدرب مطلوب.' },
        { status: 400 },
      );
    }

    await prisma.trainee.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Admin trainee delete error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'حدث خطأ أثناء حذف المتدرب.',
      },
      { status: 500 },
    );
  }
}