'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchCatalog } from '@/lib/public-catalog';
import { useLocale } from '@/hooks/use-locale';
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

const cityNames: Record<string, string> = {
  الرياض: 'Riyadh', جدة: 'Jeddah', الدمام: 'Dammam', دبي: 'Dubai',
  القاهرة: 'Cairo', البحرين: 'Bahrain', قطر: 'Qatar', لندن: 'London',
  برشلونة: 'Barcelona', ميلان: 'Milan',
};

export default function TrainingCourses() {
  const searchParams = useSearchParams();
  const { isEnglish } = useLocale();
  const [programs, setPrograms] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [month, setMonth] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
            const catalog = await fetchCatalog({
              type: 'training',
              includeSchedules: true,
            });

        if (!active) return;

        setPrograms(catalog.courses);
        setSchedules(catalog.schedules);
        setCategories(
          catalog.categories.map((item) => ({
            id: item.id,
            name: item.name,
          })),
        );
        const requestedCategory = searchParams.get('category');
        if (requestedCategory) setCategory(requestedCategory);
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
  }, [searchParams]);

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

        const matchesDelivery =
          !deliveryMode ||
          program.delivery === deliveryMode ||
          (deliveryMode === 'online' && programSchedules.some((schedule) => (schedule.city || '') === 'Online'));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCity &&
        matchesMonth &&
        matchesDelivery
      );
    });
  }, [
    programs,
    schedules,
    search,
    category,
    city,
    month,
    deliveryMode,
  ]);

  if (loading) {
    return (
      <main dir={isEnglish ? 'ltr' : 'rtl'}>
        <section className="training-catalog-hero">
          <div className="section-inner">
            {isEnglish ? 'Loading training courses...' : 'جاري تحميل الدورات التدريبية...'}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main dir={isEnglish ? 'ltr' : 'rtl'}>
      <section className="training-catalog-hero">
        <div className="section-inner">
          <div className="catalog-top-links">
              <span>{isEnglish ? 'Professional training' : 'دورة تدريبية معتمدة'}</span>
            <span>{isEnglish ? 'Expert facilitators' : 'مدرب معتمد'}</span>
            <span>
              {isEnglish ? 'Training locations across the region' : 'مدن تدريب حول المملكة والخليج'}
            </span>
          </div>

          <div className="training-filter-box">
            <div className="filter-field filter-search">
              <label>{isEnglish ? 'Search courses' : 'ابحث عن دورة'}</label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={isEnglish ? 'Course title or keyword' : 'اسم الدورة أو الكلمة المفتاحية'}
              />
            </div>

            <div className="filter-field">
              <label>{isEnglish ? 'Category' : 'التصنيف'}</label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                <option value="">
                  {isEnglish ? 'All categories' : 'كل التصنيفات'}
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
              <label>{isEnglish ? 'City' : 'المدينة'}</label>

              <select
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
              >
                <option value="">{isEnglish ? 'All cities' : 'كل المدن'}</option>

                {cities.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item === 'Online'
                      ? (isEnglish ? 'Online' : 'أونلاين')
                      : (isEnglish ? cityNames[item] ?? item : item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>{isEnglish ? 'Month' : 'الشهر'}</label>

              <select
                value={month}
                onChange={(event) =>
                  setMonth(event.target.value)
                }
              >
                <option value="">
                  {isEnglish ? 'All months' : 'كل الأشهر'}
                </option>

                {months.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {isEnglish
                      ? new Date(2026, Number(item.value) - 1, 1).toLocaleDateString('en-US', { month: 'long' })
                      : item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>{isEnglish ? 'Delivery' : 'طريقة الحضور'}</label>
              <select value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value)}>
                <option value="">{isEnglish ? 'All methods' : 'كل الطرق'}</option>
                <option value="in_person">{isEnglish ? 'In-person' : 'حضوري'}</option>
                <option value="online">{isEnglish ? 'Online' : 'أونلاين'}</option>
              </select>
            </div>

            <button
              className="catalog-search-btn"
              onClick={() => undefined}
              type="button"
            >
              {isEnglish ? 'Search' : 'بحث'}
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
              {isEnglish ? 'All courses' : 'كل الدورات'}
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
            {isEnglish ? `${visible.length} of ${programs.length} courses` : `عرض ${visible.length} من أصل ${programs.length} دورة`}
          </div>

          {visible.length === 0 ? (
            <div className="catalog-empty">
              {isEnglish ? 'No courses match your filters.' : 'لا توجد دورات مطابقة لخيارات البحث.'}
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
                  )?.name || (isEnglish ? 'Training program' : 'برنامج تدريبي');

                return (
                  <article
                    key={program.id}
                    className="training-catalog-card"
                  >
                    <div className="training-card-image" style={{ backgroundImage: `url(${program.image || program.thumbnail || ''})` }}>
                      <span>{categoryName}</span>
                    </div>

                    <div className="training-card-body">
                      <h3>{program.title}</h3>

                      <p>
                        {program.shortDescription ||
                          program.description}
                      </p>

                      <div className="training-card-meta">
                        <span>
                          {program.days || 3} {isEnglish ? 'days' : 'أيام'}
                        </span>

                        <span>
                          {isEnglish ? 'Multiple dates' : 'مواعيد متعددة'}
                        </span>

                        <span>
                          {programSchedules.length} {isEnglish ? 'dates' : 'موعد'}
                        </span>
                      </div>

                      <div className="training-card-price">
                        <small>
                          {isEnglish ? 'Starting from' : 'تبدأ الأسعار من'}
                        </small>

                        <strong>
                          {startingPrice.toLocaleString(isEnglish ? 'en-US' : 'ar-SA')}{' '}
                          {isEnglish ? 'SAR' : 'ر.س'}
                        </strong>
                      </div>

                      <Link
                        href={`/training-program?id=${encodeURIComponent(
                          program.id,
                        )}`}
                        className="btn-primary"
                      >
                        {isEnglish ? 'Details and dates' : 'التفاصيل والمواعيد'}
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