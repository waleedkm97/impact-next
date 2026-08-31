import Link from 'next/link';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { href: '/admin', label: 'لوحة التحكم', icon: '⌂' },
  { href: '/admin/courses', label: 'الدورات المسجلة', icon: '▣' },
  { href: '/admin/programs', label: 'البرامج التدريبية', icon: '▤' },
  { href: '/admin/categories', label: 'الفئات', icon: '▦' },
  { href: '/admin/orders', label: 'الطلبات', icon: '▢' },
  { href: '/admin/students', label: 'المتدربون', icon: '♙' },
  { href: '/admin/coupons', label: 'الكوبونات', icon: '◇' },
  { href: '/admin/settings', label: 'الإعدادات', icon: '⚙' },
];

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#f6f7fb',
        display: 'flex',
      }}
    >
      <aside
        style={{
          width: 260,
          minHeight: '100vh',
          background: '#ffffff',
          borderLeft: '1px solid #e5e7eb',
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 82,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: '#172554',
              }}
            >
              Impact Training
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                marginTop: 3,
              }}
            >
              لوحة التحكم
            </div>
          </div>
        </div>

        <nav
          style={{
            padding: '20px 14px',
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9ca3af',
              padding: '0 12px 10px',
            }}
          >
            الإدارة
          </div>

          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                marginBottom: 4,
                borderRadius: 10,
                color: '#374151',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 24,
                  textAlign: 'center',
                  fontSize: 18,
                }}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div
          style={{
            padding: 16,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '11px 14px',
              borderRadius: 9,
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            العودة للموقع
          </Link>
        </div>
      </aside>

      <div
        style={{
          marginRight: 260,
          width: 'calc(100% - 260px)',
          minHeight: '100vh',
        }}
      >
        {children}
      </div>
    </div>
  );
}