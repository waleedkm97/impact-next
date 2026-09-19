'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchCatalog } from '@/lib/public-catalog';
import { useLocale } from '@/hooks/use-locale';
import type { Course } from '@/types/course';
import type { Schedule } from '@/types/schedule';

const onlineCity = 'Online';

const cityNames: Record<string, string> = {
  الرياض: 'Riyadh', جدة: 'Jeddah', الدمام: 'Dammam', دبي: 'Dubai',
  القاهرة: 'Cairo', البحرين: 'Bahrain', قطر: 'Qatar', لندن: 'London',
  برشلونة: 'Barcelona', ميلان: 'Milan',
};

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
  const { isEnglish } = useLocale();
  const [course, setCourse] = useState<Course | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);

  const allowedCities = ['الرياض', 'جدة', 'الدمام', 'دبي', 'القاهرة', 'البحرين', 'قطر', 'لندن', 'برشلونة', 'ميلان', 'Online'];

  useEffect(() => {
    let active = true;

    async function load() {
      const catalog = await fetchCatalog({ id, type: 'training', includeSchedules: true });
      const currentCourse = catalog.courses[0] ?? null;
      const scheduleList = catalog.schedules;

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
setSchedules(
  scheduleList.filter((schedule: Schedule) =>
    allowedCities.includes(schedule.city || onlineCity),
  ),
);
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
      <main dir={isEnglish ? 'ltr' : 'rtl'} className="container mx-auto px-6 py-12">
        {isEnglish ? 'Loading course details...' : 'جاري تحميل تفاصيل الدورة...'}
      </main>
    );
  }

  if (!course) {
    return (
      <main dir={isEnglish ? 'ltr' : 'rtl'} className="container mx-auto px-6 py-12">
        <h1>{isEnglish ? 'Course not found' : 'الدورة غير موجودة'}</h1>
        <Link href="/training-courses" className="btn-secondary">
          {isEnglish ? 'Back to training courses' : 'العودة للدورات التدريبية'}
        </Link>
      </main>
    );
  }

  return (
    <main dir={isEnglish ? 'ltr' : 'rtl'} className="container mx-auto px-6 py-12">
      <header className="training-detail-hero">
        <div className="training-detail-image" style={{ backgroundImage: `url(${course.image || course.thumbnail || ''})` }} />
        <span className="card-label">{isEnglish ? 'Training program' : 'دورة تدريبية'}</span>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
      </header>

      <div className="training-detail-grid">
        <section>
          <article className="course-details-section">
            <h2>{isEnglish ? 'Course overview' : 'نبذة عن الدورة'}</h2>
            <p>{course.description}</p>
          </article>

          <article className="course-details-section">
            <h2>{isEnglish ? 'Objectives' : 'أهداف الدورة'}</h2>
            <ul>
              {course.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </article>

          <article className="course-details-section">
            <h2>{isEnglish ? 'Target audience' : 'الفئة المستهدفة'}</h2>
            <p>{course.audience || (isEnglish ? 'Professionals seeking to develop their skills.' : 'المهتمون بتطوير مهاراتهم المهنية.')}</p>
          </article>

          <article className="course-details-section">
            <h2>{isEnglish ? 'Course topics' : 'محاور الدورة'}</h2>
            {outline.length ? (
              <ol>
                {outline.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : (
              <p>{isEnglish ? 'Topics will be shown when they are added to the course.' : 'سيتم عرض المحاور عند إضافتها إلى الدورة.'}</p>
            )}
          </article>
        </section>

        <aside className="training-schedule-panel">
          <h2>{isEnglish ? 'Choose a delivery option' : 'اختر طريقة الحضور'}</h2>
          <div className="training-city-buttons">
            {cities.map((city) => (
              <button
                key={city}
                className={city === selectedCity ? 'active' : ''}
                onClick={() => setSelectedCity(city)}
              >
                {isEnglish ? cityNames[city] ?? city : city}
              </button>
            ))}
          </div>

          <h3>{isEnglish ? 'Available dates' : 'المواعيد المتاحة'} {selectedCity && `${isEnglish ? 'in' : 'في'} ${selectedCity}`}</h3>

          <div className="training-schedule-list">
            {visibleSchedules.length === 0 ? (
              <div className="catalog-empty">{isEnglish ? 'No published dates are currently available for this option.' : 'لا توجد مواعيد منشورة لهذا الخيار حاليًا.'}</div>
            ) : (
              visibleSchedules.map((schedule) => (
                <article className="training-schedule-card" key={schedule.id}>
                  <div>
                    <strong>{formatDateRange(schedule)}</strong>
                    <span>
                      {schedule.city === 'Online' ? (isEnglish ? 'Live online' : 'أونلاين مباشر') : (isEnglish ? 'In-person' : 'حضوري')}
                      {schedule.startTime && schedule.endTime
                        ? ` — ${schedule.startTime} إلى ${schedule.endTime}`
                        : ''}
                    </span>
                    {schedule.location && (
                      <span>{schedule.location}</span>
                    )}
                    {schedule.onlineMeetingLink && (
                      <span>{isEnglish ? 'Meeting link available after registration' : 'رابط اللقاء متاح بعد التسجيل'}</span>
                    )}
                  </div>
                  <div>
                    <strong>{Number(schedule.price ?? 0).toLocaleString(isEnglish ? 'en-US' : 'ar-SA')} {isEnglish ? 'SAR' : 'ر.س'}</strong>
                    <Link href={`/training-booking?id=${encodeURIComponent(schedule.id)}`} className="btn-primary">
                      {isEnglish ? 'Register' : 'التسجيل'}
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
