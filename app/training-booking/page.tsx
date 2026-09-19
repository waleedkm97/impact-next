'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import type { Course } from '@/types/course';
import type { Schedule } from '@/types/schedule';

export default function TrainingBookingPage() {
  const router = useRouter();
  const scheduleId =
    useSearchParams().get('id') || '';

  const [schedule, setSchedule] =
    useState<Schedule | null>(null);

  const [course, setCourse] =
    useState<Course | null>(null);

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [notes, setNotes] =
    useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const currentSchedule =
        await scheduleRepository.findById(
          scheduleId,
        );

      const [
        currentCourse,
        currentUser,
      ] = await Promise.all([
        currentSchedule
          ? courseRepository.findById(
              currentSchedule.courseId,
            )
          : Promise.resolve(null),

        traineeRepository.getCurrentUser(),
      ]);

      if (!active) {
        return;
      }

      if (
        !currentSchedule ||
        !currentCourse ||
        currentCourse.trainingKind !==
          'public'
      ) {
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

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (
      !schedule ||
      !course ||
      !user
    ) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const sqlTraineeId =
        document.cookie
          .split('; ')
          .find((item) =>
            item.startsWith(
              'impact_sql_trainee=',
            ),
          )
          ?.split('=')
          .slice(1)
          .join('=') || '';

      if (!sqlTraineeId) {
        throw new Error(
          'تعذر تحديد حساب المتدرب.',
        );
      }

      const enrollmentsResponse =
        await fetch(
          `/api/enrollments?traineeId=${encodeURIComponent(
            sqlTraineeId,
          )}`,
          {
            cache: 'no-store',
          },
        );

      const enrollmentsData =
        await enrollmentsResponse
          .json()
          .catch(() => null);

      if (
        enrollmentsResponse.ok &&
        enrollmentsData?.success
      ) {
        const alreadyEnrolled =
          (
            enrollmentsData.enrollments ??
            []
          ).some(
            (enrollment: any) =>
              enrollment.courseId ===
                course.id &&
              enrollment.scheduleId ===
                schedule.id,
          );

        if (alreadyEnrolled) {
          router.push('/account');
          return;
        }
      }

      /*
       * The public training schedules currently come
       * from the local schedule repository.
       *
       * Before creating the SQL order, make sure the
       * same schedule exists in PostgreSQL because
       * Order.scheduleId is a foreign key.
       */

      const sqlScheduleResponse =
        await fetch(
          `/api/schedules?id=${encodeURIComponent(
            schedule.id,
          )}`,
          {
            cache: 'no-store',
          },
        );

      const sqlScheduleData =
        await sqlScheduleResponse
          .json()
          .catch(() => null);

      if (
        sqlScheduleResponse.ok &&
        sqlScheduleData?.schedule
      ) {
        // The schedule already exists in SQL.
      } else {
        const scheduleResponse =
          await fetch('/api/schedules', {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              id: schedule.id,

              courseId:
                course.id,

              courseTitle:
                course.title,

              title:
                schedule.title ||
                course.title,

              description:
                schedule.description ||
                course.description ||
                null,

              startDate:
                schedule.startDate,

              endDate:
                schedule.endDate,

              startTime:
                schedule.startTime ||
                '09:00',

              endTime:
                schedule.endTime ||
                (schedule.city ===
                'Online'
                  ? '12:00'
                  : '14:00'),

              recurrence:
                schedule.recurrence ||
                'once',

              location:
                schedule.location ||
                null,

              city:
                schedule.city ||
                null,

              onlineMeetingLink:
                schedule.onlineMeetingLink ||
                null,

              maxParticipants:
                Number(
                  schedule.maxParticipants ||
                    20,
                ),

              currentParticipants:
                Number(
                  schedule.currentParticipants ||
                    0,
                ),

              waitlistMax:
                schedule.waitlistMax ??
                null,

              currentWaitlist:
                Number(
                  schedule.currentWaitlist ||
                    0,
                ),

              price:
                schedule.price ??
                null,

              currency:
                schedule.currency ||
                'SAR',

              instructorId:
                schedule.instructorId ||
                null,

              instructorName:
                schedule.instructorName ||
                null,

              trainerId:
                schedule.trainerId ||
                null,

              coordinatorId:
                schedule.coordinatorId ||
                null,

              status:
                schedule.status ||
                'available',

              published:
                schedule.published !==
                false,

              allowWaitlist:
                schedule.allowWaitlist !==
                false,

              requireConfirmation:
                schedule.requireConfirmation ===
                true,

              confirmationDeadline:
                schedule.confirmationDeadline ||
                null,

              cancellationDeadline:
                schedule.cancellationDeadline ||
                null,

              cancellationPolicy:
                schedule.cancellationPolicy ||
                null,

              postAssessmentEnabled:
                schedule.postAssessmentEnabled ===
                true,

              courseEvaluationEnabled:
                schedule.courseEvaluationEnabled ===
                true,

              sessions:
                (schedule.sessions ??
                  []).map(
                  (session: any) => ({
                    id: session.id,

                    date:
                      session.date,

                    startTime:
                      session.startTime,

                    endTime:
                      session.endTime,

                    location:
                      session.location ||
                      null,

                    onlineMeetingLink:
                      session.onlineMeetingLink ||
                      null,

                    instructorId:
                      session.instructorId ||
                      null,

                    notes:
                      session.notes ||
                      null,
                  }),
                ),
            }),
          });

        const scheduleResult =
          await scheduleResponse
            .json()
            .catch(() => null);

        if (!scheduleResponse.ok) {
          throw new Error(
            scheduleResult?.error ||
              'تعذر حفظ موعد الدورة.',
          );
        }
      }

      const amount = Number(
        schedule.price ?? 0,
      );

      const orderResponse =
        await fetch('/api/orders', {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            traineeId:
              sqlTraineeId,

            type: 'public',

            customer: {
              traineeId:
                sqlTraineeId,

              name:
                `${user.profile.firstName} ${user.profile.lastName}`.trim(),

              email:
                user.email,

              phone:
                user.contact.phone,

              company:
                user.company?.companyName,
            },

            items: [
              {
                id:
                  `item-${Date.now()}`,

                type:
                  'training-program',

                itemId:
                  course.id,

                title:
                  course.title,

                quantity: 1,

                unitPrice:
                  amount,

                totalPrice:
                  amount,

                metadata: {
                  scheduleId:
                    schedule.id,

                  city:
                    schedule.city,
                },
              },
            ],

            subtotal:
              amount,

            discount: 0,

            tax: 0,

            total:
              amount,

            currency:
              'SAR',

            payment: {
              method:
                'online-payment',

              status:
                'pending',

              amount:
                amount,

              currency:
                'SAR',
            },

            status:
              'pending',

            scheduleId:
              schedule.id,

            bookingDate:
              schedule.startDate,

            notes:
              notes.trim() ||
              'طلب تسجيل في دورة تدريبية Public.',
          }),
        });

      const orderResult =
        await orderResponse
          .json()
          .catch(() => null);

      if (!orderResponse.ok) {
        throw new Error(
          orderResult?.error ||
            'تعذر إنشاء الطلب.',
        );
      }

      setMessage(
        'تم إرسال طلب التسجيل بنجاح. سيتم تفعيل الدورة بعد اعتماد الطلب.',
      );
    } catch (error) {
      console.error(
        'Training booking error:',
        error,
      );

      setMessage(
        error instanceof Error &&
          error.message
          ? error.message
          : 'تعذر إنشاء طلب التسجيل. حاول مرة أخرى.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="container mx-auto px-6 py-12"
      >
        جاري تحميل بيانات الحجز...
      </main>
    );
  }

  if (!schedule || !course) {
    return (
      <main
        dir="rtl"
        className="container mx-auto px-6 py-12"
      >
        <h1>الموعد غير موجود</h1>

        <Link
          href="/training-courses"
          className="btn-secondary"
        >
          العودة للدورات التدريبية
        </Link>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        dir="rtl"
        className="container mx-auto px-6 py-12"
      >
        <h1>
          تسجيل الدخول مطلوب
        </h1>

        <p>
          يجب تسجيل الدخول قبل
          التسجيل في الموعد.
        </p>

        <Link
          href={`/login?next=/training-booking?id=${encodeURIComponent(
            schedule.id,
          )}`}
          className="btn-primary"
        >
          تسجيل الدخول
        </Link>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="container mx-auto max-w-5xl px-6 py-12"
    >
      <h1 className="mb-8 text-4xl font-bold">
        التسجيل في الدورة
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <section
          className="card"
          style={{ padding: 24 }}
        >
          <h2>بيانات المتدرب</h2>

          <div className="checkout-summary-list">
            <div>
              <span>الاسم</span>

              <strong>
                {user.profile.firstName}{' '}
                {user.profile.lastName}
              </strong>
            </div>

            <div>
              <span>البريد</span>

              <strong>
                {user.email}
              </strong>
            </div>

            <div>
              <span>الجوال</span>

              <strong>
                {user.contact.phone ||
                  '—'}
              </strong>
            </div>
          </div>

          <label className="checkout-notes-field">
            ملاحظات

            <textarea
              className="admin-textarea"
              rows={4}
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
            />
          </label>

          {message && (
            <div
              className="auth-demo"
              style={{
                marginTop: 18,
              }}
            >
              {message}
            </div>
          )}

          {!message && (
            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: 22,
              }}
            >
              <button
                className="btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? 'جاري إرسال الطلب...'
                  : 'تأكيد التسجيل'}
              </button>
            </form>
          )}
        </section>

        <aside
          className="card"
          style={{ padding: 24 }}
        >
          <span className="card-label">
            دورة تدريبية
          </span>

          <h2>{course.title}</h2>

          <p>
            {schedule.city ||
              'أونلاين'}
          </p>

          <p>
            {String(
              schedule.startDate.getDate(),
            ).padStart(2, '0')}
            /
            {String(
              schedule.startDate.getMonth() +
                1,
            ).padStart(2, '0')}
            /
            {schedule.startDate.getFullYear()}
          </p>

          <div className="course-price-stack">
            <strong>
              {Number(
                schedule.price ?? 0,
              ).toLocaleString(
                'ar-SA',
              )}{' '}
              ر.س
            </strong>
          </div>

          {message && (
            <Link
              href="/account"
              className="btn-primary"
              style={{
                display:
                  'inline-block',
                marginTop: 16,
              }}
            >
              الذهاب إلى حسابي
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}