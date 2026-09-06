'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { courseRepository } from '@/lib/data/repositories/course-repository';

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const currentUser = await traineeRepository.getCurrentUser();

      if (!active) {
        return;
      }

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const courseEntries = await Promise.all(
        currentUser.enrollments.map(async (enrollment) => {
          const course = await courseRepository.findById(enrollment.courseId);
          return [enrollment.courseId, course] as const;
        }),
      );

      if (active) {
        setCourses(Object.fromEntries(courseEntries));
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await traineeRepository.logout();
    router.push('/login');
  }

  if (loading) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        <p>جاري تحميل الحساب...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main dir="rtl" className="container mx-auto px-6 py-12">
        <h1>حساب المتدرب</h1>
        <p>يجب تسجيل الدخول للوصول إلى حسابك.</p>
        <button className="admin-btn admin-btn-primary" onClick={() => router.push('/login')}>
          تسجيل الدخول
        </button>
      </main>
    );
  }

  const arabicName = `${user.profile.firstName} ${user.profile.lastName}`.trim();
  const englishName = `${user.profile.firstNameEnglish ?? ''} ${user.profile.lastNameEnglish ?? ''}`.trim();

  return (
    <main dir="rtl" className="container mx-auto px-6 py-12">
      <div className="account-header">
        <div>
          <span className="eyebrow">حساب المتدرب</span>
          <h1>مرحباً {arabicName}</h1>
          <p>{user.email}</p>
        </div>
        <button className="admin-btn admin-btn-light" onClick={() => void logout()}>
          تسجيل الخروج
        </button>
      </div>

      <section className="account-profile-card">
        <h2>بياناتي</h2>
        <div className="account-profile-grid">
          <div>
            <span>الاسم بالعربي</span>
            <strong>{arabicName || '—'}</strong>
          </div>
          <div>
            <span>الاسم بالإنجليزي</span>
            <strong>{englishName || 'غير مضاف'}</strong>
          </div>
          <div>
            <span>البريد الإلكتروني</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span>رقم الجوال</span>
            <strong>{user.contact.phone || 'غير مضاف'}</strong>
          </div>
          <div>
            <span>الشركة</span>
            <strong>{user.company?.companyName || 'غير مضاف'}</strong>
          </div>
        </div>
      </section>

      <section className="account-courses-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">التعلم</span>
            <h2>دوراتي</h2>
          </div>
          <span>{user.enrollments.length} دورة</span>
        </div>

        {user.enrollments.length === 0 ? (
          <div className="account-empty-state">
            <h3>لا توجد دورات مسجلة حتى الآن</h3>
            <p>بعد التسجيل في دورة ستظهر هنا ويمكنك الدخول إليها مباشرة.</p>
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => router.push('/training-courses')}
            >
              استعراض الدورات
            </button>
          </div>
        ) : (
          <div className="account-course-grid">
            {user.enrollments.map((enrollment: any) => {
              const course = courses[enrollment.courseId];
              const progress = Math.max(0, Math.min(100, Number(enrollment.progress ?? 0)));

              return (
                <article className="account-course-card" key={enrollment.id ?? enrollment.courseId}>
                  <div>
                    <span className="account-course-status">{enrollment.status === 'completed' ? 'مكتملة' : 'نشطة'}</span>
                    <h3>{course?.title ?? enrollment.courseTitle}</h3>
                    <p>{enrollment.scheduleId ? 'تسجيل مرتبط بموعد' : 'تسجيل في الدورة'}</p>
                  </div>
                  <div className="account-course-details">
                    <span>Pre-Assessment: {enrollment.preAssessment === 'completed' ? 'مكتمل' : enrollment.preAssessment === 'available' ? 'متاح' : 'مغلق'}</span>
                    <span>Post-Assessment: {enrollment.postAssessment === 'completed' ? 'مكتمل' : enrollment.postAssessment === 'available' ? 'متاح' : 'مغلق'}</span>
                    <span>Course Evaluation: {enrollment.courseEvaluation === 'completed' ? 'مكتمل' : enrollment.courseEvaluation === 'available' ? 'متاح' : 'مغلق'}</span>
                    <span>الحضور: {enrollment.attendance === 'present' ? 'حاضر' : enrollment.attendance === 'absent' ? 'غائب' : 'لم يسجل بعد'}</span>
                  </div>

                  <div className="account-progress">
                    <div className="account-progress-label">
                      <span>التقدم</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="account-progress-track">
                      <div style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => router.push(`/course-learning?id=${encodeURIComponent(enrollment.courseId)}`)}>{progress > 0 ? 'متابعة التعلم' : 'ابدأ التعلم'}</button>
                    {enrollment.certificateId || enrollment.status === 'completed' ? <button className="admin-btn admin-btn-light" onClick={() => router.push(`/certificate?courseId=${encodeURIComponent(enrollment.courseId)}`)}>الشهادة</button> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
