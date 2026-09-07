'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import type { CourseAssessment } from '@/types/course';

type AssessmentType = 'pre' | 'post' | 'evaluation';

function getAssessmentTitle(type: AssessmentType) {
  if (type === 'pre') return 'التقييم القبلي';
  if (type === 'post') return 'التقييم البعدي';
  return 'تقييم الدورة';
}

function getEnrollmentField(type: AssessmentType) {
  if (type === 'pre') return 'preAssessment';
  if (type === 'post') return 'postAssessment';
  return 'courseEvaluation';
}

function normalizeAnswer(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).sort().join('|');
  }

  return String(value ?? '').trim().toLowerCase();
}

export default function AssessmentPage() {
  const searchParams = useSearchParams();

  const courseId = searchParams.get('courseId') || '';
  const requestedType = searchParams.get('type') as AssessmentType | null;

  const type: AssessmentType =
    requestedType === 'post' || requestedType === 'evaluation'
      ? requestedType
      : 'pre';

  const [courseTitle, setCourseTitle] = useState('');
  const [assessment, setAssessment] =
    useState<CourseAssessment | null>(null);

  const [user, setUser] = useState<any>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [course, currentUser] = await Promise.all([
          courseRepository.findById(courseId),
          traineeRepository.getCurrentUser(),
        ]);

        if (!active) return;

        if (!course || !currentUser) {
          setLoading(false);
          return;
        }

        const enrollment = currentUser.enrollments.find(
          (item) => item.courseId === courseId,
        );

        if (!enrollment) {
          setLoading(false);
          return;
        }

        const currentAssessment =
          course.assessments?.find(
            (item) => item.assessmentType === type,
          ) ?? null;

        setCourseTitle(course.title);
        setUser(currentUser);
        setAssessment(currentAssessment);

        const field = getEnrollmentField(type);

        if ((enrollment as any)[field] === 'completed') {
          setSubmitted(true);
        }
      } catch (error) {
        console.error('Failed to load assessment:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [courseId, type]);

  const questions = useMemo(
    () => assessment?.questions ?? [],
    [assessment],
  );

  function setAnswer(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function submitAssessment() {
    if (!assessment || !user) return;

    const unanswered = questions.some(
      (question) =>
        !String(answers[question.id] ?? '').trim(),
    );

    if (unanswered) {
      alert('يرجى الإجابة على جميع الأسئلة قبل إرسال التقييم.');
      return;
    }

    setSubmitting(true);

    try {
      let earnedPoints = 0;
      let totalPoints = 0;

      for (const question of questions) {
        const points = Number(question.points ?? 1);

        totalPoints += points;

        if (
          normalizeAnswer(answers[question.id]) ===
          normalizeAnswer(question.correctAnswer)
        ) {
          earnedPoints += points;
        }
      }

      const percentage =
        totalPoints > 0
          ? Math.round((earnedPoints / totalPoints) * 100)
          : 0;

      const field = getEnrollmentField(type);

      await traineeRepository.updateEnrollmentAssessment(
        user.id,
        user.enrollments.find(
          (item: any) => item.courseId === courseId,
        )?.id ?? courseId,
        field as
          | 'preAssessment'
          | 'postAssessment'
          | 'courseEvaluation',
        'completed',
      );

      setScore(percentage);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      alert('حدث خطأ أثناء إرسال التقييم.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gray-50 px-6 py-12"
      >
        <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 text-center shadow-sm">
          جاري تحميل التقييم...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gray-50 px-6 py-12"
      >
        <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 text-center shadow-sm">
          يجب تسجيل الدخول للوصول إلى التقييم.
        </div>
      </main>
    );
  }

  if (!assessment) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gray-50 px-6 py-12"
      >
        <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 text-center shadow-sm">

          <h1 className="text-2xl font-bold text-[#062b67]">
            {getAssessmentTitle(type)}
          </h1>

          <p className="mt-4 text-gray-500">
            لم تتم إضافة هذا التقييم للدورة حتى الآن.
          </p>

          <Link
            href={`/course-learning?id=${encodeURIComponent(courseId)}`}
            className="mt-6 inline-flex rounded-xl bg-[#062b67] px-6 py-3 font-semibold text-white"
          >
            العودة إلى الدورة
          </Link>

        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gray-50 px-6 py-12"
      >
        <div className="mx-auto max-w-4xl">

          <div className="rounded-3xl border bg-white p-8 text-center shadow-sm md:p-12">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
              ✓
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#062b67]">
              تم إكمال {getAssessmentTitle(type)}
            </h1>

            <p className="mt-3 text-gray-500">
              {courseTitle}
            </p>

            {score !== null && type !== 'evaluation' && (
              <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-gray-50 p-6">
                <div className="text-sm text-gray-500">
                  نتيجتك
                </div>

                <div className="mt-2 text-4xl font-bold text-[#062b67]">
                  {score}%
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  درجة التقييم
                </div>
              </div>
            )}

            <Link
              href={`/course-learning?id=${encodeURIComponent(courseId)}`}
              className="mt-8 inline-flex rounded-xl bg-[#062b67] px-7 py-3 font-semibold text-white"
            >
              العودة إلى الدورة
            </Link>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50"
    >
      <div className="mx-auto max-w-4xl px-6 py-8">

        <Link
          href={`/course-learning?id=${encodeURIComponent(courseId)}`}
          className="text-sm font-medium text-gray-500 hover:text-[#062b67]"
        >
          ← العودة إلى الدورة
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm">

          <div className="bg-[#062b67] px-6 py-8 text-white md:px-10">

            <div className="text-sm text-blue-100">
              {courseTitle}
            </div>

            <h1 className="mt-2 text-3xl font-bold text-white">
              {assessment.title ||
                getAssessmentTitle(type)}
            </h1>

            {assessment.description && (
              <p className="mt-4 leading-7 text-blue-50">
                {assessment.description}
              </p>
            )}

          </div>

          <div className="p-6 md:p-10">

            <div className="mb-8 rounded-2xl bg-gray-50 p-5">
              <div className="flex flex-wrap gap-5 text-sm text-gray-600">

                <span>
                  عدد الأسئلة:{' '}
                  <strong className="text-[#062b67]">
                    {questions.length}
                  </strong>
                </span>

                <span>
                  درجة النجاح:{' '}
                  <strong className="text-[#062b67]">
                    {assessment.passingScore}%
                  </strong>
                </span>

                {assessment.timeLimit && (
                  <span>
                    الوقت:{' '}
                    <strong className="text-[#062b67]">
                      {assessment.timeLimit} دقيقة
                    </strong>
                  </span>
                )}

              </div>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-2xl border p-8 text-center">
                <p className="text-gray-500">
                  لم تتم إضافة أسئلة لهذا التقييم بعد.
                </p>
              </div>
            ) : (
              <div className="space-y-6">

                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border p-6"
                  >

                    <div className="flex gap-3">

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#062b67]">
                        {index + 1}
                      </span>

                      <h2 className="font-bold leading-7 text-[#062b67]">
                        {question.question}
                      </h2>

                    </div>

                    <div className="mt-5 space-y-3">

                      {question.type === 'text' ? (
                        <textarea
                          value={answers[question.id] ?? ''}
                          onChange={(event) =>
                            setAnswer(
                              question.id,
                              event.target.value,
                            )
                          }
                          rows={4}
                          className="w-full rounded-xl border p-4 outline-none focus:border-[#062b67]"
                          placeholder="اكتب إجابتك هنا..."
                        />
                      ) : (
                        (question.options ?? []).map(
                          (option) => (
                            <label
                              key={option}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                                answers[question.id] ===
                                option
                                  ? 'border-[#062b67] bg-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={
                                  answers[
                                    question.id
                                  ] === option
                                }
                                onChange={() =>
                                  setAnswer(
                                    question.id,
                                    option,
                                  )
                                }
                              />

                              <span className="text-gray-700">
                                {option}
                              </span>
                            </label>
                          ),
                        )
                      )}

                    </div>

                  </div>
                ))}

              </div>
            )}

            {questions.length > 0 && (
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submitAssessment()}
                  className="rounded-xl bg-[#062b67] px-8 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? 'جاري الإرسال...'
                    : 'إرسال التقييم'}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}