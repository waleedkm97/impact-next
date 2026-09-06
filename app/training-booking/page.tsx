'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { orderRepository } from '@/lib/data/repositories/order-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import type { Course } from '@/types/course';
import type { Schedule } from '@/types/schedule';

export default function TrainingBookingPage() {
  const router = useRouter();
  const scheduleId = useSearchParams().get('id') || '';
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const currentSchedule = await scheduleRepository.findById(scheduleId);
      const [currentCourse, currentUser] = await Promise.all([
        currentSchedule
          ? courseRepository.findById(currentSchedule.courseId)
          : Promise.resolve(null),
        traineeRepository.getCurrentUser(),
      ]);

      if (!active) {
        return;
      }

      if (!currentSchedule || !currentCourse || currentCourse.trainingKind !== 'public') {
        setSchedule(null);
        setCourse(null);
        setUser(currentUser);
        setLoading(false);
        return;
      }
      setSchedule(currentSchedule);
      setCourse(currentCourse);
      setUser(currentUser);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [scheduleId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!schedule || !course || !user) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const alreadyEnrolled = user.enrollments.some(
        (enrollment: any) =>
          enrollment.courseId === course.id &&
          (!enrollment.scheduleId || enrollment.scheduleId === schedule.id),
      );

      if (alreadyEnrolled) {
        router.push('/account');
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
            type: 'training-program',
            itemId: course.id,
            title: course.title,
            quantity: 1,
            unitPrice: Number(schedule.price ?? 0),
            totalPrice: Number(schedule.price ?? 0),
            metadata: {
              scheduleId: schedule.id,
              city: schedule.city,
            },
          },
        ],
        subtotal: Number(schedule.price ?? 0),
        discount: 0,
        tax: 0,
        total: Number(schedule.price ?? 0),
        currency: 'SAR',
        payment: {
          method: 'online-payment',
          status: 'pending',
          amount: Number(schedule.price ?? 0),
          currency: 'SAR',
        },
        status: 'pending',
        scheduleId: schedule.id,
        bookingDate: schedule.startDate,
        notes: notes.trim() || 'طلب تسجيل في دورة تدريبية Public.',
      });

      setMessage('تم إرسال طلب التسجيل. سيتم تفعيل التسجيل بعد تأكيد الدفع.');
    } catch {
      setMessage('تعذر إنشاء طلب التسجيل. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        جاري تحميل بيانات الحجز...
      </main>
    );
  }

  if (!schedule || !course) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        <h1>الموعد غير موجود</h1>
        <Link href="/training-courses" className="btn-secondary">
          العودة للدورات التدريبية
        </Link>
      </main>
    );
  }

  if (!user) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        <h1>تسجيل الدخول مطلوب</h1>
        <p>يجب تسجيل الدخول قبل التسجيل في الموعد.</p>
        <Link
          href={`/login?next=/training-booking?id=${encodeURIComponent(schedule.id)}`}
          className="btn-primary"
        >
          تسجيل الدخول
        </Link>
      </main>
    );
  }

  return (
    <main dir="rtl" className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold">التسجيل في الدورة</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <section className="card" style={{ padding: 24 }}>
          <h2>بيانات المتدرب</h2>
          <div className="checkout-summary-list">
            <div><span>الاسم</span><strong>{user.profile.firstName} {user.profile.lastName}</strong></div>
            <div><span>البريد</span><strong>{user.email}</strong></div>
            <div><span>الجوال</span><strong>{user.contact.phone || '—'}</strong></div>
          </div>

          <label className="checkout-notes-field">
            ملاحظات
            <textarea
              className="admin-textarea"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          {message && <div className="auth-demo" style={{ marginTop: 18 }}>{message}</div>}

          {!message && (
            <form onSubmit={handleSubmit} style={{ marginTop: 22 }}>
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'جاري إرسال الطلب...' : 'تأكيد التسجيل'}
              </button>
            </form>
          )}
        </section>

        <aside className="card" style={{ padding: 24 }}>
          <span className="card-label">دورة تدريبية</span>
          <h2>{course.title}</h2>
          <p>{schedule.city || 'أونلاين'}</p>
          <p>{String(schedule.startDate.getDate()).padStart(2, '0')}/{String(schedule.startDate.getMonth() + 1).padStart(2, '0')}/{schedule.startDate.getFullYear()}</p>
          <div className="course-price-stack">
            <strong>{Number(schedule.price ?? 0).toLocaleString('ar-SA')} ر.س</strong>
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
