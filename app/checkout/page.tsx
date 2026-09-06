'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { orderRepository } from '@/lib/data/repositories/order-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import type { Course } from '@/types/course';

export default function CheckoutPage() {
  const router = useRouter();
  const id = useSearchParams().get('id') || '';
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const [currentCourse, currentUser] = await Promise.all([
        courseRepository.findById(id),
        traineeRepository.getCurrentUser(),
      ]);

      if (!active) {
        return;
      }

      setCourse(currentCourse);
      setUser(currentUser);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!course || !user) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const existing = user.enrollments.some(
        (enrollment: any) => enrollment.courseId === course.id,
      );

      if (existing) {
        router.push(`/course-learning?id=${encodeURIComponent(course.id)}`);
        return;
      }

      await orderRepository.create({
        type: 'public',
        customer: {
          traineeId: user.id,
          name: `${user.profile.firstName} ${user.profile.lastName}`.trim(),
          email: user.email,
          phone: user.contact.phone,
          company: user.company?.companyName,
        },
        items: [
          {
            id: `item-${Date.now()}`,
            type: 'course',
            itemId: course.id,
            title: course.title,
            quantity: 1,
            unitPrice: course.price,
            totalPrice: course.price,
          },
        ],
        subtotal: course.price,
        discount: 0,
        tax: 0,
        total: course.price,
        currency: 'SAR',
        payment: {
          method: 'online-payment',
          status: 'pending',
          amount: course.price,
          currency: 'SAR',
        },
        status: 'pending',
        notes: 'طلب شراء دورة مسجلة من الموقع.',
      });

      setMessage('تم إرسال طلب الشراء. سيتم تفعيل الدورة بعد تأكيد الدفع.');
    } catch {
      setMessage('تعذر إنشاء الطلب. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        جاري التحميل...
      </main>
    );
  }

  if (!course) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        <h1>الدورة غير موجودة</h1>
      </main>
    );
  }

  if (!user) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        <h1>تسجيل الدخول مطلوب</h1>
        <p>يجب تسجيل الدخول أو إنشاء حساب قبل شراء الدورة.</p>
        <Link href={`/login?next=/checkout?id=${encodeURIComponent(course.id)}`} className="btn-primary">
          تسجيل الدخول
        </Link>
      </main>
    );
  }

  return (
    <main dir="rtl" className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-10 text-4xl font-bold">شراء الدورة</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <section className="card" style={{ padding: 24 }}>
          <h2>بيانات المتدرب</h2>
          <div className="checkout-summary-list">
            <div><span>الاسم</span><strong>{user.profile.firstName} {user.profile.lastName}</strong></div>
            <div><span>البريد</span><strong>{user.email}</strong></div>
            <div><span>الجوال</span><strong>{user.contact.phone || '—'}</strong></div>
          </div>

          {message && <div className="auth-demo" style={{ marginTop: 18 }}>{message}</div>}

          {!message && (
            <form onSubmit={handleSubmit} style={{ marginTop: 22 }}>
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'جاري إنشاء الطلب...' : 'تأكيد الشراء'}
              </button>
            </form>
          )}
        </section>

        <aside className="card" style={{ padding: 24 }}>
          <span className="card-label">دورة مسجلة</span>
          <h2>{course.title}</h2>
          <div className="course-price-stack">
            <strong>{course.price.toLocaleString('ar-SA')} ر.س</strong>
          </div>
          {message && (
            <Link href="/account" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
              الذهاب إلى حسابي
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
