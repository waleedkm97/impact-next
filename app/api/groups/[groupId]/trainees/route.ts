import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const enrollment =
      existingEnrollment ??
      (await prisma.courseEnrollment.create({
        data: {
            id: crypto.randomUUID(),
          traineeId,
          courseId: group.courseId,
          courseTitle: group.courseTitle,
          groupId,
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