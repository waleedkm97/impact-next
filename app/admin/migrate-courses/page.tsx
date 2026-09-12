'use client';

import { useEffect, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { categoryRepository } from '@/lib/data/repositories/category-repository';
import type { Course } from '@/types/course';
import type { Category } from '@/types/category';

export default function MigrateCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [courseResult, categoryResult] =
          await Promise.all([
            courseRepository.findAll(),
            categoryRepository.findAll(),
          ]);

        setCourses(courseResult);
        setCategories(categoryResult);
      } catch (err) {
        console.error(err);
        setError(
          'فشل في قراءة البيانات القديمة',
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function migrateCourses() {
    if (courses.length === 0) {
      setError('لا توجد دورات لنقلها.');
      return;
    }

    setMigrating(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(
        '/api/migrate-courses',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            categories,
            courses,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'فشلت عملية نقل الدورات',
        );
      }

      setResult(
        [
          `تم نقل التصنيفات: ${data.categoriesImported}`,
          `تم نقل الدورات: ${data.imported}`,
          `تم تخطي الدورات: ${data.skipped}`,
          `تم نقل الدروس: ${data.lessonsImported}`,
          `تم نقل الأسئلة: ${data.questionsImported}`,
          `تم نقل التقييمات: ${data.assessmentsImported}`,
        ].join('\n'),
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء نقل البيانات',
      );
    } finally {
      setMigrating(false);
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ padding: 40 }}>
        جاري قراءة الدورات والتصنيفات...
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div dir="rtl" style={{ padding: 40 }}>
        <h1>خطأ</h1>
        <p>{error}</p>
      </div>
    );
  }

  const trainingCourses = courses.filter(
    (course) => course.type === 'training',
  );

  const recordedCourses = courses.filter(
    (course) => course.type === 'recorded',
  );

  const publicCourses = courses.filter(
    (course) => course.trainingKind === 'public',
  );

  const corporateCourses = courses.filter(
    (course) => course.trainingKind === 'corporate',
  );

  const totalLessons = courses.reduce(
    (total, course) =>
      total + (course.lessons?.length ?? 0),
    0,
  );

  const totalSchedules = courses.reduce(
    (total, course) =>
      total + (course.schedules?.length ?? 0),
    0,
  );

  const totalAssessments = courses.reduce(
    (total, course) =>
      total + (course.assessments?.length ?? 0),
    0,
  );

  return (
    <div
      dir="rtl"
      style={{
        padding: 40,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>بيانات الدورات القديمة</h1>

      <div
        style={{
          marginTop: 25,
          marginBottom: 25,
          padding: 20,
          border: '1px solid #ddd',
          borderRadius: 10,
          background: '#fff',
        }}
      >
        <p>
          إجمالي التصنيفات:{' '}
          <strong>{categories.length}</strong>
        </p>

        <p>
          إجمالي الدورات والبرامج:{' '}
          <strong>{courses.length}</strong>
        </p>

        <p>
          الدورات التدريبية:{' '}
          <strong>{trainingCourses.length}</strong>
        </p>

        <p>
          الدورات المسجلة Recorded:{' '}
          <strong>{recordedCourses.length}</strong>
        </p>

        <p>
          Public:{' '}
          <strong>{publicCourses.length}</strong>
        </p>

        <p>
          Corporate:{' '}
          <strong>{corporateCourses.length}</strong>
        </p>

        <p>
          إجمالي الدروس:{' '}
          <strong>{totalLessons}</strong>
        </p>

        <p>
          إجمالي المواعيد:{' '}
          <strong>{totalSchedules}</strong>
        </p>

        <p>
          إجمالي الاختبارات والتقييمات:{' '}
          <strong>{totalAssessments}</strong>
        </p>
      </div>

      <div
        style={{
          marginBottom: 30,
          padding: 20,
          border: '1px solid #d8c39b',
          borderRadius: 10,
          background: '#fffaf0',
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          نقل البيانات إلى PostgreSQL
        </h2>

        <p>
          سيتم نقل التصنيفات أولًا، ثم الدورات
          والدروس والأسئلة والتقييمات.
        </p>

        <button
          type="button"
          onClick={migrateCourses}
          disabled={
            migrating || courses.length === 0
          }
          style={{
            padding: '12px 22px',
            border: 0,
            borderRadius: 8,
            background: migrating
              ? '#999'
              : '#172033',
            color: '#fff',
            cursor: migrating
              ? 'not-allowed'
              : 'pointer',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {migrating
            ? 'جاري نقل البيانات...'
            : 'بدء نقل الدورات'}
        </button>

        {error && (
          <p
            style={{
              marginTop: 15,
              color: '#b42318',
              whiteSpace: 'pre-wrap',
            }}
          >
            {error}
          </p>
        )}

        {result && (
          <pre
            style={{
              marginTop: 20,
              padding: 15,
              background: '#f5f5f5',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {result}
          </pre>
        )}
      </div>

      {courses.length === 0 ? (
        <p>لا توجد دورات في IndexedDB.</p>
      ) : (
        <div>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: 20,
                marginBottom: 15,
                background: '#fff',
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                {course.title}
              </h2>

              <p>
                <strong>ID:</strong> {course.id}
              </p>

              <p>
                <strong>النوع:</strong>{' '}
                {course.type}
              </p>

              <p>
                <strong>نوع التدريب:</strong>{' '}
                {course.trainingKind}
              </p>

              <p>
                <strong>طريقة التدريب:</strong>{' '}
                {course.delivery}
              </p>

              <p>
                <strong>السعر:</strong>{' '}
                {course.price} {course.currency}
              </p>

              <p>
                <strong>الأيام:</strong>{' '}
                {course.days}
              </p>

              <p>
                <strong>الساعات:</strong>{' '}
                {course.hours}
              </p>

              <p>
                <strong>منشور:</strong>{' '}
                {course.published ? 'نعم' : 'لا'}
              </p>

              <p>
                <strong>الدروس:</strong>{' '}
                {course.lessons?.length ?? 0}
              </p>

              <p>
                <strong>المواعيد:</strong>{' '}
                {course.schedules?.length ?? 0}
              </p>

              <p>
                <strong>
                  الاختبارات والتقييمات:
                </strong>{' '}
                {course.assessments?.length ?? 0}
              </p>

              <p>
                <strong>المادة التدريبية:</strong>{' '}
                {course.materialUrl
                  ? 'موجودة'
                  : 'غير موجودة'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}