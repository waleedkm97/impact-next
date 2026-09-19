import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasStaffPermission } from '@/lib/staff-authorization';
import { canAccessGroup } from '@/lib/staff-scope';

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { groupId } = await params;

    if (request.headers.get('cookie')?.includes('impact_staff=')) {
      if (!(await hasStaffPermission(request, 'viewTrainingMaterials'))) {
        return NextResponse.json({ success: false, error: 'غير مصرح.' }, { status: 403 });
      }

      if (!(await canAccessGroup(request, groupId))) {
        return NextResponse.json({ success: false, error: 'المجموعة خارج نطاق الإسناد.' }, { status: 403 });
      }
    }

    const group = await prisma.trainingGroup.findUnique({
      where: { id: groupId },
      select: {
        materialUrl: true,
        course: { select: { materialUrl: true } },
      },
    });

    const material = group?.materialUrl || group?.course?.materialUrl;

    if (!material) {
      return NextResponse.json({ success: false, error: 'المادة التدريبية غير موجودة.' }, { status: 404 });
    }

    if (!material.startsWith('data:')) {
      return NextResponse.redirect(material);
    }

    const match = material.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/);
    if (!match) {
      return NextResponse.json({ success: false, error: 'رابط المادة غير صالح.' }, { status: 400 });
    }

    const contentType = match[1] || 'application/octet-stream';
    const content = match[2]
      ? Buffer.from(match[3], 'base64')
      : Buffer.from(decodeURIComponent(match[3]), 'utf8');

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline; filename="training-material.pdf"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('GET /api/groups/[groupId]/material error:', error);
    return NextResponse.json({ success: false, error: 'تعذر فتح المادة التدريبية.' }, { status: 500 });
  }
}
