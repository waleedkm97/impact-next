'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import type { CourseAssessment } from '@/types/course';

export default function AssessmentPage() {
  const params = useSearchParams();
  const courseId = params.get('courseId') || '';
  const enrollmentId = params.get('enrollmentId') || '';
  const requestedType = params.get('type');
  const type: 'pre' | 'post' | 'evaluation' = requestedType === 'post'
    ? 'post'
    : requestedType === 'evaluation'
      ? 'evaluation'
      : 'pre';

  const [assessment, setAssessment] = useState<CourseAssessment | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score?: number } | null>(null);
  const [blockedReason, setBlockedReason] = useState('');
  const [publicScheduleEnabled, setPublicScheduleEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const [course, currentUser] = await Promise.all([
        courseRepository.findById(courseId),
        traineeRepository.getCurrentUser(),
      ]);

      if (!active) return;

      const item = course?.assessments?.find((a: any) =>
        a.assessmentType === type ||
        (type === 'pre' && a.title === 'التقييم القبلي') ||
        (type === 'post' && a.title === 'التقييم البعدي') ||
        (type === 'evaluation' && (a.title === 'تقييم الدورة' || a.title === 'تقييم البرنامج')),
      ) ?? null;

      setAssessment(item);
      setUser(currentUser);

      const enrollment = currentUser?.enrollments?.find((e: any) =>
        (enrollmentId && e.id === enrollmentId) || e.courseId === courseId,
      );

      if (enrollment && type !== 'pre') {
       if (enrollment.groupId) {
  const enabled =
    enrollment?.[type === 'post' ? 'postAssessment' : 'courseEvaluation'] === 'available' ||
    enrollment?.[type === 'post' ? 'postAssessment' : 'courseEvaluation'] === 'completed';

  setPublicScheduleEnabled(enabled);

  if (
    !enabled &&
    enrollment?.[type === 'post' ? 'postAssessment' : 'courseEvaluation'] !== 'completed'
  ) {
    setBlockedReason('التقييم مغلق حاليًا من الإدارة لهذه المجموعة.');
  }
        } else if (enrollment.scheduleId) {
          const schedule = await scheduleRepository.findById(enrollment.scheduleId);
          const enabled = type === 'post'
            ? schedule?.postAssessmentEnabled === true
            : schedule?.courseEvaluationEnabled === true;
          setPublicScheduleEnabled(enabled);
          if (!enabled && enrollment?.[type === 'post' ? 'postAssessment' : 'courseEvaluation'] !== 'completed') {
            setBlockedReason('التقييم مغلق حاليًا لهذا الموعد التدريبي.');
          }
        } else {
          setPublicScheduleEnabled(false);
          setBlockedReason('لا يوجد موعد تدريبي مرتبط بهذا التسجيل.');
        }
      }

      setLoading(false);
    }

    void load();
    return () => { active = false; };
  }, [courseId, enrollmentId, type]);

  const enrollment = useMemo(
    () => user?.enrollments?.find((e: any) =>
      (enrollmentId && e.id === enrollmentId) || e.courseId === courseId,
    ),
    [user, enrollmentId, courseId],
  );

  const state = enrollment
    ? type === 'pre'
      ? enrollment.preAssessment
      : enrollment.groupId
        ? type === 'post'
          ? enrollment.postAssessment
          : enrollment.courseEvaluation
        : publicScheduleEnabled
          ? type === 'post'
            ? (enrollment.postAssessment === 'completed' ? 'completed' : 'available')
            : (enrollment.courseEvaluation === 'completed' ? 'completed' : 'available')
          : type === 'post'
            ? enrollment.postAssessment
            : enrollment.courseEvaluation
    : 'locked';

  if (loading) return <main dir="rtl" className="container mx-auto px-6 py-12">جاري تحميل التقييم...</main>;

  if (!user || !enrollment) {
    return <main dir="rtl" className="container mx-auto px-6 py-12"><h1>التقييم غير متاح</h1><Link href="/account">العودة إلى الحساب</Link></main>;
  }

  

  if (state === 'completed') {
    return <main dir="rtl" className="container mx-auto max-w-3xl px-6 py-12"><div className="account-empty-state"><h1>{type === 'pre' ? 'التقييم القبلي' : type === 'post' ? 'التقييم البعدي' : 'تقييم الدورة'}</h1><p>تم إكمال هذا التقييم بنجاح.</p><Link className="btn-primary" href={`/course-learning?id=${encodeURIComponent(courseId)}`}>العودة إلى الدورة</Link></div></main>;
  }

  if (blockedReason || state !== 'available') {
    return <main dir="rtl" className="container mx-auto max-w-3xl px-6 py-12"><div className="account-empty-state"><h1>{type === 'pre' ? 'التقييم القبلي' : type === 'post' ? 'التقييم البعدي' : 'تقييم الدورة'}</h1><p>{blockedReason || 'التقييم مغلق حاليًا من الإدارة.'}</p><Link className="btn-primary" href={`/course-learning?id=${encodeURIComponent(courseId)}`}>العودة إلى الدورة</Link></div></main>;
  }

  if (!assessment || !assessment.questions?.length) {
    return <main dir="rtl" className="container mx-auto max-w-3xl px-6 py-12"><div className="account-empty-state"><h1>{type === 'pre' ? 'التقييم القبلي' : type === 'post' ? 'التقييم البعدي' : 'تقييم الدورة'}</h1><p>لم تتم إضافة أسئلة لهذا التقييم بعد.</p><Link className="btn-primary" href={`/course-learning?id=${encodeURIComponent(courseId)}`}>العودة إلى الدورة</Link></div></main>;
  }

  async function submit() {
    const unanswered = assessment!.questions.filter(q =>
      q.type !== 'text' && answers[q.id] === undefined
    ).length;
    if (unanswered) {
      alert('أجب عن جميع أسئلة التقييم قبل التسليم.');
      return;
    }

    if (type === 'evaluation') {
      const ratingQuestions = assessment!.questions.filter(q => q.type !== 'text');
      const ratingTotal = ratingQuestions.reduce((sum, q) => {
        const value = Number(answers[q.id]);
        return sum + (Number.isFinite(value) ? value + 1 : 0);
      }, 0);
      const evaluationScore = ratingQuestions.length
        ? Math.round((ratingTotal / (ratingQuestions.length * 5)) * 100)
        : 0;

      await traineeRepository.updateEnrollment(
        user.id,
        enrollment.id ?? courseId,
        {
          courseEvaluation: 'completed',
          courseEvaluationCompletedAt: new Date(),
        },
      );
      setResult({ score: evaluationScore });
      setSubmitted(true);
      return;
    }

    let earned = 0;
    let total = 0;
    assessment!.questions.forEach(q => {
      const points = Number(q.points ?? 1);
      total += points;
      const correct = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.map(String).includes(String(answers[q.id]))
        : String(answers[q.id]) === String(q.correctAnswer);
      if (correct) earned += points;
    });

    const score = total ? Math.round((earned / total) * 100) : 0;

    await traineeRepository.updateEnrollment(
      user.id,
      enrollment.id ?? courseId,
      type === 'pre'
        ? {
            preAssessment: 'completed',
            preAssessmentScore: score,
            preAssessmentCompletedAt: new Date(),
          }
        : {
            postAssessment: 'completed',
            postAssessmentScore: score,
            postAssessmentCompletedAt: new Date(),
          },
    );

    setResult({ score });
    setSubmitted(true);
  }

  if (submitted && result) {
    return <main dir="rtl" className="container mx-auto max-w-3xl px-6 py-12"><div className="account-empty-state"><h1>{type === 'pre' ? 'نتيجة التقييم القبلي' : type === 'post' ? 'نتيجة التقييم البعدي' : 'تم إكمال تقييم الدورة'}</h1>{result.score !== undefined ? <p>درجتك: <strong>{result.score}/100</strong></p> : null}<p>تم حفظ التقييم بنجاح.</p><Link className="btn-primary" href={`/course-learning?id=${encodeURIComponent(courseId)}`}>العودة إلى الدورة</Link></div></main>;
  }

  const title = type === 'pre' ? 'التقييم القبلي' : type === 'post' ? 'التقييم البعدي' : 'تقييم الدورة';

  return <main dir="rtl" className="container mx-auto max-w-4xl px-6 py-10">
    <Link href={`/course-learning?id=${encodeURIComponent(courseId)}`} className="text-sm text-muted-foreground">العودة إلى الدورة</Link>
    <h1 className="mt-4 text-3xl font-bold">{assessment.title || title}</h1>
    {assessment.description ? <p className="mt-2 text-muted-foreground">{assessment.description}</p> : null}
    {type !== 'evaluation' ? <p className="mt-2 text-muted-foreground">النتيجة تُحسب من 100 ولا توجد درجة نجاح أو رسوب.</p> : <p className="mt-2 text-muted-foreground">قيّم كل بند من 1 إلى 5، والسؤال الأخير اختياري ويمكنك كتابة أي ملاحظات أو اقتراحات.</p>}

    <div className="mt-8 space-y-5">
      {assessment.questions.map((q, index) => (
        <section key={q.id} className="rounded-xl border p-5">
          <h2 className="font-semibold">{index + 1}. {q.question}</h2>
          <div className="mt-4 space-y-3">
            {q.type === 'text' ? (
              <textarea
                className="w-full rounded-lg border p-3 min-h-32"
                placeholder="اكتب رأيك أو اقتراحاتك (اختياري)"
                value={answers[q.id] ?? ''}
                onChange={(event) => setAnswers(v => ({ ...v, [q.id]: event.target.value }))}
              />
            ) : (
              (q.options ?? []).map((option, optionIndex) => (
                <label key={optionIndex} className="flex cursor-pointer gap-3 rounded-lg border p-3">
                  <input type="radio" name={q.id} checked={answers[q.id] === String(optionIndex)} onChange={() => setAnswers(v => ({ ...v, [q.id]: String(optionIndex) }))}/>
                  <span>{option}</span>
                </label>
              ))
            )}
          </div>
        </section>
      ))}
    </div>

    <button className="btn-primary mt-8" onClick={() => void submit()}>تسليم التقييم</button>
  </main>;
}
