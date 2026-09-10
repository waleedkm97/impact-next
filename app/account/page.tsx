'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';

export default function Account() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Record<string, any>>({});
  const [schedules, setSchedules] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    firstNameEnglish: '',
    lastNameEnglish: '',
    phone: '',
    gender: '' as 'male' | 'female' | '',
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const currentUser = await traineeRepository.getCurrentUser();

        if (!active) return;

        if (!currentUser) {
          setLoading(false);
          return;
        }

        const courseEntries = await Promise.all(
          currentUser.enrollments.map(async (enrollment) => {
            const course = await courseRepository.findById(
              enrollment.courseId,
            );

            return [enrollment.courseId, course] as const;
          }),
        );

        const scheduleEntries = await Promise.all(
          currentUser.enrollments
            .filter((enrollment) => Boolean(enrollment.scheduleId))
            .map(async (enrollment) => {
              const schedule = await scheduleRepository.findById(
                enrollment.scheduleId as string,
              );

              return [enrollment.scheduleId as string, schedule] as const;
            }),
        );

        if (!active) return;

        // Refresh certificates before rendering the account page so certificates
        // that are already eligible are available to the trainee as well.
        await traineeRepository.getCertificates(currentUser.id);

        const refreshedUser =
          await traineeRepository.findById(currentUser.id);

        setUser(refreshedUser ?? currentUser);
        setCourses(Object.fromEntries(courseEntries));
        setSchedules(Object.fromEntries(scheduleEntries));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load account:', error);
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await traineeRepository.logout();
    router.push('/login');
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-6xl px-6 py-12"
      >
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          جاري تحميل الحساب...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-6xl px-6 py-12"
      >
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#062b67]">
            حساب المتدرب
          </h1>

          <p className="mt-3 text-gray-600">
            يجب تسجيل الدخول للوصول إلى حسابك.
          </p>

          <button
            className="mt-6 rounded-lg bg-[#062b67] px-5 py-3 font-semibold text-white"
            onClick={() => router.push('/login')}
          >
            تسجيل الدخول
          </button>
        </div>
      </main>
    );
  }

  const arabicName =
    `${user.profile.firstName} ${user.profile.lastName}`.trim();

  const englishName =
    `${user.profile.firstNameEnglish ?? ''} ${
      user.profile.lastNameEnglish ?? ''
    }`.trim();

  const genderText =
    user.profile.gender === 'male'
      ? 'ذكر'
      : user.profile.gender === 'female'
        ? 'أنثى'
        : 'غير محدد';

  function startEditingProfile() {
    setProfileForm({
      firstName: user.profile.firstName ?? '',
      lastName: user.profile.lastName ?? '',
      firstNameEnglish: user.profile.firstNameEnglish ?? '',
      lastNameEnglish: user.profile.lastNameEnglish ?? '',
      phone: user.contact?.phone ?? '',
      gender: user.profile.gender === 'female' ? 'female' : user.profile.gender === 'male' ? 'male' : '',
    });
    setEditingProfile(true);
  }


  async function saveProfile() {
    setSavingProfile(true);
    try {
      const updated = await traineeRepository.update(user.id, {
        profile: {
          ...user.profile,
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          firstNameEnglish: profileForm.firstNameEnglish.trim() || undefined,
          lastNameEnglish: profileForm.lastNameEnglish.trim() || undefined,
          gender: profileForm.gender || undefined,
        },
        contact: {
          ...user.contact,
          phone: profileForm.phone.trim() || undefined,
        },
      });

      setUser(updated);
      setEditingProfile(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('تعذر حفظ البيانات. حاول مرة أخرى.');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50"
    >
      <div className="container mx-auto max-w-6xl px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-sm font-medium text-[#8b6508]">
              حساب المتدرب
            </span>

            <h1 className="mt-1 text-3xl font-bold text-[#062b67]">
              مرحباً {arabicName}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {user.email}
            </p>
          </div>

          <button
            className="rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={() => void logout()}
          >
            تسجيل الخروج
          </button>
        </div>

        {/* بياناتي */}
        <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-[#062b67]">
              بياناتي
            </h2>

            {!editingProfile && (
              <button
                type="button"
                className="rounded-xl border border-[#062b67] bg-white px-5 py-2.5 text-sm font-semibold text-[#062b67] hover:bg-gray-50"
                onClick={startEditingProfile}
              >
                تعديل البيانات
              </button>
            )}
          </div>

          {editingProfile ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-600">الاسم بالعربي</span>
                <input
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#062b67]"
                  value={profileForm.firstName}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, firstName: event.target.value })
                  }
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-600">اسم العائلة بالعربي</span>
                <input
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#062b67]"
                  value={profileForm.lastName}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, lastName: event.target.value })
                  }
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-600">الاسم بالإنجليزي</span>
                <input
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#062b67]"
                  value={profileForm.firstNameEnglish}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, firstNameEnglish: event.target.value })
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-600">اسم العائلة بالإنجليزي</span>
                <input
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#062b67]"
                  value={profileForm.lastNameEnglish}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, lastNameEnglish: event.target.value })
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-600">رقم الجوال</span>
                <input
                  className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#062b67]"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm({ ...profileForm, phone: event.target.value })
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-600">الجنس</span>
                <select
                  className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#062b67]"
                  value={profileForm.gender}
                  onChange={(event) =>
                    setProfileForm({
                      ...profileForm,
                      gender: event.target.value as 'male' | 'female' | '',
                    })
                  }
                  required
                >
                  <option value="">اختر الجنس</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </label>

              <div className="flex gap-3 sm:col-span-2">
                <button
                  type="button"
                  className="rounded-xl bg-[#062b67] px-6 py-3 font-semibold text-white disabled:opacity-60"
                  onClick={() => void saveProfile()}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
                <button
                  type="button"
                  className="rounded-xl border px-6 py-3 font-semibold text-gray-700"
                  onClick={() => setEditingProfile(false)}
                  disabled={savingProfile}
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-5">
                <span className="text-sm text-gray-500">الاسم بالعربي</span>
                <strong className="mt-2 block text-[#062b67]">{arabicName || '—'}</strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <span className="text-sm text-gray-500">الاسم بالإنجليزي</span>
                <strong className="mt-2 block text-[#062b67]">{englishName || 'غير مضاف'}</strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <span className="text-sm text-gray-500">الجنس</span>
                <strong className="mt-2 block text-[#062b67]">{genderText}</strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <span className="text-sm text-gray-500">البريد الإلكتروني</span>
                <strong className="mt-2 block break-all text-[#062b67]">{user.email}</strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <span className="text-sm text-gray-500">رقم الجوال</span>
                <strong className="mt-2 block text-[#062b67]">{user.contact.phone || 'غير مضاف'}</strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <span className="text-sm text-gray-500">الشركة</span>
                <strong className="mt-2 block text-[#062b67]">{user.company?.companyName || 'غير مضاف'}</strong>
              </div>
            </div>
          )}
        </section>

        {/* دوراتي */}
        <section className="mt-8">

          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="text-sm font-medium text-[#8b6508]">
                التعلم
              </span>

              <h2 className="mt-1 text-3xl font-bold text-[#062b67]">
                دوراتي
              </h2>
            </div>

            <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
              {user.enrollments.length} دورة
            </span>
          </div>

          {user.enrollments.length === 0 ? (
            <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">

              <h3 className="text-xl font-bold text-[#062b67]">
                لا توجد دورات مسجلة حتى الآن
              </h3>

              <p className="mt-3 text-gray-500">
                بعد التسجيل في دورة ستظهر هنا ويمكنك الدخول إليها مباشرة.
              </p>

              <button
                className="mt-6 rounded-xl bg-[#062b67] px-6 py-3 font-semibold text-white"
                onClick={() => router.push('/training-courses')}
              >
                استعراض الدورات
              </button>

            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">

              {user.enrollments.map((enrollment: any) => {
                const course = courses[enrollment.courseId];

                const progress = Math.max(
                  0,
                  Math.min(
                    100,
                    Number(enrollment.progress ?? 0),
                  ),
                );

                const completed =
                  enrollment.status === 'completed';

                const certificate =
                  user.certificates?.find(
                    (item: any) =>
                      item.id === enrollment.certificateId ||
                      item.courseId === enrollment.courseId,
                  ) ?? null;

                const isRecordedCourse =
                  course?.type === 'recorded';

                const schedule = enrollment.scheduleId
                  ? schedules[enrollment.scheduleId]
                  : null;

                const formatDate = (value: unknown) => {
                  if (!value) return '—';

                  const date = new Date(value as string | Date);

                  if (Number.isNaN(date.getTime())) {
                    return '—';
                  }

                  return new Intl.DateTimeFormat('ar-SA', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  }).format(date);
                };

                const dateText = schedule
                  ? schedule.startDate &&
                    schedule.endDate &&
                    formatDate(schedule.startDate) !==
                      formatDate(schedule.endDate)
                    ? `${formatDate(schedule.startDate)} — ${formatDate(schedule.endDate)}`
                    : formatDate(schedule.startDate)
                  : 'يحدد لاحقاً';

                const isOnlineCourse = course?.delivery === 'online';

                const locationText = isOnlineCourse
                  ? 'أونلاين مباشر'
                  : schedule?.location || schedule?.city || 'يحدد لاحقاً';


                return (
                  <article
                    key={
                      enrollment.id ??
                      enrollment.courseId
                    }
                    className="overflow-hidden rounded-3xl border bg-white shadow-sm"
                  >

                    {/* Course header */}
                    <div className="bg-[#062b67] p-6 text-white">

                      <div className="flex items-start justify-between gap-4">

                        <div>
                          <span className="text-sm text-blue-100">
                            البرنامج التدريبي
                          </span>

                          <h3
  className="mt-2 text-xl font-bold"
  style={{ color: '#ffffff' }}
>
  {course?.title ??
    enrollment.courseTitle}
</h3>
                        </div>

                        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs">
                          {completed
                            ? 'مكتملة'
                            : 'نشطة'}
                        </span>

                      </div>

                    </div>

                    {/* Course body */}
                    <div className="p-6">

                      <p className="min-h-[48px] text-sm leading-7 text-gray-500">
                        {course?.shortDescription ||
                          course?.description ||
                          'برنامج تدريبي مسجل ضمن دوراتك.'}
                      </p>

                      {isRecordedCourse ? (
                        <div className="mt-6">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              التقدم
                            </span>

                            <strong className="text-[#062b67]">
                              {Math.round(progress)}%
                            </strong>
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
                      ) : (
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-gray-50 p-4">
                            <span className="text-xs text-gray-500">
                              تاريخ الدورة
                            </span>
                            <strong className="mt-1 block text-sm text-[#062b67]">
                              {dateText}
                            </strong>
                          </div>

                          <div className="rounded-2xl bg-gray-50 p-4">
                            <span className="text-xs text-gray-500">
                              مكان الدورة
                            </span>
                            <strong className="mt-1 block text-sm text-[#062b67]">
                              {locationText}
                            </strong>
                          </div>

                          {!isOnlineCourse && (
                            <div className="rounded-2xl bg-gray-50 p-4">
                              <span className="text-xs text-gray-500">
                                المدينة
                              </span>
                              <strong className="mt-1 block text-sm text-[#062b67]">
                                {schedule?.city || '—'}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Course actions */}
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <button
                          className="w-full rounded-xl bg-[#062b67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
                          onClick={() =>
                            router.push(
                              `/course-learning?id=${encodeURIComponent(
                                enrollment.courseId,
                              )}`,
                            )
                          }
                        >
                          {completed
                            ? 'عرض الدورة'
                            : isRecordedCourse && progress > 0
                              ? 'متابعة الدورة'
                              : 'دخول إلى الدورة'}
                        </button>

                        {certificate && (
                          <button
                            type="button"
                            className="w-full rounded-xl border border-[#8b6508] bg-white px-5 py-3 font-semibold text-[#8b6508] transition hover:bg-[#8b6508]/5"
                            onClick={() =>
                              router.push(
                                `/certificate?traineeId=${encodeURIComponent(
                                  user.id,
                                )}&certificateId=${encodeURIComponent(
                                  certificate.id,
                                )}`,
                              )
                            }
                          >
                            عرض الشهادة
                          </button>
                        )}
                      </div>


                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}