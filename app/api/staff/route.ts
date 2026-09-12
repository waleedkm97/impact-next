import { prisma } from '@/lib/prisma';
import type { StaffRole, StaffStatus } from '@/types/staff';

function serializeStaff(user: any) {
  const trainerGroupIds = (user.trainerGroups ?? []).map(
    (group: { id: string }) => group.id,
  );

  const coordinatorGroupIds = (user.coordinatorGroups ?? []).map(
    (group: { id: string }) => group.id,
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.status,
    assignedGroupIds: Array.from(
      new Set([...trainerGroupIds, ...coordinatorGroupIds]),
    ),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt ?? undefined,
  };
}

const staffInclude = {
  trainerGroups: {
    select: {
      id: true,
    },
  },
  coordinatorGroups: {
    select: {
      id: true,
    },
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const role = searchParams.get('role') as StaffRole | null;
    const status = searchParams.get('status') as StaffStatus | null;
    const search = searchParams.get('search')?.trim() ?? '';

    const users = await prisma.staffUser.findMany({
      where: {
        ...(id ? { id } : {}),
        ...(email
          ? {
              email: email.trim().toLowerCase(),
            }
          : {}),
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  phone: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      include: staffInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json({
      success: true,
      users: users.map(serializeStaff),
      count: users.length,
    });
  } catch (error) {
    console.error('Staff GET failed:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر تحميل مستخدمي النظام.',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'seed') {
      const existingCount = await prisma.staffUser.count();

      if (existingCount > 0) {
        return Response.json({
          success: true,
          created: false,
          message: 'يوجد مستخدمون بالفعل.',
        });
      }

      const user = await prisma.staffUser.create({
        data: {
          id: 'staff-admin-1',
          name: 'مدير النظام',
          email: 'admin@impact.sa',
          phone: '',
          passwordHash: 'admin123',
          role: 'admin',
          status: 'active',
        },
        include: staffInclude,
      });

      return Response.json({
        success: true,
        created: true,
        user: serializeStaff(user),
      });
    }

    if (body.action === 'import') {
      const users = Array.isArray(body.users)
        ? body.users
        : [];

      let imported = 0;

      for (const item of users) {
        if (
          !item?.id ||
          !item?.name ||
          !item?.email ||
          !item?.passwordHash
        ) {
          continue;
        }

        await prisma.staffUser.upsert({
          where: {
            id: String(item.id),
          },
          update: {
            name: String(item.name),
            email: String(item.email).trim().toLowerCase(),
            phone: item.phone
              ? String(item.phone)
              : null,
            passwordHash: String(item.passwordHash),
            role: item.role,
            status: item.status ?? 'active',
            lastLoginAt: item.lastLoginAt
              ? new Date(item.lastLoginAt)
              : null,
          },
          create: {
            id: String(item.id),
            name: String(item.name),
            email: String(item.email).trim().toLowerCase(),
            phone: item.phone
              ? String(item.phone)
              : null,
            passwordHash: String(item.passwordHash),
            role: item.role,
            status: item.status ?? 'active',
            createdAt: item.createdAt
              ? new Date(item.createdAt)
              : undefined,
            updatedAt: item.updatedAt
              ? new Date(item.updatedAt)
              : undefined,
            lastLoginAt: item.lastLoginAt
              ? new Date(item.lastLoginAt)
              : null,
          },
        });

        imported++;
      }

      return Response.json({
        success: true,
        imported,
      });
    }

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const role = body.role as StaffRole;
    const status = (body.status ?? 'active') as StaffStatus;

    if (!name) {
      return Response.json(
        { success: false, error: 'اسم المستخدم مطلوب.' },
        { status: 400 },
      );
    }

    if (!email) {
      return Response.json(
        { success: false, error: 'البريد الإلكتروني مطلوب.' },
        { status: 400 },
      );
    }

    if (!password) {
      return Response.json(
        { success: false, error: 'كلمة المرور مطلوبة.' },
        { status: 400 },
      );
    }

    const existing = await prisma.staffUser.findUnique({
      where: { email },
    });

    if (existing) {
      return Response.json(
        {
          success: false,
          error: 'يوجد مستخدم بهذا البريد الإلكتروني.',
        },
        { status: 409 },
      );
    }

    const user = await prisma.staffUser.create({
      data: {
        id:
          body.id ??
          `staff-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        name,
        email,
        phone: body.phone
          ? String(body.phone).trim()
          : null,
        passwordHash: password,
        role,
        status,
      },
      include: staffInclude,
    });

    return Response.json({
      success: true,
      user: serializeStaff(user),
    });
  } catch (error) {
    console.error('Staff POST failed:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر إنشاء المستخدم.',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? '');

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'معرف المستخدم مطلوب.',
        },
        { status: 400 },
      );
    }

    const existing = await prisma.staffUser.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json(
        {
          success: false,
          error: 'المستخدم غير موجود.',
        },
        { status: 404 },
      );
    }

    if (body.email) {
      const email = String(body.email)
        .trim()
        .toLowerCase();

      const duplicate = await prisma.staffUser.findFirst({
        where: {
          email,
          NOT: {
            id,
          },
        },
      });

      if (duplicate) {
        return Response.json(
          {
            success: false,
            error:
              'يوجد مستخدم آخر بهذا البريد الإلكتروني.',
          },
          { status: 409 },
        );
      }
    }

    const data: any = {};

    if (body.name !== undefined) {
      data.name = String(body.name).trim();
    }

    if (body.email !== undefined) {
      data.email = String(body.email)
        .trim()
        .toLowerCase();
    }

    if (body.phone !== undefined) {
      data.phone = body.phone
        ? String(body.phone).trim()
        : null;
    }

    if (body.passwordHash !== undefined) {
      data.passwordHash = String(body.passwordHash);
    }

    if (body.role !== undefined) {
      data.role = body.role;
    }

    if (body.status !== undefined) {
      data.status = body.status;
    }

    if (body.lastLoginAt !== undefined) {
      data.lastLoginAt = body.lastLoginAt
        ? new Date(body.lastLoginAt)
        : null;
    }

    const user = await prisma.staffUser.update({
      where: { id },
      data,
      include: staffInclude,
    });

    return Response.json({
      success: true,
      user: serializeStaff(user),
    });
  } catch (error) {
    console.error('Staff PATCH failed:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر تحديث المستخدم.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        {
          success: false,
          error: 'معرف المستخدم مطلوب.',
        },
        { status: 400 },
      );
    }

    const user = await prisma.staffUser.findUnique({
      where: { id },
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          error: 'المستخدم غير موجود.',
        },
        { status: 404 },
      );
    }

    if (user.role === 'admin') {
      const adminCount =
        await prisma.staffUser.count({
          where: {
            role: 'admin',
            status: {
              not: 'inactive',
            },
          },
        });

      if (adminCount <= 1) {
        return Response.json(
          {
            success: false,
            error:
              'لا يمكن حذف آخر مدير في النظام.',
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
    console.error('Staff DELETE failed:', error);

    return Response.json(
      {
        success: false,
        error: 'تعذر حذف المستخدم.',
      },
      { status: 500 },
    );
  }
}