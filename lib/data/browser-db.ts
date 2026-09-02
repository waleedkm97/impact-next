const DB_NAME = 'impact-training-db';
const STORE_NAME = 'repositories';
const VERSION = 1;
const MIGRATION_MARKER = 'legacy-migration-v1';

type StoredValue<T> = { key: string; value: T };

function canUseIndexedDB() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDB()) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function browserDbGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as StoredValue<T> | undefined)?.value ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

export async function browserDbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ key, value } satisfies StoredValue<T>);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}


function slugifyLegacy(value: string) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '').replace(/-+/g, '-');
}

function legacyDate(value: any) {
  const d = new Date(value ?? new Date().toISOString());
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function normalizeLegacyLesson(raw: any, courseId: string, index: number) {
  const isQuiz = raw?.type === 'quiz' || raw?.type === 'interactive';
  const questions = isQuiz && raw?.question ? [{
    id: `${raw.id ?? `lesson-${index}`}-q1`,
    lessonId: raw.id ?? `lesson-${index}`,
    question: String(raw.question),
    type: 'multiple-choice',
    options: Array.isArray(raw.options) ? raw.options : [],
    correctAnswer: String(raw.correctIndex ?? 0),
    explanation: raw.explanation,
    order: 1,
    points: 1,
  }] : (Array.isArray(raw?.questions) ? raw.questions.map((q:any,j:number)=>({
    id: q.id ?? `${raw.id ?? `lesson-${index}`}-q${j+1}`, lessonId: raw.id ?? `lesson-${index}`,
    question: q.question ?? '', type: q.type ?? 'multiple-choice', options: q.options,
    correctAnswer: q.correctAnswer ?? '0', explanation: q.explanation, order: q.order ?? j+1, points: q.points ?? 1,
  })) : []);
  return {
    id: raw?.id ?? `lesson-${Date.now()}-${index}`, courseId, title: raw?.title ?? `درس ${index+1}`, description: raw?.description ?? '',
    type: isQuiz ? 'quiz' : (raw?.type === 'text' ? 'text' : 'video'), order: Number(raw?.order ?? index+1),
    videoId: raw?.videoId ?? raw?.videoUrl, videoDuration: typeof raw?.videoDuration === 'number' ? raw.videoDuration : undefined,
    questions, afterLessonId: raw?.afterLessonId, createdAt: legacyDate(raw?.createdAt), updatedAt: legacyDate(raw?.updatedAt),
  };
}

function normalizeLegacyCourse(raw: any) {
  const recorded = raw?.type === 'recorded';
  const deliveryRaw = String(raw?.delivery ?? raw?.type ?? '').toLowerCase();
  const delivery = recorded ? 'online' : (deliveryRaw.includes('online') || deliveryRaw.includes('أونلاين') ? 'online' : 'in-person');
  const categoryName = raw?.category ?? '';
  const lessons = Array.isArray(raw?.lessons) ? raw.lessons.map((l:any,i:number)=>normalizeLegacyLesson(l, String(raw?.id ?? `course-${i}`), i)) : [];
  const trainerName = typeof raw?.trainer === 'string' ? raw.trainer : raw?.trainer?.name ?? '';
  const hours = typeof raw?.hours === 'number' ? raw.hours : Number(String(raw?.hours ?? '').match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
  return {
    id: String(raw?.id ?? `course-${Date.now()}-${Math.random().toString(36).slice(2,7)}`),
    title: String(raw?.title ?? ''), slug: raw?.slug ?? slugifyLegacy(raw?.title ?? ''),
    description: raw?.description ?? raw?.fullDescription ?? '', shortDescription: raw?.shortDescription ?? '',
    categoryId: raw?.categoryId ?? (categoryName ? slugifyLegacy(categoryName) : undefined), type: recorded ? 'recorded' : 'training', delivery,
    cities: Array.isArray(raw?.cities) ? raw.cities : [], price: Number(raw?.price ?? 0), oldPrice: raw?.oldPrice == null || raw?.oldPrice === '' ? undefined : Number(raw.oldPrice),
    discount: typeof raw?.discount === 'number' ? raw.discount : undefined, currency: 'SAR', days: Number(raw?.days ?? 0), hours, videosCount: Number(raw?.videosCount ?? lessons.filter((l:any)=>l.type==='video').length),
    objectives: Array.isArray(raw?.objectives) ? raw.objectives : String(raw?.objectives ?? '').split('\n').map((x:string)=>x.trim()).filter(Boolean),
    outcomes: Array.isArray(raw?.outcomes) ? raw.outcomes : [], outline: Array.isArray(raw?.outline) ? raw.outline.join('\n') : raw?.outline ?? '',
    lessons, schedules: [], assessments: Array.isArray(raw?.assessments) ? raw.assessments : [], audience: raw?.audience ?? '', methodology: raw?.methodology ?? '',
    trainer: { id: raw?.trainer?.id ?? `trainer-${String(raw?.id ?? Date.now())}`, name: trainerName }, materialUrl: raw?.materialUrl, meetingLink: raw?.meetingLink,
    image: raw?.image, thumbnail: raw?.thumbnail ?? raw?.image, certificateSettings: { enabled: raw?.hasCertificate !== false, autoGenerate: false, requireCompletion: true, requireAssessmentPass: false },
    materialsEnabled: raw?.materialsEnabled ?? true, preAssessmentEnabled: raw?.preAssessmentEnabled ?? true, postAssessmentEnabled: raw?.postAssessmentEnabled ?? true, courseEvaluationEnabled: raw?.courseEvaluationEnabled ?? true, attendanceEnabled: raw?.attendanceEnabled ?? (delivery !== 'online'),
    featured: Boolean(raw?.featured), published: raw?.published !== false, status: raw?.published === false ? 'draft' : 'published', createdAt: legacyDate(raw?.createdAt), updatedAt: legacyDate(raw?.updatedAt),
  };
}

/**
 * One-time import of data created by the legacy Impact app.
 * After the import, the application uses IndexedDB only.
 */
export async function migrateLegacyData(): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const marker = await browserDbGet<boolean>(MIGRATION_MARKER);
  if (marker) return;

  const readJson = (key: string) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const imports: Record<string, unknown> = {};
  const courses = readJson('impact_courses_v1');
  const recorded = readJson('impact_recorded_courses_v1');
  if (Array.isArray(courses) || Array.isArray(recorded)) {
    imports.courses = [
      ...(Array.isArray(courses) ? courses : []),
      ...(Array.isArray(recorded) ? recorded : []),
    ].map(normalizeLegacyCourse);
  }
  const categories = readJson('impact_categories_v1');
  if (Array.isArray(categories)) imports.categories = categories;

  const schedules = readJson('impact_schedules_v1');
  if (Array.isArray(schedules)) {
    imports.schedules = schedules.map((s: any, index: number) => {
      const start = s.startDate ?? s.date ?? new Date().toISOString();
      const end = s.endDate ?? s.date ?? start;
      const online = String(s.delivery ?? '').toLowerCase().includes('online') || String(s.delivery ?? '').includes('أونلاين');
      return {
        id: s.id ?? `legacy-schedule-${index}`,
        courseId: s.courseId ?? '',
        courseTitle: s.courseTitle ?? s.title ?? '',
        title: s.title ?? s.courseTitle ?? '',
        description: s.description ?? '',
        startDate: new Date(start),
        endDate: new Date(end),
        startTime: s.startTime ?? '09:00',
        endTime: s.endTime ?? (online ? '12:00' : '14:00'),
        city: online ? 'أونلاين' : (s.city ?? 'الرياض'),
        location: online ? undefined : (s.location || undefined),
        onlineMeetingLink: online ? (s.meetingLink || s.onlineMeetingLink || undefined) : undefined,
        maxParticipants: Number(s.maxParticipants ?? s.capacity ?? 20),
        currentParticipants: Number(s.currentParticipants ?? 0),
        waitlistMax: Number(s.waitlistMax ?? 10),
        currentWaitlist: Number(s.currentWaitlist ?? 0),
        price: Number(s.price ?? s.amount ?? 0),
        currency: 'SAR',
        instructorName: s.trainer ?? s.instructorName ?? '',
        status: s.status === 'cancelled' ? 'cancelled' : 'available',
        published: s.published !== false,
        allowWaitlist: true,
        requireConfirmation: false,
        recurrence: 'once',
        sessions: [],
        createdAt: s.createdAt ?? new Date().toISOString(),
        updatedAt: s.updatedAt ?? new Date().toISOString(),
      };
    });
  }

  const orders = readJson('impact_orders_v1');
  if (Array.isArray(orders)) {
    imports.orders = orders.map((o: any, index: number) => {
      const amount = Number(String(o.amount ?? o.total ?? o.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
      const statusMap: Record<string, string> = {
        'مكتمل': 'completed',
        'ملغاة': 'cancelled',
        'ملغي': 'cancelled',
        'قيد المعالجة': 'processing',
      };
      return {
        id: o.id ?? `legacy-order-${index}`,
        orderNumber: o.orderNumber ?? o.id ?? `LEGACY-${index + 1}`,
        customer: {
          traineeId: o.traineeId ?? '',
          name: o.customer ?? o.traineeName ?? 'غير محدد',
          email: o.email ?? o.traineeEmail ?? '',
          phone: o.phone ?? o.traineePhone ?? '',
          company: o.company ?? '',
        },
        items: [{
          id: `legacy-item-${index}`,
          type: o.courseId ? 'course' : 'service',
          itemId: o.courseId ?? o.customProgramId ?? '',
          title: o.courseTitle ?? o.product ?? '',
          quantity: Number(o.quantity ?? o.participants ?? 1),
          unitPrice: amount,
          totalPrice: amount,
        }],
        subtotal: amount, discount: 0, tax: 0, total: amount, currency: 'SAR',
        payment: { method: 'online-payment', status: amount > 0 ? 'paid' : 'pending', amount, currency: 'SAR' },
        status: statusMap[o.status] ?? (['pending','confirmed','processing','completed','cancelled','refunded'].includes(o.status) ? o.status : 'processing'),
        createdAt: o.createdAt ?? o.date ?? new Date().toISOString(),
        updatedAt: o.updatedAt ?? o.date ?? new Date().toISOString(),
        scheduleId: o.scheduleId ?? undefined,
        bookingDate: o.trainingDate ? new Date(o.trainingDate) : undefined,
        notes: o.notes ?? '',
      };
    });
  }

  for (const [key, value] of Object.entries(imports)) {
    const existing = await browserDbGet<any>(key);
    if (Array.isArray(existing) && Array.isArray(value)) {
      const byId = new Map<string, any>();
      for (const item of existing) if (item?.id != null) byId.set(String(item.id), item);
      for (const item of value) {
        if (item?.id == null || !byId.has(String(item.id))) byId.set(String(item?.id ?? `${key}-${byId.size}`), item);
      }
      await browserDbSet(key, Array.from(byId.values()));
    } else if (existing === null && Array.isArray(value)) {
      await browserDbSet(key, value);
    }
  }
  await browserDbSet(MIGRATION_MARKER, true);
}
