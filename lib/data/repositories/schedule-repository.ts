/**
 * Schedule Repository
 *
 * LocalStorage implementation for training schedules.
 * Migrates the legacy ImpactStore schedule behavior into TypeScript.
 */

import {
  Schedule,
  ScheduleQuery,
  ScheduleSession,
} from '@/types/schedule';

import { LocalStorageAdapter } from '@/lib/storage/local-storage';

export interface IScheduleRepository {
  findById(id: string): Promise<Schedule | null>;
  findAll(query?: ScheduleQuery): Promise<Schedule[]>;
  create(
    schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Schedule>;
  update(
    id: string,
    schedule: Partial<Schedule>
  ): Promise<Schedule>;
  delete(id: string): Promise<void>;

  findByCourseId(
    courseId: string,
    query?: ScheduleQuery
  ): Promise<Schedule[]>;

  findAvailableSchedules(
    courseId: string
  ): Promise<Schedule[]>;

  findUpcomingSchedules(
    query?: ScheduleQuery
  ): Promise<Schedule[]>;

  findSessionById(
    sessionId: string
  ): Promise<ScheduleSession | null>;

  findSessionsByScheduleId(
    scheduleId: string
  ): Promise<ScheduleSession[]>;

  createSession(
    scheduleId: string,
    session: Omit<ScheduleSession, 'id' | 'scheduleId'>
  ): Promise<ScheduleSession>;

  updateSession(
    sessionId: string,
    session: Partial<ScheduleSession>
  ): Promise<ScheduleSession>;

  deleteSession(sessionId: string): Promise<void>;

  checkAvailability(
    scheduleId: string
  ): Promise<boolean>;

  updateParticipantCount(
    scheduleId: string,
    increment: number
  ): Promise<Schedule>;

  addToWaitlist(
    scheduleId: string,
    traineeId: string
  ): Promise<void>;

  removeFromWaitlist(
    scheduleId: string,
    traineeId: string
  ): Promise<void>;

  updateStatus(
    id: string,
    status: Schedule['status']
  ): Promise<Schedule>;

  cancelSchedule(
    id: string,
    reason?: string
  ): Promise<Schedule>;

  search(
    query: string,
    limit?: number
  ): Promise<Schedule[]>;

  findByCity(
    city: string,
    query?: ScheduleQuery
  ): Promise<Schedule[]>;

  findByDateRange(
    startDate: Date,
    endDate: Date,
    query?: ScheduleQuery
  ): Promise<Schedule[]>;

  getCount(
    filter?: ScheduleQuery['filter']
  ): Promise<number>;

  getUpcomingCount(): Promise<number>;

  bulkUpdateStatus(
    ids: string[],
    status: Schedule['status']
  ): Promise<void>;

  generateSchedules(options: {
    startDate?: string;
    endDate?: string;
    cities?: string[];
  }): Promise<Schedule[]>;
}

interface StoredSchedule extends Schedule {
  waitlistTraineeIds?: string[];
}

interface LegacyCourse {
  id?: string;
  title?: string;
  type?: string;
  delivery?: string;
  cities?: unknown[];
  oldPrice?: number | null;
  discount?: number | string | null;
  price?: number;
  schedules?: unknown[];
}

const SCHEDULES_KEY = 'impact_schedules_v1';
const COURSES_KEY = 'impact_courses_v1';
const RECORDED_COURSES_KEY = 'impact_recorded_courses_v1';

const storage = new LocalStorageAdapter('');

function readSchedules(): StoredSchedule[] {
  const data = storage.get<StoredSchedule[]>(SCHEDULES_KEY);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeStoredSchedule);
}

function writeSchedules(
  schedules: StoredSchedule[]
): void {
  storage.set(SCHEDULES_KEY, schedules);
}

function readCourses(): LegacyCourse[] {
  const normalCourses =
    storage.get<LegacyCourse[]>(COURSES_KEY);

  const recordedCourses =
    storage.get<LegacyCourse[]>(RECORDED_COURSES_KEY);

  const courses: LegacyCourse[] = [];

  if (Array.isArray(normalCourses)) {
    courses.push(...normalCourses);
  }

  if (Array.isArray(recordedCourses)) {
    courses.push(...recordedCourses);
  }

  return courses;
}

function normalizeStoredSchedule(
  schedule: StoredSchedule
): StoredSchedule {
  return {
    ...schedule,

    startDate: new Date(schedule.startDate),
    endDate: new Date(schedule.endDate),

    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.updatedAt),

    confirmationDeadline:
      schedule.confirmationDeadline
        ? new Date(schedule.confirmationDeadline)
        : undefined,

    cancellationDeadline:
      schedule.cancellationDeadline
        ? new Date(schedule.cancellationDeadline)
        : undefined,

    sessions:
      schedule.sessions?.map((session) => ({
        ...session,
        date: new Date(session.date),
      })),

    currentParticipants:
      schedule.currentParticipants ?? 0,

    currentWaitlist:
      schedule.currentWaitlist ?? 0,

    waitlistTraineeIds:
      schedule.waitlistTraineeIds ?? [],
  };
}

function normalizeSchedule(
  data: Partial<Schedule>,
  existing?: StoredSchedule
): StoredSchedule {
  const now = new Date();

  const startDate =
    data.startDate ??
    existing?.startDate ??
    now;

  const endDate =
    data.endDate ??
    existing?.endDate ??
    startDate;

  return {
    ...(existing ?? {}),
    ...data,

    id:
      existing?.id ??
      data.id ??
      `schedule-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    courseId:
      data.courseId ??
      existing?.courseId ??
      '',

    courseTitle:
      data.courseTitle ??
      existing?.courseTitle ??
      '',

    title:
      data.title ??
      existing?.title ??
      data.courseTitle ??
      existing?.courseTitle ??
      '',

    startDate:
      new Date(startDate),

    endDate:
      new Date(endDate),

    startTime:
      data.startTime ??
      existing?.startTime ??
      '09:00',

    endTime:
      data.endTime ??
      existing?.endTime ??
      '17:00',

    maxParticipants:
      data.maxParticipants ??
      existing?.maxParticipants ??
      0,

    currentParticipants:
      data.currentParticipants ??
      existing?.currentParticipants ??
      0,

    status:
      data.status ??
      existing?.status ??
      'available',

    published:
      data.published ??
      existing?.published ??
      true,

    allowWaitlist:
      data.allowWaitlist ??
      existing?.allowWaitlist ??
      false,

    requireConfirmation:
      data.requireConfirmation ??
      existing?.requireConfirmation ??
      false,

    createdAt:
      existing?.createdAt ??
      (data.createdAt
        ? new Date(data.createdAt)
        : now),

    updatedAt: now,

    waitlistTraineeIds:
      existing?.waitlistTraineeIds ??
      [],

    currentWaitlist:
      data.currentWaitlist ??
      existing?.currentWaitlist ??
      existing?.waitlistTraineeIds?.length ??
      0,
  };
}

function hasAvailableSpot(
  schedule: StoredSchedule
): boolean {
  return (
    schedule.status === 'available' &&
    schedule.currentParticipants <
      schedule.maxParticipants
  );
}

function matchesFilter(
  schedule: StoredSchedule,
  filter?: ScheduleQuery['filter']
): boolean {
  if (!filter) {
    return true;
  }

  if (
    filter.courseId &&
    schedule.courseId !== filter.courseId
  ) {
    return false;
  }

  if (
    filter.status &&
    schedule.status !== filter.status
  ) {
    return false;
  }

  if (
    filter.city &&
    schedule.city !== filter.city
  ) {
    return false;
  }

  if (
    typeof filter.published === 'boolean' &&
    schedule.published !== filter.published
  ) {
    return false;
  }

  if (
    typeof filter.available === 'boolean' &&
    hasAvailableSpot(schedule) !== filter.available
  ) {
    return false;
  }

  if (
    filter.startDateFrom &&
    schedule.startDate < filter.startDateFrom
  ) {
    return false;
  }

  if (
    filter.startDateTo &&
    schedule.startDate > filter.startDateTo
  ) {
    return false;
  }

  if (filter.searchQuery) {
    const search =
      filter.searchQuery
        .trim()
        .toLowerCase();

    const haystack = [
      schedule.id,
      schedule.courseId,
      schedule.courseTitle,
      schedule.title,
      schedule.description,
      schedule.city,
      schedule.location,
      schedule.instructorName,
      schedule.onlineMeetingLink,
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

function applyQuery(
  schedules: StoredSchedule[],
  query?: ScheduleQuery
): StoredSchedule[] {
  const result = schedules.filter(
    (schedule) =>
      matchesFilter(
        schedule,
        query?.filter
      )
  );

  const sort =
    query?.sort ?? 'startDate';

  const direction =
    query?.order ?? 'asc';

  result.sort((a, b) => {
    let comparison = 0;

    switch (sort) {
      case 'price':
        comparison =
          (a.price ?? 0) -
          (b.price ?? 0);
        break;

      case 'createdAt':
        comparison =
          a.createdAt.getTime() -
          b.createdAt.getTime();
        break;

      case 'startDate':
      default:
        comparison =
          a.startDate.getTime() -
          b.startDate.getTime();
        break;
    }

    return direction === 'asc'
      ? comparison
      : -comparison;
  });

  const offset =
    query?.offset ?? 0;

  if (
    typeof query?.limit === 'number'
  ) {
    return result.slice(
      offset,
      offset + query.limit
    );
  }

  return result.slice(offset);
}

function getSchedulableCourses(): LegacyCourse[] {
  return readCourses().filter((course) => {
    const type =
      String(course.type ?? '')
        .trim()
        .toLowerCase();

    const delivery =
      String(course.delivery ?? '')
        .trim()
        .toLowerCase();

    if (type === 'recorded') {
      return false;
    }

    if (
      type === 'training' ||
      type === 'public'
    ) {
      return true;
    }

    return (
      delivery === 'حضوري' ||
      delivery === 'اونلاين' ||
      delivery === 'أونلاين' ||
      delivery === 'online' ||
      delivery === 'in-person' ||
      delivery === 'hybrid'
    );
  });
}

function getSchedulePrice(
  city: string
): number {
  if (city === 'القاهرة') {
    return 8500;
  }

  if (
    city === 'دبي' ||
    city === 'البحرين' ||
    city === 'قطر'
  ) {
    return 16000;
  }

  if (
    city === 'لندن' ||
    city === 'برشلونة' ||
    city === 'ميلان'
  ) {
    return 21000;
  }

  return 5000;
}

function createScheduleId(): string {
  return (
    `schedule-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

export class ScheduleRepository
  implements IScheduleRepository
{
  async findById(
    id: string
  ): Promise<Schedule | null> {
    return (
      readSchedules().find(
        (schedule) =>
          schedule.id === id
      ) ?? null
    );
  }

  async findAll(
    query?: ScheduleQuery
  ): Promise<Schedule[]> {
    return applyQuery(
      readSchedules(),
      query
    );
  }

  async create(
    schedule: Omit<
      Schedule,
      'id' | 'createdAt' | 'updatedAt'
    >
  ): Promise<Schedule> {
    const schedules =
      readSchedules();

    const newSchedule =
      normalizeSchedule(schedule);

    schedules.push(newSchedule);

    writeSchedules(schedules);

    return newSchedule;
  }

  async update(
    id: string,
    updates: Partial<Schedule>
  ): Promise<Schedule> {
    const schedules =
      readSchedules();

    const index =
      schedules.findIndex(
        (schedule) =>
          schedule.id === id
      );

    if (index === -1) {
      throw new Error(
        `Schedule not found: ${id}`
      );
    }

    const updated =
      normalizeSchedule(
        updates,
        schedules[index]
      );

    schedules[index] = updated;

    writeSchedules(schedules);

    return updated;
  }

  async delete(
    id: string
  ): Promise<void> {
    const schedules =
      readSchedules();

    writeSchedules(
      schedules.filter(
        (schedule) =>
          schedule.id !== id
      )
    );
  }

  async findByCourseId(
    courseId: string,
    query?: ScheduleQuery
  ): Promise<Schedule[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        courseId,
      },
    });
  }

  async findAvailableSchedules(
    courseId: string
  ): Promise<Schedule[]> {
    return this.findAll({
      filter: {
        courseId,
        available: true,
        published: true,
      },
      sort: 'startDate',
      order: 'asc',
    });
  }

  async findUpcomingSchedules(
    query?: ScheduleQuery
  ): Promise<Schedule[]> {
    const now = new Date();

    const schedules =
      readSchedules().filter(
        (schedule) =>
          schedule.startDate >= now &&
          schedule.status !==
            'cancelled' &&
          schedule.status !==
            'completed'
      );

    return applyQuery(
      schedules,
      query
    );
  }

  async findSessionById(
    sessionId: string
  ): Promise<ScheduleSession | null> {
    for (
      const schedule of readSchedules()
    ) {
      const session =
        schedule.sessions?.find(
          (item) =>
            item.id === sessionId
        );

      if (session) {
        return session;
      }
    }

    return null;
  }

  async findSessionsByScheduleId(
    scheduleId: string
  ): Promise<ScheduleSession[]> {
    const schedule =
      await this.findById(
        scheduleId
      );

    return (
      schedule?.sessions ?? []
    );
  }

  async createSession(
    scheduleId: string,
    session: Omit<
      ScheduleSession,
      'id' | 'scheduleId'
    >
  ): Promise<ScheduleSession> {
    const schedules =
      readSchedules();

    const index =
      schedules.findIndex(
        (schedule) =>
          schedule.id ===
          scheduleId
      );

    if (index === -1) {
      throw new Error(
        `Schedule not found: ${scheduleId}`
      );
    }

    const newSession:
      ScheduleSession = {
      ...session,
      id:
        `session-${Date.now()}-` +
        Math.random()
          .toString(36)
          .slice(2, 8),
      scheduleId,
    };

    schedules[index].sessions = [
      ...(schedules[index].sessions ??
        []),
      newSession,
    ];

    schedules[index].updatedAt =
      new Date();

    writeSchedules(schedules);

    return newSession;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<ScheduleSession>
  ): Promise<ScheduleSession> {
    const schedules =
      readSchedules();

    for (
      const schedule of schedules
    ) {
      const index =
        schedule.sessions?.findIndex(
          (session) =>
            session.id ===
            sessionId
        ) ?? -1;

      if (index === -1) {
        continue;
      }

      const current =
        schedule.sessions![index];

      const updated:
        ScheduleSession = {
        ...current,
        ...updates,
        id: current.id,
        scheduleId:
          current.scheduleId,
      };

      schedule.sessions![index] =
        updated;

      schedule.updatedAt =
        new Date();

      writeSchedules(schedules);

      return updated;
    }

    throw new Error(
      `Session not found: ${sessionId}`
    );
  }

  async deleteSession(
    sessionId: string
  ): Promise<void> {
    const schedules =
      readSchedules();

    let found = false;

    for (
      const schedule of schedules
    ) {
      if (!schedule.sessions) {
        continue;
      }

      const originalLength =
        schedule.sessions.length;

      schedule.sessions =
        schedule.sessions.filter(
          (session) =>
            session.id !==
            sessionId
        );

      if (
        schedule.sessions.length !==
        originalLength
      ) {
        found = true;
        schedule.updatedAt =
          new Date();
      }
    }

    if (!found) {
      throw new Error(
        `Session not found: ${sessionId}`
      );
    }

    writeSchedules(schedules);
  }

  async checkAvailability(
    scheduleId: string
  ): Promise<boolean> {
    const schedule =
      await this.findById(
        scheduleId
      );

    if (!schedule) {
      return false;
    }

    return hasAvailableSpot(
      schedule
    );
  }

  async updateParticipantCount(
    scheduleId: string,
    increment: number
  ): Promise<Schedule> {
    const schedules =
      readSchedules();

    const index =
      schedules.findIndex(
        (schedule) =>
          schedule.id ===
          scheduleId
      );

    if (index === -1) {
      throw new Error(
        `Schedule not found: ${scheduleId}`
      );
    }

    const schedule =
      schedules[index];

    const nextCount =
      Math.max(
        0,
        schedule.currentParticipants +
          increment
      );

    if (
      schedule.maxParticipants > 0 &&
      nextCount >
        schedule.maxParticipants
    ) {
      throw new Error(
        'Participant count cannot exceed schedule capacity'
      );
    }

    schedule.currentParticipants =
      nextCount;

    if (
      schedule.maxParticipants > 0 &&
      nextCount >=
        schedule.maxParticipants
    ) {
      schedule.status = 'full';
    } else if (
      schedule.status === 'full'
    ) {
      schedule.status =
        'available';
    }

    schedule.updatedAt =
      new Date();

    schedules[index] =
      schedule;

    writeSchedules(schedules);

    return schedule;
  }

  async addToWaitlist(
    scheduleId: string,
    traineeId: string
  ): Promise<void> {
    const schedules =
      readSchedules();

    const schedule =
      schedules.find(
        (item) =>
          item.id === scheduleId
      );

    if (!schedule) {
      throw new Error(
        `Schedule not found: ${scheduleId}`
      );
    }

    if (!schedule.allowWaitlist) {
      throw new Error(
        'Waitlist is not enabled for this schedule'
      );
    }

    const waitlist =
      schedule.waitlistTraineeIds ??
      [];

    if (
      waitlist.includes(
        traineeId
      )
    ) {
      return;
    }

    if (
      typeof schedule.waitlistMax ===
        'number' &&
      waitlist.length >=
        schedule.waitlistMax
    ) {
      throw new Error(
        'Waitlist is full'
      );
    }

    waitlist.push(traineeId);

    schedule.waitlistTraineeIds =
      waitlist;

    schedule.currentWaitlist =
      waitlist.length;

    schedule.updatedAt =
      new Date();

    writeSchedules(schedules);
  }

  async removeFromWaitlist(
    scheduleId: string,
    traineeId: string
  ): Promise<void> {
    const schedules =
      readSchedules();

    const schedule =
      schedules.find(
        (item) =>
          item.id === scheduleId
      );

    if (!schedule) {
      throw new Error(
        `Schedule not found: ${scheduleId}`
      );
    }

    const waitlist =
      schedule.waitlistTraineeIds ??
      [];

    schedule.waitlistTraineeIds =
      waitlist.filter(
        (id) =>
          id !== traineeId
      );

    schedule.currentWaitlist =
      schedule.waitlistTraineeIds.length;

    schedule.updatedAt =
      new Date();

    writeSchedules(schedules);
  }

  async updateStatus(
    id: string,
    status: Schedule['status']
  ): Promise<Schedule> {
    return this.update(
      id,
      { status }
    );
  }

  async cancelSchedule(
    id: string,
    reason?: string
  ): Promise<Schedule> {
    return this.update(
      id,
      {
        status: 'cancelled',
        cancellationPolicy:
          reason,
      }
    );
  }

  async search(
    query: string,
    limit = 20
  ): Promise<Schedule[]> {
    return this.findAll({
      filter: {
        searchQuery: query,
      },
      limit,
    });
  }

  async findByCity(
    city: string,
    query?: ScheduleQuery
  ): Promise<Schedule[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        city,
      },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    query?: ScheduleQuery
  ): Promise<Schedule[]> {
    return this.findAll({
      ...query,
      filter: {
        ...query?.filter,
        startDateFrom: startDate,
        startDateTo: endDate,
      },
    });
  }

  async getCount(
    filter?: ScheduleQuery['filter']
  ): Promise<number> {
    return readSchedules().filter(
      (schedule) =>
        matchesFilter(
          schedule,
          filter
        )
    ).length;
  }

  async getUpcomingCount(): Promise<number> {
    const now = new Date();

    return readSchedules().filter(
      (schedule) =>
        schedule.startDate >= now &&
        schedule.status !==
          'cancelled' &&
        schedule.status !==
          'completed'
    ).length;
  }

  async bulkUpdateStatus(
    ids: string[],
    status: Schedule['status']
  ): Promise<void> {
    const idSet = new Set(ids);

    const schedules =
      readSchedules();

    const updated =
      schedules.map(
        (schedule) =>
          idSet.has(schedule.id)
            ? {
                ...schedule,
                status,
                updatedAt:
                  new Date(),
              }
            : schedule
      );

    writeSchedules(updated);
  }

  /**
   * Legacy ImpactStore schedule generation.
   *
   * Every schedulable course is distributed across Sundays.
   * Each course city appears at least once per month
   * when enough Sundays exist.
   */
  async generateSchedules({
    startDate,
    endDate,
    cities = [
      'الرياض',
      'جدة',
      'الدمام',
      'دبي',
      'القاهرة',
      'البحرين',
      'قطر',
      'لندن',
      'برشلونة',
      'ميلان',
    ],
  }: {
    startDate?: string;
    endDate?: string;
    cities?: string[];
  } = {}): Promise<Schedule[]> {
    if (!startDate || !endDate) {
      return [];
    }

    const start =
      new Date(
        `${startDate}T00:00:00`
      );

    const end =
      new Date(
        `${endDate}T00:00:00`
      );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return [];
    }

    const courses =
      getSchedulableCourses();

    if (!courses.length) {
      return [];
    }

    const schedules =
      readSchedules();

    const results: Schedule[] = [];

    for (const course of courses) {
      if (!course.id) {
        continue;
      }

      const courseCities =
        Array.isArray(course.cities) &&
        course.cities.length
          ? [
              ...new Set(
                course.cities
                  .map((city) =>
                    String(city).trim()
                  )
                  .filter(Boolean)
              ),
            ]
          : [
              ...new Set(
                cities
                  .map((city) =>
                    String(city).trim()
                  )
                  .filter(Boolean)
              ),
            ];

      if (!courseCities.length) {
        continue;
      }

      let monthCursor =
        new Date(
          start.getFullYear(),
          start.getMonth(),
          1
        );

      while (
        monthCursor <= end
      ) {
        const year =
          monthCursor.getFullYear();

        const month =
          monthCursor.getMonth();

        const firstDay =
          new Date(
            year,
            month,
            1
          );

        const lastDay =
          new Date(
            year,
            month + 1,
            0
          );

        const firstSundayOffset =
          (7 - firstDay.getDay()) %
          7;

        let sunday =
          new Date(
            year,
            month,
            1 + firstSundayOffset
          );

        const sundays: Date[] = [];

        while (
          sunday <= lastDay
        ) {
          if (
            sunday >= start &&
            sunday <= end
          ) {
            sundays.push(
              new Date(sunday)
            );
          }

          sunday.setDate(
            sunday.getDate() + 7
          );
        }

        if (!sundays.length) {
          monthCursor =
            new Date(
              year,
              month + 1,
              1
            );

          continue;
        }

        courseCities.forEach(
          (city, cityIndex) => {
            const scheduleDate =
              sundays[
                cityIndex %
                  sundays.length
              ];

            const date =
              scheduleDate
                .toISOString()
                .slice(0, 10);

            const exists =
              schedules.some(
                (schedule) =>
                  String(
                    schedule.courseId
                  ) ===
                    String(
                      course.id
                    ) &&
                  schedule.startDate
                    .toISOString()
                    .slice(0, 10) ===
                    date &&
                  schedule.city ===
                    city
              );

            if (exists) {
              return;
            }

            const now =
              new Date();

            const newSchedule:
              StoredSchedule = {
              id: createScheduleId(),

             courseId:
  course.id!,

              courseTitle:
                course.title ?? '',

              title:
                course.title ?? '',

              startDate:
                new Date(
                  `${date}T00:00:00`
                ),

              endDate:
                new Date(
                  `${date}T00:00:00`
                ),

              startTime:
                '09:00',

              endTime:
                '17:00',

              recurrence:
                'once',

              location:
                '',

              city,

              onlineMeetingLink:
                '',

              maxParticipants:
                0,

              currentParticipants:
                0,

              currentWaitlist:
                0,

              price:
                getSchedulePrice(
                  city
                ),

              currency:
                'SAR',

              instructorName:
                '',

              status:
                'available',

              published:
                true,

              allowWaitlist:
                false,

              requireConfirmation:
                false,

              cancellationPolicy:
                undefined,

              createdAt:
                now,

              updatedAt:
                now,

              waitlistTraineeIds:
                [],

              sessions: [],
            };

            schedules.push(
              newSchedule
            );

            results.push(
              newSchedule
            );
          }
        );

        monthCursor =
          new Date(
            year,
            month + 1,
            1
          );
      }
    }

    if (results.length) {
      writeSchedules(
        schedules
      );
    }

    return results;
  }
}

export const scheduleRepository =
  new ScheduleRepository();