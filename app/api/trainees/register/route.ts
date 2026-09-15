import { prisma } from '@/lib/prisma';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const firstName = String(body.firstName ?? '').trim();
    const lastName = String(body.lastName ?? '').trim();
    const firstNameEnglish =
      String(body.firstNameEnglish ?? '').trim();
    const lastNameEnglish =
      String(body.lastNameEnglish ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const password = String(body.password ?? '');

    if (!firstName || !lastName) {
      return Response.json(
        {
          success: false,
          error: 'الاسم الأول واسم العائلة مطلوبان.',
        },
        { status: 400 },
      );
    }

    if (!email) {
      return Response.json(
        {
          success: false,
          error: 'البريد الإلكتروني مطلوب.',
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return Response.json(
        {
          success: false,
          error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
        },
        { status: 400 },
      );
    }

    const existing = await prisma.trainee.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return Response.json(
        {
          success: false,
          error: 'هذا البريد مستخدم بالفعل.',
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const trainee = await prisma.trainee.create({
      data: {
        id:
          typeof body.id === 'string' && body.id.trim()
            ? body.id.trim()
            : `trainee-${Date.now()}-${randomBytes(5).toString('hex')}`,

        firstName,
        lastName,
        firstNameEnglish: firstNameEnglish || null,
        lastNameEnglish: lastNameEnglish || null,
        email,
        phone: phone || null,
        passwordHash,
        status: 'active',
        emailVerified: true,
      },

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
        createdAt: true,
      },
    });

    return Response.json({
      success: true,
      trainee,
    });
  } catch (error) {
    console.error('Trainee SQL registration failed:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر حفظ حساب المتدرب في قاعدة البيانات.',
      },
      { status: 500 },
    );
  }
}