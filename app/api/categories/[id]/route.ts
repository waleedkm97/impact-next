import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasStaffPermission } from '@/lib/staff-authorization';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    if (!(await hasStaffPermission(request, 'editCourses'))) {
      return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.englishName !== undefined ? { englishName: body.englishName ? String(body.englishName).trim() : null } : {}),
        ...(body.description !== undefined
          ? { description: body.description ? String(body.description).trim() : null }
          : {}),
        ...(body.image !== undefined ? { image: body.image || null } : {}),
        ...(body.published !== undefined ? { published: body.published === true } : {}),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('PATCH /api/categories/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر تحديث الفئة.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    if (!(await hasStaffPermission(_request, 'editCourses'))) {
      return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }
    const { id } = await params;
    const used = await prisma.course.count({ where: { categoryId: id } });

    if (used > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف فئة مرتبطة بدورات أو برامج.' },
        { status: 400 },
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/categories/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر حذف الفئة.' },
      { status: 500 },
    );
  }
}
