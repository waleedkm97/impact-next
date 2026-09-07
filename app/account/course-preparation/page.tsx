'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import type { Course } from '@/types/course';

export default function CoursePreparationPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';

  const [course, setCourse] = useState<Course | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [currentCourse, user] = await Promise.all([
          courseRepository.findById(courseId),
          traineeRepository.getCurrentUser(),
        ]);

        if (!active) return;

        setCourse(currentCourse);

        if (currentCourse && user) {
          setAllowed(
            user.enrollments.some(
              (enrollment) => enrollment.courseId === currentCourse.id,
            ),
          );
        }
      } catch (error) {
        console.error('Failed to load course preparation:', error);
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
  }, [courseId]);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-5xl px-6 py-12"
      >
        جاري تحميل التحضير...
      </main>
    );
  }

  if (!course) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-5xl px-6 py-12"
      >
        <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
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

  if (!allowed) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-5xl px-6 py-12"
      >
        <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#062b67]">
            التحضير غير متاح
          </h1>

          <p className="mt-3 text-gray-600">
            يجب أن تكون مسجلًا في الدورة للوصول إلى مواد التحضير.
          </p>

          <Link
            href={`/course-learning?id=${encodeURIComponent(course.id)}`}
            className="mt-6 inline-flex rounded-lg bg-[#062b67] px-5 py-3 text-sm font-semibold text-white"
          >
            العودة إلى الدورة
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
      <div className="container mx-auto max-w-5xl px-6 py-8">

        <Link
          href={`/course-learning?id=${encodeURIComponent(course.id)}`}
          className="text-sm font-medium text-gray-500 hover:text-[#062b67]"
        >
          ← العودة إلى الدورة
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm">

          <div className="bg-[#062b67] px-6 py-8 text-white md:px-10">
            <div className="text-sm text-blue-100">
              التحضير للدورة
            </div>

            <h1 className="mt-3 text-3xl font-bold">
              {course.title}
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-blue-50">
              استعد للدورة التدريبية من خلال قراءة التعليمات والمواد
              التحضيرية قبل بدء البرنامج.
            </p>
          </div>

          <div className="p-6 md:p-10">

            <div className="rounded-2xl border bg-gray-50 p-6">
              <h2 className="text-xl font-bold text-[#062b67]">
                تعليمات قبل الدورة
              </h2>

              <p className="mt-4 leading-8 text-gray-600">
                يرجى الاطلاع على المعلومات الخاصة بالدورة والاستعداد
                لحضور البرنامج التدريبي في الموعد المحدد.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-2xl border p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  📅
                </div>

                <h3 className="mt-4 font-bold text-[#062b67]">
                  الاستعداد للبرنامج
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  تأكد من معرفة موعد ومكان انعقاد الدورة والاستعداد
                  للحضور في الموعد.
                </p>
              </div>

              <div className="rounded-2xl border p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  📚
                </div>

                <h3 className="mt-4 font-bold text-[#062b67]">
                  المواد التحضيرية
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  سيتم عرض المواد والملفات التحضيرية هنا عند إضافتها
                  إلى الدورة.
                </p>

                {course.materialUrl && (
                  <a
                    href={course.materialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-lg bg-[#062b67] px-4 py-2 text-sm font-semibold text-white"
                  >
                    فتح المادة التحضيرية
                  </a>
                )}
              </div>

            </div>

            <div className="mt-8 flex justify-start">
              <Link
                href={`/course-learning?id=${encodeURIComponent(course.id)}`}
                className="rounded-xl border border-[#062b67] px-6 py-3 font-semibold text-[#062b67] hover:bg-gray-50"
              >
                العودة إلى صفحة الدورة
              </Link>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}