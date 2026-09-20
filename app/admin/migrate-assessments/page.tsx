'use client';

import { Suspense, useEffect, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import type { Course } from '@/types/course';

const RATING_OPTIONS = [
  '1 - ضعيف جدًا',
  '2 - ضعيف',
  '3 - جيد',
  '4 - جيد جدًا',
  '5 - ممتاز',
];

const UNIFIED_EVALUATION_QUESTIONS = [
  {
    question: 'كيف تقيّم الدورة التدريبية بشكل عام؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'كيف تقيّم المدرب وطريقة تقديمه للمحتوى؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'كيف تقيّم المادة التدريبية والمحتوى؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'كيف تقيّم وضوح وتنظيم المحتوى؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'كيف تقيّم الجانب العملي والتطبيقات؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'كيف تقيّم مدة البرنامج ووقت التدريب؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'كيف تقيّم تنظيم وتجهيز البرنامج؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'ما مدى استفادتك من البرنامج؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'ما مدى توصيتك بهذا البرنامج لزملائك؟',
    type: 'multiple-choice',
    options: RATING_OPTIONS,
  },
  {
    question: 'ما رأيك أو اقتراحاتك لتحسين البرنامج؟',
    type: 'text',
    options: [],
  },
];

export default function MigrateAssessmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState('');

  const trainingCourses = courses.filter(
    (course) => course.type === 'training',
  );

  const recordedCourses = courses.filter(
    (course) => course.type === 'recorded',
  );

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    setMessage('');

    try {
      const allCourses = await courseRepository.findAll();
      setCourses(allCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء تحميل البرامج.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function migrateAssessments() {
    setMigrating(true);
    setMessage('');

    try {
      const allCourses = await courseRepository.findAll();

      const trainingCourses = allCourses.filter(
        (course) => course.type === 'training',
      );

      let imported = 0;
      let skipped = 0;
      let importedQuestions = 0;

      for (const course of trainingCourses) {
        const assessmentId = `assessment_${course.id}_evaluation`;

        const response = await fetch('/api/assessments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: assessmentId,
            courseId: course.id,
            assessmentType: 'evaluation',
            title: 'تقييم الدورة',
            description:
              'قياس رضا المتدرب عن المدرب والمحتوى والتنظيم.',
            passingScore: 0,
            timeLimit: null,
            questions: UNIFIED_EVALUATION_QUESTIONS.map(
              (question, index) => ({
                id: `${assessmentId}_q_${index + 1}`,
                question: question.question,
                type: question.type,
                options: question.options,
                correctAnswer: '',
                explanation: '',
                order: index,
                points: 0,
              }),
            ),
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error(
            'Assessment migration failed:',
            course.id,
            result,
          );

          skipped++;
          continue;
        }

        imported++;
        importedQuestions += UNIFIED_EVALUATION_QUESTIONS.length;
      }

      setMessage(
        `تم تجهيز ${imported} تقييم دورة و ${importedQuestions} سؤال في PostgreSQL. تم تخطي ${skipped}.`,
      );
    } catch (error) {
      console.error(
        'Assessment migration failed:',
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء تجهيز تقييمات الدورات.',
      );
    } finally {
      setMigrating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            تجهيز تقييمات الدورات
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            إنشاء تقييم موحد لجميع البرامج التدريبية في PostgreSQL.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">
              جاري تحميل البرامج...
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">
                  إجمالي الدورات
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {courses.length}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">
                  البرامج التدريبية
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {trainingCourses.length}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">
                  الدورات المسجلة
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {recordedCourses.length}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">
                  الأسئلة لكل تقييم
                </div>

                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {UNIFIED_EVALUATION_QUESTIONS.length}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">
                ما سيتم تجهيزه
              </h2>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  سيتم إنشاء تقييم دورة موحد لكل برنامج تدريبي.
                </p>

                <p>
                  عدد البرامج التدريبية:{' '}
                  <strong>{trainingCourses.length}</strong>
                </p>

                <p>
                  عدد تقييمات الدورات التي سيتم تجهيزها:{' '}
                  <strong>{trainingCourses.length}</strong>
                </p>

                <p>
                  عدد الأسئلة الإجمالي:{' '}
                  <strong>
                    {trainingCourses.length *
                      UNIFIED_EVALUATION_QUESTIONS.length}
                  </strong>
                </p>

                <p>
                  الدورات المسجلة لا تحصل على تقييم دورة:
                  <strong className="mr-1">
                    {recordedCourses.length}
                  </strong>
                </p>

                <p>
                  لا يتم إنشاء Pre أو Post تجريبيين.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">
                محتوى التقييم الموحد
              </h2>

              <div className="mt-4 space-y-2">
                {UNIFIED_EVALUATION_QUESTIONS.map(
                  (question, index) => (
                    <div
                      key={question.question}
                      className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      <span className="font-semibold text-slate-900">
                        {index + 1}.
                      </span>{' '}
                      {question.question}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <button
                type="button"
                onClick={migrateAssessments}
                disabled={migrating || trainingCourses.length === 0}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {migrating
                  ? 'جاري تجهيز التقييمات...'
                  : 'تجهيز تقييمات جميع البرامج'}
              </button>

              {message && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {message}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}