import { prisma } from '@/lib/prisma';
import { scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

async function verifyPassword(password: string, passwordHash: string) {
  const parts = passwordHash.split(':');

  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, salt, storedKey] = parts;

  try {
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return derivedKey.toString('hex') === storedKey;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();

    const password = String(body.password ?? '');

    if (!email || !password) {
      return Response.json(
        {
          success: false,
          error: 'البريد الإلكتروني وكلمة المرور مطلوبان.',
        },
        { status: 400 },
      );
    }

    const trainee = await prisma.trainee.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        firstNameEnglish: true,
        lastNameEnglish: true,
        email: true,
        phone: true,
        passwordHash: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!trainee) {
      return Response.json(
        {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        },
        { status: 401 },
      );
    }

    if (trainee.status !== 'active') {
      return Response.json(
        {
          success: false,
          error: 'هذا الحساب غير نشط.',
        },
        { status: 403 },
      );
    }

    const validPassword = await verifyPassword(
      password,
      trainee.passwordHash,
    );

    if (!validPassword) {
      return Response.json(
        {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        },
        { status: 401 },
      );
    }

    await prisma.trainee.update({
      where: {
        id: trainee.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      trainee: {
        id: trainee.id,
        firstName: trainee.firstName,
        lastName: trainee.lastName,
        firstNameEnglish: trainee.firstNameEnglish,
        lastNameEnglish: trainee.lastNameEnglish,
        email: trainee.email,
        phone: trainee.phone,
        status: trainee.status,
        emailVerified: trainee.emailVerified,
      },
    });
  } catch (error) {
    console.error('Trainee SQL login failed:', error);

    return Response.json(
      {
        success: false,
        error: 'حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.',
      },
      { status: 500 },
    );
  }
}