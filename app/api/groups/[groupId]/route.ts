import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const type = body.type === 'post' || body.type === 'evaluation' ? body.type : null;

    if (!type || typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'بيانات إتاحة التقييم غير صحيحة.' }, { status: 400 });
    }

    const group = await prisma.trainingGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ error: 'المجموعة غير موجودة.' }, { status: 404 });
    }

    const current = group.assessmentSettings && typeof group.assessmentSettings === 'object'
      ? group.assessmentSettings as Record<string, unknown>
      : {};
    const settings = {
      ...current,
      pre: { enabled: true, ...(current.pre as object ?? {}) },
      post: { ...(current.post as object ?? {}), enabled: type === 'post' ? body.enabled : (current.post as { enabled?: boolean } | undefined)?.enabled === true },
      evaluation: { ...(current.evaluation as object ?? {}), enabled: type === 'evaluation' ? body.enabled : (current.evaluation as { enabled?: boolean } | undefined)?.enabled === true },
    };

    const updated = await prisma.trainingGroup.update({
      where: { id: groupId },
      data: { assessmentSettings: settings },
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (error) {
    console.error('PATCH /api/groups/[groupId] error:', error);
    return NextResponse.json({ error: 'تعذر تحديث إتاحة تقييم المجموعة.' }, { status: 500 });
  }
}

export async function PUT(
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

    const existing =
      await prisma.trainingGroup.findUnique({
        where: {
          id: groupId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error: 'المجموعة غير موجودة.',
        },
        {
          status: 404,
        },
      );
    }

    const updated =
      await prisma.trainingGroup.update({
        where: {
          id: groupId,
        },
        data: {
          name: body.name,
          courseId: body.courseId,
          courseTitle: body.courseTitle,
          corporateDate:
            body.corporateDate ?? null,
          corporateDelivery:
            body.corporateDelivery ?? null,
          corporateLocation:
            body.corporateLocation ?? null,
          materialUrl:
            body.materialUrl ?? null,
            trainerId:
  body.trainerId ?? null,
coordinatorId:
  body.coordinatorId ?? null,
          companyName:
            body.companyName ?? null,
          responsibleName:
            body.responsibleName ?? null,
          responsibleEmail:
            body.responsibleEmail ?? null,
          responsiblePhone:
            body.responsiblePhone ?? null,
          notes: body.notes ?? null,
        },
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      'PUT /api/groups/[groupId] error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'تعذر تعديل المجموعة في قاعدة البيانات.',
      },
      {
        status: 500,
      },
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

    const existing =
      await prisma.trainingGroup.findUnique({
        where: {
          id: groupId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error: 'المجموعة غير موجودة.',
        },
        {
          status: 404,
        },
      );
    }

    await prisma.trainingGroup.delete({
      where: {
        id: groupId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'DELETE /api/groups/[groupId] error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'تعذر حذف المجموعة من قاعدة البيانات.',
      },
      {
        status: 500,
      },
    );
  }
}
