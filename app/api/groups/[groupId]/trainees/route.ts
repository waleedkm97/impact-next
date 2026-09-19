import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initialAssessmentStates } from '@/lib/assessment-access';

type Params = {
  params: Promise<{ groupId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { groupId } = await params;
    const body = await request.json();

    const traineeId = String(body.traineeId || '').trim();

    if (!groupId || !traineeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'groupId and traineeId are required',
        },
        { status: 400 },
      );
    }

    const group = await prisma.trainingGroup.findUnique({
      where: { id: groupId },
      include: { course: { include: { assessments: { select: { assessmentType: true } } } } },
    });

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          error: 'Training group not found',
        },
        { status: 404 },
      );
    }

    const trainee = await prisma.trainee.findUnique({
      where: { id: traineeId },
    });

    if (!trainee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trainee not found',
        },
        { status: 404 },
      );
    }

    await prisma.groupTrainee.upsert({
      where: {
        groupId_traineeId: {
          groupId,
          traineeId,
        },
      },
      update: {},
      create: {
        groupId,
        traineeId,
      },
    });

    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        traineeId,
        courseId: group.courseId,
        groupId,
      },
    });

    const states = initialAssessmentStates({
      assessmentTypes: group.course.assessments.flatMap((item) =>
        item.assessmentType === 'pre' || item.assessmentType === 'post' || item.assessmentType === 'evaluation' ? [item.assessmentType] : [],
      ),
      enrollment: { groupId },
      course: group.course,
      group,
    });

    const enrollment =
      existingEnrollment ??
      (await prisma.courseEnrollment.create({
        data: {
            id: crypto.randomUUID(),
          traineeId,
          courseId: group.courseId,
          courseTitle: group.courseTitle,
          groupId,
          status: 'active',
          progress: 0,
          ...states,
        },
      }));

    return NextResponse.json({
      success: true,
      enrollment,
    });
  } catch (error) {
    console.error('POST /api/groups/[groupId]/trainees failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add trainee to group',
      },
      { status: 500 },
    );
  }
}
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ groupId: string }>;
  },
) {
  try {
    const { groupId } = await params;
    const body = await request.json();

    if (!body.traineeId) {
      return NextResponse.json(
        {
          error: 'معرف المتدرب مطلوب.',
        },
        {
          status: 400,
        },
      );
    }

    const membership =
      await prisma.groupTrainee.findUnique({
        where: {
          groupId_traineeId: {
            groupId,
            traineeId: body.traineeId,
          },
        },
      });

    if (!membership) {
      return NextResponse.json(
        {
          error: 'المتدرب غير موجود في المجموعة.',
        },
        {
          status: 404,
        },
      );
    }

    await prisma.groupTrainee.delete({
      where: {
        groupId_traineeId: {
          groupId,
          traineeId: body.traineeId,
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'DELETE /api/groups/[groupId]/trainees error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'تعذر حذف المتدرب من المجموعة في قاعدة البيانات.',
      },
      {
        status: 500,
      },
    );
  }
}
