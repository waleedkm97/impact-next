import { prisma } from '@/lib/prisma';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

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

    const traineeId = String(body.traineeId ?? '').trim();
const traineeEmail = String(body.traineeEmail ?? '').trim().toLowerCase();
const currentPassword = String(body.currentPassword ?? '');
const newPassword = String(body.newPassword ?? '');

if ((!traineeId && !traineeEmail) || !currentPassword || !newPassword) {
      return Response.json(
        {
          success: false,
          error: 'جميع حقول كلمة المرور مطلوبة.',
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        {
          success: false,
          error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.',
        },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return Response.json(
        {
          success: false,
          error: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية.',
        },
        { status: 400 },
      );
    }

   const trainee = traineeId
  ? await prisma.trainee.findUnique({
      where: { id: traineeId },
      select: { id: true, passwordHash: true, status: true },
    })
  : await prisma.trainee.findUnique({
      where: { email: traineeEmail },
      select: { id: true, passwordHash: true, status: true },
    });

    if (!trainee) {
      return Response.json(
        {
          success: false,
          error: 'حساب المتدرب غير موجود.',
        },
        { status: 404 },
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
      currentPassword,
      trainee.passwordHash,
    );

    if (!validPassword) {
      return Response.json(
        {
          success: false,
          error: 'كلمة المرور الحالية غير صحيحة.',
        },
        { status: 401 },
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.trainee.update({
      where: {
        id: trainee.id,
      },
      data: {
        passwordHash,
      },
    });

    return Response.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح.',
    });
  } catch (error) {
    console.error('Trainee password change failed:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر تغيير كلمة المرور، حاول مرة أخرى.',
      },
      { status: 500 },
    );
  }
}