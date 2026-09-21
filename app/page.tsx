'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { fetchCatalog } from '@/lib/public-catalog';
import type { Course } from '@/types/course';
import { useLocale } from '@/hooks/use-locale';
import HomeCarousel from '@/components/ui/HomeCarousel';

const SATISFACTION_RATE = 95;
const TRAINER_COUNT = 3000;

export default function HomePage() {
  const { isEnglish } = useLocale();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; description?: string | null }>
  >([]);
  const [totalCourseCount, setTotalCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        const catalog = await fetchCatalog({ featured: true });
        if (!mounted) return;

        setCourses(catalog.courses);
        setCategories(
          catalog.categories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
          })),
        );
        setTotalCourseCount(catalog.totalCount);
      } catch (error) {
        console.error('Failed to load homepage catalog:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const featuredCourses = useMemo(
    () =>
      [...courses].sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    [courses],
  );

  return (
    <main dir={isEnglish ? 'ltr' : 'rtl'} className="impact-home-final">
      <style jsx global>{`
        /* ===============================
           IMPACT HOMEPAGE FINAL VISUAL SYSTEM
           =============================== */
        .impact-home-final {
          --navy: #071d36;
          --navy-2: #0b2748;
          --navy-3: #153e6c;
          --gold: #b58a3a;
          --gold-light: #ead3a0;
          --ink: #0b2545;
          --muted: #6b778b;
          --soft: #f4f6f8;
          --line: #e5e9ef;
          background: #fff;
          color: var(--ink);
          overflow: hidden;
        }

        /* ===== NAVBAR: HOMEPAGE MERGES INTO HERO ===== */
        .navbar.navbar-home {
          position: absolute !important;
          inset: 0 0 auto 0 !important;
          width: 100% !important;
          z-index: 100 !important;
          background: rgba(7, 29, 54, 0.22) !important;
          border-bottom: 1px solid rgba(255,255,255,.16) !important;
          box-shadow: none !important;
          backdrop-filter: blur(5px) !important;
          -webkit-backdrop-filter: blur(5px) !important;
        }

        .navbar.navbar-home .nav-container {
          height: 82px !important;
        }

        .navbar.navbar-home .nav-links a,
        .navbar.navbar-home .nav-services-trigger,
        .navbar.navbar-home .nav-language,
        .navbar.navbar-home .nav-search {
          color: #fff !important;
        }

        .navbar.navbar-home .nav-links a:hover,
        .navbar.navbar-home .nav-services-trigger:hover,
        .navbar.navbar-home .nav-links a[aria-current='page'] {
          color: #e3bf72 !important;
          background: rgba(255,255,255,.08) !important;
        }

        .navbar.navbar-home .nav-login {
          background: #b58a3a !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,.12) !important;
          box-shadow: 0 8px 22px rgba(0,0,0,.18) !important;
        }

        .navbar.navbar-home .nav-search {
          background: rgba(255,255,255,.10) !important;
          border: 1px solid rgba(255,255,255,.18) !important;
        }

        .navbar.navbar-home .nav-language {
          background: transparent !important;
          border: 0 !important;
          width: 38px !important;
          min-width: 38px !important;
          height: 38px !important;
          padding: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 50% !important;
        }

        /* ===== HERO ===== */
        .impact-home-final .hero {
          position: relative;
          min-height: 575px;
          height: 575px;
          overflow: hidden;
          background: var(--navy);
          isolation: isolate;
        }

        .impact-home-final .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            linear-gradient(90deg,
              rgba(7,29,54,.98) 0%,
              rgba(7,29,54,.90) 22%,
              rgba(7,29,54,.62) 45%,
              rgba(7,29,54,.18) 70%,
              rgba(7,29,54,.02) 100%),
            url('/assets/hero/riyadh-hero.png') center right / cover no-repeat;
        }

        .impact-home-final .hero::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            linear-gradient(180deg, rgba(7,29,54,.04) 0%, rgba(7,29,54,.02) 58%, rgba(7,29,54,.32) 100%);
          pointer-events: none;
        }

        .impact-home-final .hero-inner {
          position: relative;
          z-index: 2;
          width: min(1280px, calc(100% - 64px));
          height: 100%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
          align-items: center;
          gap: 40px;
          direction: ltr;
        }

        .impact-home-final .hero-copy {
          direction: rtl;
          color: #fff;
          max-width: 700px;
          padding-top: 40px;
          padding-bottom: 28px;
        }

        .impact-home-final .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: #ddb25f;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: .7px;
          margin-bottom: 16px;
        }

        .impact-home-final .eyebrow::before {
          content: '';
          width: 34px;
          height: 2px;
          background: #ddb25f;
          border-radius: 99px;
        }

        .impact-home-final .hero h1 {
          margin: 0;
          max-width: 650px;
          color: #fff;
          font-size: clamp(42px, 5.5vw, 76px);
          line-height: 1.08;
          font-weight: 900;
          letter-spacing: -1.8px;
          text-wrap: balance;
        }

        .impact-home-final .hero h1 span {
          color: #ddb25f;
        }

        .impact-home-final .hero-text {
          max-width: 660px;
          margin: 22px 0 0;
          color: rgba(255,255,255,.86);
          font-size: 18px;
          line-height: 1.9;
        }

        .impact-home-final .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .impact-home-final .hero-actions a {
          min-height: 52px;
          padding: 0 25px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
          transition: .2s ease;
        }

        .impact-home-final .hero-primary {
          background: var(--gold);
          color: #fff;
          box-shadow: 0 12px 24px rgba(0,0,0,.16);
        }

        .impact-home-final .hero-primary:hover {
          transform: translateY(-2px);
          background: #c39a4a;
        }

        .impact-home-final .hero-secondary {
          color: #fff;
          background: transparent;
          border: 1px solid rgba(255,255,255,.42);
        }

        .impact-home-final .hero-secondary:hover {
          transform: translateY(-2px);
          border-color: #fff;
          background: rgba(255,255,255,.08);
        }

        /* Deliberately empty: the image is the full hero background. */
        .impact-home-final .hero-visual {
          display: none;
        }

        /* ===== STATS: FULLY SEPARATE SECTION ===== */
.impact-home-final .stats-wrap {
  position: relative;
  z-index: 2;
  margin-top: 0;
  padding: 64px 24px 72px;
  background: #fff;
}

        .impact-home-final .stats-card {
          width: min(1080px, 100%);
          margin: 0 auto;
          min-height: 155px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background: #fff;
          border: 1px solid #e4e8ef;
          border-radius: 20px;
          box-shadow: 0 18px 50px rgba(7,29,54,.14);
          overflow: hidden;
        }

        .impact-home-final .stat {
          min-height: 155px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 24px;
          position: relative;
        }

        .impact-home-final .stat + .stat {
          border-inline-start: 1px solid #e6eaf0;
        }

        .impact-home-final .stat-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #f8f2e8;
          color: var(--gold);
          margin-bottom: 10px;
        }

        .impact-home-final .stat-icon svg {
          width: 22px;
          height: 22px;
          display: block;
        }

        .impact-home-final .stat strong {
          color: var(--ink);
          font-size: 32px;
          font-weight: 900;
          line-height: 1;
        }

        .impact-home-final .stat-label {
          margin-top: 8px;
          color: #7a8799;
          font-size: 13px;
        }

        /* ===== TOPICS ===== */
        .impact-home-final .topics-section {
          background: #fff;
          padding: 88px 24px 58px;
        }

        .impact-home-final .section-inner {
          width: min(1220px, 100%);
          margin: 0 auto;
        }

        .impact-home-final .section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 30px;
        }

        .impact-home-final .section-head h2 {
          margin: 0;
          color: var(--ink);
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.15;
          font-weight: 900;
        }

        .impact-home-final .section-head p {
          margin: 10px 0 0;
          color: var(--muted);
          line-height: 1.8;
        }

        .impact-home-final .section-link {
          flex-shrink: 0;
          color: var(--gold);
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
        }

        .impact-home-final .home-category-card-final {
          height: 150px;
          min-height: 150px;
          width: 100%;
          box-sizing: border-box;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          color: #fff !important;
          background: linear-gradient(145deg, #0a2748, #123c69) !important;
          border: 1px solid rgba(181,138,58,.55) !important;
          border-radius: 18px !important;
          text-decoration: none !important;
          box-shadow: 0 10px 24px rgba(7,29,54,.09) !important;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }

        .impact-home-final .home-category-card-final:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 30px rgba(7,29,54,.14) !important;
          border-color: #ddb25f !important;
        }

        .impact-home-final .topic-index {
          color: #ddb25f;
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
        }

        .impact-home-final .topic-title {
          color: #fff;
          font-size: 18px;
          line-height: 1.4;
          font-weight: 900;
        }

        .impact-home-final .topic-arrow {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #f6ead1;
          color: var(--navy);
          font-size: 18px;
          font-weight: 900;
        }

        /* ===== COURSES ===== */
        .impact-home-final .courses-section {
          background: var(--soft);
          padding: 78px 24px 88px;
        }

        .impact-home-final .course-card-final {
          height: 420px;
          min-height: 420px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e2e7ed;
          border-radius: 18px;
          box-shadow: 0 10px 28px rgba(7,29,54,.06);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .impact-home-final .course-card-final:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 34px rgba(7,29,54,.12);
        }

        .impact-home-final .course-thumb {
          height: 170px;
          min-height: 170px;
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }

        .impact-home-final .course-thumb::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(7,29,54,0) 48%, rgba(7,29,54,.26) 100%);
        }

        .impact-home-final .course-badge {
          position: absolute;
          z-index: 2;
          top: 12px;
          inset-inline-end: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          color: var(--ink);
          font-size: 11px;
          font-weight: 900;
        }

        .impact-home-final .course-body-final {
          flex: 1;
          min-height: 0;
          padding: 17px 18px 16px;
          display: flex;
          flex-direction: column;
        }

        .impact-home-final .course-kicker {
          color: var(--gold);
          font-size: 11px;
          font-weight: 900;
        }

        .impact-home-final .course-title-final {
          margin: 7px 0 8px;
          min-height: 48px;
          color: var(--ink);
          font-size: 17px;
          line-height: 1.45;
          font-weight: 900;
        }

        .impact-home-final .course-desc-final {
          min-height: 50px;
          margin: 0;
          color: #677487;
          font-size: 12.5px;
          line-height: 1.75;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }

        .impact-home-final .course-meta-final {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: auto;
          padding-top: 14px;
        }

        .impact-home-final .course-meta-final span {
          padding: 6px 8px;
          border-radius: 7px;
          background: #f6f8fb;
          color: #667388;
          font-size: 10px;
        }

        .impact-home-final .course-foot-final {
          margin-top: 13px;
          padding-top: 12px;
          border-top: 1px solid #edf0f4;
          display: flex;
          justify-content: flex-end;
        }

        .impact-home-final .course-button-final {
          color: var(--ink);
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
        }

        .impact-home-final .course-button-final:hover {
          color: var(--gold);
        }

        /* ===== SERVICES ===== */
        .impact-home-final .services-section {
          background: #fff;
          padding: 84px 24px;
        }

        .impact-home-final .services-grid-final {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 18px;
        }

        .impact-home-final .service-card-final {
          min-height: 215px;
          padding: 24px;
          background: #fff;
          border: 1px solid #e1e7ee;
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(7,29,54,.05);
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }

        .impact-home-final .service-card-final:hover {
          transform: translateY(-4px);
          border-color: #d8bc81;
          box-shadow: 0 16px 30px rgba(7,29,54,.09);
        }

        .impact-home-final .service-number {
          color: var(--gold);
          font-size: 12px;
          font-weight: 900;
        }

        .impact-home-final .service-card-final h3 {
          margin: 18px 0 9px;
          color: var(--ink);
          font-size: 19px;
          line-height: 1.4;
          font-weight: 900;
        }

        .impact-home-final .service-card-final p {
          margin: 0;
          color: var(--muted);
          line-height: 1.9;
          font-size: 13px;
        }

        /* ===== CORPORATE CTA ===== */
        .impact-home-final .why-section {
          background: var(--soft);
          padding: 84px 24px;
        }

        .impact-home-final .why-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
          gap: 60px;
          align-items: center;
        }

        .impact-home-final .why-copy h2 {
          margin: 0;
          color: var(--ink);
          font-size: clamp(32px, 4vw, 52px);
          line-height: 1.18;
          font-weight: 900;
        }

        .impact-home-final .why-copy > p {
          margin: 18px 0 0;
          color: var(--muted);
          line-height: 2;
        }

        .impact-home-final .benefits-final {
          display: grid;
          gap: 14px;
          margin-top: 26px;
        }

        .impact-home-final .benefit-final {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e0e6ed;
        }

        .impact-home-final .benefit-mark {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #f8f2e8;
          color: var(--gold);
          font-size: 11px;
          font-weight: 900;
        }

        .impact-home-final .benefit-final strong {
          display: block;
          color: var(--ink);
          font-size: 14px;
        }

        .impact-home-final .benefit-final span {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 12px;
        }

        .impact-home-final .why-panel-final {
          min-height: 360px;
          padding: 36px;
          border-radius: 24px;
          background: linear-gradient(145deg, var(--navy), var(--navy-3));
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-shadow: 0 22px 50px rgba(7,29,54,.16);
        }

        .impact-home-final .why-panel-final small {
          color: #ddb25f;
          font-weight: 900;
        }

        .impact-home-final .why-panel-final h3 {
          margin: 15px 0;
          color: #fff;
          font-size: 31px;
          line-height: 1.4;
        }

        .impact-home-final .why-panel-final p {
          margin: 0;
          color: rgba(255,255,255,.76);
          line-height: 2;
          font-size: 14px;
        }

        .impact-home-final .cta-section {
          padding: 40px 24px 90px;
          background: #fff;
        }

        .impact-home-final .cta-box-final {
          min-height: 220px;
          padding: 36px 44px;
          border-radius: 24px;
          background: linear-gradient(135deg, var(--navy), var(--navy-3));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 36px;
        }

        .impact-home-final .cta-box-final h2 {
          margin: 0;
          font-size: clamp(25px, 3vw, 38px);
          line-height: 1.25;
        }

        .impact-home-final .cta-box-final p {
          margin: 12px 0 0;
          max-width: 700px;
          color: rgba(255,255,255,.72);
          line-height: 1.9;
        }

        .impact-home-final .cta-button-final {
          min-height: 52px;
          padding: 0 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 11px;
          background: #fff;
          color: var(--ink);
          text-decoration: none;
          font-size: 14px;
          font-weight: 900;
        }

        /* ===== HOME CAROUSEL PRESENTATION ===== */
        .impact-home-final .home-carousel {
          position: relative;
          width: 100%;
        }

        .impact-home-final .home-carousel-viewport {
          width: 100%;
          overflow: visible;
        }

        .impact-home-final .home-carousel-track {
          display: grid !important;
          grid-template-columns: repeat(var(--per-view), minmax(0, 1fr)) !important;
          gap: 18px !important;
          width: 100% !important;
          align-items: stretch !important;
        }

        .impact-home-final .home-carousel-item {
          min-width: 0 !important;
          width: 100% !important;
          display: flex !important;
        }

        .impact-home-final .home-carousel-item > * {
          width: 100% !important;
        }

        .impact-home-final .home-carousel-arrow {
          width: 42px !important;
          height: 42px !important;
          border: 1px solid #dfe5ec !important;
          background: #fff !important;
          color: var(--ink) !important;
          box-shadow: 0 8px 18px rgba(7,29,54,.08) !important;
          border-radius: 50% !important;
          display: grid !important;
          place-items: center !important;
          font-size: 23px !important;
          z-index: 10 !important;
        }

        .impact-home-final .home-carousel-arrow:disabled {
          opacity: .36;
          cursor: not-allowed;
        }

        .impact-home-final .home-carousel-arrow:hover:not(:disabled) {
          border-color: #d8bc81 !important;
          color: var(--gold) !important;
        }

        @media (max-width: 1050px) {
          .impact-home-final .hero-inner {
            width: min(100% - 40px, 920px);
            grid-template-columns: 1fr;
          }

          .impact-home-final .hero-copy {
            width: min(760px, 100%);
            padding-inline: 26px;
          }

          .impact-home-final .hero::before {
            background:
              linear-gradient(90deg, rgba(7,29,54,.93), rgba(7,29,54,.66) 55%, rgba(7,29,54,.20)),
              url('/assets/hero/riyadh-hero.png') center right / cover no-repeat;
          }

          .impact-home-final .services-grid-final {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }
        }

        @media (max-width: 720px) {
          .impact-home-final .hero,
          .impact-home-final .hero-inner {
            min-height: 610px;
            height: 610px;
          }

          .impact-home-final .hero-inner {
            width: min(100% - 28px, 620px);
          }

          .impact-home-final .hero-copy {
            padding-top: 95px;
            text-align: center;
            align-items: center;
          }

          .impact-home-final .hero h1 {
            font-size: 44px;
          }

          .impact-home-final .hero-text {
            font-size: 15px;
          }

          .impact-home-final .hero-actions {
            justify-content: center;
          }

          .impact-home-final .stats-wrap {
            margin-top: -25px;
          }

          .impact-home-final .stats-card {
            grid-template-columns: 1fr;
            min-height: 0;
          }

          .impact-home-final .stat {
            min-height: 125px;
          }

          .impact-home-final .stat + .stat {
            border-inline-start: 0;
            border-top: 1px solid #e6eaf0;
          }

          .impact-home-final .section-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .impact-home-final .course-card-final {
            height: 405px;
            min-height: 405px;
          }

          .impact-home-final .services-grid-final,
          .impact-home-final .why-grid {
            grid-template-columns: 1fr;
          }

          .impact-home-final .cta-box-final {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">Impact Training</div>
            <h1>
              {isEnglish ? 'We develop skills,' : 'نطوّر المهارات،'}
              <br />
              <span>{isEnglish ? 'and create impact.' : 'ونصنع الأثر.'}</span>
            </h1>
            <p className="hero-text">
              {isEnglish
                ? 'Specialized learning solutions that help people and organizations build skills, improve performance, and deliver measurable results.'
                : 'حلول تدريبية متخصصة تساعد الأفراد والمنشآت على تطوير المهارات، رفع مستوى الأداء، وتحقيق نتائج عملية قابلة للقياس.'}
            </p>
            <div className="hero-actions">
              <Link href="/training-courses" className="hero-primary">
                {isEnglish ? 'Explore training programs' : 'استكشف الدورات التدريبية'}
              </Link>
              <Link href="/recorded-courses" className="hero-secondary">
                {isEnglish ? 'Recorded courses' : 'الدورات المسجلة'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-wrap" aria-label={isEnglish ? 'Impact statistics' : 'إحصائيات Impact'}>
        <div className="stats-card">
          <div className="stat">
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <strong>+{TRAINER_COUNT.toLocaleString('en-US')}</strong>
            <span className="stat-label">{isEnglish ? 'Trainers' : 'مدرب ومدربة'}</span>
          </div>

          <div className="stat">
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 5.5C4 4.67 4.67 4 5.5 4H12V20H5.5C4.67 20 4 19.33 4 18.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M20 5.5C20 4.67 19.33 4 18.5 4H12V20H18.5C19.33 20 20 19.33 20 18.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </span>
            <strong>{loading ? '—' : totalCourseCount}</strong>
            <span className="stat-label">{isEnglish ? 'Training programs' : 'برنامج تدريبي'}</span>
          </div>

          <div className="stat">
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3l2.47 5.01 5.53.8-4 3.9.94 5.5L12 15.7l-4.94 2.51.94-5.5-4-3.9 5.53-.8L12 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </span>
            <strong>+{SATISFACTION_RATE}%</strong>
            <span className="stat-label">{isEnglish ? 'Customer satisfaction' : 'معدل رضا العملاء'}</span>
          </div>
        </div>
      </section>

      <section className="topics-section">
        <div className="section-inner">
          <div className="section-head">
            <div>
              <div className="eyebrow">{isEnglish ? 'Development tracks' : 'مسارات التطوير'}</div>
              <h2>{isEnglish ? 'Training topics' : 'موضوعات التدريب'}</h2>
              <p>{isEnglish ? 'Choose a professional field that matches your goals.' : 'اختر المجال التدريبي الذي يناسب احتياجك.'}</p>
            </div>
            <Link href="/training-courses" className="section-link">
              {isEnglish ? 'View all topics' : 'عرض جميع الموضوعات'}
            </Link>
          </div>

          <HomeCarousel
            items={categories}
            ariaLabel={isEnglish ? 'Training topics' : 'موضوعات التدريب'}
            itemsPerView={{ mobile: 1, tablet: 3, desktop: 6 }}
            keyExtractor={(category) => category.id}
            renderItem={(category, index) => (
              <Link
                href={`/training-courses?category=${encodeURIComponent(category.id)}`}
                className="home-category-card-final"
              >
                <span className="topic-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="topic-title">{category.name}</span>
                <span className="topic-arrow" aria-hidden="true">→</span>
              </Link>
            )}
          />
        </div>
      </section>

      <section className="courses-section">
        <div className="section-inner">
          <div className="section-head">
            <div>
              <div className="eyebrow">{isEnglish ? 'Featured learning' : 'التدريب المميز'}</div>
              <h2>{isEnglish ? 'Latest training courses' :'أبرز الدورات التدريبية'}</h2>
              <p>{isEnglish ? 'Discover selected programs designed for practical impact.' : 'اكتشف برامج مختارة مصممة لتمنحك رحلة تدريبية عملية ومؤثرة.'}</p>
            </div>
            <Link href="/training-courses" className="section-link">
              {isEnglish ? 'View all courses' : 'عرض جميع الدورات'}
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '70px 0', textAlign: 'center', color: '#6b778b' }}>
              {isEnglish ? 'Loading...' : 'جاري التحميل...'}
            </div>
          ) : featuredCourses.length === 0 ? (
            <div style={{ padding: '70px 0', textAlign: 'center', color: '#6b778b' }}>
              {isEnglish ? 'No featured courses yet.' : 'لا توجد دورات مميزة حاليًا.'}
            </div>
          ) : (
            <HomeCarousel
              items={featuredCourses}
              ariaLabel={isEnglish ? 'Featured courses' : 'الدورات المميزة'}
              itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
              keyExtractor={(course) => course.id}
              renderItem={(course) => <CourseCard course={course} />}
            />
          )}
        </div>
      </section>

      <section className="services-section">
        <div className="section-inner">
          <div className="section-head">
            <div>
              <div className="eyebrow">{isEnglish ? 'Our solutions' : 'حلولنا'}</div>
              <h2>{isEnglish ? 'Learning solutions for organizations' : 'حلول تدريبية للمنشآت'}</h2>
              <p>{isEnglish ? 'Practical services that connect learning with business needs.' : 'خدمات تدريبية واستشارية تجمع بين احتياج العمل وتطوير القدرات.'}</p>
            </div>
            <Link href="/services" className="section-link">{isEnglish ? 'All services' : 'جميع الخدمات'}</Link>
          </div>

          <div className="services-grid-final">
            {[
              ['01', isEnglish ? 'Corporate training' : 'التدريب المؤسسي', isEnglish ? 'Programs tailored to team needs and business goals.' : 'برامج مصممة وفق احتياجات فرق العمل وأهداف المنشأة.'],
              ['02', isEnglish ? 'Training needs analysis' : 'تحليل الاحتياج التدريبي', isEnglish ? 'Assess gaps and build the right learning path.' : 'تحليل الاحتياجات وتحديد الفجوات وبناء المسار التدريبي المناسب.'],
              ['03', isEnglish ? 'Learning assessments' : 'التقييمات المهنية', isEnglish ? 'Measure capability before and after learning.' : 'حلول تساعدك على قياس المهارات قبل وبعد التدريب.'],
              ['04', isEnglish ? 'Training materials design' : 'تصميم الحقائب التدريبية', isEnglish ? 'Structured learning materials built around clear outcomes.' : 'حقائب تدريبية منظمة مبنية على أهداف ومخرجات واضحة.'],
              ['05', isEnglish ? 'Short consultations' : 'الاستشارات القصيرة', isEnglish ? 'Focused sessions that turn questions into practical action.' : 'جلسات استشارية مركزة تساعد على تحويل المعرفة إلى ممارسة عملية.'],
              ['06', isEnglish ? 'Training disclosure' : 'الإفصاح التدريبي', isEnglish ? 'Practical support to prepare and complete the training disclosure journey.' : 'مساندة عملية لتجهيز واستكمال رحلة الإفصاح التدريبي.'],
            ].map(([number, title, description]) => (
              <article className="service-card-final" key={number}>
                <span className="service-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="why-section">
        <div className="section-inner">
          <div className="why-grid">
            <div className="why-copy">
              <div className="eyebrow">{isEnglish ? 'Why Impact' : 'لماذا Impact'}</div>
              <h2>{isEnglish ? 'Learning that becomes impact at work.' : 'التدريب الذي يتحول إلى أثر في العمل.'}</h2>
              <p>{isEnglish ? 'We connect quality content, expert trainers and real workplace needs to create practical learning experiences.' : 'نجمع بين جودة المحتوى، خبرة المدربين، واحتياجات بيئة العمل لصناعة تجارب تدريبية عملية.'}</p>

              <div className="benefits-final">
                {[
                  ['01', isEnglish ? 'Practical content' : 'محتوى عملي', isEnglish ? 'Connected to real workplace needs.' : 'مرتبط بالاحتياجات الفعلية في بيئة العمل.'],
                  ['02', isEnglish ? 'Multiple formats' : 'خيارات تدريب متعددة', isEnglish ? 'In-person, online and recorded learning.' : 'حضوري، أونلاين، ودورات مسجلة.'],
                  ['03', isEnglish ? 'Complete experience' : 'تجربة متكاملة', isEnglish ? 'Registration, assessment and certification in one journey.' : 'من التسجيل وحتى التقييم والشهادة ضمن رحلة واحدة.'],
                ].map(([number, title, description]) => (
                  <div className="benefit-final" key={number}>
                    <div className="benefit-mark">{number}</div>
                    <div>
                      <strong>{title}</strong>
                      <span>{description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="why-panel-final">
              <small>IMPACT TRAINING</small>
              <h3>{isEnglish ? 'We design learning around a clear need.' : 'نصمم التدريب انطلاقًا من احتياج واضح.'}</h3>
              <p>{isEnglish ? 'Our aim is simple: relevant learning, practical application and visible impact.' : 'هدفنا بسيط: تعلم مناسب، تطبيق عملي، وأثر يمكن ملاحظته.'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-inner">
          <div className="cta-box-final">
            <div>
              <h2>{isEnglish ? 'Looking for a learning solution for your organization?' : 'هل تبحث عن حل تدريبي لمنشأتك؟'}</h2>
              <p>{isEnglish ? 'Tell us what you need and we will help you shape the right learning solution.' : 'تواصل معنا لمناقشة احتياجكم وبناء الحل التدريبي المناسب.'}</p>
            </div>
            <Link href="/contact" className="cta-button-final">{isEnglish ? 'Contact us' : 'تواصل معنا'}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function CourseCard({ course }: { course: Course }) {
  const { isEnglish } = useLocale();
  const isRecorded = course.type === 'recorded';
  const href = isRecorded
    ? `/course-details?id=${encodeURIComponent(course.id)}`
    : `/training-program?id=${encodeURIComponent(course.id)}`;

  const image =
    course.image ||
    (course.categoryId?.toLowerCase().includes('تقنية')
      ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'
      : course.categoryId?.toLowerCase().includes('قيادة')
        ? 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80'
        : isRecorded
          ? 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'
          : 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80');

  const duration =
    course.days && course.days > 0
      ? `${course.days} ${course.days === 1 ? (isEnglish ? 'day' : 'يوم') : (isEnglish ? 'days' : 'أيام')}`
      : course.hours && course.hours > 0
        ? `${course.hours} ${isEnglish ? 'hours' : 'ساعة'}`
        : null;

  const description =
    course.shortDescription ||
    course.description ||
    (isEnglish
      ? 'A professional training program designed for practical workplace impact.'
      : 'برنامج تدريبي مهني مصمم لتطوير المهارات وتحقيق أثر عملي في بيئة العمل.');

  return (
    <article className="course-card-final">
      <Link href={href} aria-label={`${isEnglish ? 'View' : 'عرض'} ${course.title}`}>
        <div className="course-thumb" style={{ backgroundImage: `url(${image})` }}>
          <span className="course-badge">
            {isRecorded ? (isEnglish ? 'Recorded course' : 'دورة مسجلة') : (isEnglish ? 'Training program' : 'برنامج تدريبي')}
          </span>
        </div>
      </Link>

      <div className="course-body-final">
        <div className="course-kicker">{course.featured ? (isEnglish ? 'Featured program' : 'برنامج مميز') : 'Impact Training'}</div>
        <h3 className="course-title-final">{course.title}</h3>
        <p className="course-desc-final">{description}</p>

        <div className="course-meta-final">
          {duration ? <span>{duration}</span> : null}
          <span>{isEnglish ? 'Professional training' : 'تدريب مهني'}</span>
          {course.delivery ? (
            <span>
              {course.delivery === 'online'
                ? (isEnglish ? 'Online' : 'أونلاين')
                : (isEnglish ? 'In-person' : 'حضوري')}
            </span>
          ) : null}
        </div>

        <div className="course-foot-final">
          <Link href={href} className="course-button-final">
            {isEnglish ? 'View details' : 'عرض التفاصيل'} →
          </Link>
        </div>
      </div>
    </article>
  );
}
