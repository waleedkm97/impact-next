'use client';

import { useEffect, useState } from 'react';

import { courseRepository } from '@/lib/data/repositories/course-repository';
import { serviceRepository } from '@/lib/data/repositories/service-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { orderRepository } from '@/lib/data/repositories/order-repository';
import { couponRepository } from '@/lib/data/repositories/coupon-repository';
import { categoryRepository } from '@/lib/data/repositories/category-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';

type StatCard = {
  title: string;
  value: number;
  href: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatCard[]>([
    { title: 'الدورات', value: 0, href: '/admin/courses' },
    { title: 'الخدمات', value: 0, href: '/admin/services' },
    { title: 'المتدربون', value: 0, href: '/admin/students' },
    { title: 'الطلبات', value: 0, href: '/admin/orders' },
    { title: 'الكوبونات', value: 0, href: '/admin/coupons' },
    { title: 'التصنيفات', value: 0, href: '/admin/categories' },
    { title: 'الجداول', value: 0, href: '/admin/schedules' },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const [
          courses,
          services,
          trainees,
          orders,
          coupons,
          categories,
          schedules,
        ] = await Promise.all([
          courseRepository.findAll(),
          serviceRepository.findAll(),
          traineeRepository.findAll(),
          orderRepository.findAll(),
          couponRepository.findAll(),
          categoryRepository.findAll(),
          scheduleRepository.findAll(),
        ]);

        if (!mounted) return;

        setStats([
          {
            title: 'الدورات',
            value: courses.length,
            href: '/admin/courses',
          },
          {
            title: 'الخدمات',
            value: services.length,
            href: '/admin/services',
          },
          {
            title: 'المتدربون',
            value: trainees.length,
            href: '/admin/students',
          },
          {
            title: 'الطلبات',
            value: orders.length,
            href: '/admin/orders',
          },
          {
            title: 'الكوبونات',
            value: coupons.length,
            href: '/admin/coupons',
          },
          {
            title: 'التصنيفات',
            value: categories.length,
            href: '/admin/categories',
          },
          {
            title: 'الجداول',
            value: schedules.length,
            href: '/admin/schedules',
          },
        ]);
      } catch (error) {
        console.error('Failed to load admin dashboard:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '32px',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <header
          style={{
            marginBottom: '32px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            لوحة التحكم
          </h1>

          <p
            style={{
              marginTop: '8px',
              marginBottom: 0,
              color: '#6b7280',
              fontSize: '16px',
            }}
          >
            إدارة منصة Impact Training
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {stats.map((stat) => (
            <a
              key={stat.title}
              href={stat.href}
              style={{
                display: 'block',
                textDecoration: 'none',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '24px',
                transition: 'transform 0.15s ease',
              }}
            >
              <div
                style={{
                  color: '#6b7280',
                  fontSize: '15px',
                  marginBottom: '12px',
                }}
              >
                {stat.title}
              </div>

              <div
                style={{
                  fontSize: '36px',
                  lineHeight: 1,
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                {loading ? '...' : stat.value}
              </div>
            </a>
          ))}
        </section>

        <section
          style={{
            marginTop: '32px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            الوصول السريع
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '20px',
            }}
          >
            <a
              href="/admin/courses"
              style={quickLinkStyle}
            >
              إدارة الدورات
            </a>

            <a
              href="/admin/programs"
              style={quickLinkStyle}
            >
              إدارة البرامج
            </a>

            <a
              href="/admin/categories"
              style={quickLinkStyle}
            >
              التصنيفات
            </a>

            <a
              href="/admin/students"
              style={quickLinkStyle}
            >
              المتدربون
            </a>

            <a
              href="/admin/orders"
              style={quickLinkStyle}
            >
              الطلبات
            </a>

            <a
              href="/admin/coupons"
              style={quickLinkStyle}
            >
              الكوبونات
            </a>

            <a
              href="/admin/settings"
              style={quickLinkStyle}
            >
              الإعدادات
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

const quickLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '52px',
  padding: '12px 16px',
  borderRadius: '10px',
  background: '#f3f4f6',
  color: '#111827',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
};