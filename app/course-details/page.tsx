'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import type { Course } from '@/types/course';

export default function CourseDetails() {
  const id = useSearchParams().get('id') || '';
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const [currentCourse, user] = await Promise.all([
        courseRepository.findById(id),
        traineeRepository.getCurrentUser(),
      ]);

      if (!active) {
        return;
      }

      setCourse(currentCourse);

      if (currentCourse && user) {
        setEnrolled(
          user.enrollments.some(
            (enrollment) => enrollment.courseId === currentCourse.id,
          ),
        );
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="container mx-auto px-6 py-12" dir="rtl">
        جاري التحميل...
      </main>
    );
  }

  if (!course) {
    return (
      <main className="container mx-auto px-6 py-12" dir="rtl">
        <h1>الدورة غير موجودة</h1>
        <Link href="/recorded-courses" className="btn-secondary">
          العودة للدورات
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-6 py-12" dir="rtl">
      <span className="card-label">دورة مسجلة</span>
      <h1>{course.title}</h1>
      <p>{course.description}</p>

      <section className="course-details-section">
        <h2>نبذة عن الدورة</h2>
        <p>{course.shortDescription || course.description}</p>
      </section>

      <section className="course-details-section">
        <h2>الأهداف</h2>
        <ul>
          {course.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>

      <section className="course-details-section">
        <h2>الفئة المستهدفة</h2>
        <p>{course.audience || 'المهتمون بتطوير مهاراتهم المهنية.'}</p>
      </section>

      <section className="course-details-section">
        <h2>المحتوى</h2>
        <ol>
          {(course.lessons ?? []).map((lesson) => (
            <li key={lesson.id}>
              {lesson.title} {lesson.type === 'quiz' ? '— اختبار تفاعلي' : ''}
            </li>
          ))}
        </ol>
      </section>

      <div className="course-details-purchase">
        <div>
          <span>السعر</span>
          <strong>{course.price.toLocaleString('ar-SA')} ر.س</strong>
        </div>

        {enrolled ? (
          <Link
            href={`/course-learning?id=${encodeURIComponent(course.id)}`}
            className="btn-primary"
          >
            ابدأ التعلم
          </Link>
        ) : (
          <Link
            href={`/checkout?id=${encodeURIComponent(course.id)}`}
            className="btn-primary"
          >
            شراء الدورة
          </Link>
        )}
      </div>
    </main>
  );
}
