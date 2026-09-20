'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type {
  Course,
  CourseSchedule,
} from '@/types/course';
import type {
  Trainee,
  CourseEnrollment,
} from '@/types/trainee';

function formatDate(value: Date | string | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDateRange(
  start?: Date | string,
  end?: Date | string,
) {
  if (!start) return '-';

  if (!end) return formatDate(start);

  return `${formatDate(start)} → ${formatDate(end)}`;
}

function getAttendanceWindowState(
  dayDate: Date | string | undefined,
  schedule: CourseSchedule | null,
  currentTime: Date,
): 'open' | 'upcoming' | 'closed' {
  if (!dayDate) return 'closed';

  const trainingDate = new Date(dayDate);

  const sameCalendarDay =
    currentTime.getFullYear() === trainingDate.getFullYear() &&
    currentTime.getMonth() === trainingDate.getMonth() &&
    currentTime.getDate() === trainingDate.getDate();

  if (!sameCalendarDay) {
    return currentTime < trainingDate
      ? 'upcoming'
      : 'closed';
  }

  const startTime = schedule?.startTime?.trim();
  const endTime = schedule?.endTime?.trim();

  if (!startTime || !endTime) {
    return 'open';
  }

  const [startHour, startMinute] = startTime
    .split(':')
    .map(Number);

  const [endHour, endMinute] = endTime
    .split(':')
    .map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return 'open';
  }

  const windowStart = new Date(currentTime);

  windowStart.setHours(
    startHour,
    startMinute,
    0,
    0,
  );

  const windowEnd = new Date(currentTime);

  windowEnd.setHours(
    endHour,
    endMinute,
    59,
    999,
  );

  if (
    windowEnd.getTime() <
    windowStart.getTime()
  ) {
    windowEnd.setDate(
      windowEnd.getDate() + 1,
    );
  }

  if (currentTime < windowStart) {
    return 'upcoming';
  }

  if (currentTime > windowEnd) {
    return 'closed';
  }

  return 'open';
}

async function openTrainingMaterial(
  url: string,
) {
  try {
    if (
      url.startsWith(
        'data:application/pdf',
      )
    ) {
      const response = await fetch(url);

      const blob = await response.blob();

      const objectUrl =
        URL.createObjectURL(blob);

      const opened = window.open(
        objectUrl,
        '_blank',
        'noopener,noreferrer',
      );

      if (!opened) {
        const link =
          document.createElement('a');

        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        document.body.appendChild(link);

        link.click();

        link.remove();
      }

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            objectUrl,
          ),
        60_000,
      );

      return;
    }

    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  } catch (error) {
    console.error(
      'Failed to open training material:',
      error,
    );

    alert(
      'تعذر فتح ملف المادة التدريبية. حاول مرة أخرى.',
    );
  }
}

function getTraineeIdFromCookie() {
  if (
    typeof document ===
    'undefined'
  ) {
    return '';
  }

  const cookie =
    document.cookie
      .split('; ')
      .find(
        (item) =>
          item.startsWith(
            'impact_sql_trainee=',
          ),
      );

  if (!cookie) {
    return '';
  }

  return decodeURIComponent(
    cookie
      .split('=')
      .slice(1)
      .join('='),
  );
}

function normalizeCourse(
  value: any,
): Course {
  return {
    ...value,
    price:
      typeof value.price === 'number'
        ? value.price
        : Number(value.price ?? 0),
    oldPrice:
      value.oldPrice === null ||
      value.oldPrice === undefined
        ? undefined
        : Number(value.oldPrice),
    discount:
      value.discount === null ||
      value.discount === undefined
        ? undefined
        : Number(value.discount),
    hours:
      value.hours === null ||
      value.hours === undefined
        ? undefined
        : Number(value.hours),
    createdAt: value.createdAt
      ? new Date(value.createdAt)
      : new Date(),
    updatedAt: value.updatedAt
      ? new Date(value.updatedAt)
      : new Date(),
    lessons:
      value.lessons ?? [],
    assessments:
      value.assessments ?? [],
  } as Course;
}

function normalizeEnrollment(
  value: any,
): CourseEnrollment {
  return {
    ...value,
    enrolledAt: value.enrolledAt
      ? new Date(value.enrolledAt)
      : new Date(),
    completedAt:
      value.completedAt
        ? new Date(value.completedAt)
        : undefined,
    lastAccessedAt:
      value.lastAccessedAt
        ? new Date(value.lastAccessedAt)
        : undefined,
    preAssessmentCompletedAt:
      value.preAssessmentCompletedAt
        ? new Date(
            value.preAssessmentCompletedAt,
          )
        : undefined,
    postAssessmentCompletedAt:
      value.postAssessmentCompletedAt
        ? new Date(
            value.postAssessmentCompletedAt,
          )
        : undefined,
    courseEvaluationCompletedAt:
      value.courseEvaluationCompletedAt
        ? new Date(
            value.courseEvaluationCompletedAt,
          )
        : undefined,
    attendanceDays: (
      value.attendanceDays ?? []
    ).map((day: any) => ({
      ...day,
      date: day.date
        ? new Date(day.date)
        : new Date(),
      markedAt:
        day.markedAt
          ? new Date(day.markedAt)
          : undefined,
    })),
    progressRecords:
      value.progressRecords ?? [],
  } as CourseEnrollment;
}

function normalizeSchedule(
  value: any,
): CourseSchedule | null {
  if (!value) {
    return null;
  }

  return {
    ...value,
    startDate: value.startDate
      ? new Date(value.startDate)
      : new Date(),
    endDate: value.endDate
      ? new Date(value.endDate)
      : new Date(),
    price:
      value.price === null ||
      value.price === undefined
        ? undefined
        : Number(value.price),
    createdAt: value.createdAt
      ? new Date(value.createdAt)
      : new Date(),
    updatedAt: value.updatedAt
      ? new Date(value.updatedAt)
      : new Date(),
    sessions: (
      value.sessions ?? []
    ).map((session: any) => ({
      ...session,
      date: session.date
        ? new Date(session.date)
        : new Date(),
    })),
  } as CourseSchedule;
}

type AssessmentAccess = {
  type: 'pre' | 'post' | 'evaluation';
  exists: boolean;
  available: boolean;
  completed: boolean;
  reason: string | null;
};

function AssessmentCard({ type, access, courseId, enrollmentId }: {
  type: AssessmentAccess['type']; access: AssessmentAccess; courseId: string; enrollmentId: string;
}) {
  const meta = {
    pre: { title: 'التقييم القبلي', action: 'ابدأ التقييم القبلي', icon: '✓' },
    post: { title: 'التقييم البعدي', action: 'ابدأ التقييم البعدي', icon: '✓' },
    evaluation: { title: 'تقييم الدورة', action: 'شاركنا تقييمك للدورة', icon: '★' },
  }[type];
  const className = `group rounded-2xl border p-5 text-right transition ${access.available ? 'hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm' : 'cursor-not-allowed opacity-60'}`;
  const content = <>
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg text-[#062b67]">{meta.icon}</div>
    <h3 className="mt-4 font-bold text-[#062b67]">{meta.title}</h3>
    <p className="mt-2 text-sm text-gray-500">{access.completed ? 'تم إكمال هذا التقييم.' : access.available ? meta.action : access.reason || 'التقييم غير متاح حاليًا.'}</p>
  </>;
  return access.available ? (
    <Link href={`/assessment?courseId=${encodeURIComponent(courseId)}&enrollmentId=${encodeURIComponent(enrollmentId)}&type=${type}`} className={className}>{content}</Link>
  ) : <div className={className} aria-disabled="true">{content}</div>;
}

function CourseLearningContent() {
  const searchParams =
    useSearchParams();

  const id =
    searchParams.get('id') || '';

  const [
    course,
    setCourse,
  ] = useState<Course | null>(null);

  const [
    schedule,
    setSchedule,
  ] = useState<CourseSchedule | null>(
    null,
  );

  const [
    user,
    setUser,
  ] = useState<Trainee | null>(null);

  const [
    enrollment,
    setEnrollment,
  ] =
    useState<CourseEnrollment | null>(
      null,
    );

  const [
    certificate,
    setCertificate,
  ] = useState<any>(null);

  const [assessmentAccess, setAssessmentAccess] = useState<AssessmentAccess[]>([]);

  const groupMeetingLink =
    (enrollment as CourseEnrollment & {
      group?: { meetingLink?: string; corporateDelivery?: string | null };
    } | null)?.group?.meetingLink;

  const isGroupOnline =
    (enrollment as CourseEnrollment & {
      group?: { meetingLink?: string; corporateDelivery?: string | null };
    } | null)?.group?.corporateDelivery === 'أونلاين';

  const [
    groupMaterialUrl,
    setGroupMaterialUrl,
  ] = useState<string | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    attendanceSaving,
    setAttendanceSaving,
  ] = useState<number | null>(
    null,
  );

  const [
    currentTime,
    setCurrentTime,
  ] = useState(
    () => new Date(),
  );

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setCurrentTime(
          new Date(),
        );
      }, 30_000);

    return () =>
      window.clearInterval(
        timer,
      );
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        if (!id) {
          setLoading(false);
          return;
        }

        const traineeId =
          getTraineeIdFromCookie();

        if (!traineeId) {
          setLoading(false);
          return;
        }

        const response =
          await fetch(
            `/api/course-learning?courseId=${encodeURIComponent(
              id,
            )}`,
            {
              method: 'GET',
              headers: {
                'x-trainee-id':
                  traineeId,
              },
              cache: 'no-store',
            },
          );

        const result =
          await response
            .json()
            .catch(
              () => null,
            );

        if (!response.ok) {
          throw new Error(
            result?.error ||
              'تعذر تحميل بيانات الدورة.',
          );
        }

        if (!active) {
          return;
        }

        const currentCourse =
          result?.course
            ? normalizeCourse(
                result.course,
              )
            : null;

        const currentEnrollment =
          result?.enrollment
            ? normalizeEnrollment(
                result.enrollment,
              )
            : null;

        const currentSchedule =
          normalizeSchedule(
            result?.schedule,
          );

        const currentUser =
          result?.trainee
            ? ({
                id: result.trainee.id,
                profile: {
                  firstName:
                    result.trainee
                      .firstName ??
                    '',
                  lastName:
                    result.trainee
                      .lastName ??
                    '',
                  firstNameEnglish:
                    result.trainee
                      .firstNameEnglish ??
                    undefined,
                  lastNameEnglish:
                    result.trainee
                      .lastNameEnglish ??
                    undefined,
                },
                contact: {
                  email:
                    result.trainee
                      .email ??
                    '',
                  phone:
                    result.trainee
                      .phone ??
                    undefined,
                },
                email:
                  result.trainee
                    .email ??
                  '',
                status:
                  result.trainee
                    .status ??
                  'active',
                emailVerified:
                  Boolean(
                    result.trainee
                      .emailVerified,
                  ),
                createdAt:
                  new Date(),
                updatedAt:
                  new Date(),
                enrollments: [],
                progress: [],
                certificates: [],
              } as unknown as Trainee)
            : null;

        setCourse(
          currentCourse,
        );

        setEnrollment(
          currentEnrollment,
        );

        setSchedule(
          currentSchedule,
        );

        setUser(
          currentUser,
        );

       setCertificate(
  result?.certificate ?? null,
);

        setAssessmentAccess(Array.isArray(result?.assessmentAccess) ? result.assessmentAccess : []);

        setGroupMaterialUrl(
          result?.group
            ?.materialUrl ??
            null,
        );
      } catch (error) {
        console.error(
          'Failed to load course learning page:',
          error,
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  const assessments =
    useMemo(
      () =>
        course?.assessments ??
        [],
      [course],
    );

  const accessFor = (type: AssessmentAccess['type']) =>
    assessmentAccess.find((item) => item.type === type) ?? {
      type,
      exists: false,
      available: false,
      completed: false,
      reason: 'تعذر التحقق من إتاحة التقييم.',
    };

  const isCompleted =
    enrollment?.status ===
    'completed';

  const isRecordedCourse =
    course?.type ===
    'recorded';

  const progress = Math.max(
    0,
    Math.min(
      100,
      Number(
        enrollment?.progress ??
          0,
      ),
    ),
  );

    const recordedLessons =
    isRecordedCourse
      ? course.lessons ?? []
      : [];

  const completedLessonIds =
    new Set(
      ((enrollment as any)?.progressRecords ?? [])
        .filter(
          (record: any) =>
            record.completed,
        )
        .map(
          (record: any) =>
            record.lessonId,
        ),
    );

  async function markLessonCompleted(
    lessonId: string,
  ) {
    if (!enrollment) {
      return;
    }

    try {
      const response =
        await fetch(
          '/api/course-progress',
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              enrollmentId:
                enrollment.id,
              lessonId,
              completed: true,
            }),
          },
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'تعذر حفظ تقدم الدرس.',
        );
      }

      if (result?.enrollment) {
        setEnrollment(
          normalizeEnrollment(
            {
              ...result.enrollment,
              progressRecords:
                [
                  ...((enrollment as any).progressRecords ??
  []),
                  result.progress,
                ],
            },
          ),
        );
      } else {
        await reloadEnrollment();
      }
    } catch (error) {
      console.error(
        'Failed to complete lesson:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'تعذر حفظ تقدم الدرس.',
      );
    }
  }

  const attendanceDays =
    enrollment?.attendanceDays ??
    [];

  const effectiveMaterialUrl =
    groupMaterialUrl ||
    course?.materialUrl ||
    '';

  async function reloadEnrollment() {
    if (!id) return;

    const traineeId =
      getTraineeIdFromCookie();

    if (!traineeId) return;

    const response =
      await fetch(
        `/api/course-learning?courseId=${encodeURIComponent(
          id,
        )}`,
        {
          method: 'GET',
          headers: {
            'x-trainee-id':
              traineeId,
          },
          cache: 'no-store',
        },
      );

    if (!response.ok) {
      return;
    }

    const result =
      await response
        .json()
        .catch(
          () => null,
        );

    if (result?.enrollment) {
      setEnrollment(
        normalizeEnrollment(
          result.enrollment,
        ),
      );
    }
  }

  async function markAttendance(
    index: number,
    nextStatus:
      | 'present'
      | 'absent',
  ) {
    if (
      !enrollment ||
      !user
    ) {
      return;
    }

    const day =
      attendanceDays[index];

    const windowState =
      getAttendanceWindowState(
        day?.date,
        schedule,
        currentTime,
      );

    if (
      windowState !== 'open'
    ) {
      alert(
        windowState ===
          'upcoming'
          ? 'التحضير يفتح في وقت الدورة.'
          : 'انتهى وقت التحضير.',
      );

      return;
    }

    try {
      setAttendanceSaving(
        index,
      );

      const response =
        await fetch(
          '/api/course-learning',
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              enrollmentId:
                enrollment.id,
              dayIndex: index,
              status:
                nextStatus,
            }),
          },
        );

      const result =
        await response
          .json()
          .catch(
            () => null,
          );

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'تعذر حفظ الحضور.',
        );
      }

      if (
        result?.enrollment
      ) {
        setEnrollment(
          normalizeEnrollment(
            result.enrollment,
          ),
        );
      } else {
        await reloadEnrollment();
      }
    } catch (error) {
      console.error(
        'Failed to update attendance:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'تعذر حفظ الحضور. حاول مرة أخرى.',
      );
    } finally {
      setAttendanceSaving(
        null,
      );
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-6xl px-6 py-12"
      >
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          جاري تحميل تفاصيل الدورة...
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-6xl px-6 py-12"
      >
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#062b67]">
            الدورة غير موجودة
          </h1>

          <Link
            href="/account"
            className="mt-6 inline-flex rounded-lg bg-[#062b67] px-5 py-3 text-sm font-semibold text-white"
          >
            العودة إلى حسابي
          </Link>
        </div>
      </main>
    );
  }

  if (
    !user ||
    !enrollment
  ) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-6xl px-6 py-12"
      >
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#062b67]">
            الدورة غير متاحة
          </h1>

          <p className="mt-3 text-gray-600">
            يجب أن يكون لديك تسجيل فعال في هذه الدورة للوصول إلى تفاصيلها.
          </p>

          <Link
            href={`/course-details?id=${encodeURIComponent(
              course.id,
            )}`}
            className="mt-6 inline-flex rounded-lg bg-[#062b67] px-5 py-3 text-sm font-semibold text-white"
          >
            العودة إلى تفاصيل الدورة
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50"
    >
      <div className="container mx-auto max-w-6xl px-6 py-8">

        {/* العودة */}
        <div className="mb-6">
          <Link
            href="/account"
            className="text-sm font-medium text-gray-500 hover:text-[#062b67]"
          >
            ← العودة إلى حسابي
          </Link>
        </div>

        {/* رأس الدورة */}
        <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="bg-[#062b67] px-6 py-8 text-white md:px-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-3 text-sm text-blue-100">
                  التعلم والتدريب
                </div>

                <h1
                  className="text-3xl font-bold md:text-4xl"
                  style={{
                    color: '#ffffff',
                  }}
                >
                  {course.title}
                </h1>

                <p className="mt-4 max-w-3xl leading-7 text-blue-50">
                  {course.shortDescription ||
                    course.description ||
                    'البرنامج التدريبي الخاص بك.'}
                </p>
              </div>

              <div className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm">
                {isCompleted
                  ? 'مكتملة'
                  : 'نشطة'}
              </div>
            </div>
          </div>

          {/* تفاصيل الدورة */}
          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4 md:p-8">

            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500">
                تاريخ الدورة
              </div>

              <div className="mt-2 font-semibold text-[#062b67]">
                {formatDateRange(
                  schedule?.startDate,
                  schedule?.endDate,
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500">
                مكان الانعقاد
              </div>

              <div className="mt-2 font-semibold text-[#062b67]">
                {schedule?.city ||
                  (schedule?.onlineMeetingLink
                    ? 'Online'
                    : 'غير محدد')}
              </div>

              {schedule?.location && (
                <div className="mt-1 text-sm text-gray-500">
                  {schedule.location}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500">
                مدة البرنامج
              </div>

              <div className="mt-2 font-semibold text-[#062b67]">
                {course.days ?? 3} أيام
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500">
                نوع التدريب
              </div>

              <div className="mt-2 font-semibold text-[#062b67]">
                {(course.delivery === 'online' || isGroupOnline)
                  ? 'أونلاين مباشر'
                  : course.delivery === 'hybrid'
                    ? 'هجين'
                    : 'حضوري'}
              </div>
            </div>

          </div>
        </section>

        {/* نبذة وأهداف */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">

          <div className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-[#062b67]">
              نبذة عن الدورة
            </h2>

            <p className="mt-4 leading-8 text-gray-600">
              {course.description ||
                course.shortDescription ||
                'لا توجد نبذة مضافة لهذه الدورة.'}
            </p>

            {course.objectives?.length >
              0 && (
              <>
                <h3 className="mt-8 text-lg font-bold text-[#062b67]">
                  أهداف الدورة
                </h3>

                <ul className="mt-4 space-y-3">
                  {course.objectives.map(
                    (
                      objective,
                      index,
                    ) => (
                      <li
                        key={`${objective}-${index}`}
                        className="flex gap-3 text-gray-600"
                      >
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#062b67]">
                          ✓
                        </span>

                        <span>
                          {objective}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </>
            )}
          </div>

          {/* التقدم — يظهر للدورات المسجلة */}
          {isRecordedCourse && (
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#062b67]">
                تقدمك في الدورة
              </h2>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-500">
                    نسبة الإنجاز
                  </span>

                  <span className="font-bold text-[#062b67]">
                    {Math.round(
                      progress,
                    )}
                    %
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#062b67] transition-all"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                {isCompleted
                  ? 'تم إكمال الدورة بنجاح.'
                  : 'أكمل متطلبات الدورة للحصول على الشهادة.'}
              </div>
            </div>
          )}
        </section>

        {/* أزرار الدورة */}
        <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#062b67]">
              متطلبات الدورة
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              يمكنك الدخول إلى كل متطلب من خلال الأزرار التالية.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            {(course.delivery === 'online' || isGroupOnline) &&
              (schedule?.onlineMeetingLink || groupMeetingLink || course.meetingLink) && (
                <a
                  href={
                    schedule?.onlineMeetingLink ||
                    groupMeetingLink ||
                    course.meetingLink ||
                    undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-[#062b67] bg-blue-50 p-5 text-right transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg text-[#062b67]">
                    ↗
                  </div>
                  <h3 className="mt-4 font-bold text-[#062b67]">
                    رابط حضور الدورة
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    الدخول إلى جلسة الدورة الأونلاين.
                  </p>
                </a>
              )}

            {/* المادة التدريبية */}
            <button
              type="button"
              onClick={() => {
                if (
                  !effectiveMaterialUrl
                ) {
                  alert(
                    'لم تتم إضافة المادة التدريبية لهذه الدورة بعد.',
                  );
                  return;
                }

                void openTrainingMaterial(
                  effectiveMaterialUrl,
                );
              }}
              className={`group rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm ${
                effectiveMaterialUrl
                  ? ''
                  : 'opacity-60'
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg text-[#062b67]">
                PDF
              </div>

              <h3 className="mt-4 font-bold text-[#062b67]">
                المادة التدريبية
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {effectiveMaterialUrl
                  ? 'فتح أو تنزيل ملف المادة التدريبية PDF'
                  : 'لم تتم إضافة المادة بعد'}
              </p>
            </button>

            <AssessmentCard
              type="pre"
              access={accessFor('pre')}
              courseId={course.id}
              enrollmentId={enrollment.id ?? ''}
            />

            <AssessmentCard
              type="post"
              access={accessFor('post')}
              courseId={course.id}
              enrollmentId={enrollment.id ?? ''}
            />

            <AssessmentCard
              type="evaluation"
              access={accessFor('evaluation')}
              courseId={course.id}
              enrollmentId={enrollment.id ?? ''}
            />

            {/* الشهادة */}
            {certificate && (
              <Link
                href={`/certificate?courseId=${encodeURIComponent(
                  course.id,
                )}`}
                className="group rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-lg">
                  🏆
                </div>

                <h3 className="mt-4 font-bold text-[#062b67]">
                  الشهادة
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  عرض وطباعة شهادة إتمام الدورة
                </p>
              </Link>
            )}

          </div>
        </section>
        {/* دروس الدورة المسجلة */}
        {isRecordedCourse &&
          recordedLessons.length > 0 && (
            <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#062b67]">
                  دروس الدورة
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  شاهد الدروس بالترتيب وسجّل إكمال كل درس لحفظ تقدمك.
                </p>
              </div>

              <div className="space-y-4">
                {recordedLessons
                  .slice()
                  .sort(
                    (a, b) =>
                      a.order - b.order,
                  )
                  .map(
                    (lesson, index) => {
                      const completed =
                        completedLessonIds.has(
                          lesson.id,
                        );

                      return (
                        <div
                          key={lesson.id}
                          className="rounded-2xl border bg-gray-50 p-5"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="text-sm text-gray-500">
                                الدرس{' '}
                                {index + 1}
                              </div>

                              <h3 className="mt-1 font-bold text-[#062b67]">
                                {lesson.title}
                              </h3>

                              {lesson.description && (
                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                  {
                                    lesson.description
                                  }
                                </p>
                              )}

                              {lesson.videoDuration &&
                                lesson.videoDuration >
                                  0 && (
                                  <div className="mt-2 text-xs text-gray-400">
                                    المدة:{' '}
                                    {Math.ceil(
                                      lesson.videoDuration /
                                        60,
                                    )}{' '}
                                    دقيقة
                                  </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {lesson.videoId && (
                                <a
                                  href={
                                    lesson.videoId
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-xl bg-[#062b67] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                                >
                                  مشاهدة الفيديو
                                </a>
                              )}

                              {completed ? (
                                <span className="rounded-xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
                                  ✓ مكتمل
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void markLessonCompleted(
                                      lesson.id,
                                    )
                                  }
                                  className="rounded-xl border border-[#062b67] bg-white px-4 py-2 text-sm font-bold text-[#062b67] hover:bg-blue-50"
                                >
                                  تم إكمال الدرس
                                </button>
                              )}
                            </div>
                          </div>

                          {lesson.type ===
                            'quiz' &&
                            lesson.questions &&
                            lesson.questions.length >
                              0 && (
                              <div className="mt-4 rounded-xl bg-white p-4 text-sm text-gray-600">
                                يوجد اختبار تفاعلي
                                لهذا الدرس بعدد{' '}
                                {
                                  lesson
                                    .questions
                                    .length
                                }{' '}
                                أسئلة.
                              </div>
                            )}
                        </div>
                      );
                    },
                  )}
              </div>
            </section>
          )}

        {/* الحضور */}
        {!isRecordedCourse && (
          <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm md:p-8">

            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#062b67]">
                  الحضور اليومي
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  يتم تسجيل حضورك لكل يوم من أيام البرنامج بشكل مستقل.
                </p>
              </div>

              <span className="rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-600">
                {
                  attendanceDays.filter(
                    (day) =>
                      day.status ===
                      'present',
                  ).length
                }{' '}
                / {course.days ?? 3} أيام حضور
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({
                length:
                  course.days ?? 3,
              }).map(
                (_, index) => {
                  const day =
                    attendanceDays[
                      index
                    ];

                  const status =
                    day?.status ??
                    'not-marked';

                  const statusLabel =
                    status ===
                    'present'
                      ? 'حاضر'
                      : status ===
                          'absent'
                        ? 'غائب'
                        : 'لم يتم التسجيل';

                  const windowState =
                    getAttendanceWindowState(
                      day?.date,
                      schedule,
                      currentTime,
                    );

                  const canMarkAttendance =
                    windowState ===
                    'open';

                  const windowLabel =
                    windowState ===
                    'open'
                      ? 'التحضير متاح الآن'
                      : windowState ===
                          'upcoming'
                        ? 'التحضير يفتح في وقت الدورة'
                        : 'انتهى وقت التحضير';

                  return (
                    <div
                      key={index}
                      className="rounded-2xl border bg-gray-50 p-5"
                    >
                      <div className="text-sm text-gray-500">
                        اليوم{' '}
                        {index + 1}
                      </div>

                      <div className="mt-2 font-bold text-[#062b67]">
                        {day
                          ? formatDate(
                              day.date,
                            )
                          : 'غير محدد'}
                      </div>

                      <div
                        className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          status ===
                          'present'
                            ? 'bg-green-50 text-green-700'
                            : status ===
                                'absent'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {statusLabel}
                      </div>

                      <div
                        className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                          windowState ===
                          'open'
                            ? 'bg-blue-50 text-[#062b67]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {windowLabel}

                        {schedule?.startTime &&
                          schedule?.endTime && (
                            <span className="mr-1">
                              (
                              {
                                schedule.startTime
                              }{' '}
                              -{' '}
                              {
                                schedule.endTime
                              }
                              )
                            </span>
                          )}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          disabled={
                            attendanceSaving ===
                              index ||
                            !canMarkAttendance
                          }
                          onClick={() =>
                            void markAttendance(
                              index,
                              'present',
                            )
                          }
                          className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                            status ===
                            'present'
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-green-200 bg-white text-green-700 hover:bg-green-50'
                          }`}
                        >
                          حاضر
                        </button>

                        <button
                          type="button"
                          disabled={
                            attendanceSaving ===
                              index ||
                            !canMarkAttendance
                          }
                          onClick={() =>
                            void markAttendance(
                              index,
                              'absent',
                            )
                          }
                          className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                            status ===
                            'absent'
                              ? 'border-red-600 bg-red-600 text-white'
                              : 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                          }`}
                        >
                          غائب
                        </button>

                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
export default function CourseLearningPage() {
  return (
    <Suspense
      fallback={
        <main
          dir="rtl"
          className="min-h-screen flex items-center justify-center"
        >
          جاري تحميل الدورة...
        </main>
      }
    >
      <CourseLearningContent />
    </Suspense>
  );
}