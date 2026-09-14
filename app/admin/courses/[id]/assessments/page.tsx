'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';

type AssessmentType = 'pre' | 'post' | 'evaluation';
type QuestionType = 'multiple-choice' | 'true-false' | 'text';

type Question = {
    id: string;
    question: string;
    type: QuestionType | string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    points?: number;
};

type Assessment = {
    id: string;
    courseId: string;
    assessmentType: AssessmentType | null;
    title: string;
    description: string | null;
    timeLimit: number | null;
    questions: Question[];
};

type FormQuestion = {
    question: string;
    type: QuestionType;
    options: string[];
    correctAnswer: string;
    explanation: string;
    points: string;
};

const RATING_OPTIONS = [
    '1 - ضعيف جدًا',
    '2 - ضعيف',
    '3 - جيد',
    '4 - جيد جدًا',
    '5 - ممتاز',
];

const UNIFIED_EVALUATION_QUESTIONS = [
    'كيف تقيّم الدورة التدريبية بشكل عام؟',
    'كيف تقيّم المدرب وطريقة تقديمه للمحتوى؟',
    'كيف تقيّم المادة التدريبية والمحتوى؟',
    'كيف تقيّم وضوح وتنظيم المحتوى؟',
    'كيف تقيّم الجانب العملي والتطبيقات؟',
    'كيف تقيّم مدة البرنامج ووقت التدريب؟',
    'كيف تقيّم تنظيم وتجهيز البرنامج؟',
    'ما مدى استفادتك من البرنامج؟',
    'ما مدى توصيتك بهذا البرنامج لزملائك؟',
    'ما رأيك أو اقتراحاتك لتحسين البرنامج؟',
];

const assessmentLabels: Record<
    AssessmentType,
    { title: string; description: string }
> = {
    pre: {
        title: 'التقييم القبلي',
        description: 'قياس مستوى المعرفة قبل بدء الدورة.',
    },
    post: {
        title: 'التقييم البعدي',
        description: 'قياس مستوى المعرفة بعد إكمال الدورة.',
    },
    evaluation: {
        title: 'تقييم الدورة',
        description: 'تقييم المتدرب لجودة الدورة والتجربة التدريبية.',
    },
};

function makeId(prefix: string) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyQuestion(): FormQuestion {
    return {
        question: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        points: '1',
    };
}

function createEvaluationQuestions(): FormQuestion[] {
    return UNIFIED_EVALUATION_QUESTIONS.map((question, index) => ({
        question,
        type: index === 9 ? 'text' : 'multiple-choice',
        options: index === 9 ? [] : [...RATING_OPTIONS],
        correctAnswer: '',
        explanation: '',
        points: '0',
    }));
}

function parseBulkQuestions(text: string): FormQuestion[] {
    const blocks = text
        .trim()
        .split(/\n\s*\n+/)
        .map((block) => block.trim())
        .filter(Boolean);

    const parsed: FormQuestion[] = [];

    for (const block of blocks) {
        const lines = block
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (!lines.length) continue;

        const answerLine = lines.find((line) =>
            /^(?:الإجابة|answer)\s*:/i.test(line),
        );

        const answerValue = answerLine
            ? answerLine.replace(/^(?:الإجابة|answer)\s*:/i, '').trim()
            : '';

        const optionLines = lines.filter((line) =>
            /^(?:[A-D][)\-.]|[أ-د][)\-.])\s+/i.test(line),
        );

        const questionLine =
            lines.find(
                (line) =>
                    !/^(?:[A-D][)\-.]|[أ-د][)\-.])\s+/i.test(line) &&
                    !/^(?:الإجابة|answer)\s*:/i.test(line) &&
                    !/^(?:صح\s*\/\s*خطأ|صح أو خطأ|true\s*\/\s*false)$/i.test(
                        line,
                    ),
            ) ?? lines[0];

        let type: QuestionType = 'text';
        let options: string[] = [];
        let correctAnswer = '';

        if (optionLines.length >= 2) {
            type = 'multiple-choice';
            options = optionLines.map((line) =>
                line
                    .replace(/^(?:[A-D][)\-.]|[أ-د][)\-.])\s+/i, '')
                    .trim(),
            );

            const answerLetter = answerValue
                .match(/^[A-D]$/i)?.[0]
                ?.toUpperCase();

            if (answerLetter) {
                const answerIndex = answerLetter.charCodeAt(0) - 65;
                correctAnswer = String(answerIndex);
            } else {
                const numeric = Number(answerValue);
                const matchingIndex = options.findIndex(
                    (option) =>
                        option === answerValue ||
                        option.startsWith(answerValue),
                );

                if (
                    Number.isInteger(numeric) &&
                    numeric >= 0 &&
                    numeric < options.length
                ) {
                    correctAnswer = String(numeric);
                } else if (
                    Number.isInteger(numeric) &&
                    numeric >= 1 &&
                    numeric <= options.length
                ) {
                    correctAnswer = String(numeric - 1);
                } else if (matchingIndex >= 0) {
                    correctAnswer = String(matchingIndex);
                }
            }
        } else if (
            /^(?:صح\s*\/\s*خطأ|صح أو خطأ|true\s*\/\s*false)$/i.test(
                lines[1] ?? '',
            )
        ) {
            type = 'true-false';
            options = ['صح', 'خطأ'];

            if (/^(?:صح|true)$/i.test(answerValue)) {
                correctAnswer = 'true';
            } else if (/^(?:خطأ|false)$/i.test(answerValue)) {
                correctAnswer = 'false';
            }
        } else {
            type = 'text';
        }

        parsed.push({
            question: questionLine
                .replace(/^\d+[.)\-]\s*/, '')
                .trim(),
            type,
            options,
            correctAnswer,
            explanation: '',
            points: '1',
        });
    }

    return parsed;
}

export default function RecordedCourseAssessmentsPage() {
    const params = useParams<{ id: string }>();
    const courseId = params.id;

    const [course, setCourse] = useState<any>(null);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formType, setFormType] = useState<AssessmentType>('pre');
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState('');
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [bulkText, setBulkText] = useState('');
    const [togglingAccess, setTogglingAccess] = useState<AssessmentType | null>(null);

    async function load() {
        if (!courseId) return;

        setLoading(true);

        try {
            // Courses in the current project are loaded through the existing
            // client-side repository. There is no GET /api/courses/[id] route.
            const courseData = await courseRepository.findById(courseId);

            if (!courseData) {
                throw new Error('تعذر تحميل بيانات الدورة.');
            }

            setCourse(courseData);

            const assessmentsResponse = await fetch(
                `/api/assessments?courseId=${encodeURIComponent(courseId)}`,
                { cache: 'no-store' },
            );

            const assessmentData = await assessmentsResponse
                .json()
                .catch(() => null);

            if (!assessmentsResponse.ok) {
                throw new Error(
                    assessmentData?.error ?? 'تعذر تحميل التقييمات.',
                );
            }

            const loaded: Assessment[] =
                assessmentData?.success &&
                Array.isArray(assessmentData.assessments)
                    ? assessmentData.assessments
                    : [];

            setAssessments(loaded);

            // تقييم الدورة موحد وثابت: إذا لم يكن موجودًا ننشئه تلقائيًا.
            const hasEvaluation = loaded.some(
                (item) => item.assessmentType === 'evaluation',
            );

            if (!hasEvaluation) {
                const evaluationId = `assessment-${courseId}-evaluation`;

                const response = await fetch('/api/assessments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: evaluationId,
                        courseId,
                        assessmentType: 'evaluation',
                        title: assessmentLabels.evaluation.title,
                        description: assessmentLabels.evaluation.description,
                        passingScore: 0,
                        timeLimit: null,
                        questions: UNIFIED_EVALUATION_QUESTIONS.map(
                            (question, index) => ({
                                id: `${evaluationId}-q-${index + 1}`,
                                question,
                                type:
                                    index === 9
                                        ? 'text'
                                        : 'multiple-choice',
                                options:
                                    index === 9
                                        ? []
                                        : RATING_OPTIONS,
                                correctAnswer: '',
                                explanation: '',
                                order: index,
                                points: 0,
                            }),
                        ),
                    }),
                });

                const created = await response
                    .json()
                    .catch(() => null);

                if (response.ok && created?.success) {
                    const refreshedResponse = await fetch(
                        `/api/assessments?courseId=${encodeURIComponent(
                            courseId,
                        )}`,
                        { cache: 'no-store' },
                    );

                    const refreshedData = await refreshedResponse
                        .json()
                        .catch(() => null);

                    if (
                        refreshedResponse.ok &&
                        refreshedData?.success &&
                        Array.isArray(refreshedData.assessments)
                    ) {
                        setAssessments(refreshedData.assessments);
                    }
                }
            }
        } catch (error) {
            console.error(
                'Failed to load recorded assessments:',
                error,
            );

            alert(
                error instanceof Error
                    ? error.message
                    : 'تعذر تحميل البيانات.',
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, [courseId]);

    function getAssessment(type: AssessmentType) {
        return (
            assessments.find(
                (assessment) => assessment.assessmentType === type,
            ) ?? null
        );
    }

    function openNew(type: 'pre' | 'post') {
        setEditingId(null);
        setFormType(type);
        setFormTitle(assessmentLabels[type].title);
        setFormDescription(assessmentLabels[type].description);
        setTimeLimit('');
        setQuestions([createEmptyQuestion()]);
        setBulkText('');
        setOpen(true);
    }

    function openEdit(assessment: Assessment) {
        if (assessment.assessmentType === 'evaluation') return;

        setEditingId(assessment.id);
        setFormType(assessment.assessmentType ?? 'pre');
        setFormTitle(assessment.title);
        setFormDescription(assessment.description ?? '');
        setTimeLimit(
            assessment.timeLimit == null
                ? ''
                : String(assessment.timeLimit),
        );

        const mapped: FormQuestion[] = (assessment.questions ?? []).map((question) => ({
            question: question.question ?? '',
            type:
                question.type === 'true-false'
                    ? 'true-false'
                    : question.type === 'text'
                      ? 'text'
                      : 'multiple-choice',
            options: Array.isArray(question.options)
                ? question.options
                : ['', '', '', ''],
            correctAnswer: String(question.correctAnswer ?? ''),
            explanation: question.explanation ?? '',
            points: String(question.points ?? 1),
        }));

        setQuestions(mapped.length ? mapped : [createEmptyQuestion()]);
        setBulkText('');
        setOpen(true);
    }

    function updateQuestion(
        index: number,
        patch: Partial<FormQuestion>,
    ) {
        setQuestions((current) =>
            current.map((question, i) =>
                i === index ? { ...question, ...patch } : question,
            ),
        );
    }

    function updateOption(
        questionIndex: number,
        optionIndex: number,
        value: string,
    ) {
        setQuestions((current) =>
            current.map((question, i) => {
                if (i !== questionIndex) return question;

                const options = [...question.options];
                options[optionIndex] = value;

                return { ...question, options };
            }),
        );
    }

    function addQuestion() {
        setQuestions((current) => [
            ...current,
            createEmptyQuestion(),
        ]);
    }

    function removeQuestion(index: number) {
        if (questions.length <= 1) return;

        setQuestions((current) =>
            current.filter((_, i) => i !== index),
        );
    }

    function importBulkQuestions() {
        const parsed = parseBulkQuestions(bulkText);

        if (!parsed.length) {
            alert(
                'لم يتم التعرف على أسئلة. افصل كل سؤال عن التالي بسطر فارغ.',
            );
            return;
        }

        setQuestions(parsed);
        setBulkText('');
    }

    function importFile(file: File | undefined) {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('يرجى اختيار ملف TXT فقط.');
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const text = String(reader.result ?? '');
            const parsed = parseBulkQuestions(text);

            if (!parsed.length) {
                alert(
                    'لم يتم التعرف على أسئلة داخل الملف. تأكد من تنسيق الملف.',
                );
                return;
            }

            setQuestions(parsed);
        };

        reader.readAsText(file, 'UTF-8');
    }

    async function saveAssessment(event: React.FormEvent) {
        event.preventDefault();

        if (formType === 'evaluation') return;

        const cleaned = questions
            .map((question) => ({
                ...question,
                question: question.question.trim(),
                options:
                    question.type === 'multiple-choice'
                        ? question.options
                              .map((option) => option.trim())
                              .filter(Boolean)
                        : question.type === 'true-false'
                          ? ['صح', 'خطأ']
                          : [],
                correctAnswer: question.correctAnswer.trim(),
            }))
            .filter((question) => question.question);

        if (!cleaned.length) {
            alert('أضف سؤالًا واحدًا على الأقل.');
            return;
        }

        for (let index = 0; index < cleaned.length; index++) {
            const question = cleaned[index];

            if (
                question.type === 'multiple-choice' &&
                question.options.length < 2
            ) {
                alert(
                    `السؤال رقم ${index + 1} يحتاج إلى خيارين على الأقل.`,
                );
                return;
            }

            if (
                question.type !== 'text' &&
                !question.correctAnswer
            ) {
                alert(
                    `حدد الإجابة الصحيحة للسؤال رقم ${index + 1}.`,
                );
                return;
            }
        }

        setSaving(true);

        try {
            const assessmentId =
                editingId ??
                `assessment-${courseId}-${formType}`;

            const response = await fetch('/api/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: assessmentId,
                    courseId,
                    assessmentType: formType,
                    title: formTitle.trim(),
                    description: formDescription.trim() || null,
                    passingScore: 0,
                    timeLimit: timeLimit.trim()
                        ? Number(timeLimit)
                        : null,
                    questions: cleaned.map((question, index) => ({
                        id: `${assessmentId}-q-${index + 1}-${makeId('q')}`,
                        question: question.question,
                        type: question.type,
                        options: question.options,
                        correctAnswer: question.correctAnswer,
                        explanation: question.explanation.trim(),
                        order: index,
                        points: Number(question.points) || 1,
                    })),
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                throw new Error(
                    data?.error ?? 'تعذر حفظ التقييم.',
                );
            }

            setOpen(false);
            await load();
        } catch (error) {
            console.error('Failed to save assessment:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'تعذر حفظ التقييم.',
            );
        } finally {
            setSaving(false);
        }
    }

    async function removeAssessment(assessment: Assessment) {
        if (assessment.assessmentType === 'evaluation') {
            alert('تقييم الدورة موحد ولا يمكن حذفه من هنا.');
            return;
        }

        if (!window.confirm(`هل أنت متأكد من حذف «${assessment.title}»؟`)) {
            return;
        }

        try {
            const response = await fetch(
                `/api/assessments?id=${encodeURIComponent(assessment.id)}`,
                { method: 'DELETE' },
            );

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                throw new Error(
                    data?.error ?? 'تعذر حذف التقييم.',
                );
            }

            await load();
        } catch (error) {
            console.error('Failed to delete assessment:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : 'تعذر حذف التقييم.',
            );
        }
    }

    async function toggleAssessmentAccess(type: 'post' | 'evaluation') {
        if (!courseId || !course) return;

        const field =
            type === 'post'
                ? 'postAssessmentEnabled'
                : 'courseEvaluationEnabled';

        const currentValue =
            type === 'post'
                ? course.postAssessmentEnabled === true
                : course.courseEvaluationEnabled === true;

        setTogglingAccess(type);

        try {
            const updatedCourse = await courseRepository.update(courseId, {
                [field]: !currentValue,
            });

            setCourse(updatedCourse);
        } catch (error) {
            console.error('Failed to update assessment access:', error);

            alert(
                error instanceof Error
                    ? error.message
                    : 'تعذر تغيير حالة التقييم.',
            );
        } finally {
            setTogglingAccess(null);
        }
    }

    if (loading) {
        return (
            <main className="admin-page" dir="rtl">
                جاري تحميل التقييمات...
            </main>
        );
    }

    return (
        <main className="admin-page" dir="rtl">
            <header className="admin-page-header">
                <div>
                    <div className="eyebrow">التقييمات</div>
                    <h1>{course?.title ?? 'الدورة المسجلة'}</h1>
                    <p>
                        إدارة التقييم القبلي والبعدي، مع تقييم دورة
                        موحد يتم إنشاؤه تلقائيًا.
                    </p>
                </div>

                <div className="admin-actions">
                    <Link
                        href="/admin/courses"
                        className="admin-btn admin-btn-light"
                    >
                        العودة للدورات
                    </Link>
                </div>
            </header>

            <section
                className="admin-card-grid"
                style={{ marginTop: 20 }}
            >
                {(['pre', 'post', 'evaluation'] as AssessmentType[]).map(
                    (type) => {
                        const assessment = getAssessment(type);
                        const label = assessmentLabels[type];

                        return (
                            <article
                                className="admin-course-card"
                                key={type}
                                style={{ minHeight: 260 }}
                            >
                                <div className="admin-course-body">
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: 12,
                                        }}
                                    >
                                        <div>
                                            <div
                                                className="eyebrow"
                                                style={{ marginBottom: 6 }}
                                            >
                                                {type === 'pre'
                                                    ? 'PRE'
                                                    : type === 'post'
                                                      ? 'POST'
                                                      : 'EVALUATION'}
                                            </div>

                                            <h3 className="admin-course-title">
                                                {label.title}
                                            </h3>
                                        </div>

                                        <span
                                            className={`admin-status ${
                                                assessment
                                                    ? 'admin-status-ok'
                                                    : 'admin-status-draft'
                                            }`}
                                        >
                                            {assessment
                                                ? 'مضاف'
                                                : 'غير مضاف'}
                                        </span>
                                    </div>

                                    <p
                                        className="admin-course-desc"
                                        style={{ marginTop: 10 }}
                                    >
                                        {label.description}
                                    </p>

                                    {assessment && (
                                        <div
                                            className="admin-meta"
                                            style={{ marginTop: 14 }}
                                        >
                                            <span>
                                                {assessment.questions?.length ??
                                                    0}{' '}
                                                سؤال
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className="admin-card-actions"
                                        style={{ marginTop: 20 }}
                                    >
                                        {type === 'evaluation' ? (
                                            <>
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        color:
                                                            course?.courseEvaluationEnabled === true
                                                                ? '#067647'
                                                                : '#b42318',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {course?.courseEvaluationEnabled === true
                                                        ? 'التقييم مفتوح للمتدربين'
                                                        : 'التقييم مغلق للمتدربين'}
                                                </span>

                                                <button
                                                    type="button"
                                                    className={
                                                        course?.courseEvaluationEnabled === true
                                                            ? 'admin-btn admin-btn-danger'
                                                            : 'admin-btn admin-btn-primary'
                                                    }
                                                    disabled={togglingAccess === 'evaluation'}
                                                    onClick={() =>
                                                        void toggleAssessmentAccess('evaluation')
                                                    }
                                                >
                                                    {togglingAccess === 'evaluation'
                                                        ? 'جاري التحديث...'
                                                        : course?.courseEvaluationEnabled === true
                                                          ? 'إغلاق التقييم'
                                                          : 'فتح التقييم'}
                                                </button>
                                            </>
                                        ) : assessment ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn-primary"
                                                    onClick={() =>
                                                        openEdit(assessment)
                                                    }
                                                >
                                                    تعديل التقييم
                                                </button>

                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn-danger"
                                                    onClick={() =>
                                                        void removeAssessment(
                                                            assessment,
                                                        )
                                                    }
                                                >
                                                    حذف
                                                </button>

                                                {type === 'post' && (
                                                    <button
                                                        type="button"
                                                        className={
                                                            course?.postAssessmentEnabled === true
                                                                ? 'admin-btn admin-btn-danger'
                                                                : 'admin-btn admin-btn-primary'
                                                        }
                                                        disabled={togglingAccess === 'post'}
                                                        onClick={() =>
                                                            void toggleAssessmentAccess('post')
                                                        }
                                                    >
                                                        {togglingAccess === 'post'
                                                            ? 'جاري التحديث...'
                                                            : course?.postAssessmentEnabled === true
                                                              ? 'إغلاق التقييم البعدي'
                                                              : 'فتح التقييم البعدي'}
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-primary"
                                                onClick={() =>
                                                    openNew(type)
                                                }
                                            >
                                                إضافة التقييم
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    },
                )}
            </section>

            {open && (
                <div className="admin-modal-backdrop">
                    <form
                        className="admin-modal"
                        style={{ maxWidth: 1050 }}
                        onSubmit={saveAssessment}
                    >
                        <div className="admin-modal-header">
                            <div>
                                <h2>
                                    {editingId
                                        ? 'تعديل التقييم'
                                        : 'إضافة التقييم'}
                                </h2>
                                <small style={{ color: '#6b7890' }}>
                                    {assessmentLabels[formType].title}
                                </small>
                            </div>

                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={() => setOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            <div className="admin-form-grid">

                                <div className="admin-field">
                                    <label>مدة التقييم بالدقائق</label>
                                    <input
                                        className="admin-input"
                                        type="number"
                                        min="0"
                                        value={timeLimit}
                                        onChange={(event) =>
                                            setTimeLimit(
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="admin-field admin-field-full">
                                    <label>عنوان التقييم</label>
                                    <input
                                        className="admin-input"
                                        required
                                        value={formTitle}
                                        onChange={(event) =>
                                            setFormTitle(
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="admin-field admin-field-full">
                                    <label>الوصف</label>
                                    <textarea
                                        className="admin-textarea"
                                        rows={2}
                                        value={formDescription}
                                        onChange={(event) =>
                                            setFormDescription(
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div
                                className="admin-card"
                                style={{
                                    padding: 16,
                                    marginTop: 20,
                                }}
                            >
                                <h3 style={{ marginTop: 0 }}>
                                    إضافة عدة أسئلة دفعة واحدة
                                </h3>

                                <p
                                    style={{
                                        marginTop: 6,
                                        color: '#667085',
                                        lineHeight: 1.8,
                                    }}
                                >
                                    اكتب كل سؤال ثم الخيارات ثم
                                    الإجابة، واترك سطرًا فارغًا بين
                                    كل سؤال والذي يليه.
                                </p>

                                <textarea
                                    className="admin-textarea"
                                    rows={10}
                                    value={bulkText}
                                    onChange={(event) =>
                                        setBulkText(
                                            event.target.value,
                                        )
                                    }
                                    placeholder={`مثال:

1. ما هو الهدف الرئيسي من البرنامج؟
A) الخيار الأول
B) الخيار الثاني
C) الخيار الثالث
D) الخيار الرابع
الإجابة: B

2. السؤال الثاني؟
A) نعم
B) لا
الإجابة: A`}
                                />

                                <div
                                    className="admin-card-actions"
                                    style={{ marginTop: 10 }}
                                >
                                    <button
                                        type="button"
                                        className="admin-btn admin-btn-primary"
                                        onClick={importBulkQuestions}
                                    >
                                        قراءة وإضافة الأسئلة
                                    </button>

                                    <label className="admin-btn admin-btn-light">
                                        رفع ملف TXT
                                        <input
                                            type="file"
                                            accept=".txt,text/plain"
                                            hidden
                                            onChange={(event) =>
                                                importFile(
                                                    event.target.files?.[0],
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 24,
                                    marginBottom: 12,
                                }}
                            >
                                <div>
                                    <h3 style={{ margin: 0 }}>
                                        الأسئلة
                                    </h3>
                                    <small style={{ color: '#6b7890' }}>
                                        يمكنك مراجعة الأسئلة وتعديلها
                                        قبل الحفظ.
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    className="admin-btn admin-btn-light"
                                    onClick={addQuestion}
                                >
                                    + إضافة سؤال
                                </button>
                            </div>

                            {questions.map((question, questionIndex) => (
                                <div
                                    className="admin-card"
                                    style={{
                                        padding: 18,
                                        marginTop: 14,
                                    }}
                                    key={questionIndex}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems: 'center',
                                            gap: 10,
                                        }}
                                    >
                                        <strong>
                                            السؤال {questionIndex + 1}
                                        </strong>

                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-danger"
                                                onClick={() =>
                                                    removeQuestion(
                                                        questionIndex,
                                                    )
                                                }
                                            >
                                                حذف السؤال
                                            </button>
                                        )}
                                    </div>

                                    <div
                                        className="admin-form-grid"
                                        style={{ marginTop: 12 }}
                                    >
                                        <div className="admin-field">
                                            <label>نوع السؤال</label>
                                            <select
                                                className="admin-select"
                                                value={question.type}
                                                onChange={(event) => {
                                                    const type =
                                                        event.target
                                                            .value as QuestionType;

                                                    updateQuestion(
                                                        questionIndex,
                                                        {
                                                            type,
                                                            options:
                                                                type ===
                                                                'multiple-choice'
                                                                    ? [
                                                                          '',
                                                                          '',
                                                                          '',
                                                                          '',
                                                                      ]
                                                                    : type ===
                                                                        'true-false'
                                                                      ? [
                                                                            'صح',
                                                                            'خطأ',
                                                                        ]
                                                                      : [],
                                                            correctAnswer:
                                                                '',
                                                        },
                                                    );
                                                }}
                                            >
                                                <option value="multiple-choice">
                                                    اختيار من متعدد
                                                </option>
                                                <option value="true-false">
                                                    صح أو خطأ
                                                </option>
                                                <option value="text">
                                                    سؤال نصي
                                                </option>
                                            </select>
                                        </div>

                                        <div className="admin-field">
                                            <label>الدرجة</label>
                                            <input
                                                className="admin-input"
                                                type="number"
                                                min="1"
                                                value={question.points}
                                                onChange={(event) =>
                                                    updateQuestion(
                                                        questionIndex,
                                                        {
                                                            points:
                                                                event.target
                                                                    .value,
                                                        },
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div
                                        className="admin-field"
                                        style={{ marginTop: 12 }}
                                    >
                                        <label>نص السؤال</label>
                                        <textarea
                                            className="admin-textarea"
                                            rows={2}
                                            required
                                            value={question.question}
                                            onChange={(event) =>
                                                updateQuestion(
                                                    questionIndex,
                                                    {
                                                        question:
                                                            event.target
                                                                .value,
                                                    },
                                                )
                                            }
                                        />
                                    </div>

                                    {question.type !== 'text' && (
                                        <div
                                            className="admin-form-grid"
                                            style={{ marginTop: 12 }}
                                        >
                                            {question.options.map(
                                                (option, optionIndex) => (
                                                    <div
                                                        className="admin-field"
                                                        key={optionIndex}
                                                    >
                                                        <label>
                                                            الخيار{' '}
                                                            {optionIndex +
                                                                1}
                                                        </label>
                                                        <input
                                                            className="admin-input"
                                                            value={option}
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateOption(
                                                                    questionIndex,
                                                                    optionIndex,
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}

                                    {question.type !== 'text' && (
                                        <div
                                            className="admin-field"
                                            style={{ marginTop: 12 }}
                                        >
                                            <label>
                                                الإجابة الصحيحة
                                            </label>

                                            {question.type ===
                                            'true-false' ? (
                                                <select
                                                    className="admin-select"
                                                    value={
                                                        question.correctAnswer
                                                    }
                                                    onChange={(event) =>
                                                        updateQuestion(
                                                            questionIndex,
                                                            {
                                                                correctAnswer:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        اختر الإجابة
                                                    </option>
                                                    <option value="true">
                                                        صح
                                                    </option>
                                                    <option value="false">
                                                        خطأ
                                                    </option>
                                                </select>
                                            ) : (
                                                <select
                                                    className="admin-select"
                                                    value={
                                                        question.correctAnswer
                                                    }
                                                    onChange={(event) =>
                                                        updateQuestion(
                                                            questionIndex,
                                                            {
                                                                correctAnswer:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        اختر الإجابة
                                                    </option>
                                                    {question.options.map(
                                                        (
                                                            option,
                                                            optionIndex,
                                                        ) => (
                                                            <option
                                                                key={
                                                                    optionIndex
                                                                }
                                                                value={String(
                                                                    optionIndex,
                                                                )}
                                                            >
                                                                الخيار{' '}
                                                                {optionIndex +
                                                                    1}
                                                                {option
                                                                    ? ` — ${option}`
                                                                    : ''}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className="admin-field"
                                        style={{ marginTop: 12 }}
                                    >
                                        <label>
                                            شرح الإجابة
                                        </label>
                                        <input
                                            className="admin-input"
                                            value={question.explanation}
                                            onChange={(event) =>
                                                updateQuestion(
                                                    questionIndex,
                                                    {
                                                        explanation:
                                                            event.target
                                                                .value,
                                                    },
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="admin-modal-footer">
                            <button
                                type="button"
                                className="admin-btn admin-btn-light"
                                onClick={() => setOpen(false)}
                                disabled={saving}
                            >
                                إلغاء
                            </button>

                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? 'جاري الحفظ...'
                                    : 'حفظ التقييم'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
