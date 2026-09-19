import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasStaffPermission } from '@/lib/staff-authorization';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر تحميل الفئات.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await hasStaffPermission(request, 'editCourses'))) {
      return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
    }
    const body = await request.json();
    const name = String(body.name ?? '').trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'اسم الفئة مطلوب.' },
        { status: 400 },
      );
    }

    const existingCategories = await prisma.category.findMany({ select: { id: true, name: true } });
    const normalize = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, '');
    const duplicate = existingCategories.find((category) => normalize(category.name) === normalize(name));
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'هذه الفئة موجودة مسبقاً.', category: duplicate },
        { status: 409 },
      );
    }

    const category = await prisma.category.create({
      data: {
        id: String(body.id || crypto.randomUUID()),
        name,
        englishName: body.englishName ? String(body.englishName).trim() : null,
        description: body.description ? String(body.description).trim() : null,
        image: body.image ? String(body.image) : null,
        published: body.published !== false,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر إنشاء الفئة.' },
      { status: 500 },
    );
  }
}
