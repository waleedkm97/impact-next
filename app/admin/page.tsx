'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { orderRepository } from '@/lib/data/repositories/order-repository';
import { categoryRepository } from '@/lib/data/repositories/category-repository';
import { groupRepository } from '@/lib/data/repositories/group-repository';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    recorded: 0,
    training: 0,
    trainees: 0,
    orders: 0,
    groups: 0,
    revenue: 0,
    categories: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [recorded, training, trainees, orders, categories, groups] = await Promise.all([
        courseRepository.findByType('recorded'),
        courseRepository.findByType('training'),
        traineeRepository.findAll(),
        orderRepository.findAll(),
        categoryRepository.findAll(),
        groupRepository.findAll(),
      ]);

      const revenue = orders
        .filter((o: any) => o.payment?.status === 'paid')
        .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

      setStats({
        recorded: recorded.length,
        training: training.length,
        trainees: trainees.length,
        orders: orders.length,
        groups: groups.length,
        revenue,
        categories: categories.length,
      });
      setRecent(orders.slice(0, 5));
    }
    void load();
  }, []);

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>لوحة التحكم</h1>
          <p>إدارة التدريب من مكان واحد: الدورات، العملاء، التنفيذ، والمتدربين.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn admin-btn-primary" href="/admin/courses">+ دورة مسجلة</Link>
          <Link className="admin-btn admin-btn-gold" href="/admin/programs">+ برنامج تدريبي</Link>
          <Link className="admin-btn admin-btn-light" href="/admin/groups">+ مجموعة شركة</Link>
        </div>
      </header>

      <section className="admin-stats">
        <div className="admin-stat"><div className="admin-stat-label">الدورات المسجلة</div><div className="admin-stat-value">{stats.recorded}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">الدورات والبرامج</div><div className="admin-stat-value">{stats.training}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">مجموعات الشركات</div><div className="admin-stat-value">{stats.groups}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">المتدربون</div><div className="admin-stat-value">{stats.trainees}</div></div>
      </section>

      <section className="admin-card" style={{ marginBottom: 18 }}>
        <div className="admin-modal-header">
          <div>
            <h2>إدارة التدريب</h2>
            <p style={{ margin: '6px 0 0', color: '#6b7890' }}>ابدأ من المسار المناسب لطريقة البيع والتنفيذ.</p>
          </div>
        </div>
        <div className="admin-quick-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Link className="admin-quick" href="/admin/courses">
            <strong>الدورات المسجلة</strong><br />
            <small>شراء فردي أو طلب شركة بعدد مقاعد، ثم تظهر الدورة في حساب المتدرب.</small>
          </Link>
          <Link className="admin-quick" href="/admin/programs">
            <strong>الدورات العامة</strong><br />
            <small>مواعيد معلنة، تسجيل الأفراد، وإمكانية تسجيل موظفي الشركات.</small>
          </Link>
          <Link className="admin-quick" href="/admin/groups">
            <strong>الدورات التعاقدية</strong><br />
            <small>تنفيذ مخصص للشركات مع التاريخ، العدد، طريقة التنفيذ والموقع.</small>
          </Link>
          <Link className="admin-quick" href="/admin/students">
            <strong>المتدربون</strong><br />
            <small>الحسابات، التسجيلات، الحضور، التقييمات والشهادات.</small>
          </Link>
        </div>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-card">
          <div className="admin-modal-header">
            <div>
              <h2>آخر الطلبات</h2>
              <p style={{ margin: '6px 0 0', color: '#6b7890' }}>متابعة الطلبات القادمة من الأفراد والشركات.</p>
            </div>
            <Link href="/admin/orders" className="admin-btn admin-btn-light">عرض كل الطلبات</Link>
          </div>
          <div className="admin-list">
            {recent.length === 0 ? <div className="admin-empty">لا توجد طلبات.</div> : recent.map((o: any) => (
              <div className="admin-list-row" key={o.id}>
                <div><strong>{o.customer?.name || 'عميل'}</strong><br /><span>{o.items?.[0]?.title || 'طلب'}</span></div>
                <div><strong>{Number(o.total || 0).toLocaleString('ar-SA')} SAR</strong><br /><span>{o.status}</span></div>
              </div>
            ))}
          </div>
        </section>

        <aside className="admin-card">
          <div className="admin-modal-header"><h2>إدارة النظام</h2></div>
          <div className="admin-quick-grid">
            <Link className="admin-quick" href="/admin/categories">الفئات<br /><small>{stats.categories} فئات</small></Link>
            <Link className="admin-quick" href="/admin/students">المتدربون<br /><small>{stats.trainees} حساب</small></Link>
            <Link className="admin-quick" href="/admin/coupons">الكوبونات</Link>
            <Link className="admin-quick" href="/admin/settings">الإعدادات</Link>
          </div>
          <div style={{ padding: '0 14px 18px', color: '#6b7890', fontSize: 12 }}>
            الإيرادات المدفوعة: <strong style={{ color: '#002060' }}>{stats.revenue.toLocaleString('ar-SA')} SAR</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}
