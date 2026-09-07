import type {
  Certificate,
  CourseEnrollment,
  CourseProgress,
  Trainee,
  TraineeQuery,
} from '@/types/trainee';
import { DEFAULT_TRAINEES } from '@/lib/data/seed-data';
import { browserDbGet, browserDbSet, migrateLegacyData } from '@/lib/data/browser-db';

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function now() {
  return new Date();
}

function date(value: unknown, fallback = new Date()) {
  const result = value instanceof Date ? value : new Date(String(value ?? ''));
  return Number.isNaN(result.getTime()) ? fallback : result;
}

function getSessionIdFromCookie() {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('impact_trainee='));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.split('=').slice(1).join('=')) || null;
}

function setSession(id: string | null) {
  if (typeof document === 'undefined') {
    return;
  }

  if (id) {
    document.cookie = `impact_trainee=${encodeURIComponent(id)}; Max-Age=2592000; Path=/; SameSite=Lax`;
    return;
  }

  document.cookie = 'impact_trainee=; Max-Age=0; Path=/; SameSite=Lax';
}

function buildSeedTrainees(): Trainee[] {
  return (DEFAULT_TRAINEES as any[]).map((trainee) => {
    const name = splitName(trainee.name ?? '');
    const createdAt = date(trainee.createdAt);

    return {
      id: trainee.id,
      profile: {
        firstName: name.firstName,
        lastName: name.lastName,
      },
      contact: {
        email: trainee.email,
        phone: trainee.phone,
      },
      email: trainee.email,
      passwordHash: trainee.password ?? 'password',
      enrollments: (trainee.enrolledCourses ?? []).map((courseId: string) => ({
        id: `enrollment-${trainee.id}-${courseId}`,
        courseId,
        courseTitle: courseId,
        enrolledAt: createdAt,
        status: 'active' as const,
        progress: trainee.progress?.[courseId]?.progressPercent ?? 0,
      })),
      progress: [],
      certificates: [],
      status: 'active' as const,
      emailVerified: true,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

let trainees: Trainee[] = buildSeedTrainees();
let hydrated = false;
let hydration: Promise<void> | null = null;

async function ensureHydrated() {
  if (hydrated) {
    return;
  }

  if (!hydration) {
    hydration = (async () => {
      await migrateLegacyData();

      const saved = await browserDbGet<Trainee[]>('trainees');

      if (saved !== null) {
        trainees = saved.map(normalizeTrainee);
      }

      hydrated = true;
    })().catch(() => {
      hydrated = true;
    });
  }

  await hydration;
}

function normalizeTrainee(trainee: Trainee): Trainee {
  return {
    ...trainee,
    profile: {
      ...trainee.profile,
    },
    contact: {
      ...trainee.contact,
    },
    company: trainee.company ? { ...trainee.company } : undefined,
    enrollments: (trainee.enrollments ?? []).map((enrollment) => ({
      ...enrollment,
      enrolledAt: date(enrollment.enrolledAt),
      completedAt: enrollment.completedAt
        ? date(enrollment.completedAt)
        : undefined,
      lastAccessedAt: enrollment.lastAccessedAt
        ? date(enrollment.lastAccessedAt)
        : undefined,
      attendanceDays: (enrollment.attendanceDays ?? []).map((day) => ({
        ...day,
        date: date(day.date),
        markedAt: day.markedAt ? date(day.markedAt) : undefined,
      })),
    })),
    progress: (trainee.progress ?? []).map((progress) => ({
      ...progress,
      completedAt: progress.completedAt ? date(progress.completedAt) : undefined,
    })),
    certificates: (trainee.certificates ?? []).map((certificate) => ({
      ...certificate,
      issuedAt: date(certificate.issuedAt),
    })),
    createdAt: date(trainee.createdAt),
    updatedAt: date(trainee.updatedAt),
    lastLoginAt: trainee.lastLoginAt ? date(trainee.lastLoginAt) : undefined,
  };
}

function cloneTrainee(trainee: Trainee): Trainee {
  return normalizeTrainee(trainee);
}

async function persist() {
  await browserDbSet('trainees', trainees);
}

export class TraineeRepository {
  async refresh() {
    hydrated = false;
    hydration = null;
    await ensureHydrated();
  }

  async findById(id: string) {
    await ensureHydrated();
    const trainee = trainees.find((item) => item.id === id);
    return trainee ? cloneTrainee(trainee) : null;
  }

  async findByEmail(email: string) {
    await ensureHydrated();
    const normalizedEmail = email.trim().toLowerCase();
    const trainee = trainees.find(
      (item) => item.email.toLowerCase() === normalizedEmail,
    );

    return trainee ? cloneTrainee(trainee) : null;
  }

  async findAll(query?: TraineeQuery) {
    await ensureHydrated();

    let result = trainees.filter((trainee) => {
      const filter = query?.filter;

      if (!filter) {
        return true;
      }

      if (filter.status && trainee.status !== filter.status) {
        return false;
      }

      if (
        typeof filter.emailVerified === 'boolean' &&
        trainee.emailVerified !== filter.emailVerified
      ) {
        return false;
      }

      if (
        filter.enrolledInCourseId &&
        !trainee.enrollments.some(
          (enrollment) => enrollment.courseId === filter.enrolledInCourseId,
        )
      ) {
        return false;
      }

      if (filter.searchQuery) {
        const text = [
          trainee.profile.firstName,
          trainee.profile.lastName,
          trainee.profile.firstNameEnglish,
          trainee.profile.lastNameEnglish,
          trainee.email,
          trainee.contact.phone,
          trainee.company?.companyName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!text.includes(filter.searchQuery.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    const order = query?.order ?? 'desc';

    result.sort((a, b) => {
      let value = a.createdAt.getTime() - b.createdAt.getTime();

      if (query?.sort === 'name') {
        value = `${a.profile.firstName} ${a.profile.lastName}`.localeCompare(
          `${b.profile.firstName} ${b.profile.lastName}`,
          'ar',
        );
      }

      if (query?.sort === 'lastLoginAt') {
        value =
          (a.lastLoginAt?.getTime() ?? 0) - (b.lastLoginAt?.getTime() ?? 0);
      }

      return order === 'asc' ? value : -value;
    });

    const offset = query?.offset ?? 0;
    const end = typeof query?.limit === 'number' ? offset + query.limit : undefined;

    return result.slice(offset, end).map(cloneTrainee);
  }

  async create(input: Omit<Trainee, 'id' | 'createdAt' | 'updatedAt'>) {
    await ensureHydrated();

    const timestamp = now();
    const trainee: Trainee = {
      ...input,
      id: `trainee-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      enrollments: input.enrollments ?? [],
      progress: input.progress ?? [],
      certificates: input.certificates ?? [],
    };

    trainees.push(trainee);
    await persist();

    return cloneTrainee(trainee);
  }

  async update(id: string, input: Partial<Trainee>) {
    await ensureHydrated();

    const index = trainees.findIndex((trainee) => trainee.id === id);

    if (index < 0) {
      throw new Error('Trainee not found');
    }

    trainees[index] = {
      ...trainees[index],
      ...input,
      updatedAt: now(),
    };

    await persist();
    return cloneTrainee(trainees[index]);
  }

  async delete(id: string) {
    await ensureHydrated();
    trainees = trainees.filter((trainee) => trainee.id !== id);
    setSession(null);
    await persist();
  }

  async verifyPassword(email: string, password: string) {
    const trainee = await this.findByEmail(email);
    return !!trainee && trainee.passwordHash === password;
  }

  async updatePassword(id: string, password: string) {
    await this.update(id, { passwordHash: password });
  }

  private async buildAttendanceDays(scheduleId?: string) {
    let startDate = now();

    if (scheduleId) {
      try {
        const { scheduleRepository } = await import('./schedule-repository');
        const schedule = await scheduleRepository.findById(scheduleId);
        if (schedule?.startDate) startDate = date(schedule.startDate);
      } catch {
        // Fall back to enrollment date when no schedule is available.
      }
    }

    return Array.from({ length: 3 }, (_, index) => {
      const day = new Date(startDate);
      day.setDate(day.getDate() + index);
      return { date: day, status: 'not-marked' as const };
    });
  }

  async enrollInCourse(
    id: string,
    courseId: string,
    courseTitle: string,
    options?: {
      scheduleId?: string;
      groupId?: string;
    },
  ) {
    await ensureHydrated();

    const trainee = trainees.find((item) => item.id === id);

    if (!trainee) {
      throw new Error('Trainee not found');
    }

    const existing = trainee.enrollments.find(
      (enrollment) =>
        enrollment.courseId === courseId &&
        (!options?.scheduleId || enrollment.scheduleId === options.scheduleId),
    );

    if (existing) {
      return existing;
    }

    const enrollment: CourseEnrollment = {
      id: `enrollment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      courseId,
      courseTitle,
      enrolledAt: now(),
      scheduleId: options?.scheduleId,
      groupId: options?.groupId,
      status: 'active',
      progress: 0,
      preAssessment: 'available',
postAssessment: 'locked',
courseEvaluation: 'locked',
      attendance: 'not-marked',
      attendanceMode: options?.scheduleId ? 'in-person' : 'online',
      attendanceDays: await this.buildAttendanceDays(options?.scheduleId),
    };

    trainee.enrollments.push(enrollment);
    trainee.updatedAt = now();
    await persist();

    return enrollment;
  }

  async updateEnrollment(
    id: string,
    enrollmentId: string,
    input: Partial<CourseEnrollment>,
  ) {
    await ensureHydrated();

    const trainee = trainees.find((item) => item.id === id);

    if (!trainee) {
      throw new Error('Trainee not found');
    }

    const index = trainee.enrollments.findIndex(
      (enrollment) =>
        enrollment.id === enrollmentId || enrollment.courseId === enrollmentId,
    );

    if (index < 0) {
      throw new Error('Enrollment not found');
    }

    trainee.enrollments[index] = {
      ...trainee.enrollments[index],
      ...input,
    };
    trainee.updatedAt = now();

    await persist();
    return trainee.enrollments[index];
  }

  async getEnrollments(id: string) {
    const trainee = await this.findById(id);
    return trainee?.enrollments ?? [];
  }

  async getActiveEnrollments(id: string) {
    const enrollments = await this.getEnrollments(id);
    return enrollments.filter((enrollment) => enrollment.status === 'active');
  }

  async getCompletedEnrollments(id: string) {
    const enrollments = await this.getEnrollments(id);
    return enrollments.filter(
      (enrollment) => enrollment.status === 'completed',
    );
  }

  async updateProgress(id: string, progress: CourseProgress, totalLessons?: number) {
    await ensureHydrated();

    const trainee = trainees.find((item) => item.id === id);

    if (!trainee) {
      throw new Error('Trainee not found');
    }

    const index = trainee.progress.findIndex(
      (item) =>
        item.courseId === progress.courseId &&
        item.lessonId === progress.lessonId,
    );

    if (index >= 0) {
      trainee.progress[index] = {
        ...trainee.progress[index],
        ...progress,
      };
    } else {
      trainee.progress.push(progress);
    }

    const enrollment = trainee.enrollments.find((item) => item.courseId === progress.courseId);
    if (enrollment) {
      const courseProgress = trainee.progress.filter((item) => item.courseId === progress.courseId);
      const completedCount = courseProgress.filter((item) => item.completed).length;
      const lessonTotal = Math.max(totalLessons ?? courseProgress.length, 1);
      enrollment.progress = Math.max(enrollment.progress, Math.min(100, Math.round((completedCount / lessonTotal) * 100)));
      enrollment.lastAccessedAt = now();
    }
    trainee.updatedAt = now();
    await persist();
  }

  async completeEnrollment(id: string, enrollmentId: string) {
    await ensureHydrated();
    const trainee = trainees.find((item) => item.id === id);
    if (!trainee) throw new Error('Trainee not found');
    const enrollment = trainee.enrollments.find((item) => item.id === enrollmentId || item.courseId === enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    enrollment.progress = 100;
enrollment.status = 'completed';
enrollment.completedAt = now();

/*
 * بعد إكمال البرنامج:
 * - Post يبقى مقفلاً حتى تفتحه الإدارة للمجموعة.
 * - Course Evaluation يبقى مقفلاً حتى تفتحه الإدارة.
 * - الشهادة لا تصدر هنا.
 */
enrollment.postAssessment = 'locked';
enrollment.courseEvaluation = 'locked';
    trainee.updatedAt = now();
    await persist();
    return enrollment;
  }

   async updateEnrollmentAssessment(
    id: string,
    enrollmentId: string,
    type:
      | 'preAssessment'
      | 'postAssessment'
      | 'courseEvaluation',
    state:
      | 'locked'
      | 'available'
      | 'completed',
  ) {
    await ensureHydrated();

    const trainee = trainees.find(
      (item) => item.id === id,
    );

    if (!trainee) {
      throw new Error('Trainee not found');
    }

    const enrollment = trainee.enrollments.find(
      (item) =>
        item.id === enrollmentId ||
        item.courseId === enrollmentId,
    );

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    enrollment[type] = state;

    if (type === 'preAssessment' && state === 'completed') {
      enrollment.preAssessmentCompletedAt = now();
    }

    if (type === 'postAssessment' && state === 'completed') {
      enrollment.postAssessmentCompletedAt = now();
    }

    if (
      type === 'courseEvaluation' &&
      state === 'completed'
    ) {
      enrollment.courseEvaluationCompletedAt = now();
    }

    trainee.updatedAt = now();

    await persist();

    if (state === 'completed') {
      await this.issueCertificateIfEligible(
        id,
        enrollment.id ?? enrollment.courseId,
      );
    }

    return enrollment;
  }

  async issueCertificateIfEligible(
    id: string,
    enrollmentId: string,
  ) {
    await ensureHydrated();

    const trainee = trainees.find(
      (item) => item.id === id,
    );

    if (!trainee) {
      throw new Error('Trainee not found');
    }

    const enrollment = trainee.enrollments.find(
      (item) =>
        item.id === enrollmentId ||
        item.courseId === enrollmentId,
    );

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const allRequirementsCompleted =
      enrollment.progress >= 100 &&
      enrollment.preAssessment === 'completed' &&
      enrollment.postAssessment === 'completed' &&
      enrollment.courseEvaluation === 'completed';

    if (!allRequirementsCompleted) {
      return null;
    }

    const existingCertificate =
      trainee.certificates.find(
        (certificate) =>
          certificate.courseId === enrollment.courseId,
      );

    if (existingCertificate) {
      enrollment.certificateId =
        existingCertificate.id;

      await persist();

      return existingCertificate;
    }

    const certificate: Certificate = {
      id: `cert-${Date.now()}`,
      courseId: enrollment.courseId,
      courseTitle: enrollment.courseTitle,
      issuedAt: now(),
      certificateNumber: `IMP-${Date.now()}`,
      templateId: 'certificate-template.png',
      verified: true,
    };

    trainee.certificates.push(certificate);

    enrollment.certificateId = certificate.id;

    trainee.updatedAt = now();

    await persist();

    return certificate;
  }

  async updateAttendance(
    id: string,
    enrollmentId: string,
    status: 'not-marked' | 'present' | 'absent',
  ) {
    await ensureHydrated();
    const trainee = trainees.find((item) => item.id === id);
    if (!trainee) throw new Error('Trainee not found');
    const enrollment = trainee.enrollments.find(
      (item) => item.id === enrollmentId || item.courseId === enrollmentId,
    );
    if (!enrollment) throw new Error('Enrollment not found');
    enrollment.attendance = status;
    trainee.updatedAt = now();
    await persist();
    return enrollment;
  }

  async ensureAttendanceDays(id: string, enrollmentId: string) {
    await ensureHydrated();
    const trainee = trainees.find((item) => item.id === id);
    if (!trainee) throw new Error('Trainee not found');
    const enrollment = trainee.enrollments.find(
      (item) => item.id === enrollmentId || item.courseId === enrollmentId,
    );
    if (!enrollment) throw new Error('Enrollment not found');
    if (!enrollment.attendanceDays || enrollment.attendanceDays.length !== 3) {
      enrollment.attendanceDays = await this.buildAttendanceDays(enrollment.scheduleId);
      await persist();
    }
    return enrollment;
  }

  async updateAttendanceDay(
    id: string,
    enrollmentId: string,
    dayIndex: number,
    status: 'not-marked' | 'present' | 'absent',
  ) {
    const enrollment = await this.ensureAttendanceDays(id, enrollmentId);
    const trainee = trainees.find((item) => item.id === id)!;
    if (!enrollment.attendanceDays || !enrollment.attendanceDays[dayIndex]) {
      throw new Error('Attendance day not found');
    }
    enrollment.attendanceDays = enrollment.attendanceDays.map((day, index) =>
      index === dayIndex ? { ...day, status, markedAt: status === 'not-marked' ? undefined : now() } : day,
    );
    const marked = enrollment.attendanceDays.filter((day) => day.status !== 'not-marked');
    enrollment.attendance = marked.length === 3 && enrollment.attendanceDays.every((day) => day.status === 'present')
      ? 'present'
      : marked.some((day) => day.status === 'absent')
        ? 'absent'
        : 'not-marked';
    trainee.updatedAt = now();
    await persist();
    return enrollment;
  }

  async getProgress(id: string, courseId: string) {
    const trainee = await this.findById(id);
    return trainee?.progress.filter((item) => item.courseId === courseId) ?? [];
  }

  async getCourseProgress(id: string, courseId: string, lessonId: string) {
    const progress = await this.getProgress(id, courseId);
    return progress.find((item) => item.lessonId === lessonId) ?? null;
  }

  async issueCertificate(id: string, courseId: string, courseTitle: string) {
    await ensureHydrated();

    const trainee = trainees.find((item) => item.id === id);

    if (!trainee) {
      throw new Error('Trainee not found');
    }

    const certificate: Certificate = {
      id: `cert-${Date.now()}`,
      courseId,
      courseTitle,
      issuedAt: now(),
      certificateNumber: `IMP-${Date.now()}`,
      templateId: 'certificate-template.png',
      verified: true,
    };

    trainee.certificates.push(certificate);
    trainee.updatedAt = now();
    await persist();

    return certificate;
  }

  async getCertificates(id: string) {
    const trainee = await this.findById(id);
    return trainee?.certificates ?? [];
  }

  async verifyCertificate(number: string) {
    await ensureHydrated();

    for (const trainee of trainees) {
      const certificate = trainee.certificates.find(
        (item) => item.certificateNumber === number,
      );

      if (certificate) {
        return certificate;
      }
    }

    return null;
  }

  async search(query: string, limit = 20) {
    return this.findAll({
      filter: { searchQuery: query },
      limit,
    });
  }

  async findByStatus(status: Trainee['status'], query?: TraineeQuery) {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        status,
      },
    });
  }

  async getCount(query?: TraineeQuery) {
    return (await this.findAll(query)).length;
  }

  async getActiveTraineesCount() {
    await ensureHydrated();
    return trainees.filter((trainee) => trainee.status === 'active').length;
  }

  async loginUser(email: string, password: string) {
    await ensureHydrated();

    const trainee = trainees.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.passwordHash === password,
    );

    if (!trainee) {
      return null;
    }

    trainee.lastLoginAt = now();
    trainee.updatedAt = now();
    setSession(trainee.id);
    await persist();

    return cloneTrainee(trainee);
  }

  async getCurrentUser() {
    await ensureHydrated();

    const sessionId = getSessionIdFromCookie();

    if (!sessionId) {
      return null;
    }

    return this.findById(sessionId);
  }

  async logout() {
    setSession(null);
  }
}

export const traineeRepository = new TraineeRepository();
