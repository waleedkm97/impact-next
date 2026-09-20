'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { staffRepository } from '@/lib/data/repositories/staff-repository';
import type { StaffPermission } from '@/types/staff';

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
    permission: 'courses' as StaffPermission,
  },

  {
    href: '/admin/programs',
    label: 'البرامج التدريبية',
    icon: '▤',
    roles: ['admin'],
    permission: 'courses' as StaffPermission,
  },

  {
    href: '/admin/categories',
    label: 'الفئات',
    icon: '▦',
    roles: ['admin'],
    permission: 'courses' as StaffPermission,
  },

  {
    href: '/admin/orders',
    label: 'الطلبات',
    icon: '▢',
    roles: ['admin'],
    permission: 'orders' as StaffPermission,
  },

{
  href: '/admin/contact-requests',
  label: 'طلبات التواصل',
  icon: '✉',
  roles: ['admin'],
  permission: 'contactRequests' as StaffPermission,
},
  {
    href: '/admin/students',
    label: 'المتدربون',
    icon: '♙',
    roles: ['admin', 'coordinator'],
    permission: 'trainees' as StaffPermission,
  },

  {
    href: '/admin/groups',
    label: 'المجموعات والشركات',
    icon: '▥',
    roles: ['admin'],
    permission: 'groups' as StaffPermission,
  },

  {
    href: '/admin/coupons',
    label: 'الكوبونات',
    icon: '◇',
    roles: ['admin'],
    permission: 'courses' as StaffPermission,
  },

  {
    href: '/admin/users',
    label: 'مستخدمو النظام',
    icon: '♙',
    roles: ['admin'],
    permission: 'users' as StaffPermission,
  },

  {
    href: '/admin/settings',
    label: 'الإعدادات',
    icon: '⚙',
    roles: ['admin'],
    permission: 'settings' as StaffPermission,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  if (
    staff.role === 'coordinator' &&
    pathname !== '/admin/coordinator'
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

  const employeePermissions = new Set(staff.permissions ?? []);
  const permissionAliases: Record<string, StaffPermission[]> = {
    courses: ['viewCourses', 'editCourses'],
    orders: ['viewOrders', 'editOrders'],
    trainees: ['viewTrainees'],
    groups: ['viewGroups'],
    users: ['viewUsers'],
    settings: ['viewSettings'],
    contactRequests: ['viewContactRequests'],
  };
  const hasConfiguredPermission = (permission: StaffPermission) =>
    employeePermissions.has(permission) ||
    permissionAliases[permission]?.some((alias) => employeePermissions.has(alias)) === true;
  const employeePathPermissions: Array<[string, StaffPermission]> = [
    ['/admin/courses', 'courses'],
    ['/admin/programs', 'courses'],
    ['/admin/categories', 'courses'],
    ['/admin/orders', 'orders'],
    ['/admin/contact-requests', 'contactRequests'],
    ['/admin/students', 'trainees'],
    ['/admin/groups', 'groups'],
    ['/admin/users', 'users'],
    ['/admin/settings', 'settings'],
  ];
  const employeePermission = employeePathPermissions.find(
    ([path]) => pathname === path || pathname?.startsWith(`${path}/`),
  )?.[1];

  if (
    staff.role === 'employee' &&
    (!employeePermission || !hasConfiguredPermission(employeePermission))
  ) {
    const firstAllowed = menuItems.find((item) =>
      hasConfiguredPermission(item.permission as StaffPermission),
    );
    const destination = firstAllowed?.href ?? '/admin';

    if (typeof window !== 'undefined' && pathname !== destination) {
      router.replace(destination);
    }

    return <div className="admin-shell" dir="rtl"><div className="admin-main" style={{ padding: 40 }}>لا تملك صلاحية الوصول إلى هذه الصفحة.</div></div>;
  }

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(staff.role) &&
    (staff.role === 'admin' ||
      (staff.role === 'employee' &&
        hasConfiguredPermission(item.permission as StaffPermission)))
  );

  const roleLabel =
    staff.role === 'admin'
      ? 'مدير النظام'
      : staff.role === 'coordinator'
        ? 'منسق'
        : staff.role === 'trainer'
          ? 'مدرب'
          : 'موظف';

  function logout() {
    clearStaffSession();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="admin-shell" dir="rtl">
      <button
        type="button"
        className="admin-mobile-toggle"
        aria-label="فتح قائمة الإدارة"
        onClick={() => setSidebarOpen((open) => !open)}
      >
        ☰
      </button>
      {sidebarOpen && (
        <button
          type="button"
          className="admin-mobile-backdrop"
          aria-label="إغلاق القائمة"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
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

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            تسجيل الخروج
          </button>
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

          {(staff.role === 'admin' || staff.role === 'employee') &&
            visibleMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${pathname === item.href || pathname?.startsWith(`${item.href}/`) ? 'is-active' : ''}`}
                aria-current={pathname === item.href || pathname?.startsWith(`${item.href}/`) ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
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
            className="admin-logout-button"
            onClick={logout}
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
