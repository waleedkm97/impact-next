/**
 * Trainee Repository
 *
 * LocalStorage implementation of trainee/user data access.
 *
 * Legacy compatibility:
 * - impact_trainees_v1
 * - impact_auth_credentials_v1
 * - impact_current_user_v1
 *
 * The legacy application stored trainees in a flatter structure.
 * This repository maps that structure into the new typed domain model.
 */

import {
  Trainee,
  TraineeQuery,
  CourseEnrollment,
  CourseProgress,
  Certificate,
} from '@/types/trainee';
import { LocalStorageAdapter } from '@/lib/storage/local-storage';

export interface ITraineeRepository {
  findById(id: string): Promise<Trainee | null>;
  findByEmail(email: string): Promise<Trainee | null>;
  findAll(query?: TraineeQuery): Promise<Trainee[]>;
  create(
    trainee: Omit<Trainee, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Trainee>;
  update(id: string, trainee: Partial<Trainee>): Promise<Trainee>;
  delete(id: string): Promise<void>;

  verifyPassword(email: string, password: string): Promise<boolean>;
  updatePassword(
    traineeId: string,
    newPasswordHash: string
  ): Promise<void>;

  enrollInCourse(
    traineeId: string,
    courseId: string,
    courseTitle: string
  ): Promise<CourseEnrollment>;

  updateEnrollment(
    traineeId: string,
    enrollmentId: string,
    updates: Partial<CourseEnrollment>
  ): Promise<CourseEnrollment>;

  getEnrollments(traineeId: string): Promise<CourseEnrollment[]>;
  getActiveEnrollments(
    traineeId: string
  ): Promise<CourseEnrollment[]>;
  getCompletedEnrollments(
    traineeId: string
  ): Promise<CourseEnrollment[]>;

  updateProgress(
    traineeId: string,
    progress: CourseProgress
  ): Promise<void>;

  getProgress(
    traineeId: string,
    courseId: string
  ): Promise<CourseProgress[]>;

  getCourseProgress(
    traineeId: string,
    courseId: string,
    lessonId: string
  ): Promise<CourseProgress | null>;

  issueCertificate(
    traineeId: string,
    courseId: string,
    courseTitle: string
  ): Promise<Certificate>;

  getCertificates(
    traineeId: string
  ): Promise<Certificate[]>;

  verifyCertificate(
    certificateNumber: string
  ): Promise<Certificate | null>;

  search(query: string, limit?: number): Promise<Trainee[]>;

  findByStatus(
    status: 'active' | 'inactive' | 'suspended',
    query?: TraineeQuery
  ): Promise<Trainee[]>;

  getCount(filter?: TraineeQuery): Promise<number>;

  getActiveTraineesCount(): Promise<number>;
}

const TRAINEES_KEY = 'impact_trainees_v1';
const AUTH_KEY = 'impact_auth_credentials_v1';
const CURRENT_USER_KEY = 'impact_current_user_v1';

const storage = new LocalStorageAdapter('');

type LegacyProgress = Record<
  string,
  {
    completedItems?: string[];
    progressPercent?: number;
  }
>;

type LegacyTrainee = {
  id?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  enrolledCourses?: string[];
  courseIds?: string[];
  progress?: LegacyProgress;
  certificates?: number;
  lastLogin?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
  assessmentResults?: Record<string, unknown>;
};

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) {
    return fallback;
  }

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? fallback : date;
}

function getNameParts(name = ''): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: '',
      lastName: '',
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function normalizeProgress(
  progress: unknown
): CourseProgress[] {
  if (Array.isArray(progress)) {
    return progress.map((item) => ({
      ...item,
      completedAt: item.completedAt
        ? toDate(item.completedAt)
        : undefined,
    }));
  }

  if (!progress || typeof progress !== 'object') {
    return [];
  }

  const legacyProgress = progress as LegacyProgress;
  const result: CourseProgress[] = [];

  Object.entries(legacyProgress).forEach(
    ([courseId, courseProgress]) => {
      const completedItems =
        courseProgress?.completedItems ?? [];

      completedItems.forEach((lessonId) => {
        result.push({
          courseId,
          lessonId,
          completed: true,
          completedAt: new Date(),
        });
      });
    }
  );

  return result;
}

function normalizeEnrollment(
  enrollment: CourseEnrollment
): CourseEnrollment {
  return {
    ...enrollment,
    enrolledAt: toDate(enrollment.enrolledAt),
    completedAt: enrollment.completedAt
      ? toDate(enrollment.completedAt)
      : undefined,
    lastAccessedAt: enrollment.lastAccessedAt
      ? toDate(enrollment.lastAccessedAt)
      : undefined,
  };
}

function normalizeCertificate(
  certificate: Certificate
): Certificate {
  return {
    ...certificate,
    issuedAt: toDate(certificate.issuedAt),
  };
}

function normalizeTrainee(
  raw: Trainee | LegacyTrainee
): Trainee {
  const trainee = raw as Trainee;
  const legacy = raw as LegacyTrainee;

  const existingProfile =
    trainee.profile ?? ({} as Trainee['profile']);

  const nameParts = getNameParts(
    legacy.name ||
      [
        existingProfile.firstName,
        existingProfile.lastName,
      ]
        .filter(Boolean)
        .join(' ')
  );

  const email = String(
    trainee.email ||
      trainee.contact?.email ||
      legacy.email ||
      ''
  )
    .trim()
    .toLowerCase();

  const phone =
    trainee.contact?.phone ||
    legacy.phone ||
    undefined;

  const rawEnrollments = Array.isArray(
    trainee.enrollments
  )
    ? trainee.enrollments
    : [];

  const legacyCourseIds = [
    ...(legacy.enrolledCourses ?? []),
    ...(legacy.courseIds ?? []),
  ];

  const enrollments = [...rawEnrollments];

  legacyCourseIds.forEach((courseId) => {
    const exists = enrollments.some(
      (enrollment) => enrollment.courseId === courseId
    );

    if (!exists) {
      enrollments.push({
        courseId,
        courseTitle: '',
        enrolledAt: toDate(
          legacy.createdAt
        ),
        status: 'active',
        progress: 0,
      });
    }
  });

  return {
    id: String(
      trainee.id ||
        legacy.id ||
        `tr-${Date.now()}`
    ),

    profile: {
      firstName:
        existingProfile.firstName ||
        nameParts.firstName,
      lastName:
        existingProfile.lastName ||
        nameParts.lastName,
      dateOfBirth:
        existingProfile.dateOfBirth
          ? toDate(existingProfile.dateOfBirth)
          : undefined,
      gender: existingProfile.gender,
      nationality: existingProfile.nationality,
      avatar: existingProfile.avatar,
      bio: existingProfile.bio,
    },

    contact: {
      email,
      phone,
      alternatePhone:
        trainee.contact?.alternatePhone,
      address: trainee.contact?.address,
    },

    company:
      trainee.company ||
      (legacy.company || legacy.jobTitle
        ? {
            companyName: legacy.company,
            jobTitle: legacy.jobTitle,
          }
        : undefined),

    email,

    passwordHash:
      trainee.passwordHash ||
      '',

    enrollments:
      enrollments.map(normalizeEnrollment),

    progress: normalizeProgress(
      trainee.progress ?? legacy.progress
    ),

    certificates: Array.isArray(
      trainee.certificates
    )
      ? trainee.certificates.map(normalizeCertificate)
      : [],

    status: trainee.status || 'active',

    emailVerified:
      typeof trainee.emailVerified === 'boolean'
        ? trainee.emailVerified
        : false,

    createdAt: toDate(
      trainee.createdAt || legacy.createdAt
    ),

    updatedAt: toDate(
      trainee.updatedAt ||
        legacy.updatedAt ||
        trainee.createdAt ||
        legacy.createdAt
    ),

    lastLoginAt: trainee.lastLoginAt
      ? toDate(trainee.lastLoginAt)
      : undefined,

    preferences: trainee.preferences,
  };
}

export class TraineeRepository
  implements ITraineeRepository
{
  private readTrainees(): Trainee[] {
    const raw = storage.get<
      Array<Trainee | LegacyTrainee>
    >(TRAINEES_KEY);

    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map(normalizeTrainee);
  }

  private writeTrainees(
    trainees: Trainee[]
  ): void {
    storage.set(TRAINEES_KEY, trainees);
  }

  private findIndex(
    trainees: Trainee[],
    id: string
  ): number {
    return trainees.findIndex(
      (trainee) =>
        trainee.id === id ||
        trainee.email.toLowerCase() ===
          String(id).trim().toLowerCase()
    );
  }

  async findById(
    id: string
  ): Promise<Trainee | null> {
    if (!id) {
      return null;
    }

    const trainees = this.readTrainees();

    return (
      trainees.find(
        (trainee) =>
          trainee.id === id ||
          trainee.email.toLowerCase() ===
            String(id).trim().toLowerCase()
      ) ?? null
    );
  }

  async findByEmail(
    email: string
  ): Promise<Trainee | null> {
    if (!email) {
      return null;
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    return (
      this.readTrainees().find(
        (trainee) =>
          trainee.email.toLowerCase() ===
          normalizedEmail
      ) ?? null
    );
  }

  async findAll(
    query?: TraineeQuery
  ): Promise<Trainee[]> {
    let trainees = this.readTrainees();

    const filter = query?.filter;

    if (filter?.status) {
      trainees = trainees.filter(
        (trainee) =>
          trainee.status === filter.status
      );
    }

    if (
      typeof filter?.emailVerified ===
      'boolean'
    ) {
      trainees = trainees.filter(
        (trainee) =>
          trainee.emailVerified ===
          filter.emailVerified
      );
    }

    if (filter?.enrolledInCourseId) {
      trainees = trainees.filter(
        (trainee) =>
          trainee.enrollments.some(
            (enrollment) =>
              enrollment.courseId ===
              filter.enrolledInCourseId
          )
      );
    }

    if (filter?.searchQuery) {
      const search = filter.searchQuery
        .trim()
        .toLowerCase();

      trainees = trainees.filter(
        (trainee) => {
          const fullName = [
            trainee.profile.firstName,
            trainee.profile.lastName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return (
            fullName.includes(search) ||
            trainee.email
              .toLowerCase()
              .includes(search) ||
            trainee.contact.phone
              ?.toLowerCase()
              .includes(search) ||
            trainee.company?.companyName
              ?.toLowerCase()
              .includes(search)
          );
        }
      );
    }

    const sort = query?.sort ?? 'createdAt';
    const order = query?.order ?? 'desc';

    trainees.sort((a, b) => {
      let comparison = 0;

      if (sort === 'name') {
        const nameA = [
          a.profile.firstName,
          a.profile.lastName,
        ]
          .join(' ')
          .toLowerCase();

        const nameB = [
          b.profile.firstName,
          b.profile.lastName,
        ]
          .join(' ')
          .toLowerCase();

        comparison = nameA.localeCompare(
          nameB,
          'ar'
        );
      } else if (sort === 'lastLoginAt') {
        comparison =
          (a.lastLoginAt?.getTime() ?? 0) -
          (b.lastLoginAt?.getTime() ?? 0);
      } else {
        comparison =
          a.createdAt.getTime() -
          b.createdAt.getTime();
      }

      return order === 'asc'
        ? comparison
        : -comparison;
    });

    const offset = query?.offset ?? 0;

    if (typeof query?.limit === 'number') {
      return trainees.slice(
        offset,
        offset + query.limit
      );
    }

    return trainees.slice(offset);
  }

  async create(
    trainee: Omit<
      Trainee,
      'id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<Trainee> {
    const trainees = this.readTrainees();

    const now = new Date();

    const newTrainee: Trainee = {
      ...trainee,
      id: `tr-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    trainees.unshift(newTrainee);

    this.writeTrainees(trainees);

    return newTrainee;
  }

  async update(
    id: string,
    updates: Partial<Trainee>
  ): Promise<Trainee> {
    const trainees = this.readTrainees();

    const index = this.findIndex(
      trainees,
      id
    );

    if (index === -1) {
      throw new Error(
        `Trainee not found: ${id}`
      );
    }

    const updated: Trainee = {
      ...trainees[index],
      ...updates,
      profile: {
        ...trainees[index].profile,
        ...(updates.profile ?? {}),
      },
      contact: {
        ...trainees[index].contact,
        ...(updates.contact ?? {}),
      },
      company: updates.company
        ? {
            ...trainees[index].company,
            ...updates.company,
          }
        : trainees[index].company,
      updatedAt: new Date(),
    };

    trainees[index] = updated;

    this.writeTrainees(trainees);

    return updated;
  }

  async delete(
    id: string
  ): Promise<void> {
    const trainees = this.readTrainees();

    const filtered = trainees.filter(
      (trainee) =>
        trainee.id !== id &&
        trainee.email.toLowerCase() !==
          String(id).trim().toLowerCase()
    );

    this.writeTrainees(filtered);
  }

  async verifyPassword(
    email: string,
    password: string
  ): Promise<boolean> {
    const trainee =
      await this.findByEmail(email);

    if (!trainee) {
      return false;
    }

    const credentials =
      storage.get<Record<
        string,
        { password?: string; passwordHash?: string }
      >>(AUTH_KEY) ?? {};

    const credential =
      credentials[
        trainee.email.toLowerCase()
      ];

    if (credential?.passwordHash) {
      return credential.passwordHash === password;
    }

    if (credential?.password) {
      return credential.password === password;
    }

    return (
      !!trainee.passwordHash &&
      trainee.passwordHash === password
    );
  }

  async updatePassword(
    traineeId: string,
    newPasswordHash: string
  ): Promise<void> {
    const trainee =
      await this.findById(traineeId);

    if (!trainee) {
      throw new Error(
        `Trainee not found: ${traineeId}`
      );
    }

    const credentials =
      storage.get<Record<
        string,
        {
          password?: string;
          passwordHash?: string;
        }
      >>(AUTH_KEY) ?? {};

    const email =
      trainee.email.toLowerCase();

    credentials[email] = {
      passwordHash: newPasswordHash,
    };

    storage.set(
      AUTH_KEY,
      credentials
    );

    await this.update(
      trainee.id,
      {
        passwordHash: newPasswordHash,
      }
    );
  }

  async enrollInCourse(
    traineeId: string,
    courseId: string,
    courseTitle: string
  ): Promise<CourseEnrollment> {
    const trainee =
      await this.findById(traineeId);

    if (!trainee) {
      throw new Error(
        `Trainee not found: ${traineeId}`
      );
    }

    const existing =
      trainee.enrollments.find(
        (enrollment) =>
          enrollment.courseId === courseId
      );

    if (existing) {
      return existing;
    }

    const enrollment: CourseEnrollment = {
      courseId,
      courseTitle,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0,
    };

    trainee.enrollments.push(
      enrollment
    );

    await this.update(
      trainee.id,
      {
        enrollments:
          trainee.enrollments,
      }
    );

    return enrollment;
  }

  async updateEnrollment(
    traineeId: string,
    enrollmentId: string,
    updates: Partial<CourseEnrollment>
  ): Promise<CourseEnrollment> {
    const trainee =
      await this.findById(traineeId);

    if (!trainee) {
      throw new Error(
        `Trainee not found: ${traineeId}`
      );
    }

    const index =
      trainee.enrollments.findIndex(
        (enrollment) =>
          enrollment.courseId ===
            enrollmentId ||
          enrollment.courseId ===
            updates.courseId
      );

    if (index === -1) {
      throw new Error(
        `Enrollment not found: ${enrollmentId}`
      );
    }

    const updated: CourseEnrollment = {
      ...trainee.enrollments[index],
      ...updates,
    };

    trainee.enrollments[index] =
      updated;

    await this.update(
      trainee.id,
      {
        enrollments:
          trainee.enrollments,
      }
    );

    return updated;
  }

  async getEnrollments(
    traineeId: string
  ): Promise<CourseEnrollment[]> {
    const trainee =
      await this.findById(traineeId);

    return trainee?.enrollments ?? [];
  }

  async getActiveEnrollments(
    traineeId: string
  ): Promise<CourseEnrollment[]> {
    const enrollments =
      await this.getEnrollments(
        traineeId
      );

    return enrollments.filter(
      (enrollment) =>
        enrollment.status === 'active'
    );
  }

  async getCompletedEnrollments(
    traineeId: string
  ): Promise<CourseEnrollment[]> {
    const enrollments =
      await this.getEnrollments(
        traineeId
      );

    return enrollments.filter(
      (enrollment) =>
        enrollment.status === 'completed'
    );
  }

  async updateProgress(
    traineeId: string,
    progress: CourseProgress
  ): Promise<void> {
    const trainee =
      await this.findById(traineeId);

    if (!trainee) {
      throw new Error(
        `Trainee not found: ${traineeId}`
      );
    }

    const existingIndex =
      trainee.progress.findIndex(
        (item) =>
          item.courseId ===
            progress.courseId &&
          item.lessonId ===
            progress.lessonId
      );

    const updatedProgress: CourseProgress = {
      ...progress,
      completedAt:
        progress.completed
          ? progress.completedAt ??
            new Date()
          : undefined,
    };

    if (existingIndex >= 0) {
      trainee.progress[
        existingIndex
      ] = updatedProgress;
    } else {
      trainee.progress.push(
        updatedProgress
      );
    }

    const enrollment =
      trainee.enrollments.find(
        (item) =>
          item.courseId ===
          progress.courseId
      );

    if (enrollment) {
      const completedCount =
        trainee.progress.filter(
          (item) =>
            item.courseId ===
              progress.courseId &&
            item.completed
        ).length;

      /*
       * We do not invent the total lesson count
       * here. CourseRepository owns course structure.
       *
       * The enrollment progress can be updated later
       * when the course lesson count is available.
       */
      if (
        completedCount > 0 &&
        enrollment.progress === 0
      ) {
        enrollment.progress = 0;
      }
    }

    this.writeTrainees([
      ...this.readTrainees().map(
        (item) =>
          item.id === trainee.id
            ? {
                ...trainee,
                updatedAt: new Date(),
              }
            : item
      ),
    ]);
  }

  async getProgress(
    traineeId: string,
    courseId: string
  ): Promise<CourseProgress[]> {
    const trainee =
      await this.findById(traineeId);

    if (!trainee) {
      return [];
    }

    return trainee.progress.filter(
      (item) =>
        item.courseId === courseId
    );
  }

  async getCourseProgress(
    traineeId: string,
    courseId: string,
    lessonId: string
  ): Promise<CourseProgress | null> {
    const progress =
      await this.getProgress(
        traineeId,
        courseId
      );

    return (
      progress.find(
        (item) =>
          item.lessonId === lessonId
      ) ?? null
    );
  }

  async issueCertificate(
    traineeId: string,
    courseId: string,
    courseTitle: string
  ): Promise<Certificate> {
    const trainee =
      await this.findById(traineeId);

    if (!trainee) {
      throw new Error(
        `Trainee not found: ${traineeId}`
      );
    }

    const existing =
      trainee.certificates.find(
        (certificate) =>
          certificate.courseId ===
          courseId
      );

    if (existing) {
      return existing;
    }

    const certificate: Certificate = {
      id: `cert-${Date.now()}`,
      courseId,
      courseTitle,
      issuedAt: new Date(),
      certificateNumber:
        `IMPACT-${Date.now()}`,
      verified: true,
    };

    trainee.certificates.push(
      certificate
    );

    await this.update(
      trainee.id,
      {
        certificates:
          trainee.certificates,
      }
    );

    return certificate;
  }

  async getCertificates(
    traineeId: string
  ): Promise<Certificate[]> {
    const trainee =
      await this.findById(traineeId);

    return trainee?.certificates ?? [];
  }

  async verifyCertificate(
    certificateNumber: string
  ): Promise<Certificate | null> {
    const trainees =
      this.readTrainees();

    for (const trainee of trainees) {
      const certificate =
        trainee.certificates.find(
          (item) =>
            item.certificateNumber ===
            certificateNumber
        );

      if (certificate) {
        return certificate;
      }
    }

    return null;
  }

  async search(
    query: string,
    limit = 20
  ): Promise<Trainee[]> {
    return this.findAll({
      filter: {
        searchQuery: query,
      },
      limit,
    });
  }

  async findByStatus(
    status:
      | 'active'
      | 'inactive'
      | 'suspended',
    query?: TraineeQuery
  ): Promise<Trainee[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        status,
      },
    });
  }

  async getCount(
    filter?: TraineeQuery
  ): Promise<number> {
    const trainees =
      await this.findAll({
        ...filter,
        limit: undefined,
        offset: 0,
      });

    return trainees.length;
  }

  async getActiveTraineesCount(): Promise<number> {
    return this.readTrainees().filter(
      (trainee) =>
        trainee.status === 'active'
    ).length;
  }

  /**
   * Legacy-compatible current user methods.
   */
  setCurrentUser(
    trainee: Trainee | null
  ): Trainee | null {
    if (!trainee) {
      storage.remove(
        CURRENT_USER_KEY
      );

      return null;
    }

    storage.set(
      CURRENT_USER_KEY,
      trainee
    );

    return trainee;
  }

  getCurrentUser(): Trainee | null {
    return storage.get<Trainee>(
      CURRENT_USER_KEY
    );
  }

  logoutUser(): boolean {
    return storage.remove(
      CURRENT_USER_KEY
    );
  }

  async loginUser(
    identifier: string,
    password: string
  ): Promise<Trainee | null> {
    const value = String(identifier ?? '')
      .trim()
      .toLowerCase();

    if (!value || !password) {
      return null;
    }

    const trainees =
      this.readTrainees();

    const trainee =
      trainees.find((item) => {
        const email =
          item.email.toLowerCase();

        const phone =
          item.contact.phone?.trim();

        return (
          email === value ||
          phone ===
            String(identifier).trim()
        );
      });

    if (!trainee) {
      return null;
    }

    const valid =
      await this.verifyPassword(
        trainee.email,
        password
      );

    if (!valid) {
      return null;
    }

    const loggedIn = {
      ...trainee,
      lastLoginAt: new Date(),
    };

    await this.update(
      trainee.id,
      {
        lastLoginAt:
          loggedIn.lastLoginAt,
      }
    );

    this.setCurrentUser(
      loggedIn
    );

    return loggedIn;
  }

  async enrollTraineeInCourse(
    emailOrId: string,
    courseId: string,
    courseTitle = ''
  ): Promise<Trainee | null> {
    const trainee =
      (await this.findByEmail(
        emailOrId
      )) ??
      (await this.findById(
        emailOrId
      ));

    if (!trainee) {
      return null;
    }

    await this.enrollInCourse(
      trainee.id,
      courseId,
      courseTitle
    );

    const updated =
      await this.findById(
        trainee.id
      );

    const current =
      this.getCurrentUser();

    if (
      current &&
      updated &&
      (current.id === updated.id ||
        current.email === updated.email)
    ) {
      this.setCurrentUser(updated);
    }

    return updated;
  }

  hasAccessToCourse(
    email: string,
    courseId: string
  ): boolean {
    const trainee =
      this.readTrainees().find(
        (item) =>
          item.email.toLowerCase() ===
          email.trim().toLowerCase()
      );

    if (!trainee) {
      return false;
    }

    return trainee.enrollments.some(
      (enrollment) =>
        enrollment.courseId === courseId
    );
  }
}

export const traineeRepository =
  new TraineeRepository();