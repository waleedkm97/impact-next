import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'يرجى إدخال البريد الإلكتروني.' },
        { status: 400 },
      );
    }

    const trainees = await prisma.$queryRaw<
      Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      }>
    >`
      SELECT "id", "email", "firstName", "lastName"
      FROM "Trainee"
      WHERE LOWER("email") = ${email}
      LIMIT 1
    `;

    const trainee = trainees[0];

    // لا نكشف للمستخدم إذا كان البريد مسجلاً أم لا.
    if (!trainee) {
      return NextResponse.json({
        message:
          'إذا كان البريد الإلكتروني مسجلاً لدينا، فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه.',
      });
    }

    // إلغاء أي روابط إعادة تعيين سابقة غير مستخدمة.
    await prisma.$executeRaw`
      UPDATE "PasswordResetToken"
      SET "usedAt" = ${new Date()}
      WHERE "traineeId" = ${trainee.id}
        AND "usedAt" IS NULL
    `;

    // إنشاء Token عشوائي.
    const rawToken = randomBytes(32).toString('hex');

    // نخزن Hash فقط في قاعدة البيانات.
    const tokenHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // صلاحية الرابط ساعة واحدة.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.$executeRaw`
      INSERT INTO "PasswordResetToken"
        ("id", "traineeId", "tokenHash", "expiresAt")
      VALUES
        (
          ${randomBytes(16).toString('hex')},
          ${trainee.id},
          ${tokenHash},
          ${expiresAt}
        )
    `;

    // إنشاء رابط إعادة التعيين.
    const resetUrl = new URL('/reset-password', request.url);
    resetUrl.searchParams.set('token', rawToken);

    const smtpHost = process.env.ZEPTO_SMTP_HOST;
    const smtpPort = Number(process.env.ZEPTO_SMTP_PORT || '465');
    const smtpUser = process.env.ZEPTO_SMTP_USER;
    const smtpPassword = process.env.ZEPTO_SMTP_PASSWORD;

    const fromEmail =
      process.env.ZEPTO_MAIL_FROM || 'info@impacttrainingsa.com';

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error('ZeptoMail SMTP is not configured.');

      return NextResponse.json(
        { error: 'خدمة البريد الإلكتروني غير مهيأة حالياً.' },
        { status: 500 },
      );
    }

    const traineeName =
      `${trainee.firstName} ${trainee.lastName}`.trim() || 'المتدرب';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: {
        address: fromEmail,
        name: 'Impact Training',
      },
      to: {
        address: trainee.email,
        name: traineeName,
      },
      subject: 'إعادة تعيين كلمة المرور - Impact Training',
      html: `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>

          <body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, sans-serif;">
            <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">

              <div style="background:#0A1931; padding:28px; text-align:center;">
                <div style="font-size:26px; font-weight:700; color:#ffffff;">
                  Impact Training
                </div>
              </div>

              <div style="padding:35px 30px; color:#1f2937;">
                <h2 style="margin:0 0 20px; color:#0A1931;">
                  إعادة تعيين كلمة المرور
                </h2>

                <p style="font-size:16px; line-height:1.9; margin:0 0 15px;">
                  مرحباً ${traineeName}،
                </p>

                <p style="font-size:16px; line-height:1.9; margin:0 0 25px;">
                  تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة Impact Training.
                </p>

                <div style="text-align:center; margin:30px 0;">
                  <a
                    href="${resetUrl.toString()}"
                    style="display:inline-block; background:#A07F33; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:700;"
                  >
                    إعادة تعيين كلمة المرور
                  </a>
                </div>

                <p style="font-size:14px; line-height:1.8; color:#6b7280; margin:25px 0 0;">
                  هذا الرابط صالح لمدة ساعة واحدة فقط.
                </p>

                <p style="font-size:14px; line-height:1.8; color:#6b7280; margin:10px 0 0;">
                  إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.
                </p>
              </div>

              <div style="background:#f5f5f5; padding:20px 30px; text-align:center; color:#6b7280; font-size:13px;">
                Impact Training
              </div>

            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({
      message:
        'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    return NextResponse.json(
      { error: 'تعذر إرسال رسالة إعادة تعيين كلمة المرور.' },
      { status: 500 },
    );
  }
}