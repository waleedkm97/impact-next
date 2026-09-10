'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { staffRepository } from '@/lib/data/repositories/staff-repository';

const menuItems = [
  {
    href: '/admin',
    label: 'لوحة التحكم',
    icon: '⌂',
    roles: ['admin'],
  },

  {
    href: '/admin/courses',
    label: 'الدورات المسجلة',
    icon: '▣',
    roles: ['admin'],
  },

  {
    href: '/admin/programs',
    label: 'البرامج التدريبية',
    icon: '▤',
    roles: ['admin'],
  },

  {
    href: '/admin/categories',
    label: 'الفئات',
    icon: '▦',
    roles: ['admin'],
  },

  {
    href: '/admin/orders',
    label: 'الطلبات',
    icon: '▢',
    roles: ['admin'],
  },

  {
    href: '/admin/students',
    label: 'المتدربون',
    icon: '♙',
    roles: ['admin', 'coordinator'],
  },

  {
    href: '/admin/groups',
    label: 'المجموعات والشركات',
    icon: '▥',
    roles: ['admin'],
  },

  {
    href: '/admin/coupons',
    label: 'الكوبونات',
    icon: '◇',
    roles: ['admin'],
  },

  {
    href: '/admin/users',
    label: 'مستخدمو النظام',
    icon: '♙',
    roles: ['admin'],
  },

  {
    href: '/admin/settings',
    label: 'الإعدادات',
    icon: '⚙',
    roles: ['admin'],
  },
];

function getStaffSessionId() {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('impact_staff='));

  if (!match) {
    return null;
  }

  return decodeURIComponent(
    match.split('=').slice(1).join('='),
  );
}

function clearStaffSession() {
  document.cookie =
    'impact_staff=; Max-Age=0; Path=/; SameSite=Lax';
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [staff, setStaff] = useState<Awaited<
    ReturnType<typeof staffRepository.findById>
  >>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStaff() {
      const id = getStaffSessionId();

      if (!id) {
        if (active) {
          setLoading(false);
        }

        return;
      }

      const user = await staffRepository.findById(id);

      if (!active) {
        return;
      }

      if (!user || user.status !== 'active') {
        clearStaffSession();
        setStaff(null);
        setLoading(false);
        return;
      }

      setStaff(user);
      setLoading(false);
    }

    void loadStaff();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="admin-shell" dir="rtl">
        <div
          className="admin-main"
          style={{
            padding: 40,
          }}
        >
          جاري تحميل لوحة التحكم...
        </div>
      </div>
    );
  }

  if (!staff) {
    if (typeof window !== 'undefined') {
      router.replace(
        `/login?next=${encodeURIComponent(
          pathname || '/admin',
        )}`,
      );
    }

    return (
      <div className="admin-shell" dir="rtl">
        <div
          className="admin-main"
          style={{
            padding: 40,
          }}
        >
          جاري التحقق من الحساب...
        </div>
      </div>
    );
  }

  /*
   * =========================
   * ROLE ACCESS CONTROL
   * =========================
   *
   * المدرب:
   * لوحة المدرب فقط.
   *
   * المنسق:
   * لوحة المنسق + المتدربون.
   *
   * المدير:
   * جميع صفحات الإدارة.
   */

  if (
    staff.role === 'trainer' &&
    pathname !== '/admin/trainer'
  ) {
    if (typeof window !== 'undefined') {
      router.replace('/admin/trainer');
    }

    return (
      <div className="admin-shell" dir="rtl">
        <div
          className="admin-main"
          style={{
            padding: 40,
          }}
        >
          جاري تحويلك إلى لوحة المدرب...
        </div>
      </div>
    );
  }

  const coordinatorAllowedPaths = [
    '/admin/coordinator',
    '/admin/students',
  ];

  if (
    staff.role === 'coordinator' &&
    !coordinatorAllowedPaths.includes(pathname || '')
  ) {
    if (typeof window !== 'undefined') {
      router.replace('/admin/coordinator');
    }

    return (
      <div className="admin-shell" dir="rtl">
        <div
          className="admin-main"
          style={{
            padding: 40,
          }}
        >
          جاري تحويلك إلى لوحة المنسق...
        </div>
      </div>
    );
  }

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(staff.role),
  );

  const roleLabel =
    staff.role === 'admin'
      ? 'مدير النظام'
      : staff.role === 'coordinator'
        ? 'منسق'
        : 'مدرب';

  function logout() {
    clearStaffSession();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="admin-shell" dir="rtl">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-title">
            Impact Training
          </div>

          <div className="admin-brand-subtitle">
            لوحة التحكم
          </div>
        </div>

        <div
          style={{
            padding: '12px 16px 16px',
            borderBottom:
              '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: '#fff',
              marginBottom: 4,
            }}
          >
            {staff.name}
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {roleLabel}
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-label">
            الإدارة
          </div>

          {staff.role === 'trainer' && (
            <Link
              href="/admin/trainer"
              className="admin-nav-item"
            >
              <span className="admin-nav-icon">
                ♙
              </span>

              <span>
                لوحة المدرب
              </span>
            </Link>
          )}

          {staff.role === 'coordinator' && (
            <>
              <Link
                href="/admin/coordinator"
                className="admin-nav-item"
              >
                <span className="admin-nav-icon">
                  ♙
                </span>

                <span>
                  لوحة المنسق
                </span>
              </Link>

              <Link
                href="/admin/students"
                className="admin-nav-item"
              >
                <span className="admin-nav-icon">
                  ♙
                </span>

                <span>
                  المتدربون
                </span>
              </Link>
            </>
          )}

          {staff.role === 'admin' &&
            visibleMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="admin-nav-item"
              >
                <span className="admin-nav-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </Link>
            ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link
            href="/"
            className="admin-back-site"
          >
            العودة للموقع
          </Link>

          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%',
              marginTop: 10,
              border: 0,
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              padding: '8px 0',
              fontSize: 13,
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}
