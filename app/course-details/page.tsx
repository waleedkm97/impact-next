'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchCatalog } from '@/lib/public-catalog';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { useLocale } from '@/hooks/use-locale';
import type { Course } from '@/types/course';

export default function CourseDetails() {
  const { isEnglish } = useLocale();
  const id =
    useSearchParams().get('id') || '';

  const [course, setCourse] =
    useState<Course | null>(null);

  const [enrolled, setEnrolled] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const [
        courseResponse,
        user,
      ] = await Promise.all([
        fetchCatalog({ id }).then((data) => data.courses[0] ?? null),
        traineeRepository.getCurrentUser(),
      ]);

      const currentCourse = courseResponse;

      if (!active) {
        return;
      }

      setCourse(currentCourse);

      let sqlEnrolled = false;

      if (currentCourse && user) {
        const sqlTraineeId =
          document.cookie
            .split('; ')
            .find((item) =>
              item.startsWith(
                'impact_sql_trainee=',
              ),
            )
            ?.split('=')
            .slice(1)
            .join('=') || '';

        if (sqlTraineeId) {
          try {
            const response =
              await fetch(
                `/api/enrollments?traineeId=${encodeURIComponent(
                  sqlTraineeId,
                )}`,
                {
                  cache: 'no-store',
                },
              );

            const result =
              await response
                .json()
                .catch(() => null);

            if (
              response.ok &&
              result?.success
            ) {
              sqlEnrolled =
                (
                  result.enrollments ??
                  []
                ).some(
                  (enrollment: any) =>
                    enrollment.courseId ===
                    currentCourse.id,
                );
            }
          } catch (error) {
            console.error(
              'Failed to check SQL enrollment:',
              error,
            );
          }
        }
      }

      if (active) {
        setEnrolled(sqlEnrolled);
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main
        className="container mx-auto px-6 py-12"
        dir={isEnglish ? 'ltr' : 'rtl'}
      >
        {isEnglish ? 'Loading...' : 'جاري التحميل...'}
      </main>
    );
  }

  if (!course) {
    return (
      <main
        className="container mx-auto px-6 py-12"
        dir={isEnglish ? 'ltr' : 'rtl'}
      >
        <h1>
          {isEnglish ? 'Course not found' : 'الدورة غير موجودة'}
        </h1>

        <Link
          href="/recorded-courses"
          className="btn-secondary"
        >
          {isEnglish ? 'Back to courses' : 'العودة للدورات'}
        </Link>
      </main>
    );
  }

  return (
    <main
      className="container mx-auto px-6 py-12"
      dir={isEnglish ? 'ltr' : 'rtl'}
    >
      <span className="card-label">
        {isEnglish ? 'Recorded course' : 'دورة مسجلة'}
      </span>

      <div className="course-detail-image" style={{ backgroundImage: `url(${course.image || course.thumbnail || ''})` }} />

      <h1>{course.title}</h1>

      <p>{course.description}</p>

      <section className="course-details-section">
        <h2>{isEnglish ? 'Course overview' : 'نبذة عن الدورة'}</h2>

        <p>
          {course.shortDescription ||
            course.description}
        </p>
      </section>

      <section className="course-details-section">
        <h2>{isEnglish ? 'Objectives' : 'الأهداف'}</h2>

        <ul>
          {course.objectives.map(
            (objective) => (
              <li key={objective}>
                {objective}
              </li>
            ),
          )}
        </ul>
      </section>

      <section className="course-details-section">
        <h2>{isEnglish ? 'Topics' : 'المحاور'}</h2>

        <ol>
          {(course.outline ?? '')
            .split('\n')
            .map((topic) => topic.trim())
            .filter(Boolean)
            .map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
        </ol>
      </section>

      <section className="course-details-section">
        <h2>{isEnglish ? 'Target audience' : 'الفئة المستهدفة'}</h2>

        <p>
          {course.audience ||
            (isEnglish ? 'Professionals seeking to develop their skills.' : 'المهتمون بتطوير مهاراتهم المهنية.')}
        </p>
      </section>

      <section className="course-details-section">
        <h2>{isEnglish ? 'Course content' : 'المحتوى'}</h2>

        <ol>
          {(course.lessons ?? []).map(
            (lesson, index) => (
              <li key={lesson.id}>
                {isEnglish ? `Module ${index + 1}` : lesson.title}{' '}
                {lesson.type === 'quiz'
                  ? isEnglish ? '— Interactive assessment' : '— اختبار تفاعلي'
                  : ''}
              </li>
            ),
          )}
        </ol>
      </section>

      <div className="course-details-purchase">
        <div>
          <span>{isEnglish ? 'Price' : 'السعر'}</span>

          <strong>
            {course.price.toLocaleString(
              isEnglish ? 'en-US' : 'ar-SA',
            )}{' '}{isEnglish ? 'SAR' : 'ر.س'}
          </strong>
        </div>

        {enrolled ? (
          <Link
            href={`/course-learning?id=${encodeURIComponent(
              course.id,
            )}`}
            className="btn-primary"
          >
            {isEnglish ? 'Start learning' : 'ابدأ التعلم'}
          </Link>
        ) : (
          <Link
            href={`/checkout?id=${encodeURIComponent(
              course.id,
            )}`}
            className="btn-primary"
          >
            {isEnglish ? 'Buy course' : 'شراء الدورة'}
          </Link>
        )}
      </div>
    </main>
  );
}