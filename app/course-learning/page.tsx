'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import { groupRepository } from '@/lib/data/repositories/group-repository';
import type { Course, CourseAssessment, CourseSchedule } from '@/types/course';
import type { Trainee, CourseEnrollment } from '@/types/trainee';

function formatDate(value: Date | string | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDateRange(start?: Date | string, end?: Date | string) {
  if (!start) return '-';

  if (!end) return formatDate(start);

  return `${formatDate(start)} → ${formatDate(end)}`;
}

function getAssessment(
  assessments: CourseAssessment[] | undefined,
  type: 'pre' | 'post' | 'evaluation',
) {
  return assessments?.find(
    (assessment) => assessment.assessmentType === type,
  );
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
    return currentTime < trainingDate ? 'upcoming' : 'closed';
  }

  const startTime = schedule?.startTime?.trim();
  const endTime = schedule?.endTime?.trim();

  if (!startTime || !endTime) {
    return 'open';
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return 'open';
  }

  const windowStart = new Date(currentTime);
  windowStart.setHours(startHour, startMinute, 0, 0);

  const windowEnd = new Date(currentTime);
  windowEnd.setHours(endHour, endMinute, 59, 999);

  if (windowEnd.getTime() < windowStart.getTime()) {
    windowEnd.setDate(windowEnd.getDate() + 1);
  }

  if (currentTime < windowStart) return 'upcoming';
  if (currentTime > windowEnd) return 'closed';
  return 'open';
}

async function openTrainingMaterial(url: string) {
  try {
    if (url.startsWith('data:application/pdf')) {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');

      if (!opened) {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Failed to open training material:', error);
    alert('تعذر فتح ملف المادة التدريبية. حاول مرة أخرى.');
  }
}

export default function CourseLearningPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const [course, setCourse] = useState<Course | null>(null);
  const [schedule, setSchedule] = useState<CourseSchedule | null>(null);
  const [user, setUser] = useState<Trainee | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [groupMaterialUrl, setGroupMaterialUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceSaving, setAttendanceSaving] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [currentCourse, currentUser] = await Promise.all([
          courseRepository.findById(id),
          traineeRepository.getCurrentUser(),
        ]);

        if (!active) return;

        setCourse(currentCourse);

        if (!currentCourse || !currentUser) {
          setUser(currentUser);
          setLoading(false);
          return;
        }

        const certificates = await traineeRepository.getCertificates(
          currentUser.id,
        );
        const currentCertificate =
          certificates.find(
            (item) => item.courseId === currentCourse.id,
          ) ?? null;

        setCertificate(currentCertificate);
        setUser({
          ...currentUser,
          certificates,
        });

        const currentEnrollment =
          currentUser.enrollments.find(
            (item) => item.courseId === currentCourse.id,
          ) ?? null;

        let currentGroup: any = null;

        if (currentEnrollment?.groupId) {
          currentGroup = await groupRepository.findById(
            currentEnrollment.groupId,
          );
        }

        // بعض التسجيلات القديمة قد لا تحتوي على groupId،
        // لذلك نبحث أيضًا عن المجموعة التي تضم المتدرب ضمن traineeIds.
        if (!currentGroup) {
          const courseGroups = await groupRepository.findAll({
            filter: { courseId: currentCourse.id },
          });

          currentGroup =
            courseGroups.find((group) =>
              group.traineeIds?.includes(currentUser.id),
            ) ?? null;
        }

        if (active) {
          setGroupMaterialUrl(currentGroup?.materialUrl ?? null);
        }

        if (currentEnrollment) {
          try {
            const ensuredEnrollment = await traineeRepository.ensureAttendanceDays(
              currentUser.id,
              currentEnrollment.id ?? currentEnrollment.courseId,
            );
            setEnrollment({ ...ensuredEnrollment });
          } catch {
            setEnrollment(currentEnrollment);
          }
        } else {
          setEnrollment(null);
        }

        if (currentEnrollment?.scheduleId) {
          const currentSchedule = await scheduleRepository.findById(
            currentEnrollment.scheduleId,
          );

          if (active) {
            setSchedule(currentSchedule as CourseSchedule | null);
          }
        } else {
          const schedules = await scheduleRepository.findByCourseId(
            currentCourse.id,
          );

          if (active) {
            const matchingSchedule =
              schedules.find(
                (item) =>
                  currentEnrollment?.scheduleId &&
                  item.id === currentEnrollment.scheduleId,
              ) ?? schedules[0] ?? null;

            setSchedule(matchingSchedule as CourseSchedule | null);
          }
        }
      } catch (error) {
        console.error('Failed to load course learning page:', error);
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

  const assessments = useMemo(
    () => course?.assessments ?? [],
    [course],
  );

  const preAssessment = getAssessment(assessments, 'pre');
  const postAssessment = getAssessment(assessments, 'post');
  const evaluation = getAssessment(assessments, 'evaluation');

  const isCompleted = enrollment?.status === 'completed';
  const isRecordedCourse = course?.type === 'recorded';
  const progress = Math.max(
    0,
    Math.min(100, Number(enrollment?.progress ?? 0)),
  );

  const attendanceDays = enrollment?.attendanceDays ?? [];
  const effectiveMaterialUrl = groupMaterialUrl || course?.materialUrl || '';

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

  if (!user || !enrollment) {
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
            href={`/course-details?id=${encodeURIComponent(course.id)}`}
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
  style={{ color: '#ffffff' }}
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
                {isCompleted ? 'مكتملة' : 'نشطة'}
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
                  (schedule?.onlineMeetingLink ? 'Online' : 'غير محدد')}
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
                {course.delivery === 'online' ? 'أونلاين مباشر' : 'حضوري'}
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

            {course.objectives?.length > 0 && (
              <>
                <h3 className="mt-8 text-lg font-bold text-[#062b67]">
                  أهداف الدورة
                </h3>

                <ul className="mt-4 space-y-3">
                  {course.objectives.map((objective, index) => (
                    <li
                      key={`${objective}-${index}`}
                      className="flex gap-3 text-gray-600"
                    >
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#062b67]">
                        ✓
                      </span>

                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* التقدم — يظهر فقط للدورات المسجلة */}
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
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#062b67] transition-all"
                    style={{ width: `${progress}%` }}
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

            {/* المادة التدريبية */}
            <button
              type="button"
              onClick={() => {
                if (!effectiveMaterialUrl) {
                  alert('لم تتم إضافة المادة التدريبية لهذه الدورة بعد.');
                  return;
                }

                void openTrainingMaterial(effectiveMaterialUrl);
              }}
              className={`group rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm ${
                effectiveMaterialUrl ? '' : 'opacity-60'
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

            {/* التقييم القبلي */}
            <Link
              href={`/assessment?courseId=${encodeURIComponent(course.id)}&type=pre`}
              className={`group rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm ${
                preAssessment
                  ? ''
                  : 'opacity-60'
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg text-[#062b67]">
                
              </div>

              <h3 className="mt-4 font-bold text-[#062b67]">
                التقييم القبلي
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {preAssessment
                  ? 'ابدأ التقييم القبلي'
                  : 'لم تتم إضافة التقييم بعد'}
              </p>
            </Link>

            {/* التقييم البعدي */}
            <Link
              href={`/assessment?courseId=${encodeURIComponent(course.id)}&type=post`}
              className={`group rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm ${
                postAssessment && (isRecordedCourse ? isCompleted : true)
                  ? ''
                  : 'opacity-60'
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg text-[#062b67]">
                
              </div>

              <h3 className="mt-4 font-bold text-[#062b67]">
                التقييم البعدي
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {postAssessment
                  ? isRecordedCourse && !isCompleted
                    ? 'يظهر بعد إكمال متطلبات الدورة'
                    : 'ابدأ التقييم البعدي'
                  : 'لم تتم إضافة التقييم بعد'}
              </p>
            </Link>

            {/* تقييم الدورة */}
            <Link
              href={`/assessment?courseId=${encodeURIComponent(course.id)}&type=evaluation`}
              className={`group rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm ${
                evaluation
                  ? ''
                  : 'opacity-60'
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg text-[#062b67]">
                
              </div>

              <h3 className="mt-4 font-bold text-[#062b67]">
                تقييم الدورة
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {evaluation
                  ? 'شاركنا تقييمك للدورة'
                  : 'لم يتم إضافة التقييم بعد'}
              </p>
            </Link>

            {/* الشهادة */}
            {certificate && (
              <Link
                href={`/certificate?courseId=${encodeURIComponent(course.id)}`}
                className="group rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-lg">
                  
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

        {/* موارد الدورة */}
        {(course.delivery === 'online' && (schedule?.onlineMeetingLink || course.meetingLink)) && (
          <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#062b67]">
                موارد الدورة
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                الملفات والروابط الخاصة بتنفيذ الدورة.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {course.delivery === 'online' && (schedule?.onlineMeetingLink || course.meetingLink) && (
                <a
                  href={schedule?.onlineMeetingLink || course.meetingLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border p-5 text-right transition hover:-translate-y-0.5 hover:border-[#062b67] hover:shadow-sm"
                >
                  <h3 className="font-bold text-[#062b67]">
                    رابط حضور الدورة
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    الدخول إلى جلسة الدورة الأونلاين.
                  </p>
                </a>
              )}
            </div>
          </section>
        )}

        {/* الحضور */}
        {!isRecordedCourse && <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm md:p-8">

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
              {attendanceDays.filter(
                (day) => day.status === 'present',
              ).length}{' '}
              / 3 أيام حضور
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((index) => {
              const day = attendanceDays[index];
              const status = day?.status ?? 'not-marked';
              const statusLabel =
                status === 'present'
                  ? 'حاضر'
                  : status === 'absent'
                    ? 'غائب'
                    : 'لم يتم التسجيل';

              const windowState = getAttendanceWindowState(
                day?.date,
                schedule,
                currentTime,
              );
              const canMarkAttendance = windowState === 'open';

              async function markAttendance(nextStatus: 'present' | 'absent') {
                if (!user || !enrollment || !canMarkAttendance) return;
                try {
                  setAttendanceSaving(index);
                  const updated = await traineeRepository.updateAttendanceDayForTrainee(
                    user.id,
                    enrollment.id ?? enrollment.courseId,
                    index,
                    nextStatus,
                  );
                  setEnrollment({ ...updated });
                } catch (error) {
                  console.error('Failed to update attendance:', error);
                  alert(
                    error instanceof Error
                      ? error.message.includes('Attendance is available')
                        ? 'التحضير متاح فقط خلال وقت الدورة المحدد.'
                        : error.message.includes('only available on the training day')
                          ? 'التحضير متاح فقط في يوم التدريب.'
                          : 'تعذر حفظ الحضور. حاول مرة أخرى.'
                      : 'تعذر حفظ الحضور. حاول مرة أخرى.',
                  );
                } finally {
                  setAttendanceSaving(null);
                }
              }

              const windowLabel =
                windowState === 'open'
                  ? 'التحضير متاح الآن'
                  : windowState === 'upcoming'
                    ? 'التحضير يفتح في وقت الدورة'
                    : 'انتهى وقت التحضير';

              return (
                <div key={index} className="rounded-2xl border bg-gray-50 p-5">
                  <div className="text-sm text-gray-500">اليوم {index + 1}</div>
                  <div className="mt-2 font-bold text-[#062b67]">
                    {day ? formatDate(day.date) : 'غير محدد'}
                  </div>
                  <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    status === 'present'
                      ? 'bg-green-50 text-green-700'
                      : status === 'absent'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {statusLabel}
                  </div>
                  <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                    windowState === 'open'
                      ? 'bg-blue-50 text-[#062b67]'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {windowLabel}
                    {schedule?.startTime && schedule?.endTime && (
                      <span className="mr-1">({schedule.startTime} - {schedule.endTime})</span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={attendanceSaving === index || !canMarkAttendance}
                      onClick={() => void markAttendance('present')}
                      className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        status === 'present'
                          ? 'border-green-600 bg-green-600 text-white'
                          : 'border-green-200 bg-white text-green-700 hover:bg-green-50'
                      }`}
                    >
                      حاضر
                    </button>
                    <button
                      type="button"
                      disabled={attendanceSaving === index || !canMarkAttendance}
                      onClick={() => void markAttendance('absent')}
                      className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        status === 'absent'
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                      }`}
                    >
                      غائب
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>}

      </div>
    </main>
  );
}