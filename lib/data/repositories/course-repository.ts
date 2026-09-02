import type {
  Course,
  CourseLesson,
  CourseQuery,
  CourseFilter,
  LessonQuestion,
} from '@/types/course';
import { DEFAULT_CATEGORIES, DEFAULT_RECORDED_LESSONS, SEED_COURSES } from '@/lib/data/seed-data';
import { browserDbGet, browserDbSet, migrateLegacyData } from '@/lib/data/browser-db';

export interface ICourseRepository {
  findById(id: string): Promise<Course | null>;
  findBySlug(slug: string): Promise<Course | null>;
  findAll(query?: CourseQuery): Promise<Course[]>;
  create(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course>;
  update(id: string, course: Partial<Course>): Promise<Course>;
  delete(id: string): Promise<void>;
  findLessonById(lessonId: string): Promise<CourseLesson | null>;
  findLessonsByCourseId(courseId: string): Promise<CourseLesson[]>;
  createLesson(courseId: string, lesson: Omit<CourseLesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>): Promise<CourseLesson>;
  updateLesson(lessonId: string, lesson: Partial<CourseLesson>): Promise<CourseLesson>;
  deleteLesson(lessonId: string): Promise<void>;
  search(query: string, limit?: number): Promise<Course[]>;
  findByCategory(categoryId: string, query?: CourseQuery): Promise<Course[]>;
  findByType(type: 'recorded' | 'training' | 'public', query?: CourseQuery): Promise<Course[]>;
  findFeatured(limit?: number): Promise<Course[]>;
  findPublished(query?: CourseQuery): Promise<Course[]>;
  getCount(filter?: CourseFilter): Promise<number>;
  getPopularCourses(limit?: number): Promise<Course[]>;
  bulkUpdate(ids: string[], updates: Partial<Course>): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '').replace(/-+/g, '-');
}

function date(value: unknown, fallback = new Date()) {
  const d = value instanceof Date ? value : new Date(String(value ?? ''));
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function durationToSeconds(value: unknown) {
  if (typeof value === 'number') return value;
  const match = String(value ?? '').match(/(\d+)/);
  return match ? Number(match[1]) * 60 : undefined;
}

function mapLegacyLesson(raw: any, courseId: string, index: number): CourseLesson {
  const questions: LessonQuestion[] = raw.type === 'quiz' && raw.question
    ? [{
        id: `${raw.id}-q1`,
        lessonId: raw.id,
        question: raw.question,
        type: 'multiple-choice',
        options: raw.options ?? [],
        correctAnswer: String(raw.correctIndex ?? 0),
        explanation: raw.explanation,
        order: 1,
        points: 1,
      }]
    : [];

  return {
    id: raw.id,
    courseId,
    title: raw.title ?? `درس ${index + 1}`,
    description: raw.description,
    type: raw.type === 'quiz' ? 'quiz' : 'video',
    order: raw.order ?? index + 1,
    videoId: raw.videoId ?? raw.videoUrl,
    videoDuration: raw.videoDuration ?? durationToSeconds(raw.duration),
    questions,
    afterLessonId: raw.afterLessonId,
    createdAt: date(raw.createdAt),
    updatedAt: date(raw.updatedAt),
  };
}

function buildSeedCourses(): Course[] {
  return (SEED_COURSES as any[]).map((raw) => {
    const isRecorded = raw.type === 'recorded';
    const delivery = isRecorded ? 'online' : raw.delivery === 'online' ? 'online' : 'in-person';
    const category = (DEFAULT_CATEGORIES as any[]).find((c:any) => c.id === raw.categoryId || c.name === raw.category);
    const categoryId = raw.categoryId ?? category?.id ?? slugify(raw.category ?? '');
    const rawLessons = isRecorded && Array.isArray(raw.lessons) && raw.lessons.length
      ? raw.lessons
      : isRecorded ? DEFAULT_RECORDED_LESSONS : [];
    const lessons: CourseLesson[] = rawLessons.map((lesson: any, index: number) => mapLegacyLesson(lesson, raw.id, index));
    const now = date(raw.createdAt);

    return {
      id: raw.id,
      title: raw.title,
      slug: raw.slug ?? slugify(raw.title),
      description: raw.fullDescription ?? raw.description ?? '',
      shortDescription: raw.shortDescription,
      categoryId,
      type: isRecorded ? 'recorded' : 'training',
      delivery,
      cities: raw.cities ?? [],
      price: Number(raw.price ?? 0),
      oldPrice: raw.oldPrice == null ? undefined : Number(raw.oldPrice),
      discount: typeof raw.discount === 'number' ? raw.discount : undefined,
      currency: 'SAR',
      days: Number(raw.days ?? 0),
      hours: typeof raw.hours === 'number' ? raw.hours : Number(String(raw.hours ?? '').match(/\d+(?:\.\d+)?/)?.[0] ?? 0),
      videosCount: lessons.filter((l) => l.type === 'video').length,
      objectives: raw.objectives ?? [],
      outcomes: raw.outcomes ?? [],
      outline: Array.isArray(raw.outline) ? raw.outline.join('\n') : raw.outline,
      lessons,
      schedules: [],
      assessments: [],
      audience: raw.audience,
      methodology: raw.methodology,
      image: raw.image,
      featured: Boolean(raw.featured),
      published: raw.published !== false,
      status: raw.published === false ? 'draft' : 'published',
      certificateSettings: {
        enabled: raw.hasCertificate !== false,
        autoGenerate: false,
        requireCompletion: true,
        requireAssessmentPass: false,
      },
      createdAt: now,
      updatedAt: now,
    } satisfies Course;
  });
}

let courses: Course[] = buildSeedCourses();
let hydrated = false;
let hydration: Promise<void> | null = null;
async function ensureHydrated(){ if(hydrated) return; await migrateLegacyData(); if(!hydration){ hydration=(async()=>{ const saved=await browserDbGet<Course[]>('courses'); if(saved !== null) courses=saved.map(normalizeCourse); hydrated=true; })().catch(()=>{hydrated=true;}); } await hydration; }
function normalizeCourse(c: Course): Course { return {...c, createdAt:date(c.createdAt), updatedAt:date(c.updatedAt), lessons:(c.lessons??[]).map(l=>({...l,createdAt:date(l.createdAt),updatedAt:date(l.updatedAt),questions:l.questions?.map(q=>({...q}))})), schedules:(c.schedules??[]).map(s=>({...s,startDate:date(s.startDate),endDate:date(s.endDate),createdAt:date(s.createdAt),updatedAt:date(s.updatedAt)})), assessments:(c.assessments??[]).map(a=>({...a,createdAt:date(a.createdAt),updatedAt:date(a.updatedAt)}))}; }
async function persist(){ await browserDbSet('courses', courses); }

function cloneCourse(course: Course): Course {
  return {
    ...course,
    objectives: [...course.objectives],
    outcomes: [...course.outcomes],
    lessons: (course.lessons ?? []).map((lesson) => ({ ...lesson, questions: lesson.questions?.map((q) => ({ ...q, options: q.options ? [...q.options] : undefined })) })),
    schedules: [...(course.schedules ?? [])],
    assessments: [...(course.assessments ?? [])],
  };
}

function matches(course: Course, filter?: CourseFilter) {
  if (!filter) return true;
  if (filter.type && course.type !== filter.type) return false;
  if (filter.delivery && course.delivery !== filter.delivery) return false;
  if (filter.categoryId && course.categoryId !== filter.categoryId) return false;
  if (filter.city && !(course.cities ?? []).includes(filter.city)) return false;
  if (typeof filter.minPrice === 'number' && course.price < filter.minPrice) return false;
  if (typeof filter.maxPrice === 'number' && course.price > filter.maxPrice) return false;
  if (typeof filter.featured === 'boolean' && course.featured !== filter.featured) return false;
  if (typeof filter.published === 'boolean' && course.published !== filter.published) return false;
  if (filter.searchQuery) {
    const q = filter.searchQuery.trim().toLowerCase();
    const text = [course.title, course.description, course.shortDescription, course.categoryId, course.audience, ...(course.objectives ?? []), ...(course.outcomes ?? [])].filter(Boolean).join(' ').toLowerCase();
    if (!text.includes(q)) return false;
  }
  return true;
}

export class CourseRepository implements ICourseRepository {
  async findById(id: string) { await ensureHydrated(); const c = courses.find((x) => x.id === id); return c ? cloneCourse(c) : null; }
  async findBySlug(slug: string) { await ensureHydrated(); const normalized = slugify(slug); const c = courses.find((x) => x.slug === normalized); return c ? cloneCourse(c) : null; }

  async findAll(query?: CourseQuery) { await ensureHydrated();
    let result = courses.filter((c) => matches(c, query?.filter));
    const order = query?.order ?? 'desc';
    result.sort((a, b) => {
      let n = 0;
      if (query?.sort === 'title') n = a.title.localeCompare(b.title, 'ar');
      else if (query?.sort === 'price') n = a.price - b.price;
      else if (query?.sort === 'popularity') n = Number(b.featured) - Number(a.featured);
      else n = a.createdAt.getTime() - b.createdAt.getTime();
      return order === 'asc' ? n : -n;
    });
    const offset = query?.offset ?? 0;
    const end = typeof query?.limit === 'number' ? offset + query.limit : undefined;
    return result.slice(offset, end).map(cloneCourse);
  }

  async create(input: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) { await ensureHydrated();
    const now = new Date();
    const created: Course = { ...input, id: (input as any).id ?? `course-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, slug: input.slug || slugify(input.title), createdAt: now, updatedAt: now, lessons: input.lessons ?? [], schedules: input.schedules ?? [], assessments: input.assessments ?? [] };
    courses = [...courses, created];
    await persist();
    return cloneCourse(created);
  }

  async update(id: string, updates: Partial<Course>) { await ensureHydrated();
    const index = courses.findIndex((c) => c.id === id);
    if (index < 0) throw new Error(`Course not found: ${id}`);
    const updated = { ...courses[index], ...updates, id, updatedAt: new Date() };
    courses[index] = updated;
    await persist();
    return cloneCourse(updated);
  }

  async delete(id: string) { await ensureHydrated(); courses = courses.filter((c) => c.id !== id); await persist(); }

  async findLessonById(lessonId: string) { await ensureHydrated(); for (const c of courses) { const l = c.lessons?.find((x) => x.id === lessonId); if (l) return { ...l }; } return null; }
  async findLessonsByCourseId(courseId: string) { await ensureHydrated(); const c = courses.find((x) => x.id === courseId); return [...(c?.lessons ?? [])].sort((a,b) => a.order-b.order).map((l) => ({ ...l })); }

  async createLesson(courseId: string, input: Omit<CourseLesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>) { await ensureHydrated();
    const course = courses.find((c) => c.id === courseId);
    if (!course) throw new Error(`Course not found: ${courseId}`);
    const now = new Date();
    const id = `lesson-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const lesson: CourseLesson = { ...input, id, courseId, order: input.order ?? (course.lessons?.length ?? 0) + 1, createdAt: now, updatedAt: now, questions: input.questions?.map((q) => ({ ...q, lessonId: id })) };
    course.lessons = [...(course.lessons ?? []), lesson];
    course.videosCount = course.lessons.filter((l) => l.type === 'video').length;
    course.updatedAt = now;
    await persist();
    return { ...lesson };
  }

  async updateLesson(lessonId: string, updates: Partial<CourseLesson>) { await ensureHydrated();
    for (const course of courses) {
      const index = course.lessons?.findIndex((l) => l.id === lessonId) ?? -1;
      if (index < 0) continue;
      const existing = course.lessons![index];
      const updated: CourseLesson = { ...existing, ...updates, id: lessonId, courseId: existing.courseId, updatedAt: new Date(), questions: updates.questions?.map((q) => ({ ...q, lessonId })) ?? existing.questions };
      course.lessons![index] = updated;
      course.videosCount = course.lessons!.filter((l) => l.type === 'video').length;
      course.updatedAt = new Date();
      await persist();
      return { ...updated };
    }
    throw new Error(`Lesson not found: ${lessonId}`);
  }

  async deleteLesson(lessonId: string) { await ensureHydrated();
    for (const course of courses) {
      const before = course.lessons?.length ?? 0;
      if (!course.lessons) continue;
      course.lessons = course.lessons.filter((l) => l.id !== lessonId).map((l, i) => ({ ...l, order: i + 1 }));
      if (course.lessons.length !== before) { course.videosCount = course.lessons.filter((l) => l.type === 'video').length; course.updatedAt = new Date(); await persist(); return; }
    }
  }

  async search(query: string, limit = 20) { await ensureHydrated(); return this.findAll({ filter: { searchQuery: query }, limit }); }
  async findByCategory(categoryId: string, query?: CourseQuery) { await ensureHydrated(); return this.findAll({ ...query, filter: { ...query?.filter, categoryId } }); }
  async findByType(type: 'recorded' | 'training' | 'public', query?: CourseQuery) { await ensureHydrated(); return this.findAll({ ...query, filter: { ...query?.filter, type } }); }
  async findFeatured(limit = 10) { await ensureHydrated(); return this.findAll({ filter: { featured: true }, limit }); }
  async findPublished(query?: CourseQuery) { await ensureHydrated(); return this.findAll({ ...query, filter: { ...query?.filter, published: true } }); }
  async getCount(filter?: CourseFilter) { await ensureHydrated(); return courses.filter((c) => matches(c, filter)).length; }
  async getPopularCourses(limit = 10) { await ensureHydrated(); return this.findAll({ sort: 'popularity', order: 'desc', limit }); }
  async bulkUpdate(ids: string[], updates: Partial<Course>) { await ensureHydrated(); const set = new Set(ids); courses = courses.map((c) => set.has(c.id) ? { ...c, ...updates, updatedAt: new Date() } : c); await persist(); }
  async bulkDelete(ids: string[]) { await ensureHydrated(); const set = new Set(ids); courses = courses.filter((c) => !set.has(c.id)); await persist(); }
}

export const courseRepository = new CourseRepository();
