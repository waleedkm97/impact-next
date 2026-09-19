import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { hasStaffPermission } from '@/lib/staff-authorization';
import { scopedGroupWhere } from '@/lib/staff-scope';



export async function GET(request: Request) {
  try {
    if (request.headers.get('cookie')?.includes('impact_staff=')) {
      const canReadGroups = await Promise.all([
        hasStaffPermission(request, 'viewGroups'),
        hasStaffPermission(request, 'viewTrainees'),
        hasStaffPermission(request, 'manageAttendance'),
        hasStaffPermission(request, 'viewTrainingMaterials'),
        hasStaffPermission(request, 'viewAssessments'),
      ]);

      if (!canReadGroups.some(Boolean)) {
        return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 });
      }
    }
    const groups = await prisma.trainingGroup.findMany({
      where: await scopedGroupWhere(request),
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        courseId: true,
        courseTitle: true,
        scheduleId: true,
        corporateDate: true,
        corporateDelivery: true,
        corporateLocation: true,
        meetingLink: true,
        expectedTrainees: true,
        companyName: true,
        responsibleName: true,
        responsibleEmail: true,
        responsiblePhone: true,
        trainerId: true,
        coordinatorId: true,
        maxParticipants: true,
        notes: true,
        assessmentSettings: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            meetingLink: true,
            delivery: true,
          },
        },
        schedule: {
          select: {
            onlineMeetingLink: true,
            location: true,
            city: true,
          },
        },
        trainees: {
          select: {
            traineeId: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            traineeId: true,
            courseId: true,
            courseTitle: true,
            scheduleId: true,
            groupId: true,
            trainerId: true,
            coordinatorId: true,
            status: true,
            progress: true,
            attendance: true,
            attendanceMode: true,
            preAssessment: true,
            postAssessment: true,
            courseEvaluation: true,
            preAssessmentScore: true,
            postAssessmentScore: true,
            courseEvaluationScore: true,
            preAssessmentAnswers: true,
            postAssessmentAnswers: true,
            courseEvaluationAnswers: true,
            preAssessmentCompletedAt: true,
            postAssessmentCompletedAt: true,
            courseEvaluationCompletedAt: true,
            completedAt: true,
            certificateId: true,
            enrolledAt: true,
            createdAt: true,
            updatedAt: true,
            attendanceDays: {
              orderBy: { date: 'asc' },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const materialFlags = groups.length
      ? await prisma.$queryRaw<
          Array<{ id: string; materialAvailable: boolean }>
        >`SELECT "id", ("materialUrl" IS NOT NULL) AS "materialAvailable" FROM "TrainingGroup" WHERE "id" IN (${Prisma.join(groups.map((group) => group.id))})`
      : [];
    const materialById = new Map(
      materialFlags.map((item) => [item.id, item.materialAvailable]),
    );

    const result = groups.map((group) => ({
      ...group,
      materialAvailable: materialById.get(group.id) ?? false,
      traineeIds: group.trainees.map(
        (item) => item.traineeId,
      ),
      trainees: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/groups error:', error);

    return NextResponse.json(
      {
        error: 'تعذر تحميل المجموعات من قاعدة البيانات.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    if (!(await hasStaffPermission(request, 'createGroup'))) {
      return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 });
    }
    const body = await request.json();

    const {
      id,
      name,
      type,
      status,
      courseId,
      courseTitle,
      scheduleId,
      corporateDate,
      corporateDelivery,
      corporateLocation,
      materialUrl,
      meetingLink,
      expectedTrainees,
      companyName,
      responsibleName,
      responsibleEmail,
      responsiblePhone,
      trainerId,
      coordinatorId,
      maxParticipants,
      notes,
      assessmentSettings,
    } = body;

    if (!id || !name || !courseId || !courseTitle) {
      return NextResponse.json(
        {
          error:
            'بيانات المجموعة الأساسية غير مكتملة.',
        },
        {
          status: 400,
        },
      );
    }

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          error: 'الدورة المرتبطة بالمجموعة غير موجودة.',
        },
        {
          status: 404,
        },
      );
    }

    const existing = await prisma.trainingGroup.findUnique({
      where: {
        id,
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const group = await prisma.trainingGroup.create({
      data: {
        id,
        name,
        type: type ?? 'corporate',
        status: status ?? 'active',
        courseId,
        courseTitle,
        scheduleId: scheduleId ?? null,
        corporateDate: corporateDate ?? null,
        corporateDelivery:
          corporateDelivery ?? null,
        corporateLocation:
          corporateLocation ?? null,
        materialUrl: materialUrl ?? null,
        meetingLink: meetingLink ?? null,
        expectedTrainees:
          expectedTrainees === null || expectedTrainees === undefined || expectedTrainees === ''
            ? null
            : Number(expectedTrainees),
        companyName: companyName ?? null,
        responsibleName:
          responsibleName ?? null,
        responsibleEmail:
          responsibleEmail ?? null,
        responsiblePhone:
          responsiblePhone ?? null,
        trainerId: trainerId ?? null,
        coordinatorId:
          coordinatorId ?? null,
        maxParticipants:
          typeof maxParticipants === 'number'
            ? maxParticipants
            : null,
        notes: notes ?? null,
        assessmentSettings:
          assessmentSettings ?? null,
      },
    });

    return NextResponse.json(
      {
        ...group,
        traineeIds: [],
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error('POST /api/groups error:', error);

    return NextResponse.json(
      {
        error: 'تعذر حفظ المجموعة في قاعدة البيانات.',
      },
      {
        status: 500,
      },
    );
  }
}