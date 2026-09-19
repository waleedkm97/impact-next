import { prisma } from '@/lib/prisma';
import { scopedScheduleWhere, canAccessCourse } from '@/lib/staff-scope';
import { hasStaffPermission } from '@/lib/staff-authorization';
import {
  ScheduleRecurrence,
  ScheduleStatus,
} from '@/lib/generated/prisma/enums';

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function dateOrNull(value: unknown) {
  if (!value) return null;

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeSchedule(schedule: any) {
  return {
    id: schedule.id,
    courseId: schedule.courseId,
    courseTitle: schedule.courseTitle,
    title: schedule.title,
    description: schedule.description ?? undefined,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    recurrence: schedule.recurrence ?? undefined,
    location: schedule.location ?? undefined,
    city: schedule.city ?? undefined,
    onlineMeetingLink: schedule.onlineMeetingLink ?? undefined,
    maxParticipants: schedule.maxParticipants,
    currentParticipants: schedule.currentParticipants,
    waitlistMax: schedule.waitlistMax ?? undefined,
    currentWaitlist: schedule.currentWaitlist,
    price:
      schedule.price === null || schedule.price === undefined
        ? undefined
        : Number(schedule.price),
    currency: schedule.currency ?? undefined,
    instructorId: schedule.instructorId ?? undefined,
    instructorName: schedule.instructorName ?? undefined,
    trainerId: schedule.trainerId ?? undefined,
    coordinatorId: schedule.coordinatorId ?? undefined,
    status: schedule.status,
    published: schedule.published,
    allowWaitlist: schedule.allowWaitlist,
    requireConfirmation: schedule.requireConfirmation,
    confirmationDeadline: schedule.confirmationDeadline ?? undefined,
    cancellationDeadline: schedule.cancellationDeadline ?? undefined,
    cancellationPolicy: schedule.cancellationPolicy ?? undefined,
    postAssessmentEnabled: schedule.postAssessmentEnabled,
    courseEvaluationEnabled: schedule.courseEvaluationEnabled,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    sessions: (schedule.sessions ?? []).map((session: any) => ({
      id: session.id,
      scheduleId: session.scheduleId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location ?? undefined,
      onlineMeetingLink: session.onlineMeetingLink ?? undefined,
      instructorId: session.instructorId ?? undefined,
      notes: session.notes ?? undefined,
    })),
  };
}

const scheduleInclude = {
  sessions: {
    orderBy: {
      date: 'asc' as const,
    },
  },
};

function buildWhere(searchParams: URLSearchParams) {
  const id = searchParams.get('id');
  const courseId = searchParams.get('courseId');
  const status = searchParams.get('status');
  const city = searchParams.get('city');
  const search = searchParams.get('search')?.trim();
  const published = searchParams.get('published');
  const dateFrom = dateOrNull(searchParams.get('dateFrom'));
  const dateTo = dateOrNull(searchParams.get('dateTo'));

  return {
    ...(id ? { id } : {}),
    ...(courseId ? { courseId } : {}),
    ...(status &&
    Object.values(ScheduleStatus).includes(status as ScheduleStatus)
      ? { status: status as ScheduleStatus }
      : {}),
    ...(city ? { city } : {}),
    ...(published !== null
      ? { published: published === 'true' }
      : {}),
    ...(dateFrom || dateTo
      ? {
          startDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              id: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              title: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              courseTitle: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              city: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              instructorName: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };
}

export async function GET(request: Request) {
  try {
    if (request.headers.get('cookie')?.includes('impact_staff=')) {
      const canRead = await Promise.all([
        hasStaffPermission(request, 'viewCourses'),
        hasStaffPermission(request, 'viewGroups'),
        hasStaffPermission(request, 'viewTrainingMaterials'),
      ]);
      if (!canRead.some(Boolean)) {
        return Response.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
      }
    }
    const { searchParams } = new URL(request.url);
    const where = buildWhere(searchParams);
    const id = searchParams.get('id');

    if (id) {
      const schedule = await prisma.schedule.findUnique({
        where: { id },
        include: scheduleInclude,
      });

      if (schedule && request.headers.get('cookie')?.includes('impact_staff=') && !(await canAccessCourse(request, schedule.courseId))) {
        return Response.json({ success: false, error: 'الموعد خارج نطاق الإسناد.' }, { status: 403 });
      }

      return Response.json({
        success: true,
        schedule: schedule ? serializeSchedule(schedule) : null,
      });
    }

    const sort = searchParams.get('sort');
    const order =
      searchParams.get('order') === 'desc' ? 'desc' : 'asc';

    const limit = Number(searchParams.get('limit') ?? 0);
    const offset =
      Math.max(
        0,
        Number(searchParams.get('offset') ?? 0) || 0,
      );

    const available = searchParams.get('available') === 'true';

    const finalWhere: any = {
      ...where,
      ...(request.headers.get('cookie')?.includes('impact_staff=') ? await scopedScheduleWhere(request) : {}),
      ...(available
        ? {
            status: 'available',
            currentParticipants: {
              lt: prisma.schedule.fields.maxParticipants,
            },
          }
        : {}),
    };

    const schedules = await prisma.schedule.findMany({
      where: finalWhere,
      include: scheduleInclude,
      orderBy:
        sort === 'createdAt'
          ? { createdAt: order }
          : sort === 'price'
            ? { price: order }
            : { startDate: order },
      ...(limit > 0
        ? {
            take: limit,
            skip: offset,
          }
        : {
            skip: offset,
          }),
    });

    const count = await prisma.schedule.count({
      where: finalWhere,
    });

    return Response.json({
      success: true,
      schedules: schedules.map(serializeSchedule),
      count,
    });
  } catch (error) {
    console.error('Schedules GET failed:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر تحميل الجدولة.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'sessionCreate') {
      const scheduleId = String(body.scheduleId ?? '');

      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      });

      if (!schedule) {
        return Response.json(
          {
            success: false,
            error: 'الموعد غير موجود.',
          },
          { status: 404 },
        );
      }

      const session = await prisma.scheduleSession.create({
        data: {
          id:
            String(body.id ?? '') ||
            `session-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
          scheduleId,
          date: dateOrNull(body.date) ?? new Date(),
          startTime: String(
            body.startTime ?? schedule.startTime,
          ),
          endTime: String(
            body.endTime ?? schedule.endTime,
          ),
          location: body.location ?? null,
          onlineMeetingLink:
            body.onlineMeetingLink ?? null,
          instructorId: body.instructorId ?? null,
          notes: body.notes ?? null,
        },
      });

      return Response.json({
        success: true,
        session,
      });
    }

    if (body.action === 'sessionUpdate') {
      const id = String(body.sessionId ?? '');

      if (!id) {
        return Response.json(
          {
            success: false,
            error: 'معرف الجلسة مطلوب.',
          },
          { status: 400 },
        );
      }

      const data: any = {};

      for (const field of [
        'startTime',
        'endTime',
        'location',
        'onlineMeetingLink',
        'instructorId',
        'notes',
      ]) {
        if (body[field] !== undefined) {
          data[field] =
            body[field] === '' ? null : body[field];
        }
      }

      if (body.date !== undefined) {
        data.date =
          dateOrNull(body.date) ?? new Date();
      }

      const session =
        await prisma.scheduleSession.update({
          where: { id },
          data,
        });

      return Response.json({
        success: true,
        session,
      });
    }

    if (body.action === 'sessionDelete') {
      const id = String(body.sessionId ?? '');

      if (!id) {
        return Response.json(
          {
            success: false,
            error: 'معرف الجلسة مطلوب.',
          },
          { status: 400 },
        );
      }

      await prisma.scheduleSession.delete({
        where: { id },
      });

      return Response.json({
        success: true,
      });
    }

    if (body.action === 'generate') {
      const start =
        dateOrNull(body.startDate) ??
        new Date(
          `${new Date().getFullYear()}-01-01T00:00:00`,
        );

      const end =
        dateOrNull(body.endDate) ??
        new Date(
          `${start.getFullYear()}-12-31T23:59:59`,
        );

      const cities =
        Array.isArray(body.cities) &&
        body.cities.length
          ? body.cities.map((city: unknown) =>
              String(
                city === 'أونلاين'
                  ? 'Online'
                  : city,
              ),
            )
          : [
              'الرياض',
              'جدة',
              'الدمام',
              'دبي',
              'القاهرة',
              'البحرين',
              'قطر',
              'لندن',
              'برشلونة',
              'ميلان',
              'Online',
            ];

      const requestedIds = Array.isArray(
        body.courseIds,
      )
        ? body.courseIds.map((id: unknown) =>
            String(id),
          )
        : null;

      const courses =
        await prisma.course.findMany({
          where: {
            type: 'training',
            trainingKind: 'public',
            published: true,
            ...(requestedIds
              ? {
                  id: {
                    in: requestedIds,
                  },
                }
              : {}),
          },
          include: {
            trainerAssignments: {
              include: {
                staff: true,
              },
              take: 1,
            },
          },
        });

      const created: any[] = [];

      for (const course of courses) {
        for (
          let monthCursor = new Date(
            start.getFullYear(),
            start.getMonth(),
            1,
          );
          monthCursor <= end;
          monthCursor = new Date(
            monthCursor.getFullYear(),
            monthCursor.getMonth() + 1,
            1,
          )
        ) {
          const year =
            monthCursor.getFullYear();
          const month =
            monthCursor.getMonth();

          const firstDay = new Date(
            year,
            month,
            1,
          );

          const lastDay = new Date(
            year,
            month + 1,
            0,
          );

          const firstSundayOffset =
            (7 - firstDay.getDay()) % 7;

          const sundays: Date[] = [];

          for (
            let day =
              1 + firstSundayOffset;
            day <= lastDay.getDate();
            day += 7
          ) {
            const sunday = new Date(
              year,
              month,
              day,
            );

            if (
              sunday >= start &&
              sunday <= end
            ) {
              sundays.push(sunday);
            }
          }

          if (!sundays.length) continue;

          for (
            let cityIndex = 0;
            cityIndex < cities.length;
            cityIndex += 1
          ) {
            const city = cities[cityIndex];
            const date =
              sundays[
                cityIndex % sundays.length
              ];

            const dayStart = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            );

            const dayEnd = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() + 1,
            );

            const existing =
              await prisma.schedule.findFirst({
                where: {
                  courseId: course.id,
                  city,
                  startDate: {
                    gte: dayStart,
                    lt: dayEnd,
                  },
                },
                select: {
                  id: true,
                },
              });

            if (existing) continue;

            const online =
              city === 'Online';

            const price = online
              ? 3000
              : [
                    'الرياض',
                    'جدة',
                    'الدمام',
                  ].includes(city)
                ? 5000
                : city === 'القاهرة'
                  ? 8500
                  : [
                        'دبي',
                        'البحرين',
                        'قطر',
                      ].includes(city)
                    ? 16000
                    : [
                          'لندن',
                          'برشلونة',
                          'ميلان',
                        ].includes(city)
                      ? 21000
                      : Number(course.price);

            const trainer =
              course.trainerAssignments[0]
                ?.staff;

            const schedule =
              await prisma.schedule.create({
                data: {
                  id: `schedule-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,
                  courseId: course.id,
                  courseTitle: course.title,
                  title: course.title,
                  description:
                    course.shortDescription ??
                    course.description,
                  startDate: date,
                  endDate: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate() + 2,
                  ),
                  startTime: '09:00',
                  endTime: online
                    ? '12:00'
                    : '14:00',
                  city,
                  maxParticipants: 20,
                  currentParticipants: 0,
                  waitlistMax: 10,
                  currentWaitlist: 0,
                  price,
                  currency: 'SAR',
                  instructorId:
                    trainer?.id ?? null,
                  instructorName:
                    trainer?.name ?? null,
                  trainerId:
                    trainer?.id ?? null,
                  status: 'available',
                  published: true,
                  allowWaitlist: true,
                  requireConfirmation: false,
                  recurrence: 'once',
                  postAssessmentEnabled:
                    course.postAssessmentEnabled,
                  courseEvaluationEnabled:
                    course.courseEvaluationEnabled,
                },
                include: scheduleInclude,
              });

            created.push(
              serializeSchedule(schedule),
            );
          }
        }
      }

      return Response.json({
        success: true,
        created: created.length,
        schedules: created,
      });
    }

    const courseId = String(
      body.courseId ?? '',
    );

    if (!courseId) {
      return Response.json(
        {
          success: false,
          error: 'الدورة مطلوبة.',
        },
        { status: 400 },
      );
    }

    const course =
      await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
        },
      });

    if (!course) {
      return Response.json(
        {
          success: false,
          error: 'الدورة غير موجودة.',
        },
        { status: 404 },
      );
    }

    const city =
      body.city === 'أونلاين'
        ? 'Online'
        : body.city ?? null;

    const startDate =
      dateOrNull(body.startDate);

    const endDate =
      dateOrNull(body.endDate) ??
      (startDate
        ? new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate() + 2,
          )
        : null);

    if (!startDate || !endDate) {
      return Response.json(
        {
          success: false,
          error:
            'تاريخ البداية والنهاية مطلوبان.',
        },
        { status: 400 },
      );
    }

    const schedule =
      await prisma.schedule.create({
        data: {
          id:
            String(body.id ?? '') ||
            `schedule-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
          courseId,
          courseTitle: String(
            body.courseTitle ?? course.title,
          ),
          title: String(
            body.title ?? course.title,
          ),
          description:
            body.description ?? null,
          startDate,
          endDate,
          startTime: String(
            body.startTime ?? '09:00',
          ),
          endTime: String(
            body.endTime ??
              (city === 'Online'
                ? '12:00'
                : '14:00'),
          ),
          recurrence:
            body.recurrence &&
            Object.values(
              ScheduleRecurrence,
            ).includes(
              body.recurrence as ScheduleRecurrence,
            )
              ? body.recurrence
              : 'once',
          location:
            body.location ?? null,
          city,
          onlineMeetingLink:
            body.onlineMeetingLink ?? null,
          maxParticipants:
            Number(
              body.maxParticipants ?? 20,
            ),
          currentParticipants:
            Number(
              body.currentParticipants ?? 0,
            ),
          waitlistMax: numberOrNull(
            body.waitlistMax,
          ),
          currentWaitlist:
            Number(
              body.currentWaitlist ?? 0,
            ),
          price: numberOrNull(body.price),
          currency:
            body.currency ?? 'SAR',
          instructorId:
            body.instructorId ?? null,
          instructorName:
            body.instructorName ?? null,
          trainerId:
            body.trainerId ??
            body.instructorId ??
            null,
          coordinatorId:
            body.coordinatorId ?? null,
          status:
            body.status &&
            Object.values(
              ScheduleStatus,
            ).includes(
              body.status as ScheduleStatus,
            )
              ? body.status
              : 'available',
          published:
            body.published !== false,
          allowWaitlist:
            body.allowWaitlist !== false,
          requireConfirmation:
            body.requireConfirmation === true,
          confirmationDeadline:
            dateOrNull(
              body.confirmationDeadline,
            ),
          cancellationDeadline:
            dateOrNull(
              body.cancellationDeadline,
            ),
          cancellationPolicy:
            body.cancellationPolicy ??
            null,
          postAssessmentEnabled:
            body.postAssessmentEnabled ===
            true,
          courseEvaluationEnabled:
            body.courseEvaluationEnabled ===
            true,
        },
        include: scheduleInclude,
      });

    if (Array.isArray(body.sessions)) {
      for (const session of body.sessions) {
        await prisma.scheduleSession.create({
          data: {
            id:
              String(session.id ?? '') ||
              `session-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            scheduleId: schedule.id,
            date:
              dateOrNull(session.date) ??
              startDate,
            startTime: String(
              session.startTime ??
                schedule.startTime,
            ),
            endTime: String(
              session.endTime ??
                schedule.endTime,
            ),
            location:
              session.location ?? null,
            onlineMeetingLink:
              session.onlineMeetingLink ??
              null,
            instructorId:
              session.instructorId ?? null,
            notes:
              session.notes ?? null,
          },
        });
      }
    }

    const result =
      await prisma.schedule.findUnique({
        where: {
          id: schedule.id,
        },
        include: scheduleInclude,
      });

    return Response.json({
      success: true,
      schedule: serializeSchedule(result),
    });
  } catch (error) {
    console.error(
      'Schedules POST failed:',
      error,
    );

    return Response.json(
      {
        success: false,
        error: 'تعذر حفظ الموعد.',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'bulkStatus') {
      const ids = Array.isArray(body.ids)
        ? body.ids.map((id: unknown) =>
            String(id),
          )
        : [];

      if (
        !ids.length ||
        !Object.values(
          ScheduleStatus,
        ).includes(
          body.status as ScheduleStatus,
        )
      ) {
        return Response.json(
          {
            success: false,
            error:
              'بيانات الحالة غير صحيحة.',
          },
          { status: 400 },
        );
      }

      await prisma.schedule.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          status: body.status,
        },
      });

      return Response.json({
        success: true,
      });
    }

    if (body.action === 'participantCount') {
      const id = String(body.id ?? '');
      const increment = Number(
        body.increment ?? 0,
      );

      const current =
        await prisma.schedule.findUnique({
          where: { id },
          select: {
            currentParticipants: true,
            maxParticipants: true,
            status: true,
          },
        });

      if (!current) {
        return Response.json(
          {
            success: false,
            error: 'الموعد غير موجود.',
          },
          { status: 404 },
        );
      }

      const next = Math.max(
        0,
        current.currentParticipants +
          increment,
      );

      if (
        current.maxParticipants > 0 &&
        next > current.maxParticipants
      ) {
        return Response.json(
          {
            success: false,
            error:
              'لا يمكن تجاوز سعة الموعد.',
          },
          { status: 400 },
        );
      }

      const schedule =
        await prisma.schedule.update({
          where: { id },
          data: {
            currentParticipants: next,
            status:
              next >=
              current.maxParticipants
                ? 'full'
                : current.status === 'full'
                  ? 'available'
                  : current.status,
          },
          include: scheduleInclude,
        });

      return Response.json({
        success: true,
        schedule:
          serializeSchedule(schedule),
      });
    }

    if (body.action === 'waitlist') {
      const id = String(body.id ?? '');
      const delta =
        body.mode === 'remove'
          ? -1
          : 1;

      const current =
        await prisma.schedule.findUnique({
          where: { id },
          select: {
            currentWaitlist: true,
            waitlistMax: true,
          },
        });

      if (!current) {
        return Response.json(
          {
            success: false,
            error: 'الموعد غير موجود.',
          },
          { status: 404 },
        );
      }

      const next = Math.max(
        0,
        current.currentWaitlist +
          delta,
      );

      if (
        delta > 0 &&
        current.waitlistMax !== null &&
        next > current.waitlistMax
      ) {
        return Response.json(
          {
            success: false,
            error:
              'قائمة الانتظار ممتلئة.',
          },
          { status: 400 },
        );
      }

      const schedule =
        await prisma.schedule.update({
          where: { id },
          data: {
            currentWaitlist: next,
          },
          include: scheduleInclude,
        });

      return Response.json({
        success: true,
        schedule:
          serializeSchedule(schedule),
      });
    }

    const id = String(body.id ?? '');

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'معرف الموعد مطلوب.',
        },
        { status: 400 },
      );
    }

    const existing =
      await prisma.schedule.findUnique({
        where: { id },
      });

    if (!existing) {
      return Response.json(
        {
          success: false,
          error: 'الموعد غير موجود.',
        },
        { status: 404 },
      );
    }

    const data: any = {};

    const stringFields = [
      'courseTitle',
      'title',
      'description',
      'startTime',
      'endTime',
      'location',
      'city',
      'onlineMeetingLink',
      'currency',
      'instructorId',
      'instructorName',
      'trainerId',
      'coordinatorId',
      'cancellationPolicy',
    ];

    for (const field of stringFields) {
      if (body[field] !== undefined) {
        data[field] =
          body[field] === ''
            ? null
            : body[field];
      }
    }

    for (const field of [
      'startDate',
      'endDate',
      'confirmationDeadline',
      'cancellationDeadline',
    ]) {
      if (body[field] !== undefined) {
        data[field] = body[field]
          ? new Date(body[field])
          : null;
      }
    }

    for (const field of [
      'maxParticipants',
      'currentParticipants',
      'waitlistMax',
      'currentWaitlist',
    ]) {
      if (body[field] !== undefined) {
        data[field] =
          body[field] === null
            ? null
            : Number(body[field]);
      }
    }

    if (body.price !== undefined) {
      data.price = numberOrNull(
        body.price,
      );
    }

    if (
      body.recurrence !== undefined &&
      Object.values(
        ScheduleRecurrence,
      ).includes(
        body.recurrence as ScheduleRecurrence,
      )
    ) {
      data.recurrence =
        body.recurrence;
    }

    if (
      body.status !== undefined &&
      Object.values(
        ScheduleStatus,
      ).includes(
        body.status as ScheduleStatus,
      )
    ) {
      data.status = body.status;
    }

    for (const field of [
      'published',
      'allowWaitlist',
      'requireConfirmation',
      'postAssessmentEnabled',
      'courseEvaluationEnabled',
    ]) {
      if (body[field] !== undefined) {
        data[field] =
          body[field] === true;
      }
    }

    const schedule =
      await prisma.schedule.update({
        where: { id },
        data,
        include: scheduleInclude,
      });

    return Response.json({
      success: true,
      schedule:
        serializeSchedule(schedule),
    });
  } catch (error) {
    console.error(
      'Schedules PATCH failed:',
      error,
    );

    return Response.json(
      {
        success: false,
        error: 'تعذر تحديث الموعد.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? '');

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'معرف الموعد مطلوب.',
        },
        { status: 400 },
      );
    }

    await prisma.schedule.delete({
      where: { id },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Schedules DELETE failed:',
      error,
    );

    return Response.json(
      {
        success: false,
        error: 'تعذر حذف الموعد.',
      },
      { status: 500 },
    );
  }
}