import type { Schedule, ScheduleQuery, ScheduleSession, ScheduleStatus } from '@/types/schedule';
import { courseRepository } from './course-repository';
import { browserDbGet, browserDbSet, migrateLegacyData } from '@/lib/data/browser-db';
export interface IScheduleRepository {
    findById(id: string): Promise<Schedule | null>;
    findAll(query?: ScheduleQuery): Promise<Schedule[]>;
    create(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule>;
    update(id: string, schedule: Partial<Schedule>): Promise<Schedule>;
    delete(id: string): Promise<void>;
    findByCourseId(courseId: string, query?: ScheduleQuery): Promise<Schedule[]>;
    findAvailableSchedules(courseId: string): Promise<Schedule[]>;
    findUpcomingSchedules(query?: ScheduleQuery): Promise<Schedule[]>;
    findSessionById(sessionId: string): Promise<ScheduleSession | null>;
    findSessionsByScheduleId(scheduleId: string): Promise<ScheduleSession[]>;
    createSession(scheduleId: string, session: Omit<ScheduleSession, 'id' | 'scheduleId'>): Promise<ScheduleSession>;
    updateSession(sessionId: string, session: Partial<ScheduleSession>): Promise<ScheduleSession>;
    deleteSession(sessionId: string): Promise<void>;
    checkAvailability(scheduleId: string): Promise<boolean>;
    updateParticipantCount(scheduleId: string, increment: number): Promise<Schedule>;
    addToWaitlist(scheduleId: string, traineeId: string): Promise<void>;
    removeFromWaitlist(scheduleId: string, traineeId: string): Promise<void>;
    updateStatus(id: string, status: ScheduleStatus): Promise<Schedule>;
    cancelSchedule(id: string, reason?: string): Promise<Schedule>;
    search(query: string, limit?: number): Promise<Schedule[]>;
    findByCity(city: string, query?: ScheduleQuery): Promise<Schedule[]>;
    findByDateRange(startDate: Date, endDate: Date, query?: ScheduleQuery): Promise<Schedule[]>;
    getCount(filter?: ScheduleQuery['filter']): Promise<number>;
    getUpcomingCount(): Promise<number>;
    bulkUpdateStatus(ids: string[], status: ScheduleStatus): Promise<void>;
    generateSchedules(options: {
        startDate?: string;
        endDate?: string;
        cities?: string[];
        courseIds?: string[];
    }): Promise<Schedule[]>;
}
let schedules: Schedule[] = [];
let hydrated = false;
let hydration: Promise<void> | null = null;
async function ensureHydrated() { if (hydrated)
    return; if (!hydration) {
    hydration = (async () => { const saved = await browserDbGet<Schedule[]>('schedules'); if (saved !== null)
        schedules = saved.map(normalizeSchedule); hydrated = true; })().catch(() => { hydrated = true; });
} await hydration; }
function schedulePrice(city?: string) {
    if (city === 'Online' || city === 'أونلاين') return 3000;
    if (['الرياض', 'جدة', 'الدمام'].includes(city ?? '')) return 5000;
    if (city === 'القاهرة') return 8500;
    if (['دبي', 'البحرين', 'قطر'].includes(city ?? '')) return 16000;
    if (['لندن', 'برشلونة', 'ميلان'].includes(city ?? '')) return 21000;
    return undefined;
}
function validDate(value: unknown, fallback: Date) {
    const result = new Date(String(value ?? ''));
    return Number.isNaN(result.getTime()) ? fallback : result;
}

function normalizeSchedule(s: Schedule): Schedule {
    const city = s.city === 'أونلاين' ? 'Online' : s.city;
    const startDate = validDate(s.startDate, new Date());
    const defaultEndDate = new Date(startDate);
    defaultEndDate.setDate(startDate.getDate() + 2);
    const endDate = validDate(s.endDate, defaultEndDate);
    const online = city === 'Online';

    return {
        ...s,
        city,
        startDate,
        endDate,
        startTime:
            typeof s.startTime === 'string' && s.startTime.trim()
                ? s.startTime
                : '09:00',
        endTime:
            typeof s.endTime === 'string' && s.endTime.trim()
                ? s.endTime
                : online
                  ? '12:00'
                  : '14:00',
        price:
            typeof s.price === 'number' && Number.isFinite(s.price)
                ? s.price
                : schedulePrice(city),
        createdAt: validDate(s.createdAt, new Date()),
        updatedAt: validDate(s.updatedAt, new Date()),
        confirmationDeadline: s.confirmationDeadline
            ? validDate(s.confirmationDeadline, new Date())
            : undefined,
        cancellationDeadline: s.cancellationDeadline
            ? validDate(s.cancellationDeadline, new Date())
            : undefined,
        sessions: (s.sessions ?? []).map(x => ({
            ...x,
            date: validDate(x.date, startDate),
        })),
    };
}
async function persist() { await browserDbSet('schedules', schedules); }
const waitlists = new Map<string, string[]>();
function matches(s: Schedule, q?: ScheduleQuery) { const f = q?.filter; if (!f)
    return true; if (f.courseId && s.courseId !== f.courseId)
    return false; if (f.status && s.status !== f.status)
    return false; if (f.city && s.city !== f.city)
    return false; if (typeof f.published === 'boolean' && s.published !== f.published)
    return false; if (f.available && s.currentParticipants >= s.maxParticipants)
    return false; if (f.startDateFrom && s.startDate < f.startDateFrom)
    return false; if (f.startDateTo && s.startDate > f.startDateTo)
    return false; if (f.searchQuery && !`${s.title} ${s.courseTitle} ${s.city ?? ''}`.toLowerCase().includes(f.searchQuery.trim().toLowerCase()))
    return false; return true; }
function sorted(list: Schedule[], q?: ScheduleQuery) { const r = [...list]; const ord = q?.order ?? 'asc'; r.sort((a, b) => { let n = 0; if (q?.sort === 'createdAt')
    n = a.createdAt.getTime() - b.createdAt.getTime();
else if (q?.sort === 'price')
    n = (a.price ?? 0) - (b.price ?? 0);
else
    n = a.startDate.getTime() - b.startDate.getTime(); return ord === 'desc' ? -n : n; }); const o = q?.offset ?? 0; return typeof q?.limit === 'number' ? r.slice(o, o + q.limit) : r.slice(o); }
export class ScheduleRepository implements IScheduleRepository {
    async refresh() { hydrated = false; hydration = null; await ensureHydrated(); }
    async findById(id: string) { await ensureHydrated(); return schedules.find(s => s.id === id) ?? null; }
    async findAll(q?: ScheduleQuery) { await ensureHydrated(); return sorted(schedules.filter(s => matches(s, q)), q); }
    async create(input: any) {
        await ensureHydrated();
        const now = new Date();
        const city = input.city === 'أونلاين' ? 'Online' : input.city;
        const startDate = new Date(input.startDate);
        const defaultEndDate = new Date(startDate);
        defaultEndDate.setDate(startDate.getDate() + 2);
        const endDate = input.endDate ? new Date(input.endDate) : defaultEndDate;
        const online = city === 'Online';
        const s: Schedule = {
            ...input,
            id: input.id ?? `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            city,
            startDate,
            endDate,
            startTime:
                typeof input.startTime === 'string' && input.startTime.trim()
                    ? input.startTime
                    : '09:00',
            endTime:
                typeof input.endTime === 'string' && input.endTime.trim()
                    ? input.endTime
                    : online
                      ? '12:00'
                      : '14:00',
            price:
                typeof input.price === 'number' && Number.isFinite(input.price)
                    ? input.price
                    : schedulePrice(city),
            createdAt: now,
            updatedAt: now,
            sessions: input.sessions ?? [],
            currentParticipants: input.currentParticipants ?? 0,
            maxParticipants: input.maxParticipants ?? 20,
            status: input.status ?? 'available',
            published: input.published ?? true,
            allowWaitlist: input.allowWaitlist ?? true,
            requireConfirmation: input.requireConfirmation ?? false,
        };
        schedules.push(s);
        await persist();
        return s;
    }
    async update(id: string, input: any) {
        await ensureHydrated();
        const i = schedules.findIndex(s => s.id === id);
        if (i < 0) throw new Error('Schedule not found');
        const merged: any = { ...schedules[i], ...input, id, updatedAt: new Date() };
        const city = merged.city === 'أونلاين' ? 'Online' : merged.city;
        const startDate = new Date(merged.startDate);
        const defaultEndDate = new Date(startDate);
        defaultEndDate.setDate(startDate.getDate() + 2);
        const endDate = merged.endDate ? new Date(merged.endDate) : defaultEndDate;
        schedules[i] = {
            ...merged,
            city,
            startDate,
            endDate,
            startTime:
                typeof merged.startTime === 'string' && merged.startTime.trim()
                    ? merged.startTime
                    : '09:00',
            endTime:
                typeof merged.endTime === 'string' && merged.endTime.trim()
                    ? merged.endTime
                    : city === 'Online'
                      ? '12:00'
                      : '14:00',
            price:
                typeof merged.price === 'number' && Number.isFinite(merged.price)
                    ? merged.price
                    : schedulePrice(city),
        };
        await persist();
        return schedules[i];
    }
    async delete(id: string) { await ensureHydrated(); schedules = schedules.filter(s => s.id !== id); waitlists.delete(id); await persist(); }
    async findByCourseId(id: string, q?: ScheduleQuery) { await ensureHydrated(); return sorted(schedules.filter(s => s.courseId === id && matches(s, q)), q); }
    async findAvailableSchedules(id: string) { await ensureHydrated(); return this.findByCourseId(id, { filter: { available: true, published: true } }); }
    async findUpcomingSchedules(q?: ScheduleQuery) { await ensureHydrated(); return sorted(schedules.filter(s => s.startDate >= new Date() && matches(s, q)), q); }
    async findSessionById(id: string) { await ensureHydrated(); for (const s of schedules) {
        const x = s.sessions?.find(v => v.id === id);
        if (x)
            return x;
    } return null; }
    async findSessionsByScheduleId(id: string) { await ensureHydrated(); return (schedules.find(s => s.id === id)?.sessions ?? []); }
    async createSession(scheduleId: string, input: any) { await ensureHydrated(); const s = await this.findById(scheduleId); if (!s)
        throw new Error('Schedule not found'); const session = { ...input, id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, scheduleId }; s.sessions = [...(s.sessions ?? []), session]; s.updatedAt = new Date(); await persist(); return session; }
    async updateSession(id: string, input: any) { await ensureHydrated(); for (const s of schedules) {
        const i = s.sessions?.findIndex(x => x.id === id) ?? -1;
        if (i >= 0) {
            s.sessions![i] = { ...s.sessions![i], ...input, id };
            s.updatedAt = new Date();
            await persist();
            return s.sessions![i];
        }
    } throw new Error('Session not found'); }
    async deleteSession(id: string) { await ensureHydrated(); for (const s of schedules) {
        if (s.sessions) {
            s.sessions = s.sessions.filter(x => x.id !== id);
            s.updatedAt = new Date();
        }
    } await persist(); }
    async checkAvailability(id: string) { await ensureHydrated(); const s = await this.findById(id); return !!s && s.status === 'available' && s.currentParticipants < s.maxParticipants; }
    async updateParticipantCount(id: string, inc: number) { await ensureHydrated(); const s = await this.findById(id); if (!s)
        throw new Error('Schedule not found'); s.currentParticipants = Math.max(0, s.currentParticipants + inc); if (s.currentParticipants >= s.maxParticipants)
        s.status = 'full';
    else if (s.status === 'full')
        s.status = 'available'; s.updatedAt = new Date(); await persist(); return s; }
    async addToWaitlist(id: string, traineeId: string) { await ensureHydrated(); const list = waitlists.get(id) ?? []; if (!list.includes(traineeId))
        list.push(traineeId); waitlists.set(id, list); const s = await this.findById(id); if (s) {
        s.currentWaitlist = list.length;
        s.updatedAt = new Date();
    } await persist(); }
    async removeFromWaitlist(id: string, traineeId: string) { await ensureHydrated(); const list = (waitlists.get(id) ?? []).filter(x => x !== traineeId); waitlists.set(id, list); const s = await this.findById(id); if (s) {
        s.currentWaitlist = list.length;
        s.updatedAt = new Date();
    } await persist(); }
    async updateStatus(id: string, status: ScheduleStatus) { await ensureHydrated(); return this.update(id, { status }); }
    async cancelSchedule(id: string, reason?: string) { await ensureHydrated(); return this.update(id, { status: 'cancelled', cancellationPolicy: reason }); }
    async search(q: string, limit = 20) { await ensureHydrated(); return sorted(schedules.filter(s => `${s.title} ${s.courseTitle} ${s.city ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())), { limit }); }
    async findByCity(city: string, q?: ScheduleQuery) { await ensureHydrated(); return this.findAll({ ...q, filter: { ...q?.filter, city } }); }
    async findByDateRange(a: Date, b: Date, q?: ScheduleQuery) { await ensureHydrated(); return this.findAll({ ...q, filter: { ...q?.filter, startDateFrom: a, startDateTo: b } }); }
    async getCount(f?: ScheduleQuery['filter']) { await ensureHydrated(); return schedules.filter(s => matches(s, { filter: f })).length; }
    async getUpcomingCount() { await ensureHydrated(); return schedules.filter(s => s.startDate >= new Date() && s.published).length; }
    async bulkUpdateStatus(ids: string[], status: ScheduleStatus) { await ensureHydrated(); const set = new Set(ids); schedules = schedules.map(s => set.has(s.id) ? { ...s, status, updatedAt: new Date() } : s); await persist(); }
    async generateSchedules(options: {
        startDate?: string;
        endDate?: string;
        cities?: string[];
        courseIds?: string[];
    }) {
        await ensureHydrated();

        const start = new Date(options.startDate ?? `${new Date().getFullYear()}-01-01T00:00:00`);
        const end = new Date(options.endDate ?? `${start.getFullYear()}-12-31T00:00:00`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

        const cities = options.cities ?? ['الرياض', 'جدة', 'الدمام', 'دبي', 'القاهرة', 'البحرين', 'قطر', 'لندن', 'برشلونة', 'ميلان', 'Online'];
        const requestedCourseIds = options.courseIds ? new Set(options.courseIds) : null;
        const courses = (await courseRepository.findAll({ filter: { type: 'training', trainingKind: 'public', published: true } }))
            .filter(course => !requestedCourseIds || requestedCourseIds.has(course.id));
        const created: Schedule[] = [];

        // Same scheduling idea as the original Impact project:
        // each month is handled independently, all Sundays are collected,
        // then the cities are distributed across those Sundays so every city
        // appears at least once during every month for every public course.
        for (const course of courses) {
            for (let monthCursor = new Date(start.getFullYear(), start.getMonth(), 1); monthCursor <= end; monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)) {
                const year = monthCursor.getFullYear();
                const month = monthCursor.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const firstSundayOffset = (7 - firstDay.getDay()) % 7;
                const sundays: Date[] = [];
                for (let day = 1 + firstSundayOffset; day <= lastDay.getDate(); day += 7) {
                    const sunday = new Date(year, month, day);
                    if (sunday >= start && sunday <= end) sundays.push(sunday);
                }
                if (!sundays.length) continue;

                for (let cityIndex = 0; cityIndex < cities.length; cityIndex += 1) {
                    const city = cities[cityIndex] === 'أونلاين' ? 'Online' : cities[cityIndex];
                    const date = sundays[cityIndex % sundays.length];
                    const dateKey = date.toISOString().slice(0, 10);
                    const exists = schedules.some(schedule =>
                        schedule.courseId === course.id &&
                        schedule.startDate.toISOString().slice(0, 10) === dateKey &&
                        (schedule.city === 'أونلاين' ? 'Online' : schedule.city) === city
                    );
                    if (exists) continue;

                    const online = city === 'Online';
                    created.push(await this.create({
                        courseId: course.id,
                        courseTitle: course.title,
                        title: course.title,
                        description: course.shortDescription ?? course.description,
                        startDate: date,
                        endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2),
                        startTime: '09:00',
                        endTime: online ? '12:00' : '14:00',
                        city,
                        location: undefined,
                        onlineMeetingLink: undefined,
                        maxParticipants: 20,
                        currentParticipants: 0,
                        waitlistMax: 10,
                        currentWaitlist: 0,
                        price: schedulePrice(city),
                        currency: 'SAR',
                        instructorName: course.trainer?.name,
                        status: 'available',
                        published: true,
                        allowWaitlist: true,
                        requireConfirmation: false,
                        recurrence: 'once',
                        sessions: [],
                    }));
                }
            }
        }
        return created;
    }
}
export const scheduleRepository = new ScheduleRepository();

