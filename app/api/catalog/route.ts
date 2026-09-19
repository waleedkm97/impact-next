import { prisma } from '@/lib/prisma';

function serializeCourse(course: any, language: 'ar' | 'en') {
  const english = language === 'en'
    ? (course.contentEn && typeof course.contentEn === 'object' ? course.contentEn : {
        title: 'Professional Development Course',
        shortDescription: 'A practical professional development course for the workplace.',
        description: 'A structured professional course focused on practical tools, workplace application and measurable improvement.',
        objectives: ['Build practical workplace capability.', 'Apply tools to real situations.', 'Create an actionable improvement plan.'],
        outline: ['Core concepts', 'Practical tools', 'Workplace case studies', 'Application plan'],
        audience: 'Professionals and managers seeking practical development.',
        methodology: 'Interactive learning, practical exercises and workplace case studies.',
      })
    : null;
  return {
    ...course,
    ...(english
      ? {
          title: english.title ?? course.title,
          shortDescription: english.shortDescription ?? course.shortDescription,
          description: english.description ?? course.description,
          objectives: english.objectives ?? course.objectives,
          outline: Array.isArray(english.outline) ? english.outline.join('\n') : english.outline ?? course.outline,
          audience: english.audience ?? course.audience,
          methodology: english.methodology ?? course.methodology,
        }
      : {}),
    price: Number(course.price ?? 0),
    image: course.image ?? course.thumbnail ?? course.category?.image ?? null,
    thumbnail: course.thumbnail ?? course.image ?? course.category?.image ?? null,
    oldPrice: course.oldPrice == null ? null : Number(course.oldPrice),
    discount: course.discount == null ? null : Number(course.discount),
    hours: course.hours == null ? null : Number(course.hours),
    schedules: (course.schedules ?? []).map((schedule: any) => ({
      ...schedule,
      price: schedule.price == null ? null : Number(schedule.price),
      startDate: new Date(schedule.startDate).toISOString(),
      endDate: new Date(schedule.endDate).toISOString(),
      createdAt: new Date(schedule.createdAt).toISOString(),
      updatedAt: new Date(schedule.updatedAt).toISOString(),
    })),
    createdAt: new Date(course.createdAt).toISOString(),
    updatedAt: new Date(course.updatedAt).toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get('id')?.trim();
    const type = params.get('type');
    const categoryId = params.get('categoryId');
    const includeSchedules = params.get('includeSchedules') === 'true';
    const language = params.get('lang') === 'en' ? 'en' : 'ar';
    const featuredOnly = params.get('featured') === 'true';
    const totalCount = await prisma.course.count({
      where: { published: true, status: 'published' },
    });

    const courses = await prisma.course.findMany({
      where: {
        published: true,
        status: 'published',
        ...(id ? { id } : {}),
        ...(type === 'recorded' || type === 'training' ? { type } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(featuredOnly ? { featured: true } : {}),
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      ...(id ? { take: 1 } : {}),
      include: {
        category: true,
        ...(includeSchedules
          ? {
              schedules: {
                where: { published: true },
                orderBy: { startDate: 'asc' },
              },
            }
          : {}),
      },
    });

    return Response.json({
      success: true,
      totalCount,
      courses: courses.map((course) => serializeCourse(course, language)),
      categories: id
        ? []
        : (await prisma.category.findMany({
            where: { published: true },
            orderBy: { name: 'asc' },
          })).map((category) => ({
            ...category,
            name: language === 'en' ? category.englishName ?? 'Professional Development' : category.name,
          })),
    });
  } catch (error) {
    console.error('GET /api/catalog error:', error);
    return Response.json(
      { success: false, error: 'تعذر تحميل الكتالوج.' },
      { status: 500 },
    );
  }
}
