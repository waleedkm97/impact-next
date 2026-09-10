'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { courseRepository } from '@/lib/data/repositories/course-repository';
import type { Course } from '@/types/course';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCourses() {
      try {
        const publishedCourses = await courseRepository.findPublished({
          sort: 'popularity',
          order: 'desc',
        });

        if (mounted) {
          setCourses(publishedCourses);
        }
      } catch (error) {
        console.error('Failed to load homepage courses:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      mounted = false;
    };
  }, []);

  const recordedCourses = useMemo(
    () =>
      courses
        .filter((course) => course.type === 'recorded')
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            b.createdAt.getTime() - a.createdAt.getTime()
        )
        .slice(0, 6),
    [courses]
  );

  const trainingCourses = useMemo(
    () =>
      courses
        .filter(
          (course) =>
            course.type === 'training' &&
            course.trainingKind === 'public'
        )
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            b.createdAt.getTime() - a.createdAt.getTime()
        )
        .slice(0, 6),
    [courses]
  );

  const totalPublished = courses.length;

  return (
    <main dir="rtl" className="homepage">
      <style jsx>{`
        .homepage {
          background: #ffffff;
          color: #0B2E67
        }

        .section {
          padding: 82px 24px;
        }

        .section-inner {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 12% 20%,
              rgba(162, 115, 48, 0.12),
              transparent 30%
            ),
            linear-gradient(135deg, #F7F9FC 0%, #ffffff 55%, #F2F6FA 100%);
          min-height: 610px;
          display: flex;
          align-items: center;
        }

        .hero-inner {
          width: min(1180px, 100%);
          margin: 0 auto;
          padding: 80px 24px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 70px;
          align-items: center;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #B58A3A;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 18px;
        }

        .eyebrow::before {
          content: '';
          width: 28px;
          height: 2px;
          background: #B58A3A;
        }

        .hero h1 {
          margin: 0;
          max-width: 700px;
          font-size: clamp(40px, 5vw, 66px);
          line-height: 1.12;
          font-weight: 900;
          letter-spacing: -1.5px;
          color: #0B2E67;
        }

        .hero h1 span {
          color: #B58A3A;
        }

        .hero-text {
          max-width: 650px;
          margin: 26px 0 0;
          font-size: 19px;
          line-height: 2;
          color: #667085;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 34px;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          min-height: 50px;
          padding: 0 25px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 800;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .btn-primary {
          background: #0B2E67;
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(39, 49, 61, 0.16);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(39, 49, 61, 0.2);
        }

        .btn-secondary {
          border: 1px solid #D7DFEA;
          background: #ffffff;
          color: #0B2E67;
        }

        .btn-secondary:hover {
          transform: translateY(-2px);
          border-color: #B58A3A;
        }

        .hero-visual {
          position: relative;
          min-height: 410px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-logo-card {
          position: relative;
          width: min(440px, 100%);
          min-height: 340px;
          border-radius: 28px;
          background: #0B2E67;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 45px;
          box-shadow: 0 28px 70px rgba(39, 49, 61, 0.2);
          overflow: hidden;
        }

        .hero-logo-card::before {
          content: '';
          position: absolute;
          width: 280px;
          height: 280px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 50%;
          top: -120px;
          left: -100px;
        }

        .hero-logo-card::after {
          content: '';
          position: absolute;
          width: 220px;
          height: 220px;
          border: 1px solid rgba(162, 115, 48, 0.4);
          border-radius: 50%;
          bottom: -100px;
          right: -80px;
        }

        .hero-logo {
          position: relative;
          z-index: 1;
          width: 230px;
          height: auto;
          object-fit: contain;
        }

        .hero-card-title {
          position: relative;
          z-index: 1;
          margin: 28px 0 0;
          color: #ffffff;
          font-size: 20px;
          font-weight: 800;
          text-align: center;
        }

        .hero-card-subtitle {
          position: relative;
          z-index: 1;
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 14px;
          text-align: center;
        }

        .stats {
          margin-top: -34px;
          position: relative;
          z-index: 2;
          padding: 0 24px 25px;
        }

        .stats-inner {
          width: min(1000px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 16px 45px rgba(39, 49, 61, 0.1);
          overflow: hidden;
        }

        .stat {
          padding: 25px;
          text-align: center;
          border-left: 1px solid #E7ECF3;
        }

        .stat:last-child {
          border-left: 0;
        }

        .stat strong {
          display: block;
          color: #0B2E67;
          font-size: 30px;
          font-weight: 900;
        }

        .stat span {
          display: block;
          margin-top: 5px;
          color: #7A8496;
          font-size: 13px;
        }

        .section-header {
          margin-bottom: 38px;
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 30px;
        }

        .section-header h2 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.25;
          color: #0B2E67;
        }

        .section-header p {
          max-width: 520px;
          margin: 10px 0 0;
          color: #667085;
          line-height: 1.9;
        }

        .section-link {
          flex-shrink: 0;
          color: #B58A3A;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .section-link:hover {
          text-decoration: underline;
        }

        .courses-section {
          background: #ffffff;
        }

        .course-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .course-card {
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #E7ECF3;
          border-radius: 16px;
          box-shadow: 0 8px 28px rgba(39, 49, 61, 0.05);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .course-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 35px rgba(39, 49, 61, 0.1);
        }

        .course-image {
          height: 165px;
          background:
            linear-gradient(
              135deg,
              rgba(59, 41, 50, 0.98),
              rgba(80, 59, 69, 0.92)
            );
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .course-image::before {
          content: '';
          position: absolute;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .course-image-label {
          position: relative;
          z-index: 1;
          padding: 8px 13px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(4px);
        }

        .course-body {
          padding: 22px;
        }

        .course-type {
          color: #B58A3A;
          font-size: 12px;
          font-weight: 800;
        }

        .course-title {
          margin: 9px 0 10px;
          color: #0B2E67;
          font-size: 19px;
          line-height: 1.55;
          font-weight: 850;
        }

        .course-description {
          min-height: 48px;
          margin: 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.8;
        }

        .course-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 17px;
        }

        .course-meta span {
          padding: 6px 9px;
          border-radius: 7px;
          background: #F6F8FB;
          color: #5D687A;
          font-size: 11px;
        }

        .course-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #E7ECF3;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .course-price {
          color: #0B2E67;
          font-size: 17px;
          font-weight: 900;
        }

        .course-price small {
          display: block;
          margin-bottom: 2px;
          color: #8A94A6;
          font-size: 10px;
          font-weight: 500;
        }

        .course-button {
          color: #B58A3A;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
        }

        .course-button:hover {
          text-decoration: underline;
        }

        .empty-state {
          padding: 50px 25px;
          text-align: center;
          border: 1px dashed #D7DFEA;
          border-radius: 16px;
          color: #7A8496;
          grid-column: 1 / -1;
        }

        .services-section {
          background: #F6F8FB;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .service-card {
          background: #ffffff;
          border: 1px solid #E7ECF3;
          border-radius: 14px;
          padding: 28px 22px;
        }

        .service-number {
          color: #B58A3A;
          font-size: 12px;
          font-weight: 900;
        }

        .service-card h3 {
          margin: 18px 0 10px;
          font-size: 18px;
          color: #0B2E67;
        }

        .service-card p {
          margin: 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.9;
        }

        .why-section {
          background: #ffffff;
        }

        .why-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 65px;
          align-items: center;
        }

        .why-copy h2 {
          margin: 0;
          color: #0B2E67;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.3;
        }

        .why-copy > p {
          margin: 20px 0 0;
          color: #667085;
          line-height: 2;
        }

        .benefits {
          display: grid;
          gap: 13px;
          margin-top: 28px;
        }

        .benefit {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 14px 0;
          border-bottom: 1px solid #E7ECF3;
        }

        .benefit-mark {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #EEF2F7;
          color: #B58A3A;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
        }

        .benefit strong {
          display: block;
          color: #0B2E67;
          font-size: 14px;
        }

        .benefit span {
          display: block;
          margin-top: 4px;
          color: #7A8496;
          font-size: 12px;
        }

        .why-panel {
          min-height: 390px;
          padding: 42px;
          border-radius: 24px;
          background: #0B2E67;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 25px 55px rgba(39, 49, 61, 0.16);
        }

        .why-panel small {
          color: #D8B56A;
          font-weight: 800;
        }

        .why-panel h3 {
  margin: 15px 0;
  font-size: 30px;
  line-height: 1.4;
  color: #ffffff;
}

        .why-panel p {
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
          line-height: 2;
          font-size: 14px;
        }

        .cta-section {
          padding-top: 30px;
          padding-bottom: 90px;
        }

        .cta-box {
          padding: 55px;
          border-radius: 24px;
          background:
            linear-gradient(
              135deg,
              #0B2E67 0%,
              #163F80 60%,
              #1E4A8F 100%
            );
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 40px;
        }

        .cta-box h2 {
          margin: 0;
          font-size: clamp(25px, 3vw, 36px);
        }

        .cta-box p {
          max-width: 650px;
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.9;
        }

        .cta-button {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          padding: 0 27px;
          border-radius: 10px;
          background: #ffffff;
          color: #0B2E67;
          text-decoration: none;
          font-size: 14px;
          font-weight: 900;
        }

        .loading {
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7A8496;
          grid-column: 1 / -1;
        }

        @media (max-width: 900px) {
          .hero-inner,
          .why-grid {
            grid-template-columns: 1fr;
          }

          .hero {
            min-height: auto;
          }

          .hero-inner {
            padding-top: 65px;
            padding-bottom: 75px;
            gap: 45px;
          }

          .hero-copy {
            text-align: center;
          }

          .hero h1,
          .hero-text {
            margin-left: auto;
            margin-right: auto;
          }

          .hero-actions {
            justify-content: center;
          }

          .course-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .services-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .section-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .cta-box {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 600px) {
          .section {
            padding: 60px 18px;
          }

          .hero-inner {
            padding-left: 18px;
            padding-right: 18px;
          }

          .hero h1 {
            font-size: 39px;
          }

          .hero-text {
            font-size: 16px;
          }

          .hero-visual {
            min-height: 300px;
          }

          .hero-logo-card {
            min-height: 285px;
            padding: 30px;
          }

          .hero-logo {
            width: 190px;
          }

          .stats-inner {
            grid-template-columns: 1fr;
          }

          .stat {
            border-left: 0;
            border-bottom: 1px solid #E7ECF3;
          }

          .stat:last-child {
            border-bottom: 0;
          }

          .course-grid,
          .services-grid {
            grid-template-columns: 1fr;
          }

          .why-panel {
            min-height: 300px;
            padding: 30px;
          }

          .cta-box {
            padding: 34px 25px;
          }

          .cta-button {
            width: 100%;
          }
        }
      `}</style>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">Impact Training</div>

            <h1>
              نطوّر المهارات،
              <br />
              <span>ونصنع الأثر.</span>
            </h1>

            <p className="hero-text">
              حلول تدريبية متخصصة تساعد الأفراد والمنشآت على تطوير المهارات،
              رفع مستوى الأداء، وتحقيق نتائج عملية قابلة للقياس.
            </p>

            <div className="hero-actions">
              <Link href="/training-courses" className="btn-primary">
                استكشف الدورات التدريبية
              </Link>

              <Link href="/recorded-courses" className="btn-secondary">
                الدورات المسجلة
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-logo-card">
              <Image
                src="/assets/logo/logo_white-remove.png"
                alt="Impact Training"
                width={260}
                height={120}
                className="hero-logo"
                priority
              />

              <div className="hero-card-title">
                تدريب يركز على النتائج
              </div>

              <div className="hero-card-subtitle">
                حلول تدريبية للأفراد والمنشآت
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats">
        <div className="stats-inner">
          <div className="stat">
            <strong>{loading ? '—' : totalPublished}</strong>
            <span>دورة وبرنامج منشور</span>
          </div>

          <div className="stat">
            <strong>مرن</strong>
            <span>حضوري وأونلاين ومسجل</span>
          </div>

          <div className="stat">
            <strong>متكامل</strong>
            <span>تدريب وتقييم وشهادات</span>
          </div>
        </div>
      </section>

      {/* Training Courses */}
      <section className="section courses-section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2>البرامج التدريبية</h2>
              <p>
                برامج تدريبية منشورة ومتاحة للأفراد، مع مواعيد تنفيذ متعددة
                حسب البرنامج.
              </p>
            </div>

            <Link href="/training-courses" className="section-link">
              عرض جميع البرامج
            </Link>
          </div>

          <div className="course-grid">
            {loading ? (
              <div className="loading">جاري تحميل البرامج التدريبية...</div>
            ) : trainingCourses.length === 0 ? (
              <div className="empty-state">
                لا توجد برامج تدريبية منشورة حاليًا.
              </div>
            ) : (
              trainingCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recorded Courses */}
      <section className="section courses-section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2>الدورات المسجلة</h2>
              <p>
                تعلّم بمرونة وفي الوقت الذي يناسبك من خلال الدورات المسجلة
                المتاحة على المنصة.
              </p>
            </div>

            <Link href="/recorded-courses" className="section-link">
              عرض جميع الدورات المسجلة
            </Link>
          </div>

          <div className="course-grid">
            {loading ? (
              <div className="loading">جاري تحميل الدورات المسجلة...</div>
            ) : recordedCourses.length === 0 ? (
              <div className="empty-state">
                لا توجد دورات مسجلة منشورة حاليًا.
              </div>
            ) : (
              recordedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section services-section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2>حلول تدريبية للمنشآت</h2>
              <p>
                لا نقدم دورة فقط، بل نساعد المنشآت على بناء حلول تدريبية
                تتناسب مع احتياجات فرق العمل وأهدافها.
              </p>
            </div>

            <Link href="/services" className="section-link">
              استكشف خدماتنا
            </Link>
          </div>

          <div className="services-grid">
            <article className="service-card">
              <span className="service-number">01</span>
              <h3>التدريب المؤسسي</h3>
              <p>
                برامج تدريبية مصممة للمنشآت والفرق وفق الاحتياجات والأهداف
                المهنية.
              </p>
            </article>

            <article className="service-card">
              <span className="service-number">02</span>
              <h3>التقييمات المهنية</h3>
              <p>
                حلول تساعد المنشآت على قياس المهارات وتحديد فرص التطوير.
              </p>
            </article>

            <article className="service-card">
              <span className="service-number">03</span>
              <h3>التعلم الإلكتروني</h3>
              <p>
                محتوى تدريبي رقمي وتجارب تعلم مرنة تدعم التعلم المستمر.
              </p>
            </article>

            <article className="service-card">
              <span className="service-number">04</span>
              <h3>الاستشارات التدريبية</h3>
              <p>
                دعم متخصص لتصميم وتنفيذ حلول تدريبية متكاملة للمنشآت.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Why Impact */}
      <section className="section why-section">
        <div className="section-inner">
          <div className="why-grid">
            <div className="why-copy">
              <h2>
                التدريب الذي يتحول
                <br />
                إلى أثر في العمل.
              </h2>

              <p>
                نركز على تقديم تجارب تدريبية عملية تجمع بين جودة المحتوى،
                خبرة المدربين، واحتياجات سوق العمل.
              </p>

              <div className="benefits">
                <div className="benefit">
                  <div className="benefit-mark">01</div>
                  <div>
                    <strong>محتوى عملي</strong>
                    <span>يرتبط بالمهارات والتحديات الفعلية في بيئة العمل.</span>
                  </div>
                </div>

                <div className="benefit">
                  <div className="benefit-mark">02</div>
                  <div>
                    <strong>خيارات تدريب متعددة</strong>
                    <span>حضوري، أونلاين مباشر، ودورات مسجلة.</span>
                  </div>
                </div>

                <div className="benefit">
                  <div className="benefit-mark">03</div>
                  <div>
                    <strong>تجربة تدريب متكاملة</strong>
                    <span>من التسجيل وحتى التقييم والشهادة.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="why-panel">
              <small>IMPACT TRAINING</small>

              <h3>
                نؤمن أن التدريب الحقيقي
                <br />
                يبدأ من احتياج واضح.
              </h3>

              <p>
                لذلك نصمم حلولنا التدريبية لتكون مرتبطة بالأهداف، قابلة
                للتطبيق، ومناسبة للأفراد والمنشآت.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="section-inner">
          <div className="cta-box">
            <div>
              <h2>هل تبحث عن حل تدريبي لمنشأتك؟</h2>

              <p>
                تواصل معنا لمناقشة احتياجكم وتصميم الحل التدريبي المناسب.
              </p>
            </div>

            <Link href="/contact" className="cta-button">
              تواصل معنا
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function CourseCard({ course }: { course: Course }) {
  const isRecorded = course.type === 'recorded';

  const href = isRecorded
    ? `/course-details?id=${encodeURIComponent(course.id)}`
    : `/training-program?id=${encodeURIComponent(course.id)}`;

  const description =
    course.shortDescription ||
    course.description ||
    'برنامج تدريبي متخصص مصمم لتطوير المهارات وتحقيق نتائج عملية.';

  const duration =
    course.days && course.days > 0
      ? `${course.days} ${course.days === 1 ? 'يوم' : 'أيام'}`
      : course.hours && course.hours > 0
        ? `${course.hours} ساعة`
        : null;


  return (
    <article className="course-card">
      <div className="course-image">
        <span className="course-image-label">
          {isRecorded ? 'دورة مسجلة' : 'برنامج تدريبي'}
        </span>
      </div>

      <div className="course-body">
        <div className="course-type">
          {course.featured ? 'برنامج مميز' : 'Impact Training'}
        </div>

        <h3 className="course-title">{course.title}</h3>

        <p className="course-description">{description}</p>

        <div className="course-meta">
          {duration && <span>{duration}</span>}

          <span>
            {isRecorded ? 'تعلم مرن' : 'تدريب مهني'}
          </span>

          {course.delivery && (
            <span>
              {course.delivery === 'online'
                ? 'أونلاين'
                : 'حضوري'}
            </span>
          )}
        </div>

        <div className="course-footer">
          <Link href={href} className="course-button">
            عرض التفاصيل
          </Link>
        </div>
      </div>
    </article>
  );
}