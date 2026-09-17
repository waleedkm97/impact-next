import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const transporter = nodemailer.createTransport({
  host: process.env.ZEPTO_SMTP_HOST,
  port: Number(process.env.ZEPTO_SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.ZEPTO_SMTP_USER,
    pass: process.env.ZEPTO_SMTP_PASSWORD,
  },
});

export async function GET() {
  try {
    const requests = await prisma.contactRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Failed to load contact requests:", error);

    return Response.json(
      {
        success: false,
        error: "تعذر تحميل طلبات التواصل.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id =
      typeof body.id === "string" ? body.id.trim() : "";

    const status =
      typeof body.status === "string" ? body.status.trim() : "";

    const allowedStatuses = [
      "new",
      "read",
      "replied",
      "closed",
    ];

    if (!id || !allowedStatuses.includes(status)) {
      return Response.json(
        {
          success: false,
          error: "بيانات تحديث الطلب غير صحيحة.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.contactRequest.update({
      where: {
        id,
      },
      data: {
        status: status as
          | "new"
          | "read"
          | "replied"
          | "closed",
      },
    });

    return Response.json({
      success: true,
      request: updated,
    });
  } catch (error) {
    console.error("Failed to update contact request:", error);

    return Response.json(
      {
        success: false,
        error: "تعذر تحديث حالة الطلب.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string" ? body.email.trim() : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return Response.json(
        {
          success: false,
          error: "الاسم والبريد الإلكتروني والرسالة مطلوبة.",
        },
        { status: 400 },
      );
    }

    const contactRequest = await prisma.contactRequest.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        phone: phone || null,
        message,
      },
    });

    const fromEmail =
      process.env.ZEPTO_MAIL_FROM || "info@impacttrainingsa.com";

    await transporter.sendMail({
      from: fromEmail,
      to: "info@impacttrainingsa.com",
      replyTo: email,
      subject: `طلب تواصل جديد من ${name}`,
      text: [
        "وصل طلب تواصل جديد من موقع Impact Training.",
        "",
        `الاسم: ${name}`,
        `البريد الإلكتروني: ${email}`,
        `رقم الجوال: ${phone || "غير مضاف"}`,
        "",
        "الرسالة:",
        message,
        "",
        `رقم الطلب: ${contactRequest.id}`,
      ].join("\n"),
    });

    return Response.json({
      success: true,
      message: "تم إرسال رسالتك بنجاح.",
      requestId: contactRequest.id,
    });
  } catch (error) {
    console.error("Failed to create contact request:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "تعذر إرسال الرسالة حاليًا. حاول مرة أخرى.",
      },
      { status: 500 },
    );
  }
}