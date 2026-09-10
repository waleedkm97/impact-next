'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { groupRepository } from '@/lib/data/repositories/group-repository';
import type { Trainee, Certificate } from '@/types/trainee';
import type { Course } from '@/types/course';

interface CertificateView {
  trainee: Trainee;
  certificate: Certificate;
  course: Course | null;
}

function formatCertificateDate(value: unknown) {
  if (!value) return '—';

  const date = new Date(value as string | Date);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear());

  return `${day}/${month}/${year}`;
}

function getArabicName(trainee: Trainee) {
  return (
    `${trainee.profile?.firstName ?? ''} ${
      trainee.profile?.lastName ?? ''
    }`.trim() || 'المتدرب'
  );
}

function getEnglishName(trainee: Trainee) {
  const name = `${trainee.profile?.firstNameEnglish ?? ''} ${
    trainee.profile?.lastNameEnglish ?? ''
  }`.trim();

  return name || getArabicName(trainee);
}

function getHours(course: Course | null) {
  if (!course) return '—';

  if (course.hours !== undefined && course.hours !== null) {
    const value = String(course.hours)
      .replace(/\s*ساعة.*$/i, '')
      .trim();

    return value || String(course.hours);
  }

  return course.days ? String(Number(course.days) * 5) : '—';
}

function getDuration(
  course: Course | null,
  language: 'ar' | 'en',
) {
  if (!course?.days) return '—';

  const days = Number(course.days);

  if (language === 'en') {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }

  return `${days} ${days === 1 ? 'يوم' : 'أيام'}`;
}

function getDelivery(
  course: Course | null,
  language: 'ar' | 'en',
) {
  if (!course) return '';

  if (language === 'en') {
    if (course.delivery === 'online') {
      return 'Live Online';
    }

    if (course.delivery === 'in-person') {
      return 'In-Person';
    }

    return 'Hybrid';
  }

  if (course.delivery === 'online') {
    return 'أونلاين';
  }

  if (course.delivery === 'in-person') {
    return 'حضوري';
  }

  return 'حضوري / أونلاين';
}

function getEnglishCourseTitle(
  course: Course | null,
  certificate: Certificate,
) {
  const title =
    course?.title?.trim() ||
    certificate.courseTitle?.trim() ||
    '';

  if (!title) {
    return 'Training Course';
  }

  if (/[A-Za-z]/.test(title)) {
    return title;
  }

  const translations: Record<string, string> = {
    'مهارات البيع وتحويل الفرص لنتائج ملموسة':
      'Sales Skills and Converting Opportunities into Results',
    'القيادة الحديثة': 'Modern Leadership',
    'القيادة التحويلية': 'Transformational Leadership',
    'بناء فرق العمل': 'Team Building',
    'مهارات البيع الحديثة': 'Modern Sales Skills',
    'مهارات التفاوض': 'Negotiation Skills',
    'البيع الاستشاري': 'Consultative Selling',
    'مهارات التعامل مع العملاء':
      'Customer Handling Skills',
    'حل المشكلات والاعتراضات':
      'Problem Solving and Objection Handling',
    'تجربة العميل': 'Customer Experience',
    'إدارة الأداء': 'Performance Management',
    'مؤشرات الأداء': 'Key Performance Indicators',
    'المقابلات الاحترافية':
      'Professional Interviewing Skills',
    'إدارة المشاريع الاحترافية':
      'Professional Project Management',
    'أساسيات أجيلي': 'Agile Fundamentals',
    'أساسيات سكروم': 'Scrum Fundamentals',
    'مهارات التواصل الفعال':
      'Effective Communication Skills',
    'مهارات العرض والإلقاء':
      'Presentation and Public Speaking Skills',
    'كتابة التقارير': 'Report Writing',
    'إدارة الوقت بفعالية':
      'Effective Time Management',
    'تحديد الأولويات': 'Prioritization Skills',
    'تحسين الإنتاجية': 'Productivity Improvement',
    'حل المشكلات بطرق جديدة':
      'Creative Problem Solving',
    'إشعال روح الابتكار':
      'Igniting Innovation',
    'التفكير الاستراتيجي':
      'Strategic Thinking',
  };

  return translations[title] || title;
}

function CertificateSheet({
  item,
  language,
}: {
  item: CertificateView;
  language: 'ar' | 'en';
}) {
  const isArabic = language === 'ar';

  const name = isArabic
    ? getArabicName(item.trainee)
    : getEnglishName(item.trainee);

  const courseTitle = isArabic
    ? item.certificate.courseTitle ||
      item.course?.title ||
      '—'
    : getEnglishCourseTitle(
        item.course,
        item.certificate,
      );

  const duration = getDuration(item.course, language);
  const hours = getHours(item.course);
  const delivery = getDelivery(item.course, language);

  return (
    <section className="certificate-sheet">
      <div
        className={`certificate ${
          isArabic
            ? 'certificate-ar'
            : 'certificate-en'
        }`}
      >
        {/* عنوان الشهادة */}
        <div className="certificate-title">
          {isArabic ? 'الشهادة' : 'CERTIFICATE'}
        </div>

        {/* تشهد إمباكت */}
        <div className="field intro-text">
          {isArabic
            ? 'تشهد إمباكت للتدريب أن'
            : 'IMPACT Training certifies that'}
        </div>

        {/* اسم المتدرب */}
        <div className="field student-name">
          {name}
        </div>

        {/* قد أنجز */}
        <div className="field completion-text">
          {isArabic
            ? item.trainee.profile?.gender === 'female'
              ? 'قد أنجزت دورة'
              : 'قد أنجز دورة'
            : 'has successfully completed the training course'}
        </div>

        {/* اسم الدورة */}
        <div className="field course-name">
          {courseTitle}
        </div>

        {/* معلومات الدورة */}
        <div className="certificate-info">
          {/* التاريخ */}
          <div className="date-info">
            <div className="info-label">
              {isArabic ? 'خلال فترة' : 'During'}
            </div>

            <div className="info-value">
              {formatCertificateDate(
                item.certificate.issuedAt,
              )}
            </div>
          </div>

          {/* طريقة التدريب */}
          <div className="delivery-info">
            <div className="info-label">
              {isArabic
                ? 'طريقة التدريب'
                : 'Delivery'}
            </div>

            <div className="info-value">
              {delivery}
            </div>
          </div>

          {/* المدة والساعات */}
          <div className="hours-info">
            <div className="info-label">
              {isArabic ? 'لمدة' : 'Duration'}
            </div>

            <div className="duration-row">
              <span>{duration}</span>

              {hours !== '—' && (
                <span>
                  {hours}{' '}
                  {isArabic
                    ? 'ساعة تدريبية'
                    : 'Training Hours'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* رقم الشهادة */}
        <div className="certificate-number">
          {isArabic
            ? 'رقم الشهادة'
            : 'Certificate No.'}
          : {item.certificate.certificateNumber}
        </div>
      </div>
    </section>
  );
}

export default function CertificatePage() {
  const searchParams = useSearchParams();

  const courseId =
    searchParams.get('courseId') || '';

  const traineeId =
    searchParams.get('traineeId') || '';

  const groupId =
    searchParams.get('groupId') || '';

  const [items, setItems] = useState<
    CertificateView[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [language, setLanguage] =
    useState<'ar' | 'en'>('ar');

  const [error, setError] =
    useState('');

  const isBulk = Boolean(groupId);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const views: CertificateView[] = [];

        if (groupId) {
          const group =
            await groupRepository.findById(
              groupId,
            );

          if (!group) {
            throw new Error(
              'المجموعة غير موجودة.',
            );
          }

          const course =
            await courseRepository.findById(
              group.courseId,
            );

          const allTrainees =
            await traineeRepository.findAll();

          const members =
            allTrainees.filter((trainee) =>
              group.traineeIds.includes(
                trainee.id,
              ),
            );

          for (const trainee of members) {
            const enrollment =
              trainee.enrollments.find(
                (item) =>
                  item.groupId === group.id ||
                  (item.courseId ===
                    group.courseId &&
                    !item.groupId),
              );

            if (!enrollment) {
              continue;
            }

            const certificate =
              await traineeRepository.issueCertificateIfEligible(
                trainee.id,
                enrollment.id ??
                  enrollment.courseId,
              );

            if (certificate) {
              views.push({
                trainee,
                certificate,
                course,
              });
            }
          }
        } else {
          const trainee = traineeId
            ? await traineeRepository.findById(
                traineeId,
              )
            : await traineeRepository.getCurrentUser();

          if (!trainee) {
            throw new Error(
              'المتدرب غير موجود.',
            );
          }

          const enrollment = courseId
            ? trainee.enrollments.find(
                (item) =>
                  item.courseId === courseId,
              )
            : trainee.enrollments.find(
                (item) => item.certificateId,
              );

          if (!enrollment) {
            throw new Error(
              'الدورة غير موجودة لدى المتدرب.',
            );
          }

          const certificate =
            await traineeRepository.issueCertificateIfEligible(
              trainee.id,
              enrollment.id ??
                enrollment.courseId,
            );

          const existing =
            certificate ??
            trainee.certificates.find(
              (item) =>
                item.courseId ===
                enrollment.courseId,
            );

          if (!existing) {
            throw new Error(
              'الشهادة غير متاحة بعد. أكمل متطلبات الدورة أولاً.',
            );
          }

          const course =
            await courseRepository.findById(
              enrollment.courseId,
            );

          views.push({
            trainee,
            certificate: existing,
            course,
          });
        }

        if (!active) {
          return;
        }

        if (!views.length) {
          setError(
            'لا توجد شهادات مستحقة حاليًا.',
          );
        }

        setItems(views);
        setLoading(false);
      } catch (loadError) {
        console.error(
          'Failed to load certificate:',
          loadError,
        );

        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'تعذر تحميل الشهادة.',
        );

        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [courseId, traineeId, groupId]);

  useEffect(() => {
    if (
      !loading &&
      isBulk &&
      items.length > 0
    ) {
      const timer = window.setTimeout(() => {
        window.print();
      }, 700);

      return () =>
        window.clearTimeout(timer);
    }
  }, [
    loading,
    isBulk,
    items.length,
  ]);

  const title = useMemo(
    () =>
      isBulk
        ? 'شهادات المجموعة'
        : 'الشهادة',
    [isBulk],
  );

  if (loading) {
    return (
      <main
        dir="rtl"
        className="certificate-page-shell"
      >
        <div className="certificate-message">
          جاري تجهيز الشهادة...
        </div>
      </main>
    );
  }

  if (
    error ||
    items.length === 0
  ) {
    return (
      <main
        dir="rtl"
        className="certificate-page-shell"
      >
        <div className="certificate-message">
          <h1>{title}</h1>

          <p>
            {error ||
              'لا توجد شهادات.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={
        language === 'ar'
          ? 'rtl'
          : 'ltr'
      }
      className="certificate-page-shell"
    >
      <div className="certificate-toolbar">
        <div>
          <h1>{title}</h1>

          <p>
            {isBulk
              ? `تم تجهيز ${items.length} شهادة للطباعة دفعة واحدة.`
              : `رقم الشهادة: ${items[0].certificate.certificateNumber}`}
          </p>
        </div>

        <div className="certificate-actions">
          <button
            type="button"
            className="certificate-button light"
            onClick={() =>
              setLanguage(
                language === 'ar'
                  ? 'en'
                  : 'ar',
              )
            }
          >
            {language === 'ar'
              ? 'English'
              : 'العربية'}
          </button>

          <button
            type="button"
            className="certificate-button"
            onClick={() =>
              window.print()
            }
          >
            طباعة الشهادة
          </button>
        </div>
      </div>

      {items.map((item) => (
        <div
          key={`${item.trainee.id}-${item.certificate.id}`}
        >
          <CertificateSheet
            item={item}
            language={language}
          />
        </div>
      ))}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }

        body {
          font-family: Arial, sans-serif;
        }

        .certificate-page-shell {
          min-height: 100vh;
          padding: 24px;
        }

        .certificate-toolbar {
          max-width: 1200px;
          margin: 0 auto 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .certificate-toolbar h1 {
          margin: 0;
          color: #062b67;
          font-size: 26px;
        }

        .certificate-toolbar p {
          margin: 6px 0 0;
          color: #6b7280;
        }

        .certificate-actions {
          display: flex;
          gap: 8px;
        }

        .certificate-button {
          border: 0;
          border-radius: 8px;
          padding: 11px 18px;
          cursor: pointer;
          background: #002060;
          color: white;
          font-size: 14px;
        }

        .certificate-button.light {
          background: white;
          color: #002060;
          border: 1px solid #d5d9e0;
        }

        .certificate-sheet {
          width: 297mm;
          height: 210mm;
          margin: 0 auto 24px;
          position: relative;
          overflow: hidden;
        }

        .certificate {
          position: relative;
          width: 297mm;
          height: 210mm;

          background-image: url('/assets/certificate-template.png');
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;

          overflow: hidden;

          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        /* =========================
           عنوان الشهادة
           ========================= */

        .certificate-title {
          position: absolute;
          z-index: 4;

          /* نزلناها عن النسخة السابقة حتى لا تدخل على اللوغو */
          top: 24%;

          left: 50%;

          transform: translateX(-50%);

          width: 48%;

          text-align: center;

          background: #ffffff;

          color: #0B2E67;

          font-family:
            'Randly',
            'Times New Roman',
            Georgia,
            serif;

          font-size: 45px;

          font-weight: 500;

          line-height: 1.1;

          padding: 2px 18px;

          white-space: nowrap;
        }

        .certificate-ar .certificate-title {
          font-family:
            'Randly',
            'IBM Plex Sans Arabic',
            Arial,
            sans-serif;

          font-size: 45px;

          font-weight: 500;
        }

        .certificate-en .certificate-title {
          font-family:
            'Randly',
            'Times New Roman',
            Georgia,
            serif;

          font-size: 45px;

          font-weight: 500;

          direction: ltr;
        }

        .field {
          position: absolute;

          z-index: 5;

          left: 50%;

          transform: translateX(-50%);

          text-align: center;

          color: #0B2E67;

          line-height: 1.15;
        }

        .certificate-ar .field {
          direction: rtl;

          font-family:
            'IBM Plex Sans Arabic',
            Arial,
            sans-serif;

          font-synthesis: none;

          text-rendering:
            geometricPrecision;
        }

        /* =========================
           العربي
           ========================= */

        /* تشهد إمباكت - نزلت قليل */
        .certificate-ar .intro-text {
          top: 31%;

          width: 65%;

          font-size: 30px;

          font-weight: 500;

          white-space: nowrap;
        }

        /* اسم المتدرب - نزل قليل */
        .certificate-ar .student-name {
          top: 35.2%;

          width: 68%;

          color: #B48732;

          font-size: 42px;

          font-weight: 700;

          padding-bottom: 10px;

          border-bottom: 1.5px solid #B48732;

          white-space: nowrap;
        }

        /* قد أنجز - نزل أكثر */
        .certificate-ar .completion-text {
          top: 43.5%;

          width: 65%;

          font-size: 30px;

          font-weight: 500;

          white-space: nowrap;
        }

        /* اسم الدورة - نازل */
        .certificate-ar .course-name {
          top: 49.0%;

          width: 68%;

          color: #B48732;

          font-size: 40px;

          font-weight: 700;

          padding-bottom: 10px;

          border-bottom: 1.5px solid #B48732;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        /* =========================
           الإنجليزي
           ========================= */

        .certificate-en .field {
          direction: ltr;
        }

        .certificate-en .intro-text {
          top: 31%;

          width: 70%;

          font-size: 30px;

          font-weight: 500;

          white-space: nowrap;
        }

        .certificate-en .student-name {
          top: 35.2%;

          width: 68%;

          color: #B48732;

          font-size: 30px;

          font-weight: 500;

          padding-bottom: 10px;

          border-bottom: 1.5px solid #B48732;

          white-space: nowrap;
        }

        .certificate-en .completion-text {
          top: 43.5%;

          width: 76%;

          font-size: 30px;

          font-weight: 500;

          white-space: nowrap;
        }

        .certificate-en .course-name {
          top: 49.0%;

          width: 68%;

          color: #B48732;

          font-size: 30px;

          font-weight: 500;

          padding-bottom: 10px;

          border-bottom: 1.5px solid #B48732;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        /* =========================
           معلومات الدورة
           ========================= */

        .certificate-info {
          position: absolute;

          z-index: 5;

          top: 57.2%;

          left: 50%;

          width: 72%;

          transform: translateX(-50%);

          display: flex;

          justify-content: space-between;

          align-items: flex-start;

          gap: 20px;

          direction: ltr;
        }

        .date-info,
        .delivery-info,
        .hours-info {
          flex: 1;

          min-width: 0;

          text-align: center;
        }

        .certificate-ar
          .date-info,
        .certificate-ar
          .delivery-info,
        .certificate-ar
          .hours-info {
          direction: rtl;
        }

        .certificate-en
          .date-info,
        .certificate-en
          .delivery-info,
        .certificate-en
          .hours-info {
          direction: ltr;
        }

        .info-label {
          color: #0B2E67;

          font-size: 20px;

          font-weight: 400;

          margin: 0 auto 7px;

          padding: 0 8px 6px;

          border-bottom: 1.5px solid #B48732;

          white-space: nowrap;

          display: table;
        }

        .info-value {
          color: #B48732;

          font-size: 18px;

          font-weight: 400;

          padding: 0 8px;

          min-height: 34px;

          white-space: nowrap;
        }

        /* =========================
           المدة والساعات جنب بعض
           ========================= */

        .duration-row {
          display: flex;

          justify-content: center;

          align-items: center;

          gap: 14px;

          color: #B48732;

          font-size: 18px;

          font-weight: 400;

          white-space: nowrap;
        }

        .duration-row span + span {
          border-right: 1px solid #B48732;

          padding-right: 14px;
        }

        .certificate-en
          .duration-row
          span
          + span {
          border-right: 0;

          border-left: 1px solid #B48732;

          padding-right: 0;

          padding-left: 14px;
        }

        /* =========================
           رقم الشهادة
           ========================= */

        .certificate-number {
          position: absolute;

          z-index: 5;

          bottom: 6.5%;

          left: 50%;

          transform: translateX(-50%);

          color: #0B2E67;

          font-size: 10px;

          text-align: center;

          white-space: nowrap;
        }

        /* =========================
           RESPONSIVE
           ========================= */

        @media screen and (max-width: 900px) {
          .certificate-page-shell {
            padding: 12px;

            overflow-x: auto;
          }

          .certificate-toolbar {
            flex-direction: column;

            align-items: stretch;
          }

          .certificate-actions {
            width: 100%;
          }

          .certificate-button {
            flex: 1;
          }

          .certificate-sheet {
            transform-origin: top left;

            margin-left: 0;
          }
        }

        /* =========================
           PRINT
           ========================= */

        @media print {
          @page {
            size: A4 landscape;

            margin: 0;
          }

          html,
          body {
            width: 297mm;

            height: 210mm;

            margin: 0;

            padding: 0;

            background: white;
          }

          body {
            overflow: hidden;
          }

          header,
          nav,
          footer {
            display: none !important;
          }

          .certificate-page-shell {
            width: 297mm;

            min-height: 0;

            padding: 0;

            margin: 0;
          }

          .certificate-toolbar {
            display: none !important;
          }

          .certificate-sheet {
            width: 297mm;

            height: 210mm;

            margin: 0;

            padding: 0;

            break-after: page;

            page-break-after: always;

            overflow: hidden;
          }

          .certificate-sheet:last-child {
            break-after: auto;

            page-break-after: auto;
          }

          .certificate {
            width: 297mm;

            height: 210mm;

            margin: 0;

            padding: 0;

            background-size: 100% 100%;

            overflow: hidden;
          }

          .certificate-message {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}