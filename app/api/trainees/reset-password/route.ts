import { createHash, randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = String(body?.token || '').trim();
    const newPassword = String(body?.newPassword || '');

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' },
        { status: 400 }
      );
    }

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const resetTokens = await tx.$queryRaw<
        Array<{
          id: string;
          traineeId: string;
        }>
      >`
        SELECT "id", "traineeId"
        FROM "PasswordResetToken"
        WHERE "tokenHash" = ${tokenHash}
          AND "usedAt" IS NULL
          AND "expiresAt" > ${now}
        LIMIT 1
      `;

      if (resetTokens.length === 0) {
        return null;
      }

      const resetToken = resetTokens[0];

      const passwordHash = await hashPassword(newPassword);

      await tx.$executeRaw`
        UPDATE "Trainee"
        SET
          "passwordHash" = ${passwordHash},
          "updatedAt" = ${now}
        WHERE "id" = ${resetToken.traineeId}
      `;

      await tx.$executeRaw`
        UPDATE "PasswordResetToken"
        SET "usedAt" = ${now}
        WHERE "id" = ${resetToken.id}
          AND "usedAt" IS NULL
      `;

      return {
        traineeId: resetToken.traineeId,
      };
    });

    if (!result) {
      return NextResponse.json(
        { error: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'تم تغيير كلمة المرور بنجاح.',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    return NextResponse.json(
      { error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور.' },
      { status: 500 }
    );
  }
}