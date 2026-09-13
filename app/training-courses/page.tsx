'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import { categoryRepository } from '@/lib/data/repositories/category-repository';
import type { Course } from '@/types/course';
import type { Schedule } from '@/types/schedule';

const cities = [
  'الرياض',
  'جدة',
  'الدمام',
  'دبي',
  'القاهرة',
  'البحرين',
  'قطر',
  'لندن',
  'برشلونة',
  'ميلان',
  'Online',
];

const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2026, i, 1).toLocaleDateString('ar-SA', {
    month: 'long',
  }),
}));

export default function TrainingCourses() {
  const [programs, setPrograms] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [programsData, schedulesData, categoriesData] =
          await Promise.all([
            courseRepository.findPublished({
              filter: {
                type: 'training',
                trainingKind: 'public',
              },
            }),
            scheduleRepository.findAll({
              filter: {
                published: true,
              },
              sort: 'startDate',
              order: 'asc',
            }),
            categoryRepository.findAll({
              sort: 'name',
              order: 'asc',
            }),
          ]);

        if (!active) return;

        setPrograms(programsData);
        setSchedules(schedulesData);
        setCategories(
          categoriesData.map((item) => ({
            id: item.id,
            name: item.name,
          })),
        );
      } catch (error) {
        console.error(
          'Failed to load training courses:',
          error,
        );
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
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesSearch =
        !q ||
        [
          program.title,
          program.description,
          program.shortDescription,
          program.audience,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);

      const matchesCategory =
        !category || program.categoryId === category;

      const programSchedules = schedules.filter(
        (schedule) => schedule.courseId === program.id,
      );

      const matchesCity =
        !city ||
        programSchedules.some(
          (schedule) => (schedule.city || 'Online') === city,
        );

      const matchesMonth =
        !month ||
        programSchedules.some(
          (schedule) =>
            new Date(schedule.startDate).getMonth() + 1 ===
            Number(month),
        );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCity &&
        matchesMonth
      );
    });
  }, [
    programs,
    schedules,
    search,
    category,
    city,
    month,
  ]);

  if (loading) {
    return (
      <main dir="rtl">
        <section className="training-catalog-hero">
          <div className="section-inner">
            جاري تحميل الدورات التدريبية...
          </div>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl">
      <section className="training-catalog-hero">
        <div className="section-inner">
          <div className="catalog-top-links">
            <span>دورة تدريبية معتمدة</span>
            <span>مدرب معتمد</span>
            <span>
              مدن تدريب حول المملكة والخليج
            </span>
          </div>

          <div className="training-filter-box">
            <div className="filter-field filter-search">
              <label>ابحث عن دورة</label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="اسم الدورة أو الكلمة المفتاحية"
              />
            </div>

            <div className="filter-field">
              <label>التصنيف</label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                <option value="">
                  كل التصنيفات
                </option>

                {categories.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>المدينة</label>

              <select
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
              >
                <option value="">كل المدن</option>

                {cities.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === 'Online'
                      ? 'أونلاين'
                      : item}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>الشهر</label>

              <select
                value={month}
                onChange={(event) =>
                  setMonth(event.target.value)
                }
              >
                <option value="">
                  كل الأشهر
                </option>

                {months.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="catalog-search-btn"
              onClick={() => undefined}
              type="button"
            >
              بحث
            </button>
          </div>
        </div>
      </section>

      <section className="section training-catalog-section">
        <div className="section-inner">
          <div className="catalog-category-pills">
            <button
              className={!category ? 'active' : ''}
              onClick={() => setCategory('')}
            >
              كل الدورات
            </button>

            {categories.slice(0, 7).map((item) => (
              <button
                key={item.id}
                className={
                  category === item.id ? 'active' : ''
                }
                onClick={() =>
                  setCategory(item.id)
                }
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="catalog-results-count">
            عرض {visible.length} من أصل {programs.length} دورة
          </div>

          {visible.length === 0 ? (
            <div className="catalog-empty">
              لا توجد دورات مطابقة لخيارات البحث.
            </div>
          ) : (
            <div className="cards training-catalog-grid">
              {visible.map((program) => {
                const programSchedules =
                  schedules.filter(
                    (schedule) =>
                      schedule.courseId === program.id,
                  );

                const prices = programSchedules
                  .map((schedule) =>
                    Number(schedule.price ?? 0),
                  )
                  .filter((price) => price > 0);

                const startingPrice =
                  prices.length > 0
                    ? Math.min(...prices)
                    : program.delivery === 'online'
                      ? 3000
                      : 5000;

                const categoryName =
                  categories.find(
                    (item) =>
                      item.id === program.categoryId,
                  )?.name || 'برنامج تدريبي';

                return (
                  <article
                    key={program.id}
                    className="training-catalog-card"
                  >
                    <div className="training-card-image">
                      <span>{categoryName}</span>
                      <div>برنامج تدريبي</div>
                    </div>

                    <div className="training-card-body">
                      <h3>{program.title}</h3>

                      <p>
                        {program.shortDescription ||
                          program.description}
                      </p>

                      <div className="training-card-meta">
                        <span>
                          {program.days || 3} أيام
                        </span>

                        <span>
                          مواعيد متعددة
                        </span>

                        <span>
                          {programSchedules.length} موعد
                        </span>
                      </div>

                      <div className="training-card-price">
                        <small>
                          تبدأ الأسعار من
                        </small>

                        <strong>
                          {startingPrice.toLocaleString(
                            'ar-SA',
                          )}{' '}
                          ر.س
                        </strong>
                      </div>

                      <Link
                        href={`/training-program?id=${encodeURIComponent(
                          program.id,
                        )}`}
                        className="btn-primary"
                      >
                        التفاصيل والمواعيد
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}