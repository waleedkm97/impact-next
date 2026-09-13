import { prisma } from '@/lib/prisma';
import type { Schedule } from '@/types/schedule';

function numberOrDefault(value: unknown, fallback: number) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const schedules = Array.isArray(body.schedules)
      ? (body.schedules as Schedule[])
      : [];

    let imported = 0;
    let skipped = 0;

    for (const schedule of schedules) {
      if (!schedule.id || !schedule.courseId) {
        skipped++;
        continue;
      }

      const courseExists = await prisma.course.findUnique({
        where: {
          id: schedule.courseId,
        },
        select: {
          id: true,
        },
      });

      if (!courseExists) {
        skipped++;
        continue;
      }

      const data = {
        courseId: schedule.courseId,
        courseTitle: schedule.courseTitle,
        title: schedule.title,
        description: schedule.description ?? null,

        startDate: new Date(schedule.startDate),
        endDate: new Date(schedule.endDate),

        startTime: schedule.startTime,
        endTime: schedule.endTime,

        recurrence: schedule.recurrence ?? null,

        location: schedule.location ?? null,
        city: schedule.city ?? null,
        onlineMeetingLink:
          schedule.onlineMeetingLink ?? null,

        maxParticipants: numberOrDefault(
          schedule.maxParticipants,
          20,
        ),

        currentParticipants: numberOrDefault(
          schedule.currentParticipants,
          0,
        ),

        waitlistMax:
          schedule.waitlistMax ?? null,

        currentWaitlist: numberOrDefault(
          schedule.currentWaitlist,
          0,
        ),

        price:
          typeof schedule.price === 'number'
            ? schedule.price
            : null,

        currency: schedule.currency ?? 'SAR',

        instructorId:
          schedule.instructorId ?? null,

        instructorName:
          schedule.instructorName ?? null,

        trainerId:
          schedule.instructorId ?? null,

        status: schedule.status,

        published: schedule.published,

        allowWaitlist:
          schedule.allowWaitlist,

        requireConfirmation:
          schedule.requireConfirmation,

        confirmationDeadline:
          schedule.confirmationDeadline
            ? new Date(schedule.confirmationDeadline)
            : null,

        cancellationDeadline:
          schedule.cancellationDeadline
            ? new Date(schedule.cancellationDeadline)
            : null,

        cancellationPolicy:
          schedule.cancellationPolicy ?? null,

        createdAt: new Date(schedule.createdAt),
        updatedAt: new Date(schedule.updatedAt),
      };

      await prisma.schedule.upsert({
        where: {
          id: schedule.id,
        },

        create: {
          id: schedule.id,
          ...data,
        },

        update: data,
      });

      imported++;
    }

    return Response.json({
      success: true,
      imported,
      skipped,
      total: schedules.length,
    });
  } catch (error) {
    console.error(
      'Schedule migration failed:',
      error,
    );

    return Response.json(
      {
        success: false,
        error: 'Schedule migration failed',
      },
      {
        status: 500,
      },
    );
  }
}