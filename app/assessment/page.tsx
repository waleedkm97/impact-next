'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CourseAssessment } from '@/types/course';

function getTraineeIdFromCookie() {
  const cookie = typeof document === 'undefined' ? undefined : document.cookie.split('; ').find((item) => item.startsWith('impact_sql_trainee='));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
}

function AssessmentContent() {
  const params = useSearchParams();

  const courseId = params.get('courseId') || '';
  const enrollmentId = params.get('enrollmentId') || '';
  const requestedType = params.get('type');

  const type: 'pre' | 'post' | 'evaluation' =
    requestedType === 'post'
      ? 'post'
      : requestedType === 'evaluation'
        ? 'evaluation'
        : 'pre';

  const [assessment, setAssessment] =
    useState<CourseAssessment | null>(null);

  const [enrollment, setEnrollment] =
    useState<any>(null);

  const [course, setCourse] =
    useState<any>(null);

  const [access, setAccess] = useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [answers, setAnswers] =
    useState<Record<string, string>>({});

  const [submitted, setSubmitted] =
    useState(false);

  const [result, setResult] =
    useState<{
      score?: number;
      passed: boolean;
    } | null>(null);

  const [blockedReason, setBlockedReason] =
    useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [assessmentResponse, enrollmentResponse] =
          await Promise.all([
            fetch(
              `/api/assessments?courseId=${encodeURIComponent(courseId)}&enrollmentId=${encodeURIComponent(enrollmentId)}`,
              {
                cache: 'no-store',
                headers: { 'x-trainee-id': getTraineeIdFromCookie() },
              },
            ),
            fetch(
              `/api/enrollments/${encodeURIComponent(enrollmentId)}`,
              {
                cache: 'no-store',
              },
            ),
          ]);

        const assessmentData =
          await assessmentResponse
            .json()
            .catch(() => null);

        const enrollmentData =
          await enrollmentResponse
            .json()
            .catch(() => null);

        if (!assessmentResponse.ok) {
          throw new Error(
            assessmentData?.error ||
              'تعذر تحميل التقييم.',
          );
        }

        if (!enrollmentResponse.ok) {
          throw new Error(
            enrollmentData?.error ||
              'تعذر تحميل بيانات التسجيل.',
          );
        }

        if (!active) return;

        const assessments =
          assessmentData?.success &&
          Array.isArray(
            assessmentData.assessments,
          )
            ? assessmentData.assessments
            : [];

        const item =
          assessments.find((a: any) => a.assessmentType === type) ?? null;

        setAssessment(item);
        setEnrollment(
          enrollmentData?.enrollment ?? null,
        );

        setCourse(
          assessmentData?.course ?? null,
        );
        setAccess(Array.isArray(assessmentData?.access) ? assessmentData.access.find((item: any) => item.type === type) ?? null : null);

        setLoading(false);
      } catch (error) {
        console.error(
          'Failed to load assessment:',
          error,
        );

        if (!active) return;

        setAssessment(null);
        setEnrollment(null);
        setCourse(null);
        setLoading(false);
      }
    }

    if (!courseId || !enrollmentId) {
      setLoading(false);
      return;
    }

    void load();

    return () => {
      active = false;
    };
  }, [courseId, enrollmentId, type]);

 const state = access?.completed ? 'completed' : access?.available ? 'available' : 'locked';

  if (loading) {
    return (
      <main
        dir="rtl"
        className="container mx-auto px-6 py-12"
      >
        جاري تحميل التقييم...
      </main>
    );
  }

  if (!enrollment) {
    return (
      <main
        dir="rtl"
        className="container mx-auto px-6 py-12"
      >
        <h1>التقييم غير متاح</h1>

        <Link href="/account">
          العودة إلى الحساب
        </Link>
      </main>
    );
  }

  if (state === 'completed') {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-3xl px-6 py-12"
      >
        <div className="account-empty-state">
          <h1>
            {type === 'pre'
              ? 'التقييم القبلي'
              : type === 'post'
                ? 'التقييم البعدي'
                : 'تقييم الدورة'}
          </h1>

          <p>
            تم إكمال هذا التقييم بنجاح.
          </p>

          <Link
            className="btn-primary"
            href={`/course-learning?id=${encodeURIComponent(courseId)}`}
          >
            العودة إلى الدورة
          </Link>
        </div>
      </main>
    );
  }

  if (blockedReason || state !== 'available') {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-3xl px-6 py-12"
      >
        <div className="account-empty-state">
          <h1>
            {type === 'pre'
              ? 'التقييم القبلي'
              : type === 'post'
                ? 'التقييم البعدي'
                : 'تقييم الدورة'}
          </h1>

          <p>
            {blockedReason || access?.reason ||
              'التقييم مغلق حاليًا من الإدارة.'}
          </p>

          <Link
            className="btn-primary"
            href={`/course-learning?id=${encodeURIComponent(courseId)}`}
          >
            العودة إلى الدورة
          </Link>
        </div>
      </main>
    );
  }

  if (!assessment || !assessment.questions?.length) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-3xl px-6 py-12"
      >
        <div className="account-empty-state">
          <h1>
            {type === 'pre'
              ? 'التقييم القبلي'
              : type === 'post'
                ? 'التقييم البعدي'
                : 'تقييم الدورة'}
          </h1>

          <p>
            لم تتم إضافة أسئلة لهذا التقييم بعد.
          </p>

          <Link
            className="btn-primary"
            href={`/course-learning?id=${encodeURIComponent(courseId)}`}
          >
            العودة إلى الدورة
          </Link>
        </div>
      </main>
    );
  }

  async function submit() {
    const unanswered =
      assessment!.questions.filter(
        (q) =>
          q.type !== 'text' &&
          answers[q.id] === undefined,
      ).length;

    if (unanswered) {
      alert(
        'أجب عن جميع أسئلة التقييم قبل التسليم.',
      );
      return;
    }

    if (type === 'evaluation') {
      const ratingQuestions =
        assessment!.questions.filter(
          (q) => q.type !== 'text',
        );

      const ratingTotal =
        ratingQuestions.reduce((sum, q) => {
          const value = Number(
            answers[q.id],
          );

          return (
            sum +
            (Number.isFinite(value)
              ? value + 1
              : 0)
          );
        }, 0);

      const evaluationScore =
        ratingQuestions.length
          ? Math.round(
              (ratingTotal /
                (ratingQuestions.length * 5)) *
                100,
            )
          : 0;

      const response = await fetch(
        '/api/assessments',
        {
          method: 'PATCH',
            body: JSON.stringify({
              enrollmentId:
                enrollment.id,
              type: 'evaluation',
            score: evaluationScore,
            answers,
            }),
            headers: { 'Content-Type': 'application/json', 'x-trainee-id': getTraineeIdFromCookie() },
        },
      );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.error ||
            'تعذر حفظ نتيجة تقييم الدورة.',
        );
      }

      setResult({
        score: evaluationScore,
        passed: true,
      });

      setSubmitted(true);

      return;
    }

    let earned = 0;
    let total = 0;

    const normalizeAnswer = (
      value: unknown,
    ) => {
      const text = String(
        value ?? '',
      ).trim();

      const englishIndex = [
        'A',
        'B',
        'C',
        'D',
      ].indexOf(
        text.toUpperCase(),
      );

      if (englishIndex >= 0) {
        return String(
          englishIndex,
        );
      }

      const arabicIndex = [
        'أ',
        'ب',
        'ج',
        'د',
      ].indexOf(text);

      if (arabicIndex >= 0) {
        return String(
          arabicIndex,
        );
      }

      return text;
    };

    assessment!.questions.forEach(
      (q) => {
        const points = Number(
          q.points ?? 1,
        );

        total += points;

        const rawAnswer = String(
          answers[q.id] ?? '',
        ).trim();

        const selectedIndex =
          Number(rawAnswer);

        const hasSelectedIndex =
          Number.isInteger(
            selectedIndex,
          ) &&
          selectedIndex >= 0 &&
          selectedIndex <
            (q.options?.length ?? 0);

        const selectedOption =
          hasSelectedIndex
            ? q.options?.[
                selectedIndex
              ]
            : rawAnswer;

        const isCorrect = (
          value: unknown,
        ) => {
          const correctText =
            String(
              value ?? '',
            ).trim();

          return (
            normalizeAnswer(
              value,
            ) ===
              normalizeAnswer(
                rawAnswer,
              ) ||
            normalizeAnswer(
              value,
            ) ===
              normalizeAnswer(
                selectedOption,
              ) ||
            correctText ===
              String(
                selectedOption ?? '',
              ).trim()
          );
        };

        const correct =
          Array.isArray(
            q.correctAnswer,
          )
            ? q.correctAnswer.some(
                isCorrect,
              )
            : isCorrect(
                q.correctAnswer,
              );

        if (correct) {
          earned += points;
        }
      },
    );

    const score = total
      ? Math.round(
          (earned / total) * 100,
        )
      : 0;

    const response = await fetch(
      '/api/assessments',
      {
        method: 'PATCH',
            body: JSON.stringify({
          enrollmentId:
            enrollment.id,
          type,
          score,
              answers,
            }),
            headers: { 'Content-Type': 'application/json', 'x-trainee-id': getTraineeIdFromCookie() },
      },
    );

    if (!response.ok) {
      const data =
        await response
          .json()
          .catch(() => null);

      throw new Error(
        data?.error ||
          'تعذر حفظ نتيجة التقييم.',
      );
    }

    setResult({
      score,
      passed: true,
    });

    setSubmitted(true);
  }

  if (submitted && result) {
    return (
      <main
        dir="rtl"
        className="container mx-auto max-w-3xl px-6 py-12"
      >
        <div className="account-empty-state">
          <h1>
            {type === 'pre'
              ? 'نتيجة التقييم القبلي'
              : type === 'post'
                ? 'نتيجة التقييم البعدي'
                : 'تم إكمال تقييم الدورة'}
          </h1>

          {result.score !== undefined ? (
            <p>
              درجتك:{' '}
              <strong>
                {result.score}/100
              </strong>
            </p>
          ) : null}

          <p>
            تم حفظ التقييم بنجاح.
          </p>

          <Link
            className="btn-primary"
            href={`/course-learning?id=${encodeURIComponent(courseId)}`}
          >
            العودة إلى الدورة
          </Link>
        </div>
      </main>
    );
  }

  const title =
    type === 'pre'
      ? 'التقييم القبلي'
      : type === 'post'
        ? 'التقييم البعدي'
        : 'تقييم الدورة';

  return (
    <main
      dir="rtl"
      className="container mx-auto max-w-4xl px-6 py-10"
    >
      <Link
        href={`/course-learning?id=${encodeURIComponent(courseId)}`}
        className="text-sm text-muted-foreground"
      >
        العودة إلى الدورة
      </Link>

      <h1 className="mt-4 text-3xl font-bold">
        {assessment.title || title}
      </h1>

      {assessment.description ? (
        <p className="mt-2 text-muted-foreground">
          {assessment.description}
        </p>
      ) : null}

      {type !== 'evaluation' ? (
        <p className="mt-2 text-muted-foreground">
          النتيجة تُحسب من 100 ولا توجد درجة نجاح أو
          رسوب.
        </p>
      ) : (
        <p className="mt-2 text-muted-foreground">
          قيّم كل بند من 1 إلى 5، والسؤال الأخير
          اختياري ويمكنك كتابة أي ملاحظات أو
          اقتراحات.
        </p>
      )}

      <div className="mt-8 space-y-5">
        {assessment.questions.map(
          (q, index) => (
            <section
              key={q.id}
              className="rounded-xl border p-5"
            >
              <h2 className="font-semibold">
                {index + 1}. {q.question}
              </h2>

              <div className="mt-4 space-y-3">
                {q.type === 'text' ? (
                  <textarea
                    className="w-full rounded-lg border p-3 min-h-32"
                    placeholder="اكتب رأيك أو اقتراحاتك (اختياري)"
                    value={
                      answers[q.id] ?? ''
                    }
                    onChange={(event) =>
                      setAnswers((value) => ({
                        ...value,
                        [q.id]:
                          event.target.value,
                      }))
                    }
                  />
                ) : (
                  (q.options ?? []).map(
                    (
                      option,
                      optionIndex,
                    ) => (
                      <label
                        key={optionIndex}
                        className="flex cursor-pointer gap-3 rounded-lg border p-3"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={
                            answers[q.id] ===
                            String(
                              optionIndex,
                            )
                          }
                          onChange={() =>
                            setAnswers(
                              (value) => ({
                                ...value,
                                [q.id]:
                                  String(
                                    optionIndex,
                                  ),
                              }),
                            )
                          }
                        />

                        <span>
                          {option}
                        </span>
                      </label>
                    ),
                  )
                )}
              </div>
            </section>
          ),
        )}
      </div>

      <button
        className="btn-primary mt-8"
        onClick={() => void submit()}
      >
        تسليم التقييم
      </button>
    </main>
  );
}
export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <main
          dir="rtl"
          className="min-h-screen flex items-center justify-center"
        >
          جاري تحميل التقييم...
        </main>
      }
    >
      <AssessmentContent />
    </Suspense>
  );
}