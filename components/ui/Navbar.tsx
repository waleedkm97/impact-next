'use client';

import Image from 'next/image';
import Link from 'next/link';
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
  const [navVisible, setNavVisible] = useState(true);
  const { isEnglish, setLocale } = useLocale();
  const isHome = pathname === '/';

  useEffect(() => {
    let active = true;

    traineeRepository
      .getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 20) {
        setNavVisible(true);
      } else if (currentScrollY > lastScrollY + 5) {
        setNavVisible(false);
        setMenuOpen(false);
        setServicesOpen(false);
      } else if (currentScrollY < lastScrollY - 5) {
        setNavVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav
      className={`navbar${isHome ? ' navbar-home' : ''}${
        navVisible ? ' navbar-visible' : ' navbar-hidden'
      }`}
    >
      <div className="nav-container">
        <Link
          href="/"
          className="logo"
          aria-label="Impact Training"
        >
          <Image
            src={
              isHome
                ? '/assets/logo/logo_white-remove.png'
                : '/assets/logo/logo_blue-remove.png'
            }
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
          aria-label={
            isEnglish ? 'Open menu' : 'فتح القائمة'
          }
          aria-expanded={menuOpen}
          onClick={() =>
            setMenuOpen((open) => !open)
          }
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={`nav-links ${
            menuOpen ? 'is-open' : ''
          }`}
          aria-label={
            isEnglish
              ? 'Main navigation'
              : 'التنقل الرئيسي'
          }
        >
          <Link
            href="/"
            aria-current={
              pathname === '/' ? 'page' : undefined
            }
          >
            {isEnglish ? 'Home' : 'الرئيسية'}
          </Link>

          <Link
            href="/recorded-courses"
            aria-current={
              pathname === '/recorded-courses'
                ? 'page'
                : undefined
            }
          >
            {isEnglish
              ? 'Recorded courses'
              : 'الدورات المسجلة'}
          </Link>

          <Link
            href="/training-courses"
            aria-current={
              pathname === '/training-courses'
                ? 'page'
                : undefined
            }
          >
            {isEnglish
              ? 'Training courses'
              : 'الدورات التدريبية'}
          </Link>

          <Link
            href="/training-disclosure"
            aria-current={
              pathname === '/training-disclosure'
                ? 'page'
                : undefined
            }
          >
            {isEnglish
              ? 'Training disclosure'
              : 'الإفصاح التدريبي'}
          </Link>

          <Link
            href="/verify-certificate"
            aria-current={
              pathname === '/verify-certificate'
                ? 'page'
                : undefined
            }
          >
            {isEnglish
              ? 'Certificate verification'
              : 'التحقق من الشهادة'}
          </Link>

          <div
            className={`nav-services-menu ${
              servicesOpen ? 'is-open' : ''
            }`}
          >
            <button
              type="button"
              className="nav-services-trigger"
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              onClick={() =>
                setServicesOpen((open) => !open)
              }
            >
              {isEnglish ? 'Services' : 'الخدمات'}{' '}
              <span aria-hidden="true">⌄</span>
            </button>

            <div
              className="nav-services-dropdown"
              style={
                servicesOpen
                  ? {
                      display: 'grid',
                      opacity: 1,
                      visibility: 'visible',
                      transform:
                        'translateY(0)',
                    }
                  : undefined
              }
            >
              <Link
                href="/services"
                className="nav-services-all"
              >
                {isEnglish
                  ? 'View all services'
                  : 'عرض جميع الخدمات'}
              </Link>

              <Link href="/training-disclosure">
                {isEnglish
                  ? 'Training disclosure'
                  : 'الإفصاح التدريبي'}
              </Link>

              <Link href="/recorded-courses">
                {isEnglish
                  ? 'Recorded courses'
                  : 'الدورات المسجلة'}
              </Link>

              <Link href="/training-courses">
                {isEnglish
                  ? 'Training courses'
                  : 'الدورات التدريبية'}
              </Link>

              <Link href="/services?service=needs-analysis">
                {isEnglish
                  ? 'Training needs analysis'
                  : 'التقييمات وتحليل الاحتياجات التدريبية'}
              </Link>

              <Link href="/contact?service=short-consultation">
                {isEnglish
                  ? 'Short consultations'
                  : 'الاستشارات القصيرة'}
              </Link>

              <Link href="/services?service=training-materials">
                {isEnglish
                  ? 'Training material design'
                  : 'تصميم الحقائب التدريبية'}
              </Link>
            </div>
          </div>

          <Link href="/contact">
            {isEnglish
              ? 'Contact us'
              : 'تواصل معنا'}
          </Link>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-language"
            onClick={() =>
              setLocale(isEnglish ? 'ar' : 'en')
            }
            aria-label={
              isEnglish
                ? 'Switch to Arabic'
                : 'التبديل إلى الإنجليزية'
            }
            title={
              isEnglish
                ? 'Switch to Arabic'
                : 'English'
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M3 12h18M12 3c2.5 2.5 3.75 5.5 3.75 9S14.5 18.5 12 21M12 3c-2.5 2.5-3.75 5.5-3.75 9S9.5 18.5 12 21"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>

          <Link
            href="/training-courses"
            className="nav-search"
            aria-label={
              isEnglish
                ? 'Search courses'
                : 'بحث في الدورات'
            }
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 20L16.65 16.65"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          {!loading ? (
            <Link
              href={user ? '/account' : '/login'}
              className="nav-login"
            >
              {isEnglish
                ? 'My account'
                : 'حسابي'}
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}