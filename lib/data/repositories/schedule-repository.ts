import type {
    Schedule,
    ScheduleQuery,
    ScheduleSession,
    ScheduleStatus,
} from '@/types/schedule';

export interface IScheduleRepository {
    findById(id: string): Promise<Schedule | null>;
    findAll(query?: ScheduleQuery): Promise<Schedule[]>;
    create(
        schedule: Omit<
            Schedule,
            'id' | 'createdAt' | 'updatedAt'
        >
    ): Promise<Schedule>;
    update(
        id: string,
        schedule: Partial<Schedule>
    ): Promise<Schedule>;
   delete(id: string): Promise<void>;
deleteMany(ids: string[]): Promise<void>;
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
        session: Omit<
            ScheduleSession,
            'id' | 'scheduleId'
        >
    ): Promise<ScheduleSession>;
    updateSession(
        sessionId: string,
        session: Partial<ScheduleSession>
    ): Promise<ScheduleSession>;
    deleteSession(sessionId: string): Promise<void>;
    checkAvailability(scheduleId: string): Promise<boolean>;
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
        status: ScheduleStatus
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
        status: ScheduleStatus
    ): Promise<void>;
    generateSchedules(options: {
        startDate?: string;
        endDate?: string;
        cities?: string[];
        courseIds?: string[];
    }): Promise<Schedule[]>;
}

function toDate(value: unknown): Date {
    const date = new Date(String(value ?? ''));

    return Number.isNaN(date.getTime())
        ? new Date()
        : date;
}

function normalizeSession(
    session: any
): ScheduleSession {
    return {
        ...session,
        date: toDate(session.date),
    };
}

function normalizeSchedule(
    schedule: any
): Schedule {
    return {
        ...schedule,
        city:
            schedule.city === 'أونلاين'
                ? 'Online'
                : schedule.city,
        startDate: toDate(schedule.startDate),
        endDate: toDate(schedule.endDate),
        createdAt: toDate(schedule.createdAt),
        updatedAt: toDate(schedule.updatedAt),
        confirmationDeadline:
            schedule.confirmationDeadline
                ? toDate(
                      schedule.confirmationDeadline
                  )
                : undefined,
        cancellationDeadline:
            schedule.cancellationDeadline
                ? toDate(
                      schedule.cancellationDeadline
                  )
                : undefined,
        sessions: Array.isArray(
            schedule.sessions
        )
            ? schedule.sessions.map(
                  normalizeSession
              )
            : [],
    };
}

async function requestJson(
    url: string,
    options?: RequestInit
) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
        },
        cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || data?.success === false) {
        throw new Error(
            data?.error ||
                'تعذر تنفيذ عملية الجدولة.'
        );
    }

    return data;
}

function buildParams(
    query?: ScheduleQuery
) {
    const params = new URLSearchParams();

    const filter = query?.filter;

    if (filter?.courseId) {
        params.set(
            'courseId',
            filter.courseId
        );
    }

    if (filter?.status) {
        params.set(
            'status',
            filter.status
        );
    }

    if (filter?.city) {
        params.set(
            'city',
            filter.city
        );
    }

    if (
        typeof filter?.published ===
        'boolean'
    ) {
        params.set(
            'published',
            String(filter.published)
        );
    }

    if (filter?.available) {
        params.set(
            'available',
            'true'
        );
    }

    if (filter?.startDateFrom) {
        params.set(
            'dateFrom',
            filter.startDateFrom.toISOString()
        );
    }

    if (filter?.startDateTo) {
        params.set(
            'dateTo',
            filter.startDateTo.toISOString()
        );
    }

    if (filter?.searchQuery) {
        params.set(
            'search',
            filter.searchQuery
        );
    }

    if (query?.sort) {
        params.set(
            'sort',
            query.sort
        );
    }

    if (query?.order) {
        params.set(
            'order',
            query.order
        );
    }

    if (
        typeof query?.limit ===
        'number'
    ) {
        params.set(
            'limit',
            String(query.limit)
        );
    }

    if (
        typeof query?.offset ===
        'number'
    ) {
        params.set(
            'offset',
            String(query.offset)
        );
    }

    return params;
}

export class ScheduleRepository
    implements IScheduleRepository
{
    async refresh() {
        return;
    }

    async findById(
        id: string
    ): Promise<Schedule | null> {
        const params =
            new URLSearchParams();

        params.set('id', id);

        const result =
            await requestJson(
                `/api/schedules?${params.toString()}`
            );

        return result.schedule
            ? normalizeSchedule(
                  result.schedule
              )
            : null;
    }

    async findAll(
        query?: ScheduleQuery
    ): Promise<Schedule[]> {
        const params =
            buildParams(query);

        const result =
            await requestJson(
                `/api/schedules?${params.toString()}`
            );

        return (
            result.schedules ?? []
        ).map(normalizeSchedule);
    }

    async create(
        input: Omit<
            Schedule,
            'id' | 'createdAt' | 'updatedAt'
        >
    ): Promise<Schedule> {
        const result =
            await requestJson(
                '/api/schedules',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        ...input,
                        city:
                            input.city ===
                            'أونلاين'
                                ? 'Online'
                                : input.city,
                    }),
                }
            );

        return normalizeSchedule(
            result.schedule
        );
    }

    async update(
        id: string,
        input: Partial<Schedule>
    ): Promise<Schedule> {
        const result =
            await requestJson(
                '/api/schedules',
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        id,
                        ...input,
                    }),
                }
            );

        return normalizeSchedule(
            result.schedule
        );
    }

  async delete(
    id: string
): Promise<void> {
    await requestJson(
        '/api/schedules',
        {
            method: 'DELETE',
            body: JSON.stringify({
                id,
            }),
        }
    );
}

async deleteMany(
    ids: string[]
): Promise<void> {
    if (!ids.length) return;

    await requestJson(
        '/api/schedules',
        {
            method: 'DELETE',
            body: JSON.stringify({
                action: 'bulkDelete',
                ids,
            }),
        }
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
            },
        });
    }

    async findUpcomingSchedules(
        query?: ScheduleQuery
    ): Promise<Schedule[]> {
        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        return this.findAll({
            ...query,
            filter: {
                ...query?.filter,
                startDateFrom:
                    today,
            },
        });
    }

    async findSessionById(
        sessionId: string
    ): Promise<ScheduleSession | null> {
        const schedules =
            await this.findAll();

        for (
            const schedule of schedules
        ) {
            const session =
                schedule.sessions?.find(
                    (
                        item: ScheduleSession
                    ) =>
                        item.id ===
                        sessionId
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
            schedule?.sessions ??
            []
        );
    }

    async createSession(
        scheduleId: string,
        session: Omit<
            ScheduleSession,
            'id' | 'scheduleId'
        >
    ): Promise<ScheduleSession> {
        const result =
            await requestJson(
                '/api/schedules',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        action:
                            'sessionCreate',
                        scheduleId,
                        ...session,
                    }),
                }
            );

        return normalizeSession(
            result.session
        );
    }

    async updateSession(
        sessionId: string,
        session: Partial<ScheduleSession>
    ): Promise<ScheduleSession> {
        const result =
            await requestJson(
                '/api/schedules',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        action:
                            'sessionUpdate',
                        sessionId,
                        ...session,
                    }),
                }
            );

        return normalizeSession(
            result.session
        );
    }

    async deleteSession(
        sessionId: string
    ): Promise<void> {
        await requestJson(
            '/api/schedules',
            {
                method: 'POST',
                body: JSON.stringify({
                    action:
                        'sessionDelete',
                    sessionId,
                }),
            }
        );
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

        return (
            schedule.status ===
                'available' &&
            schedule.currentParticipants <
                schedule.maxParticipants
        );
    }

    async updateParticipantCount(
        scheduleId: string,
        increment: number
    ): Promise<Schedule> {
        const result =
            await requestJson(
                '/api/schedules',
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        action:
                            'participantCount',
                        id: scheduleId,
                        increment,
                    }),
                }
            );

        return normalizeSchedule(
            result.schedule
        );
    }

    async addToWaitlist(
        scheduleId: string,
        traineeId: string
    ): Promise<void> {
        await requestJson(
            '/api/schedules',
            {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'waitlist',
                    id: scheduleId,
                    traineeId,
                    mode: 'add',
                }),
            }
        );
    }

    async removeFromWaitlist(
        scheduleId: string,
        traineeId: string
    ): Promise<void> {
        await requestJson(
            '/api/schedules',
            {
                method: 'PATCH',
                body: JSON.stringify({
                    action: 'waitlist',
                    id: scheduleId,
                    traineeId,
                    mode: 'remove',
                }),
            }
        );
    }

    async updateStatus(
        id: string,
        status: ScheduleStatus
    ): Promise<Schedule> {
        return this.update(id, {
            status,
        });
    }

    async cancelSchedule(
        id: string,
        reason?: string
    ): Promise<Schedule> {
        return this.update(id, {
            status: 'cancelled',
            cancellationPolicy:
                reason,
        });
    }

    async search(
        query: string,
        limit = 20
    ): Promise<Schedule[]> {
        return this.findAll({
            filter: {
                searchQuery:
                    query,
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
                city:
                    city === 'أونلاين'
                        ? 'Online'
                        : city,
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
                startDateFrom:
                    startDate,
                startDateTo:
                    endDate,
            },
        });
    }

    async getCount(
        filter?: ScheduleQuery['filter']
    ): Promise<number> {
        const params =
            buildParams({
                filter,
            });

        const result =
            await requestJson(
                `/api/schedules?${params.toString()}`
            );

        return Number(
            result.count ?? 0
        );
    }

    async getUpcomingCount(): Promise<number> {
        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        return this.getCount({
            startDateFrom:
                today,
        });
    }

    async bulkUpdateStatus(
        ids: string[],
        status: ScheduleStatus
    ): Promise<void> {
        await requestJson(
            '/api/schedules',
            {
                method: 'PATCH',
                body: JSON.stringify({
                    action:
                        'bulkStatus',
                    ids,
                    status,
                }),
            }
        );
    }

    async generateSchedules(
        options: {
            startDate?: string;
            endDate?: string;
            cities?: string[];
            courseIds?: string[];
        }
    ): Promise<Schedule[]> {
        const result =
            await requestJson(
                '/api/schedules',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        action:
                            'generate',
                        ...options,
                    }),
                }
            );

        return (
            result.schedules ?? []
        ).map(
            normalizeSchedule
        );
    }
}

export const scheduleRepository =
    new ScheduleRepository();