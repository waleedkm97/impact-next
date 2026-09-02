'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { orderRepository } from '@/lib/data/repositories/order-repository';
import { categoryRepository } from '@/lib/data/repositories/category-repository';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ recorded: 0, training: 0, trainees: 0, orders: 0, revenue: 0, categories: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [recorded, training, trainees, orders, categories] = await Promise.all([
        courseRepository.findByType('recorded'),
        courseRepository.findByType('training'),
        traineeRepository.findAll(),
        orderRepository.findAll(),
        categoryRepository.findAll(),
      ]);
      const revenue = orders.filter((o:any) => o.payment?.status === 'paid').reduce((sum:number,o:any)=>sum+Number(o.total||0),0);
      setStats({ recorded: recorded.length, training: training.length, trainees: trainees.length, orders: orders.length, revenue, categories: categories.length });
      setRecent(orders.slice(0,5));
    }
    void load();
  }, []);

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <div><div className="eyebrow">Admin</div><h1>لوحة التحكم</h1><p>نظرة عامة على الدورات والبرامج والمتدربين والطلبات.</p></div>
        <div className="admin-actions">
          <Link className="admin-btn admin-btn-primary" href="/admin/courses">+ إضافة دورة مسجلة</Link>
          <Link className="admin-btn admin-btn-gold" href="/admin/programs">+ إضافة برنامج تدريبي</Link>
        </div>
      </header>

      <section className="admin-stats">
        <div className="admin-stat"><div className="admin-stat-label">الدورات المسجلة</div><div className="admin-stat-value">{stats.recorded}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">البرامج التدريبية</div><div className="admin-stat-value">{stats.training}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">المتدربون</div><div className="admin-stat-value">{stats.trainees}</div></div>
        <div className="admin-stat"><div className="admin-stat-label">إجمالي الطلبات</div><div className="admin-stat-value">{stats.orders}</div></div>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-card">
          <div className="admin-modal-header"><h2>أحدث الطلبات</h2><Link href="/admin/orders" className="admin-btn admin-btn-light">عرض الكل</Link></div>
          <div className="admin-list">
            {recent.length === 0 ? <div className="admin-empty">لا توجد طلبات.</div> : recent.map((o:any)=><div className="admin-list-row" key={o.id}><div><strong>{o.customer?.name || 'عميل'}</strong><br/><span>{o.items?.[0]?.title || 'طلب'}</span></div><div><strong>{Number(o.total||0).toLocaleString('ar-SA')} SAR</strong><br/><span>{o.status}</span></div></div>)}
          </div>
        </section>
        <aside className="admin-card">
          <div className="admin-modal-header"><h2>اختصارات</h2></div>
          <div className="admin-quick-grid">
            <Link className="admin-quick" href="/admin/categories">الفئات<br/><small>{stats.categories} فئات</small></Link>
            <Link className="admin-quick" href="/admin/students">المتدربون<br/><small>{stats.trainees} حساب</small></Link>
            <Link className="admin-quick" href="/admin/coupons">الكوبونات</Link>
            <Link className="admin-quick" href="/admin/settings">الإعدادات</Link>
          </div>
          <div style={{padding:'0 14px 18px',color:'#6b7890',fontSize:12}}>الإيرادات المدفوعة: <strong style={{color:'#002060'}}>{stats.revenue.toLocaleString('ar-SA')} SAR</strong></div>
        </aside>
      </div>
    </main>
  );
}
