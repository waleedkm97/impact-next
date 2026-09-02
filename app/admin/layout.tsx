import Link from 'next/link';
import type { ReactNode } from 'react';

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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell" dir="rtl">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-title">Impact Training</div>
          <div className="admin-brand-subtitle">لوحة التحكم</div>
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-label">الإدارة</div>
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="admin-nav-item">
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-back-site">العودة للموقع</Link>
        </div>
      </aside>
      <div className="admin-main">
        {children}
      </div>
    </div>
  );
}
