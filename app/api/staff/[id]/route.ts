import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const user = await prisma.staffUser.findUnique({
      where: { id },
      include: {
        trainerGroups: {
          select: { id: true },
        },
        coordinatorGroups: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          error: 'Staff user not found',
        },
        { status: 404 },
      );
    }

    const assignedGroupIds = [
      ...user.trainerGroups.map((group) => group.id),
      ...user.coordinatorGroups.map((group) => group.id),
    ];

    return Response.json({
      success: true,
      user: {
        ...user,
        assignedGroupIds,
      },
    });
  } catch (error) {
    console.error('Get staff user failed:', error);

    return Response.json(
      {
        success: false,
        error: 'Failed to get staff user',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existingUser = await prisma.staffUser.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return Response.json(
        {
          success: false,
          error: 'Staff user not found',
        },
        { status: 404 },
      );
    }

    const data: {
      name?: string;
      email?: string;
      phone?: string | null;
      passwordHash?: string;
      role?: 'admin' | 'coordinator' | 'trainer';
      status?: 'active' | 'inactive' | 'suspended';
    } = {};

    if (typeof body.name === 'string') {
      data.name = body.name;
    }

    if (typeof body.email === 'string') {
      data.email = body.email;
    }

    if (body.phone !== undefined) {
      data.phone = body.phone || null;
    }

    if (typeof body.passwordHash === 'string') {
      data.passwordHash = body.passwordHash;
    }

    if (
      body.role === 'admin' ||
      body.role === 'coordinator' ||
      body.role === 'trainer'
    ) {
      data.role = body.role;
    }

    if (
      body.status === 'active' ||
      body.status === 'inactive' ||
      body.status === 'suspended'
    ) {
      data.status = body.status;
    }

    const assignedGroupIds = Array.isArray(body.assignedGroupIds)
      ? body.assignedGroupIds.filter(
          (groupId: unknown): groupId is string =>
            typeof groupId === 'string',
        )
      : undefined;

    const nextRole = data.role ?? existingUser.role;

    const user = await prisma.staffUser.update({
      where: { id },
      data: {
        ...data,

        trainerGroups:
          assignedGroupIds !== undefined
            ? nextRole === 'trainer'
              ? {
                  set: assignedGroupIds.map((groupId: string) => ({
                    id: groupId,
                  })),
                }
              : {
                  set: [],
                }
            : undefined,

        coordinatorGroups:
          assignedGroupIds !== undefined
            ? nextRole === 'coordinator'
              ? {
                  set: assignedGroupIds.map((groupId: string) => ({
                    id: groupId,
                  })),
                }
              : {
                  set: [],
                }
            : undefined,
      },
      include: {
        trainerGroups: {
          select: { id: true },
        },
        coordinatorGroups: {
          select: { id: true },
        },
      },
    });

    const resultAssignedGroupIds = [
      ...user.trainerGroups.map((group) => group.id),
      ...user.coordinatorGroups.map((group) => group.id),
    ];

    return Response.json({
      success: true,
      user: {
        ...user,
        assignedGroupIds: resultAssignedGroupIds,
      },
    });
  } catch (error) {
    console.error('Update staff user failed:', error);

    return Response.json(
      {
        success: false,
        error: 'Failed to update staff user',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const user = await prisma.staffUser.findUnique({
      where: { id },
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          error: 'Staff user not found',
        },
        { status: 404 },
      );
    }

    if (user.role === 'admin' && user.status === 'active') {
      const activeAdminCount = await prisma.staffUser.count({
        where: {
          role: 'admin',
          status: 'active',
        },
      });

      if (activeAdminCount <= 1) {
        return Response.json(
          {
            success: false,
            error: 'Cannot delete the last active admin',
          },
          { status: 400 },
        );
      }
    }

    await prisma.staffUser.delete({
      where: { id },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete staff user failed:', error);

    return Response.json(
      {
        success: false,
        error: 'Failed to delete staff user',
      },
      { status: 500 },
    );
  }
}