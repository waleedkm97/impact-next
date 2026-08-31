/**
 * Course Repository
 *
 * Implements course and lesson data access using the LocalStorage adapter.
 *
 * Legacy compatibility:
 * - impact_courses_v1
 * - impact_recorded_courses_v1
 *
 * This repository intentionally keeps the storage implementation isolated
 * from the UI so it can later be replaced by an API/database.
 */

import {
  Course,
  CourseLesson,
  CourseQuery,
  CourseFilter,
} from '@/types/course';
import {
  LocalStorageAdapter,
} from '@/lib/storage/local-storage';

export interface ICourseRepository {
  findById(id: string): Promise<Course | null>;
  findBySlug(slug: string): Promise<Course | null>;
  findAll(query?: CourseQuery): Promise<Course[]>;
  create(
    course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Course>;
  update(id: string, course: Partial<Course>): Promise<Course>;
  delete(id: string): Promise<void>;

  findLessonById(lessonId: string): Promise<CourseLesson | null>;
  findLessonsByCourseId(courseId: string): Promise<CourseLesson[]>;
  createLesson(
    courseId: string,
    lesson: Omit<CourseLesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>
  ): Promise<CourseLesson>;
  updateLesson(
    lessonId: string,
    lesson: Partial<CourseLesson>
  ): Promise<CourseLesson>;
  deleteLesson(lessonId: string): Promise<void>;

  search(query: string, limit?: number): Promise<Course[]>;
  findByCategory(
    categoryId: string,
    query?: CourseQuery
  ): Promise<Course[]>;
  findByType(
    type: 'recorded' | 'training' | 'public',
    query?: CourseQuery
  ): Promise<Course[]>;
  findFeatured(limit?: number): Promise<Course[]>;
  findPublished(query?: CourseQuery): Promise<Course[]>;

  getCount(filter?: CourseFilter): Promise<number>;
  getPopularCourses(limit?: number): Promise<Course[]>;

  bulkUpdate(ids: string[], updates: Partial<Course>): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
}

const COURSES_KEY = 'impact_courses_v1';
const RECORDED_COURSES_KEY = 'impact_recorded_courses_v1';

const storage = new LocalStorageAdapter('');

function reviveCourse(course: Course): Course {
  return {
    ...course,
    createdAt: new Date(course.createdAt),
    updatedAt: new Date(course.updatedAt),

    lessons: (course.lessons ?? []).map((lesson) => ({
      ...lesson,
      createdAt: new Date(lesson.createdAt),
      updatedAt: new Date(lesson.updatedAt),
    })),

    schedules: (course.schedules ?? []).map((schedule) => ({
      ...schedule,
      startDate: new Date(schedule.startDate),
      endDate: new Date(schedule.endDate),
      createdAt: new Date(schedule.createdAt),
      updatedAt: new Date(schedule.updatedAt),
    })),

    assessments: (course.assessments ?? []).map((assessment) => ({
      ...assessment,
      createdAt: new Date(assessment.createdAt),
      updatedAt: new Date(assessment.updatedAt),
    })),
  };
}

function normalizeCourse(
  course: Partial<Course>,
  existing?: Course
): Course {
  const now = new Date();

  const merged = {
    ...existing,
    ...course,
  } as Course;

  const lessons = (merged.lessons ?? []).map((lesson, index) => ({
    ...lesson,
    order: typeof lesson.order === 'number' ? lesson.order : index,
  }));

  const videosCount = lessons.filter(
    (lesson) => lesson.type === 'video'
  ).length;

  return {
    ...merged,

    id: merged.id || `course_${Date.now()}`,

    title: merged.title || '',
    slug:
      merged.slug ||
      String(merged.title || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0600-\u06FF-]/g, ''),

    description: merged.description || '',
    objectives: merged.objectives ?? [],
    outcomes: merged.outcomes ?? [],

    lessons,
    videosCount,

    featured: merged.featured ?? false,
    published: merged.published ?? false,
    status:
      merged.status ||
      (merged.published ? 'published' : 'draft'),

    certificateSettings:
      merged.certificateSettings ?? {
        enabled: false,
        autoGenerate: false,
        requireCompletion: true,
        requireAssessmentPass: false,
      },

    createdAt: existing?.createdAt
      ? new Date(existing.createdAt)
      : new Date(course.createdAt ?? now),

    updatedAt: now,
  };
}

export class CourseRepository implements ICourseRepository {
  private readCourses(key: string): Course[] {
    const data = storage.get<Course[]>(key);

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map(reviveCourse);
  }

  private readAllCourses(): Course[] {
    const normalCourses = this.readCourses(COURSES_KEY);
    const recordedCourses = this.readCourses(RECORDED_COURSES_KEY);

    const map = new Map<string, Course>();

    [...normalCourses, ...recordedCourses].forEach((course) => {
      map.set(course.id, course);
    });

    return Array.from(map.values());
  }

  private writeCourseCollections(courses: Course[]): void {
    const recorded = courses.filter(
      (course) => course.type === 'recorded'
    );

    const training = courses.filter(
      (course) => course.type !== 'recorded'
    );

    storage.set(COURSES_KEY, training);
    storage.set(RECORDED_COURSES_KEY, recorded);
  }

  private matchesFilter(
    course: Course,
    filter?: CourseFilter
  ): boolean {
    if (!filter) {
      return true;
    }

    if (filter.type && course.type !== filter.type) {
      return false;
    }

    if (filter.delivery && course.delivery !== filter.delivery) {
      return false;
    }

    if (
      filter.categoryId &&
      course.categoryId !== filter.categoryId
    ) {
      return false;
    }

    if (
      filter.city &&
      !(course.cities ?? []).includes(filter.city)
    ) {
      return false;
    }

    if (
      typeof filter.minPrice === 'number' &&
      course.price < filter.minPrice
    ) {
      return false;
    }

    if (
      typeof filter.maxPrice === 'number' &&
      course.price > filter.maxPrice
    ) {
      return false;
    }

    if (
      typeof filter.featured === 'boolean' &&
      course.featured !== filter.featured
    ) {
      return false;
    }

    if (
      typeof filter.published === 'boolean' &&
      course.published !== filter.published
    ) {
      return false;
    }

    if (filter.searchQuery) {
      const search = filter.searchQuery
        .toLowerCase()
        .trim();

      const haystack = [
        course.title,
        course.description,
        course.shortDescription,
        course.categoryId,
        ...(course.objectives ?? []),
        ...(course.outcomes ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  }

  async findById(id: string): Promise<Course | null> {
    return (
      this.readAllCourses().find(
        (course) => course.id === id
      ) ?? null
    );
  }

  async findBySlug(slug: string): Promise<Course | null> {
    const normalizedSlug = slug.toLowerCase().trim();

    return (
      this.readAllCourses().find(
        (course) =>
          course.slug.toLowerCase() === normalizedSlug
      ) ?? null
    );
  }

  async findAll(query?: CourseQuery): Promise<Course[]> {
    let courses = this.readAllCourses().filter((course) =>
      this.matchesFilter(course, query?.filter)
    );

    const sort = query?.sort ?? 'createdAt';
    const order = query?.order ?? 'desc';

    courses.sort((a, b) => {
      let comparison = 0;

      switch (sort) {
        case 'title':
          comparison = a.title.localeCompare(
            b.title,
            'ar'
          );
          break;

        case 'price':
          comparison = a.price - b.price;
          break;

        case 'popularity':
          comparison =
            (b.featured ? 1 : 0) -
            (a.featured ? 1 : 0);
          break;

        case 'createdAt':
        default:
          comparison =
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime();
          break;
      }

      return order === 'asc'
        ? comparison
        : -comparison;
    });

    const offset = query?.offset ?? 0;
    const limit = query?.limit;

    if (typeof limit === 'number') {
      return courses.slice(offset, offset + limit);
    }

    return courses.slice(offset);
  }

  async create(
    course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Course> {
    const courses = this.readAllCourses();

    const newCourse = normalizeCourse({
      ...course,
      id: `course_${Date.now()}`,
    });

    courses.push(newCourse);

    this.writeCourseCollections(courses);

    return newCourse;
  }

  async update(
    id: string,
    updates: Partial<Course>
  ): Promise<Course> {
    const courses = this.readAllCourses();
    const index = courses.findIndex(
      (course) => course.id === id
    );

    if (index === -1) {
      throw new Error(`Course not found: ${id}`);
    }

    const updated = normalizeCourse(
      updates,
      courses[index]
    );

    courses[index] = updated;

    this.writeCourseCollections(courses);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const courses = this.readAllCourses().filter(
      (course) => course.id !== id
    );

    this.writeCourseCollections(courses);
  }

  async findLessonById(
    lessonId: string
  ): Promise<CourseLesson | null> {
    for (const course of this.readAllCourses()) {
      const lesson = (course.lessons ?? []).find(
        (item) => item.id === lessonId
      );

      if (lesson) {
        return lesson;
      }
    }

    return null;
  }

  async findLessonsByCourseId(
    courseId: string
  ): Promise<CourseLesson[]> {
    const course = await this.findById(courseId);

    if (!course) {
      return [];
    }

    return [...(course.lessons ?? [])].sort(
      (a, b) => a.order - b.order
    );
  }

  async createLesson(
    courseId: string,
    lesson: Omit<
      CourseLesson,
      'id' | 'courseId' | 'createdAt' | 'updatedAt'
    >
  ): Promise<CourseLesson> {
    const course = await this.findById(courseId);

    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    const lessons = course.lessons ?? [];

    const newLesson: CourseLesson = {
      ...lesson,
      id: `lesson_${Date.now()}`,
      courseId,
      order:
        typeof lesson.order === 'number'
          ? lesson.order
          : lessons.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedLessons = [...lessons, newLesson];

    await this.update(courseId, {
      lessons: updatedLessons,
    });

    return newLesson;
  }

  async updateLesson(
    lessonId: string,
    updates: Partial<CourseLesson>
  ): Promise<CourseLesson> {
    const courses = this.readAllCourses();

    for (const course of courses) {
      const lessonIndex = (
        course.lessons ?? []
      ).findIndex(
        (lesson) => lesson.id === lessonId
      );

      if (lessonIndex === -1) {
        continue;
      }

      const existing = course.lessons![lessonIndex];

      const updatedLesson: CourseLesson = {
        ...existing,
        ...updates,
        id: existing.id,
        courseId: existing.courseId,
        updatedAt: new Date(),
      };

      course.lessons![lessonIndex] = updatedLesson;

      const updatedCourse = normalizeCourse(
        {
          ...course,
          lessons: course.lessons,
        },
        course
      );

      const courseIndex = courses.findIndex(
        (item) => item.id === course.id
      );

      courses[courseIndex] = updatedCourse;

      this.writeCourseCollections(courses);

      return updatedLesson;
    }

    throw new Error(`Lesson not found: ${lessonId}`);
  }

  async deleteLesson(
    lessonId: string
  ): Promise<void> {
    const courses = this.readAllCourses();

    let found = false;

    for (const course of courses) {
      const originalLength =
        course.lessons?.length ?? 0;

      course.lessons = (course.lessons ?? [])
        .filter((lesson) => lesson.id !== lessonId)
        .map((lesson, index) => ({
          ...lesson,
          order: index,
        }));

      if (course.lessons.length !== originalLength) {
        found = true;

        const normalized = normalizeCourse(
          {
            ...course,
            lessons: course.lessons,
          },
          course
        );

        const index = courses.findIndex(
          (item) => item.id === course.id
        );

        courses[index] = normalized;
        break;
      }
    }

    if (found) {
      this.writeCourseCollections(courses);
    }
  }

  async search(
    query: string,
    limit = 20
  ): Promise<Course[]> {
    const searchQuery = query.toLowerCase().trim();

    if (!searchQuery) {
      return this.findAll({ limit });
    }

    const courses = this.readAllCourses().filter(
      (course) => {
        const text = [
          course.title,
          course.description,
          course.shortDescription,
          ...(course.objectives ?? []),
          ...(course.outcomes ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return text.includes(searchQuery);
      }
    );

    return courses.slice(0, limit);
  }

  async findByCategory(
    categoryId: string,
    query?: CourseQuery
  ): Promise<Course[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        categoryId,
      },
    });
  }

  async findByType(
    type: 'recorded' | 'training' | 'public',
    query?: CourseQuery
  ): Promise<Course[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        type,
      },
    });
  }

  async findFeatured(
    limit = 10
  ): Promise<Course[]> {
    return this.findAll({
      filter: {
        featured: true,
      },
      limit,
    });
  }

  async findPublished(
    query?: CourseQuery
  ): Promise<Course[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        published: true,
      },
    });
  }

  async getCount(
    filter?: CourseFilter
  ): Promise<number> {
    return this.readAllCourses().filter((course) =>
      this.matchesFilter(course, filter)
    ).length;
  }

  async getPopularCourses(
    limit = 10
  ): Promise<Course[]> {
    return this.findAll({
      sort: 'popularity',
      order: 'desc',
      limit,
    });
  }

  async bulkUpdate(
    ids: string[],
    updates: Partial<Course>
  ): Promise<void> {
    const idSet = new Set(ids);
    const courses = this.readAllCourses();

    const updatedCourses = courses.map((course) => {
      if (!idSet.has(course.id)) {
        return course;
      }

      return normalizeCourse(updates, course);
    });

    this.writeCourseCollections(updatedCourses);
  }

  async bulkDelete(
    ids: string[]
  ): Promise<void> {
    const idSet = new Set(ids);

    const courses = this.readAllCourses().filter(
      (course) => !idSet.has(course.id)
    );

    this.writeCourseCollections(courses);
  }
}

export const courseRepository =
  new CourseRepository();