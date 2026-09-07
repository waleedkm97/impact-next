'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { courseRepository } from '@/lib/data/repositories/course-repository';

export default function Account() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

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

        if (!active) return;

        const refreshedUser =
          await traineeRepository.findById(currentUser.id);

        setUser(refreshedUser ?? currentUser);
        setCourses(Object.fromEntries(courseEntries));
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
          <h2 className="text-xl font-bold text-[#062b67]">
            بياناتي
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-2xl bg-gray-50 p-5">
              <span className="text-sm text-gray-500">
                الاسم بالعربي
              </span>

              <strong className="mt-2 block text-[#062b67]">
                {arabicName || '—'}
              </strong>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <span className="text-sm text-gray-500">
                الاسم بالإنجليزي
              </span>

              <strong className="mt-2 block text-[#062b67]">
                {englishName || 'غير مضاف'}
              </strong>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <span className="text-sm text-gray-500">
                البريد الإلكتروني
              </span>

              <strong className="mt-2 block break-all text-[#062b67]">
                {user.email}
              </strong>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <span className="text-sm text-gray-500">
                رقم الجوال
              </span>

              <strong className="mt-2 block text-[#062b67]">
                {user.contact.phone || 'غير مضاف'}
              </strong>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <span className="text-sm text-gray-500">
                الشركة
              </span>

              <strong className="mt-2 block text-[#062b67]">
                {user.company?.companyName || 'غير مضاف'}
              </strong>
            </div>

          </div>
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

                      {/* Progress */}
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

                      {/* Course button */}
                      <button
                        className="mt-6 w-full rounded-xl bg-[#062b67] px-5 py-3 font-semibold text-white transition hover:opacity-90"
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
                          : progress > 0
                            ? 'متابعة الدورة'
                            : 'دخول إلى الدورة'}
                      </button>

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