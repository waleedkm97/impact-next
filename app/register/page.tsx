'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { fetchCatalog } from '@/lib/public-catalog';
import type { Course } from '@/types/course';
import { useLocale } from '@/hooks/use-locale';

export default function RecordedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const { isEnglish } = useLocale();

  useEffect(() => {
    fetchCatalog({ type: 'recorded' }).then(({ courses: catalogCourses }) => setCourses(catalogCourses));
  }, []);

  return (
    <main dir={isEnglish ? 'ltr' : 'rtl'} className="recorded-page">
      <style jsx>{`
        .recorded-page { background:#f5f7fa; min-height:100vh; color:#0a1931; }
        .recorded-hero { padding:90px 24px 40px; text-align:center; background:linear-gradient(180deg,#fff 0%,#f5f7fa 100%); }
        .recorded-hero h1 { margin:0; font-size:clamp(34px,5vw,56px); line-height:1.15; color:#0a1931; font-weight:900; }
        .recorded-hero p { max-width:760px; margin:14px auto 0; color:#69778c; line-height:2; }
        .recorded-grid { width:min(1180px,100%); margin:0 auto; padding:30px 24px 90px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; align-items:stretch; }
        .recorded-card { min-height:560px; height:100%; display:flex; flex-direction:column; background:#fff; border:1px solid #e1e8ef; border-radius:22px; overflow:hidden; box-shadow:0 14px 36px rgba(10,25,49,.06); transition:transform .2s ease, box-shadow .2s ease; }
        .recorded-card:hover { transform:translateY(-5px); box-shadow:0 20px 42px rgba(10,25,49,.10); }
        .recorded-image { height:230px; flex:0 0 230px; background-size:cover; background-position:center; position:relative; }
        .recorded-image::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(7,29,54,.05),rgba(7,29,54,.25)); }
        .recorded-label { position:absolute; z-index:2; top:14px; right:14px; padding:7px 10px; background:#fff; color:#0a1931; border-radius:8px; font-size:11px; font-weight:900; }
        .recorded-body { flex:1; display:flex; flex-direction:column; padding:24px; }
        .recorded-body h3 { margin:0; color:#0a1931; font-size:21px; line-height:1.5; }
        .recorded-body p { margin:14px 0 0; color:#66758a; font-size:13px; line-height:1.95; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden; min-height:125px; }
        .recorded-meta { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px; }
        .recorded-meta span { padding:7px 9px; border-radius:8px; background:#f4f6f8; color:#607086; font-size:11px; }
        .recorded-bottom { margin-top:auto; padding-top:18px; border-top:1px solid #edf0f3; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .recorded-price { color:#0a1931; font-size:19px; font-weight:900; }
        .recorded-button { padding:11px 16px; border-radius:10px; background:#b58a3a; color:#fff; text-decoration:none; font-size:12px; font-weight:900; }
        @media(max-width:900px){.recorded-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:600px){.recorded-grid{grid-template-columns:1fr;padding:20px 18px 60px}.recorded-hero{padding:70px 18px 30px}}
      `}</style>

      <section className="recorded-hero">
        <h1>{isEnglish ? 'Learn on your time, build skills with confidence' : 'تعلّم في وقتك، وطور مهاراتك بثقة'}</h1>
        <p>{isEnglish ? 'Recorded courses you can access and learn from whenever it suits you.' : 'دورات مسجلة يمكنك الوصول إليها والتعلم منها في الوقت المناسب لك.'}</p>
      </section>

      <section className="recorded-grid">
        {courses.map((course) => {
          const description = course.shortDescription || course.description || (isEnglish ? 'A practical recorded learning experience designed for flexible professional development.' : 'دورة تدريبية مسجلة مصممة لتطوير المهارات من خلال تجربة تعلم مرنة وعملية.');
          return (
            <article key={course.id} className="recorded-card">
              <div className="recorded-image" style={{ backgroundImage: `url(${course.image || course.thumbnail || ''})` }}>
                <span className="recorded-label">{isEnglish ? 'Recorded course' : 'دورة مسجلة'}</span>
              </div>
              <div className="recorded-body">
                <h3>{course.title}</h3>
                <p>{description}</p>
                <div className="recorded-meta">
                  {course.hours ? <span>{course.hours} {isEnglish ? 'hours' : 'ساعة'}</span> : null}
                  {course.days ? <span>{course.days} {isEnglish ? 'days' : 'أيام'}</span> : null}
                  <span>{isEnglish ? 'Self-paced' : 'تعلم ذاتي'}</span>
                </div>
                <div className="recorded-bottom">
                  <strong className="recorded-price">{course.price ? `${Number(course.price).toLocaleString(isEnglish ? 'en-US' : 'ar-SA')} ${isEnglish ? 'SAR' : 'ر.س'}` : (isEnglish ? 'Contact us' : 'تواصل معنا')}</strong>
                  <Link href={`/course-details?id=${course.id}`} className="recorded-button">{isEnglish ? 'View details' : 'عرض التفاصيل'}</Link>
                </div>
              </div>
            </article>
          );
        })}
        {!courses.length && <p>{isEnglish ? 'No recorded courses are currently published.' : 'لا توجد دورات مسجلة منشورة حاليًا.'}</p>}
      </section>
    </main>
  );
}
