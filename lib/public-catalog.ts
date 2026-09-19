import type { Course } from '@/types/course';
import type { Schedule } from '@/types/schedule';

export type PublicCategory = {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
};

export type PublicCourse = Course & {
  category?: PublicCategory | null;
  schedules?: Schedule[];
};

function normalizeCourse(raw: any): PublicCourse {
  return {
    ...raw,
    price: Number(raw.price ?? 0),
    oldPrice: raw.oldPrice == null ? undefined : Number(raw.oldPrice),
    discount: raw.discount == null ? undefined : Number(raw.discount),
    hours: raw.hours == null ? undefined : Number(raw.hours),
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    schedules: (raw.schedules ?? []).map((schedule: any) => ({
      ...schedule,
      price: schedule.price == null ? undefined : Number(schedule.price),
      startDate: new Date(schedule.startDate),
      endDate: new Date(schedule.endDate),
      createdAt: new Date(schedule.createdAt),
      updatedAt: new Date(schedule.updatedAt),
    })),
  } as PublicCourse;
}

export async function fetchCatalog(params: {
  id?: string;
  type?: 'recorded' | 'training';
  categoryId?: string;
  includeSchedules?: boolean;
  featured?: boolean;
} = {}) {
  const search = new URLSearchParams();
  if (params.id) search.set('id', params.id);
  if (params.type) search.set('type', params.type);
  if (params.categoryId) search.set('categoryId', params.categoryId);
  if (params.includeSchedules) search.set('includeSchedules', 'true');
  if (params.featured) search.set('featured', 'true');
  if (typeof document !== 'undefined') {
    const language = document.cookie.split('; ').find((item) => item.startsWith('impact_locale='))?.split('=')[1];
    if (language === 'en') search.set('lang', 'en');
  }

  const response = await fetch(`/api/catalog?${search.toString()}`, {
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'تعذر تحميل الكتالوج');
  }

  const courses = (payload.courses ?? []).map(normalizeCourse);
  const schedules = courses.flatMap((course: PublicCourse) => course.schedules ?? []);
  return {
    courses,
    schedules,
    totalCount: Number(payload.totalCount ?? courses.length),
    categories: (payload.categories ?? []) as PublicCategory[],
  };
}
