'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

        <div className="nav-links">
          <Link href="/">الرئيسية</Link>
          <Link href="/recorded-courses">الدورات المسجلة</Link>
          <Link href="/training-courses">الدورات التدريبية</Link>
          <Link href="/services">الخدمات</Link>
          <Link href="/contact">تواصل معنا</Link>
        </div>

        <div className="nav-actions">
          {loading ? null : user ? (
            <Link href="/account" className="nav-login">
              حسابي
            </Link>
          ) : (
            <Link href="/login" className="nav-login">
              تسجيل الدخول
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}