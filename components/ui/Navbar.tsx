'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { useLocale } from '@/hooks/use-locale';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const { isEnglish, setLocale } = useLocale();

  useEffect(() => {
    let active = true;

    traineeRepository
      .getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo" aria-label="Impact Training">
          <Image
            src="/assets/logo/logo_blue-remove.png"
  alt="Impact Training"
  width={120}
  height={70}
  priority
  style={{
    width: '120px',
    height: 'auto',
    objectFit: 'contain',
  }}
/>
        </Link>

        <button
          type="button"
          className="nav-menu-toggle"
          aria-label="فتح القائمة"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label={isEnglish ? 'Main navigation' : 'التنقل الرئيسي'}>
          <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
          <Link href="/recorded-courses">{isEnglish ? 'Recorded courses' : 'الدورات المسجلة'}</Link>
          <Link href="/training-courses">{isEnglish ? 'Training courses' : 'الدورات التدريبية'}</Link>
          <Link href="/training-disclosure">{isEnglish ? 'Training disclosure' : 'الإفصاح التدريبي'}</Link>
          <Link href="/verify-certificate">{isEnglish ? 'Certificate verification' : 'التحقق من الشهادة'}</Link>
          <div className={`nav-services-menu ${servicesOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="nav-services-trigger"
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              onClick={() => setServicesOpen((open) => !open)}
            >
              {isEnglish ? 'Services' : 'الخدمات'} <span aria-hidden="true">⌄</span>
            </button>
            <div
              className="nav-services-dropdown"
              style={servicesOpen ? { display: 'grid', opacity: 1, visibility: 'visible', transform: 'translateY(0)' } : undefined}
            >
              <Link href="/services" className="nav-services-all"><span>◈</span> {isEnglish ? 'View all services' : 'عرض جميع الخدمات'}</Link>
              <Link href="/training-disclosure"><span>▧</span> {isEnglish ? 'Training disclosure' : 'الإفصاح التدريبي'}</Link>
              <Link href="/recorded-courses"><span>▣</span> {isEnglish ? 'Recorded courses' : 'الدورات المسجلة'}</Link>
              <Link href="/training-courses"><span>▣</span> {isEnglish ? 'Training courses' : 'الدورات التدريبية'}</Link>
              <Link href="/services?service=needs-analysis"><span>⌁</span> {isEnglish ? 'Training needs analysis' : 'التقييمات وتحليل الاحتياجات التدريبية'}</Link>
              <Link href="/contact?service=short-consultation"><span>↗</span> {isEnglish ? 'Short consultations' : 'الاستشارات القصيرة'}</Link>
              <Link href="/services?service=training-materials"><span>▤</span> {isEnglish ? 'Training material design' : 'تصميم الحقائب التدريبية'}</Link>
            </div>
          </div>
          <Link href="/contact">{isEnglish ? 'Contact us' : 'تواصل معنا'}</Link>
        </div>

        <div className="nav-actions">
          {loading ? null : user ? (
            <Link href="/account" className="nav-login">
              {isEnglish ? 'My account' : 'حسابي'}
            </Link>
          ) : (
            <Link href="/login" className="nav-login">
              {isEnglish ? 'Log in' : 'تسجيل الدخول'}
            </Link>
          )}
          <button
            type="button"
            className="nav-language"
            onClick={() => setLocale(isEnglish ? 'ar' : 'en')}
          >
            {isEnglish ? 'العربية' : 'English'}
          </button>
        </div>
      </div>
    </nav>
  );
}