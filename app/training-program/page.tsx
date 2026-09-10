'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import type { Course } from '@/types/course';
import type { Schedule } from '@/types/schedule';

const onlineCity = 'Online';

function formatDate(date: Date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDateRange(schedule: Schedule) {
  const start = formatDate(schedule.startDate);
  const end = formatDate(schedule.endDate);
  return start === end ? start : `${start} — ${end}`;
}

export default function TrainingProgram() {
  const id = useSearchParams().get('id') || '';
  const [course, setCourse] = useState<Course | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);

  const allowedCities = ['الرياض', 'جدة', 'الدمام', 'دبي', 'القاهرة', 'البحرين', 'قطر', 'لندن', 'برشلونة', 'ميلان', 'Online'];

  useEffect(() => {
    let active = true;

    async function load() {
      const [currentCourse, scheduleList] = await Promise.all([
        courseRepository.findById(id),
        scheduleRepository.findByCourseId(id, {
          filter: { published: true },
          sort: 'startDate',
          order: 'asc',
        }),
      ]);

      if (!active) {
        return;
      }

      if (!currentCourse || currentCourse.trainingKind !== 'public') {
        setCourse(null);
        setSchedules([]);
        setLoading(false);
        return;
      }
      setCourse(currentCourse);
      setSchedules(scheduleList.filter(schedule => allowedCities.includes(schedule.city || onlineCity)));
      setLoading(false);
    }

    if (id) {
      void load();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  const cities = useMemo(() => allowedCities.filter(city => schedules.some(schedule => (schedule.city || onlineCity) === city)), [schedules]);

  useEffect(() => {
    if (!selectedCity && cities[0]) {
      setSelectedCity(cities[0]);
    }
  }, [cities, selectedCity]);

  const visibleSchedules = schedules.filter(
    (schedule) => (schedule.city || onlineCity) === selectedCity,
  );

  const outline = (course?.outline ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  if (loading) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        جاري تحميل تفاصيل الدورة...
      </main>
    );
  }

  if (!course) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        <h1>الدورة غير موجودة</h1>
        <Link href="/training-courses" className="btn-secondary">
          العودة للدورات التدريبية
        </Link>
      </main>
    );
  }

  return (
    <main dir="rtl" className="container mx-auto px-6 py-12">
      <header className="training-detail-hero">
        <span className="card-label">دورة تدريبية</span>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
      </header>

      <div className="training-detail-grid">
        <section>
          <article className="course-details-section">
            <h2>نبذة عن الدورة</h2>
            <p>{course.description}</p>
          </article>

          <article className="course-details-section">
            <h2>أهداف الدورة</h2>
            <ul>
              {course.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </article>

          <article className="course-details-section">
            <h2>الفئة المستهدفة</h2>
            <p>{course.audience || 'المهتمون بتطوير مهاراتهم المهنية.'}</p>
          </article>

          <article className="course-details-section">
            <h2>محاور الدورة</h2>
            {outline.length ? (
              <ol>
                {outline.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : (
              <p>سيتم عرض المحاور عند إضافتها إلى الدورة.</p>
            )}
          </article>
        </section>

        <aside className="training-schedule-panel">
          <h2>اختر طريقة الحضور</h2>
          <div className="training-city-buttons">
            {cities.map((city) => (
              <button
                key={city}
                className={city === selectedCity ? 'active' : ''}
                onClick={() => setSelectedCity(city)}
              >
                {city}
              </button>
            ))}
          </div>

          <h3>المواعيد المتاحة {selectedCity && `في ${selectedCity}`}</h3>

          <div className="training-schedule-list">
            {visibleSchedules.length === 0 ? (
              <div className="catalog-empty">لا توجد مواعيد منشورة لهذا الخيار حاليًا.</div>
            ) : (
              visibleSchedules.map((schedule) => (
                <article className="training-schedule-card" key={schedule.id}>
                  <div>
                    <strong>{formatDateRange(schedule)}</strong>
                    <span>
                      {schedule.city === 'Online' ? 'أونلاين مباشر' : 'حضوري'}
                      {schedule.startTime && schedule.endTime
                        ? ` — ${schedule.startTime} إلى ${schedule.endTime}`
                        : ''}
                    </span>
                    {schedule.location && (
                      <span>{schedule.location}</span>
                    )}
                    {schedule.onlineMeetingLink && (
                      <span>رابط اللقاء متاح بعد التسجيل</span>
                    )}
                  </div>
                  <div>
                    <strong>{Number(schedule.price ?? 0).toLocaleString('ar-SA')} ر.س</strong>
                    <Link href={`/training-booking?id=${encodeURIComponent(schedule.id)}`} className="btn-primary">
                      التسجيل
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
