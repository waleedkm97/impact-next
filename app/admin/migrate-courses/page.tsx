'use client';

import { useEffect, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import type { Course } from '@/types/course';

export default function MigrateCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        const result = await courseRepository.findAll();
        setCourses(result);
      } catch (err) {
        console.error(err);
        setError('فشل في قراءة بيانات الدورات القديمة');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div dir="rtl" style={{ padding: 40 }}>
        جاري قراءة الدورات...
      </div>
    );
  }

  if (error) {
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
          marginBottom: 35,
          padding: 20,
          border: '1px solid #ddd',
          borderRadius: 10,
          background: '#fff',
        }}
      >
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
          إجمالي الاختبارات/التقييمات:{' '}
          <strong>{totalAssessments}</strong>
        </p>
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
                <strong>الاختبارات والتقييمات:</strong>{' '}
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