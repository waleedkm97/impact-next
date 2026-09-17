import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const groups = await prisma.trainingGroup.findMany({
      include: {
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = groups.map((group) => ({
      ...group,
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