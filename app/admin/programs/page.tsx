'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { categoryRepository } from '@/lib/data/repositories/category-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import type {
  Course,
  CourseAssessment,
  LessonQuestion,
} from '@/types/course';
import type { Schedule } from '@/types/schedule';

type AssessmentType = 'pre' | 'post' | 'evaluation';
type QuestionType = 'multiple-choice' | 'true-false' | 'text';

const cities = [
  'الرياض',
  'جدة',
  'الدمام',
  'دبي',
  'القاهرة',
  'البحرين',
  'قطر',
  'لندن',
  'برشلونة',
  'ميلان',
  'Online',
];

const UNIFIED_EVALUATION_QUESTIONS = [
  { question: 'كيف تقيّم الدورة التدريبية بشكل عام؟', type: 'rating' },
  { question: 'كيف تقيّم المدرب وطريقة تقديمه للمحتوى؟', type: 'rating' },
  { question: 'كيف تقيّم المادة التدريبية والمحتوى؟', type: 'rating' },
  { question: 'كيف تقيّم وضوح وتنظيم المحتوى؟', type: 'rating' },
  { question: 'كيف تقيّم الجانب العملي والتطبيقات؟', type: 'rating' },
  { question: 'كيف تقيّم مدة البرنامج ووقت التدريب؟', type: 'rating' },
  { question: 'كيف تقيّم تنظيم وتجهيز البرنامج؟', type: 'rating' },
  { question: 'ما مدى استفادتك من البرنامج؟', type: 'rating' },
  { question: 'ما مدى توصيتك بهذا البرنامج لزملائك؟', type: 'rating' },
  { question: 'ما رأيك أو اقتراحاتك لتحسين البرنامج؟', type: 'text' },
];

const RATING_OPTIONS = ['1 - ضعيف جدًا', '2 - ضعيف', '3 - جيد', '4 - جيد جدًا', '5 - ممتاز'];

const assessmentMeta: Record<
  AssessmentType,
  { title: string; description: string }
> = {
  pre: {
    title: 'التقييم القبلي',
    description: 'قياس مستوى المعرفة قبل بدء التدريب.',
  },
  post: {
    title: 'التقييم البعدي',
    description: 'قياس مستوى المعرفة بعد إكمال التدريب.',
  },
  evaluation: {
    title: 'تقييم الدورة',
    description: 'قياس رضا المتدرب عن المدرب والمحتوى والتنظيم.',
  },
};

const emptyForm = {
  title: '',
  categoryId: '',
  trainer: '',
  price: '',
  description: '',
  objectives: '',
  audience: '',
  materialUrl: '',
  materials: true,
  pre: true,
  post: true,
  evaluation: true,
  attendance: true,
  published: true,
  featured: false,
};

type Form = typeof emptyForm;

type ScheduleForm = {
  delivery: 'in-person' | 'online';
  startDate: string;
  city: string;
  location: string;
  meeting: string;
  max: string;
};

const emptySchedule: ScheduleForm = {
  delivery: 'in-person',
  startDate: '',
  city: 'الرياض',
  location: '',
  meeting: '',
  max: '20',
};

type Drafts = Record<AssessmentType, CourseAssessment | null>;

const emptyDrafts = (): Drafts => ({
  pre: null,
  post: null,
  evaluation: null,
});

function makeId(prefix: string) {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeQuestion(
  assessmentId: string,
  order: number,
): LessonQuestion {
  return {
    id: makeId('question'),
    lessonId: assessmentId,
    question: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    order,
    points: 1,
  };
}

function priceFor(city: string, base: number) {
  if (city === 'Online' || city === 'أونلاين') return 3000;
  if (city === 'القاهرة') return 8500;
  if (['دبي', 'البحرين', 'قطر'].includes(city)) return 16000;
  if (['لندن', 'برشلونة', 'ميلان'].includes(city)) return 21000;
  return base || 5000;
}

function asDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function addDays(value: Date, days: number) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(value: Date) {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}/${d.getFullYear()}`;
}

function isPublicTraining(course: Course) {
  return (
    course.type === 'training' &&
    course.trainingKind !== 'corporate' &&
    course.published
  );
}

function getAssessment(
  course: Course,
  type: AssessmentType,
): CourseAssessment | null {
  const assessments = Array.isArray((course as any).assessments)
    ? ((course as any).assessments as CourseAssessment[])
    : [];

  const found = assessments.find((assessment: any) => {
    if (assessment.assessmentType === type) return true;

    const title = String(assessment.title ?? '').toLowerCase();

    if (type === 'post') {
      return title.includes('بعدي') || title.includes('post');
    }

    if (type === 'evaluation') {
      return title.includes('تقييم الدورة') || title.includes('evaluation');
    }

    return title.includes('قبلي') || title.includes('pre');
  });

  return found
    ? {
        ...found,
        questions: [...(found.questions ?? [])].sort(
          (a, b) => a.order - b.order,
        ),
      }
    : null;
}

function createAssessment(
  courseId: string,
  type: AssessmentType,
): CourseAssessment {
  const id = `assessment_${courseId}_${type}`;

  const questions: LessonQuestion[] =
    type === 'evaluation'
      ? UNIFIED_EVALUATION_QUESTIONS.map((item, index) => ({
          id: `${id}_q_${index + 1}`,
          lessonId: id,
          question: item.question,
          type: item.type === 'text' ? 'text' : 'multiple-choice',
          options: item.type === 'text' ? undefined : RATING_OPTIONS,
          correctAnswer: '',
          explanation: '',
          order: index,
          points: 0,
        }))
      : [];

  return {
    id,
    courseId,
    title: assessmentMeta[type].title,
    description: assessmentMeta[type].description,
    questions,
    createdAt: new Date(),
    updatedAt: new Date(),
    assessmentType: type,
  } as CourseAssessment & { assessmentType: AssessmentType };
}

function normalizeEvaluationAssessment(
  courseId: string,
  existing: CourseAssessment | null,
): CourseAssessment {
  const base = existing ?? createAssessment(courseId, 'evaluation');

  // Existing evaluation questions are preserved. If the course has never
  // had an evaluation, the unified template is inserted automatically.
  if (base.questions?.length) return base;

  return createAssessment(courseId, 'evaluation');
}


export default function ProgramsAdmin() {
  const [programs, setPrograms] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');

  const [courseModal, setCourseModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [assessmentCourse, setAssessmentCourse] = useState<Course | null>(null);
  const [assessmentTab, setAssessmentTab] =
    useState<AssessmentType>('pre');
  const [drafts, setDrafts] = useState<Drafts>(emptyDrafts());
  const [assessmentSaving, setAssessmentSaving] = useState(false);
  const [bulkQuestionsText, setBulkQuestionsText] = useState('');
  const [assessmentSchedules, setAssessmentSchedules] = useState<Schedule[]>([]);
  const [selectedAssessmentScheduleId, setSelectedAssessmentScheduleId] = useState('');
  const [assessmentAccessSaving, setAssessmentAccessSaving] = useState<'post' | 'evaluation' | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [programForSchedule, setProgramForSchedule] = useState<Course | null>(
    null,
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleForm, setScheduleForm] =
    useState<ScheduleForm>(emptySchedule);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);

  async function load() {
    const [courses, cats] = await Promise.all([
      courseRepository.findByType('training'),
      categoryRepository.findAll({ sort: 'name', order: 'asc' }),
    ]);

    setPrograms(courses);
    setCategories(cats);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return programs.filter((course) => {
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        (course.trainer?.name ?? '').toLowerCase().includes(q);

      const matchesStatus =
        status === 'all' ||
        (status === 'published' ? course.published : !course.published);

      return matchesSearch && matchesStatus;
    });
  }, [programs, search, status]);

  function setFormValue<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function readMaterialFile(file: File) {
    if (file.type !== 'application/pdf') {
      alert('يرجى اختيار ملف PDF فقط.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormValue('materialUrl', String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  }

  function addCourse() {
    setEditing(null);
    setForm({ ...emptyForm });
    setCourseModal(true);
  }

  function editCourse(course: Course) {
    setEditing(course.id);

    setForm({
      title: course.title,
      categoryId: course.categoryId ?? '',
      trainer: course.trainer?.name ?? '',
      price: String(course.price ?? ''),
      description: course.description ?? '',
      objectives: (course.objectives ?? []).join('\n'),
      audience: course.audience ?? '',
      materialUrl: course.materialUrl ?? '',
      materials: course.materialsEnabled !== false,
      pre: course.preAssessmentEnabled !== false,
      post: course.postAssessmentEnabled !== false,
      evaluation: course.courseEvaluationEnabled !== false,
      attendance: course.attendanceEnabled !== false,
      published: course.published,
      featured: course.featured,
    });

    setCourseModal(true);
  }

  async function saveCourse(event: FormEvent) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert('أدخل اسم البرنامج.');
      return;
    }

    const existing = editing
      ? programs.find((course) => course.id === editing)
      : undefined;

    const payload: any = {
      title: form.title.trim(),
      slug: form.title.trim().toLowerCase().replace(/\s+/g, '-'),
      description: form.description.trim(),
      shortDescription: form.description.trim().slice(0, 180),
      categoryId: form.categoryId || undefined,
      type: 'training',
      trainingKind: existing?.trainingKind ?? 'public',
      delivery: 'in-person',
      price: Number(form.price) || 5000,
      days: 3,
      hours: 0,
      objectives: form.objectives
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      outcomes: existing?.outcomes ?? [],
      outline: existing?.outline ?? '',
      lessons: existing?.lessons ?? [],
      schedules: existing?.schedules ?? [],
      assessments: existing?.assessments ?? [],
      audience: form.audience,
      materialUrl: form.materialUrl || undefined,
      trainer: {
        id: existing?.trainer?.id ?? makeId('trainer'),
        name: form.trainer,
      },
      featured: form.featured,
      published: form.published,
      status: form.published ? 'published' : 'draft',
      certificateSettings: existing?.certificateSettings ?? {
        enabled: true,
        autoGenerate: false,
        requireCompletion: true,
        requireAssessmentPass: false,
      },
      materialsEnabled: form.materials,
      preAssessmentEnabled: form.pre,
      postAssessmentEnabled: form.post,
      courseEvaluationEnabled: form.evaluation,
      attendanceEnabled: form.attendance,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    if (editing) {
      await courseRepository.update(editing, payload);
    } else {
      await courseRepository.create(payload);
    }

    setCourseModal(false);
    await load();
  }

  async function togglePublish(course: Course) {
    await courseRepository.update(course.id, {
      published: !course.published,
      status: !course.published ? 'published' : 'draft',
    });

    await load();
  }

  async function removeCourse() {
    if (!deleteId) return;

    await courseRepository.delete(deleteId);
    setDeleteId(null);
    await load();
  }

  async function openAssessments(course: Course) {
    const nextDrafts = emptyDrafts();

    (['pre', 'post', 'evaluation'] as AssessmentType[]).forEach((type) => {
      const existing = getAssessment(course, type);

      nextDrafts[type] =
        type === 'evaluation'
          ? normalizeEvaluationAssessment(course.id, existing)
          : existing ?? createAssessment(course.id, type);
    });

    setAssessmentCourse(course);
    setDrafts(nextDrafts);
    const courseSchedules = await scheduleRepository.findByCourseId(course.id);
    setAssessmentSchedules(courseSchedules);
    setSelectedAssessmentScheduleId(courseSchedules[0]?.id ?? '');
    setAssessmentTab('pre');
    setBulkQuestionsText('');
    setAssessmentOpen(true);
  }

  async function togglePublicScheduleAssessment(type: 'post' | 'evaluation') {
    if (!selectedAssessmentScheduleId) {
      alert('اختر موعدًا تدريبيًا أولًا.');
      return;
    }

    const schedule = assessmentSchedules.find(
      (item) => item.id === selectedAssessmentScheduleId,
    );
    if (!schedule) return;

    const field =
      type === 'post' ? 'postAssessmentEnabled' : 'courseEvaluationEnabled';
    const nextValue = schedule[field] !== true;

    setAssessmentAccessSaving(type);
    try {
      const updated = await scheduleRepository.update(schedule.id, {
        [field]: nextValue,
      } as Partial<Schedule>);

      setAssessmentSchedules((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'تعذر تحديث إتاحة التقييم.');
    } finally {
      setAssessmentAccessSaving(null);
    }
  }

  function updateCurrentAssessment(
    updates: Partial<CourseAssessment>,
  ) {
    setDrafts((current) => ({
      ...current,
      [assessmentTab]: current[assessmentTab]
        ? { ...current[assessmentTab]!, ...updates }
        : current[assessmentTab],
    }));
  }

  function updateQuestion(
    questionId: string,
    updates: Partial<LessonQuestion>,
  ) {
    setDrafts((current) => {
      const assessment = current[assessmentTab];
      if (!assessment) return current;

      return {
        ...current,
        [assessmentTab]: {
          ...assessment,
          questions: assessment.questions.map((question) =>
            question.id === questionId
              ? { ...question, ...updates }
              : question,
          ),
        },
      };
    });
  }

  function updateQuestionOption(
    questionId: string,
    index: number,
    value: string,
  ) {
    setDrafts((current) => {
      const assessment = current[assessmentTab];
      if (!assessment) return current;

      return {
        ...current,
        [assessmentTab]: {
          ...assessment,
          questions: assessment.questions.map((question) => {
            if (question.id !== questionId) return question;

            const options = [...(question.options ?? [])];
            options[index] = value;

            return { ...question, options };
          }),
        },
      };
    });
  }

  function addQuestion() {
    setDrafts((current) => {
      const assessment = current[assessmentTab];
      if (!assessment) return current;

      const question = makeQuestion(
        assessment.id,
        assessment.questions.length,
      );

      if (assessmentTab === 'evaluation') {
        question.points = 0;
      }

      return {
        ...current,
        [assessmentTab]: {
          ...assessment,
          questions: [...assessment.questions, question],
        },
      };
    });
  }

  function importBulkQuestions() {
    if (assessmentTab === 'evaluation') return;

    const text = bulkQuestionsText.trim();
    if (!text) return;

    const blocks = text
      .split(/\n\s*\n+/)
      .map((block) => block.trim())
      .filter(Boolean);

    const parsed: LessonQuestion[] = [];

    blocks.forEach((block, index) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) return;

      const questionLine = lines.find(
        (line) => !/^(?:[A-D][)\-.]|[أ-د][)\-.]|الإجابة\s*:)/i.test(line),
      ) ?? lines[0];

      const answerLine = lines.find((line) => /^الإجابة\s*:/i.test(line));
      const answerValue = answerLine
        ? answerLine.replace(/^الإجابة\s*:/i, '').trim()
        : '';

      const optionLines = lines.filter((line) =>
        /^(?:[A-D][)\-.]|[أ-د][)\-.])\s+/i.test(line),
      );

      let type: QuestionType = 'multiple-choice';
      let options: string[] | undefined;
      let correctAnswer = answerValue;

      if (optionLines.length >= 2) {
        options = optionLines.map((line) =>
          line.replace(/^(?:[A-D][)\-.]|[أ-د][)\-.])\s+/i, '').trim(),
        );

        const answerLetter = answerValue.match(/^([A-D])$/i)?.[1]?.toUpperCase();
        if (answerLetter) {
          const answerIndex = answerLetter.charCodeAt(0) - 65;
          correctAnswer = options[answerIndex] ?? '';
        }
      } else if (/^(?:صح\s*\/\s*خطأ|صح أو خطأ|true\s*\/\s*false)$/i.test(lines[1] ?? '')) {
        type = 'true-false';
        options = undefined;
        if (/^(?:صح|true)$/i.test(answerValue)) correctAnswer = 'true';
        if (/^(?:خطأ|false)$/i.test(answerValue)) correctAnswer = 'false';
      } else if (optionLines.length === 0 && /^الإجابة\s*:/i.test(answerLine ?? '')) {
        type = 'text';
        options = undefined;
        correctAnswer = '';
      }

      // If there are no explicit choices, treat the question as text unless
      // it clearly declares true/false.
      if (!optionLines.length && type === 'multiple-choice') {
        type = 'text';
        options = undefined;
        correctAnswer = '';
      }

      parsed.push({
        id: makeId('question'),
        lessonId: drafts[assessmentTab]?.id ?? '',
        question: questionLine.replace(/^\d+[.)\-]\s*/, '').trim(),
        type,
        options,
        correctAnswer,
        explanation: '',
        order: index,
        points: 1,
      });
    });

    if (!parsed.length) return;

    setDrafts((current) => {
      const assessment = current[assessmentTab];
      if (!assessment) return current;

      const startOrder = assessment.questions.length;
      return {
        ...current,
        [assessmentTab]: {
          ...assessment,
          questions: [
            ...assessment.questions,
            ...parsed.map((question, index) => ({
              ...question,
              lessonId: assessment.id,
              order: startOrder + index,
            })),
          ],
        },
      };
    });

    setBulkQuestionsText('');
  }

  function removeQuestion(questionId: string) {
    setDrafts((current) => {
      const assessment = current[assessmentTab];
      if (!assessment) return current;

      return {
        ...current,
        [assessmentTab]: {
          ...assessment,
          questions: assessment.questions
            .filter((question) => question.id !== questionId)
            .map((question, index) => ({
              ...question,
              order: index,
            })),
        },
      };
    });
  }

  function validateQuestions(
    assessment: CourseAssessment,
    type: AssessmentType,
  ) {
    for (const question of assessment.questions) {
      if (!question.question.trim()) {
        return 'أكمل نص كل سؤال.';
      }

      // Course Evaluation is a unified satisfaction survey.
      // It does not have correct answers or a passing score.
      if (type === 'evaluation') {
        if (
          question.type === 'multiple-choice' &&
          (question.options ?? []).filter((option) => option.trim()).length < 2
        ) {
          return 'كل سؤال في تقييم الدورة يحتاج خيارين على الأقل.';
        }

        continue;
      }

      if (question.type === 'multiple-choice') {
        const options = (question.options ?? [])
          .map((option) => option.trim())
          .filter(Boolean);

        if (options.length < 2) {
          return 'كل سؤال اختيار من متعدد يحتاج خيارين على الأقل.';
        }

        if (!String(question.correctAnswer ?? '').trim()) {
          return 'حدد الإجابة الصحيحة لكل سؤال.';
        }
      }

      if (
        question.type === 'true-false' &&
        !String(question.correctAnswer ?? '').trim()
      ) {
        return 'حدد الإجابة الصحيحة لأسئلة صح أو خطأ.';
      }
    }

    return '';
  }


  async function saveAssessments() {
    if (!assessmentCourse) return;

    const error = (
      ['pre', 'post', 'evaluation'] as AssessmentType[]
    )
      .map((type) => drafts[type])
      .filter(Boolean)
      .map((assessment, index) =>
        validateQuestions(
          assessment!,
          (['pre', 'post', 'evaluation'] as AssessmentType[])[index],
        ),
      )
      .find(Boolean);

    if (error) {
      alert(error);
      return;
    }

    setAssessmentSaving(true);

    try {
      const existingAssessments = Array.isArray(
        (assessmentCourse as any).assessments,
      )
        ? [...(assessmentCourse as any).assessments]
        : [];

      const nextAssessments = (
        ['pre', 'post', 'evaluation'] as AssessmentType[]
      ).map((type) => {
        const draft =
          type === 'evaluation'
            ? normalizeEvaluationAssessment(
                assessmentCourse.id,
                drafts.evaluation,
              )
            : drafts[type]!;

        return {
          ...draft,
          assessmentType: type,
          courseId: assessmentCourse.id,
          questions: draft.questions.map((question, index) => ({
            ...question,
            lessonId: draft.id,
            order: index,
          })),
          updatedAt: new Date(),
        };
      });

      nextAssessments.forEach((assessment) => {
        const index = existingAssessments.findIndex(
          (item: any) =>
            item.id === assessment.id ||
            item.assessmentType === assessment.assessmentType,
        );

        if (index >= 0) {
          existingAssessments[index] = assessment;
        } else {
          existingAssessments.push(assessment);
        }
      });

      await courseRepository.update(assessmentCourse.id, {
        assessments: existingAssessments,
        updatedAt: new Date(),
      });

      const refreshed = await courseRepository.findById(
        assessmentCourse.id,
      );

      if (refreshed) {
        setAssessmentCourse(refreshed);
      }

      await load();
      alert('تم حفظ تقييمات البرنامج بنجاح.');
    } finally {
      setAssessmentSaving(false);
    }
  }

  async function openSchedules(course: Course) {
    setProgramForSchedule(course);
    setEditingSchedule(null);
    setScheduleForm(emptySchedule);
    setSchedules(await scheduleRepository.findByCourseId(course.id));
    setScheduleOpen(true);
  }

  function closeSchedules() {
    setScheduleOpen(false);
    setProgramForSchedule(null);
    setSchedules([]);
    setEditingSchedule(null);
  }

  function editSchedule(schedule: Schedule) {
    setEditingSchedule(schedule.id);
    setScheduleForm({
      delivery:
        schedule.city === 'Online' || schedule.city === 'أونلاين'
          ? 'online'
          : 'in-person',
      startDate: schedule.startDate.toISOString().slice(0, 10),
      city: schedule.city ?? 'الرياض',
      location: schedule.location ?? '',
      meeting: schedule.onlineMeetingLink ?? '',
      max: String(schedule.maxParticipants ?? 20),
    });
  }

  async function saveSchedule(event: FormEvent) {
    event.preventDefault();

    if (!programForSchedule || !scheduleForm.startDate) return;

    const online = scheduleForm.delivery === 'online';
    const startDate = asDate(scheduleForm.startDate);
    const city = online ? 'Online' : scheduleForm.city;

    const data: any = {
      courseId: programForSchedule.id,
      courseTitle: programForSchedule.title,
      title: programForSchedule.title,
      description: programForSchedule.description,
      startDate,
      endDate: addDays(startDate, 2),
      startTime: '',
      endTime: '',
      city,
      location: online ? undefined : scheduleForm.location || undefined,
      onlineMeetingLink: online
        ? scheduleForm.meeting || undefined
        : undefined,
      maxParticipants: Number(scheduleForm.max) || 20,
      currentParticipants: 0,
      price: priceFor(city, Number(programForSchedule.price)),
      currency: 'SAR',
      instructorName: programForSchedule.trainer?.name,
      status: 'available',
      published: programForSchedule.published,
      allowWaitlist: true,
      requireConfirmation: false,
      recurrence: 'once',
      postAssessmentEnabled: false,
      courseEvaluationEnabled: false,
    };

    if (editingSchedule) {
      await scheduleRepository.update(editingSchedule, data);
    } else {
      await scheduleRepository.create(data);
    }

    setEditingSchedule(null);
    setScheduleForm(emptySchedule);
    setSchedules(
      await scheduleRepository.findByCourseId(programForSchedule.id),
    );
  }

  async function deleteSchedule(id: string) {
    if (!confirm('حذف هذا الموعد؟')) return;

    await scheduleRepository.delete(id);

    if (programForSchedule) {
      setSchedules(
        await scheduleRepository.findByCourseId(programForSchedule.id),
      );
    }
  }

  async function deleteAllSchedulesForProgram() {
    if (!programForSchedule || schedules.length === 0) return;

    if (
      !confirm(
        `هل أنت متأكد من حذف جميع مواعيد ${programForSchedule.title}؟`,
      )
    ) {
      return;
    }

    for (const schedule of schedules) {
      await scheduleRepository.delete(schedule.id);
    }

    setSchedules([]);
    setEditingSchedule(null);
    setScheduleForm(emptySchedule);
  }

  async function deleteAllPublicSchedules() {
    const all = await scheduleRepository.findAll();
    const publicCourseIds = new Set(
      programs.filter(isPublicTraining).map((course) => course.id),
    );

    const publicSchedules = all.filter((schedule) =>
      publicCourseIds.has(schedule.courseId),
    );

    if (!publicSchedules.length) {
      alert('لا توجد جدولة عامة لحذفها.');
      return;
    }

    if (!confirm('سيتم حذف جميع مواعيد Public المجدولة. هل تريد المتابعة؟')) {
      return;
    }

    for (const schedule of publicSchedules) {
      await scheduleRepository.delete(schedule.id);
    }

    if (programForSchedule) setSchedules([]);

    alert(`تم حذف ${publicSchedules.length} موعدًا.`);
  }

  async function generate(year: number) {
    if (!programForSchedule || !isPublicTraining(programForSchedule)) {
      alert('يمكن جدولة Public Courses فقط.');
      return;
    }

    if (
      !confirm(
        `سيتم جدولة ${programForSchedule.title} بحيث تظهر كل المدن مرة واحدة على الأقل في كل شهر، وفي أيام الأحد فقط. هل تريد المتابعة؟`,
      )
    ) {
      return;
    }

    const created = await scheduleRepository.generateSchedules({
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      cities,
      courseIds: [programForSchedule.id],
    });

    setSchedules(
      await scheduleRepository.findByCourseId(programForSchedule.id),
    );

    alert(
      created.length
        ? `تم إنشاء ${created.length} موعدًا لعام ${year}.`
        : 'لا توجد مواعيد جديدة لهذا العام.',
    );
  }

  async function generateAll(year: number) {
    const publicPrograms = programs.filter(isPublicTraining);

    if (!publicPrograms.length) {
      alert('لا توجد برامج Public منشورة للجدولة.');
      return;
    }

    if (
      !confirm(
        `سيتم جدولة جميع برامج Public بحيث تظهر كل المدن مرة واحدة على الأقل في كل شهر، وفي أيام الأحد فقط لعام ${year}. هل تريد المتابعة؟`,
      )
    ) {
      return;
    }

    const created = await scheduleRepository.generateSchedules({
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      cities,
      courseIds: publicPrograms.map((course) => course.id),
    });

    alert(
      created.length
        ? `تم إنشاء ${created.length} موعدًا لعام ${year}.`
        : 'لا توجد مواعيد جديدة لهذا العام.',
    );
  }

  const currentAssessment = drafts[assessmentTab];

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>إدارة البرامج التدريبية</h1>
          <p>
            إدارة البرامج، التقييمات، والمواعيد من مكان واحد.
          </p>
        </div>

        <div className="admin-actions">
          <button
            className="admin-btn admin-btn-primary"
            onClick={addCourse}
          >
            + إضافة برنامج تدريبي
          </button>
        </div>
      </header>

      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="البحث في البرامج التدريبية..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="admin-select"
          style={{ width: 150 }}
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as 'all' | 'published' | 'draft')
          }
        >
          <option value="all">كل الحالات</option>
          <option value="published">منشورة</option>
          <option value="draft">مسودة</option>
        </select>

        <button
          className="admin-btn admin-btn-gold"
          onClick={() => void generateAll(2026)}
        >
          جدولة 2026
        </button>

        <button
          className="admin-btn admin-btn-gold"
          onClick={() => void generateAll(2027)}
        >
          جدولة 2027
        </button>

        <button
          className="admin-btn admin-btn-danger"
          onClick={() => void deleteAllPublicSchedules()}
        >
          إلغاء جميع الجدولة
        </button>
      </div>

      <section className="admin-stats">
        <Stat label="إجمالي البرامج" value={programs.length} />
        <Stat
          label="المنشورة"
          value={programs.filter((course) => course.published).length}
        />
        <Stat
          label="المسودات"
          value={programs.filter((course) => !course.published).length}
        />
        <Stat
          label="Public"
          value={
            programs.filter(
              (course) =>
                course.trainingKind !== 'corporate' && course.published,
            ).length
          }
        />
      </section>

      <section className="admin-card-grid">
        {visible.length === 0 ? (
          <div
            className="admin-card admin-empty"
            style={{ gridColumn: '1/-1' }}
          >
            <strong>لا توجد برامج</strong>
            <span>البرامج التدريبية ستظهر هنا.</span>
          </div>
        ) : (
          visible.map((course) => (
            <article className="admin-course-card" key={course.id}>
              <div className="admin-course-body">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <h3 className="admin-course-title">
                      {course.title}
                    </h3>
                    <span className="admin-tag">
                      {course.trainingKind === 'corporate'
                        ? 'Corporate'
                        : 'Public'}
                    </span>
                  </div>

                  <span
                    className={`admin-status ${
                      course.published
                        ? 'admin-status-ok'
                        : 'admin-status-draft'
                    }`}
                  >
                    {course.published ? 'منشور' : 'مسودة'}
                  </span>
                </div>

                <p className="admin-course-desc">
                  {course.shortDescription || course.description}
                </p>

                <div className="admin-meta">
                  <span className="admin-tag">
                    {categories.find(
                      (category) => category.id === course.categoryId,
                    )?.name || 'بدون تصنيف'}
                  </span>
                  <span>{course.days || 3} أيام</span>
                  <span>{course.trainer?.name || 'بدون مدرب'}</span>
                  <span>
                    {Number(course.price || 0).toLocaleString('ar-SA')}{' '}
                    SAR أساس
                  </span>
                </div>

                <div className="admin-card-actions">
                  <button
                    className="admin-btn admin-btn-gold"
                    onClick={() => openAssessments(course)}
                  >
                    إدارة التقييمات
                  </button>

                  <button
                    className="admin-btn admin-btn-light"
                    onClick={() => void openSchedules(course)}
                  >
                    إدارة المواعيد
                  </button>

                  <button
                    className="admin-btn admin-btn-light"
                    onClick={() => editCourse(course)}
                  >
                    تعديل البرنامج
                  </button>

                  <button
                    className="admin-btn admin-btn-light"
                    onClick={() => void togglePublish(course)}
                  >
                    {course.published ? 'إلغاء النشر' : 'نشر'}
                  </button>

                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => setDeleteId(course.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {courseModal && (
        <Modal
          title={editing ? 'تعديل برنامج تدريبي' : 'إضافة برنامج تدريبي'}
          onClose={() => setCourseModal(false)}
          width={900}
        >
          <form onSubmit={saveCourse}>
            <div className="admin-form-grid">
              <Field label="اسم البرنامج">
                <input
                  className="admin-input"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setFormValue('title', event.target.value)
                  }
                />
              </Field>

              <Field label="التصنيف">
                <select
                  className="admin-select"
                  value={form.categoryId}
                  onChange={(event) =>
                    setFormValue('categoryId', event.target.value)
                  }
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="المدرب">
                <input
                  className="admin-input"
                  value={form.trainer}
                  onChange={(event) =>
                    setFormValue('trainer', event.target.value)
                  }
                />
              </Field>

              <Field label="عدد الأيام">
                <input
                  className="admin-input"
                  value="3"
                  readOnly
                />
              </Field>

              <Field label="السعر الأساسي">
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    setFormValue('price', event.target.value)
                  }
                />
              </Field>

              <Field label="الفئة المستهدفة">
                <input
                  className="admin-input"
                  value={form.audience}
                  onChange={(event) =>
                    setFormValue('audience', event.target.value)
                  }
                />
              </Field>

              <Field label="المادة التدريبية PDF" full>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input
                    className="admin-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readMaterialFile(file);
                    }}
                  />
                  {form.materialUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ color: '#067647', fontWeight: 700, fontSize: 13 }}>تم تحديد المادة التدريبية PDF.</span>
                      <a href={form.materialUrl} target="_blank" rel="noreferrer" className="admin-btn admin-btn-light" style={{ textDecoration: 'none' }}>معاينة المادة</a>
                      <button type="button" className="admin-btn admin-btn-light" onClick={() => setFormValue('materialUrl', '')}>إزالة المادة</button>
                    </div>
                  ) : (
                    <small>المادة العامة للبرنامج تظهر لجميع المتدربين، ويمكن استبدالها بمادة خاصة على مستوى المجموعة.</small>
                  )}
                </div>
              </Field>

              <Field label="الوصف" full>
                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setFormValue('description', event.target.value)
                  }
                />
              </Field>

              <Field label="الأهداف — هدف في كل سطر" full>
                <textarea
                  className="admin-textarea"
                  rows={5}
                  value={form.objectives}
                  onChange={(event) =>
                    setFormValue('objectives', event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="admin-checkboxes" style={{ marginTop: 16 }}>
              {[
                ['materials', 'مواد تدريبية'],
                ['pre', 'تقييم قبلي'],
                ['post', 'تقييم بعدي'],
                ['evaluation', 'تقييم الدورة'],
                ['attendance', 'الحضور'],
                ['published', 'منشور'],
                ['featured', 'مميز'],
              ].map(([key, label]) => (
                <label className="admin-checkbox" key={key}>
                  <input
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={(event) =>
                      setFormValue(
                        key as keyof Form,
                        event.target.checked as never,
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() => setCourseModal(false)}
              >
                إلغاء
              </button>

              <button className="admin-btn admin-btn-primary">
                حفظ البرنامج
              </button>
            </div>
          </form>
        </Modal>
      )}

      {assessmentOpen && assessmentCourse && currentAssessment && (
        <Modal
          title={`إدارة التقييمات — ${assessmentCourse.title}`}
          onClose={() => { setAssessmentOpen(false); setAssessmentSchedules([]); setSelectedAssessmentScheduleId(''); }}
          width={1100}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '1px solid #e7ebf2',
              paddingBottom: 12,
              marginBottom: 18,
            }}
          >
            {(['pre', 'post', 'evaluation'] as AssessmentType[]).map(
              (type) => {
                const count = drafts[type]?.questions.length ?? 0;

                return (
                  <button
                    key={type}
                    type="button"
                    className={
                      assessmentTab === type
                        ? 'admin-btn admin-btn-primary'
                        : 'admin-btn admin-btn-light'
                    }
                    onClick={() => setAssessmentTab(type)}
                  >
                    {assessmentMeta[type].title} ({count})
                  </button>
                );
              },
            )}
          </div>

          {assessmentCourse.trainingKind !== 'corporate' && (
            <div
              className="admin-card"
              style={{ padding: 18, marginBottom: 18, background: '#f8fafc' }}
            >
              <h3 style={{ marginTop: 0 }}>إتاحة التقييم لمتدربي Public حسب الموعد</h3>
              <p style={{ color: '#6b7890', marginTop: 0, fontSize: 13 }}>
                اختر موعدًا محددًا. هذا الإعداد لا يفتح التقييم لباقي مواعيد الدورة.
              </p>
              <div className="admin-form-grid">
                <Field label="الموعد التدريبي">
                  <select
                    className="admin-select"
                    value={selectedAssessmentScheduleId}
                    onChange={(event) => setSelectedAssessmentScheduleId(event.target.value)}
                  >
                    <option value="">اختر الموعد</option>
                    {assessmentSchedules
                      .slice()
                      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                      .map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {formatDate(schedule.startDate)} — {schedule.city || 'Online'}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
              {selectedAssessmentScheduleId && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  {(['post', 'evaluation'] as const).map((type) => {
                    const schedule = assessmentSchedules.find((item) => item.id === selectedAssessmentScheduleId)!;
                    const enabled = type === 'post' ? schedule.postAssessmentEnabled === true : schedule.courseEvaluationEnabled === true;
                    return (
                      <button
                        key={type}
                        type="button"
                        className={enabled ? 'admin-btn admin-btn-primary' : 'admin-btn admin-btn-light'}
                        disabled={assessmentAccessSaving === type}
                        onClick={() => void togglePublicScheduleAssessment(type)}
                      >
                        {assessmentAccessSaving === type
                          ? 'جارٍ الحفظ...'
                          : `${type === 'post' ? 'التقييم البعدي' : 'تقييم الدورة'}: ${enabled ? 'مفتوح' : 'مغلق'}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div
            className="admin-card"
            style={{ padding: 18, marginBottom: 18 }}
          >
            <h3 style={{ marginTop: 0 }}>
              {assessmentMeta[assessmentTab].title}
            </h3>
            <p style={{ color: '#6b7890', marginBottom: 16 }}>
              {assessmentMeta[assessmentTab].description}
            </p>

            <div className="admin-form-grid">
              <Field label="عنوان التقييم">
                <input
                  className="admin-input"
                  value={currentAssessment.title}
                  onChange={(event) =>
                    updateCurrentAssessment({
                      title: event.target.value,
                    })
                  }
                />
              </Field>


              {assessmentTab === 'pre' && (
                <div
                  className="admin-card"
                  style={{
                    padding: 14,
                    background: '#f8fafc',
                    border: '1px solid #e7ebf2',
                  }}
                >
                  <strong>النتيجة</strong>
                  <div style={{ marginTop: 5, color: '#6b7890', fontSize: 13 }}>
                    سيتم حساب نتيجة المتدرب من 100 بعد الإجابة على أسئلة التقييم القبلي.
                  </div>
                </div>
              )}

              {assessmentTab === 'post' && (
                <div
                  className="admin-card"
                  style={{
                    padding: 14,
                    background: '#f8fafc',
                    border: '1px solid #e7ebf2',
                  }}
                >
                  <strong>النتيجة</strong>
                  <div style={{ marginTop: 5, color: '#6b7890', fontSize: 13 }}>
                    سيتم حساب نتيجة المتدرب من 100 بعد الإجابة على أسئلة التقييم البعدي، ويمكن مقارنة النتيجة مع التقييم القبلي.
                  </div>
                </div>
              )}

              {assessmentTab === 'evaluation' && (
                <div
                  className="admin-card"
                  style={{
                    padding: 14,
                    background: '#f8fafc',
                    border: '1px solid #e7ebf2',
                  }}
                >
                  <strong>نموذج موحد</strong>
                  <div style={{ marginTop: 5, color: '#6b7890', fontSize: 13 }}>
                    هذا النموذج موحد ويُستخدم تلقائيًا لجميع البرامج التدريبية.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>الأسئلة</h3>
              <p
                style={{
                  margin: '4px 0 0',
                  color: '#6b7890',
                  fontSize: 13,
                }}
              >
                {assessmentTab === 'evaluation'
                  ? 'هذا نموذج موحد لجميع الدورات ويُضاف تلقائيًا، ولا تحتاج لإنشائه لكل برنامج.'
                  : 'الأسئلة محفوظة داخل البرنامج نفسه، ونتيجة المتدرب في Pre وPost تُحسب من 100.'}
              </p>
            </div>

            {assessmentTab !== 'evaluation' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-gold"
                  onClick={addQuestion}
                >
                  + إضافة سؤال
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => setBulkQuestionsText((value) => value || '1. السؤال هنا؟\nA) الخيار الأول\nB) الخيار الثاني\nC) الخيار الثالث\nD) الخيار الرابع\nالإجابة: B\n\n2. السؤال الثاني؟\nA) الخيار الأول\nB) الخيار الثاني\nC) الخيار الثالث\nD) الخيار الرابع\nالإجابة: C')}
                >
                  + إضافة مجموعة أسئلة
                </button>
              </div>
            )}
            {assessmentTab === 'evaluation' && (
              <button
                type="button"
                className="admin-btn admin-btn-light"
                disabled
              >
                النموذج الموحد ثابت
              </button>
            )}
          </div>

          {assessmentTab !== 'evaluation' && bulkQuestionsText && (
            <div
              className="admin-card"
              style={{
                padding: 18,
                marginBottom: 18,
                background: '#f8fafc',
                border: '1px solid #e7ebf2',
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: 6 }}>إضافة الأسئلة دفعة واحدة</h4>
              <p style={{ color: '#6b7890', fontSize: 13, marginTop: 0 }}>
                الصق الأسئلة، وافصل بين كل سؤال وسؤال بسطر فارغ. يدعم اختيار من متعدد وصح/خطأ والنصي.
              </p>
              <textarea
                className="admin-textarea"
                rows={12}
                value={bulkQuestionsText}
                onChange={(event) => setBulkQuestionsText(event.target.value)}
                placeholder={'1. السؤال؟\nA) الخيار الأول\nB) الخيار الثاني\nC) الخيار الثالث\nD) الخيار الرابع\nالإجابة: B\n\n2. السؤال الثاني؟\nA) ...'}
                dir="rtl"
              />
              <div className="admin-modal-footer" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-light"
                  onClick={() => setBulkQuestionsText('')}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={importBulkQuestions}
                >
                  إضافة الأسئلة
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 14 }}>
            {currentAssessment.questions.length === 0 ? (
              <div className="admin-card admin-empty">
                <strong>لا توجد أسئلة بعد</strong>
                <span>أضف أول سؤال لهذا التقييم.</span>
              </div>
            ) : (
              currentAssessment.questions.map((question, index) => (
                <div
                  className="admin-card"
                  key={question.id}
                  style={{ padding: 18 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <strong>السؤال {index + 1}</strong>

                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      onClick={() => removeQuestion(question.id)}
                    >
                      حذف السؤال
                    </button>
                  </div>

                  <div className="admin-form-grid">
                    <Field label="نوع السؤال">
                      {assessmentTab === 'evaluation' ? (
                        <input
                          className="admin-input"
                          value={question.type === 'text' ? 'إجابة نصية (اختيارية)' : 'تقييم من 5'}
                          readOnly
                        />
                      ) : (
                        <select
                          className="admin-select"
                          value={question.type}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              type: event.target.value as QuestionType,
                              correctAnswer: '',
                              options:
                                event.target.value === 'multiple-choice'
                                  ? ['', '', '', '']
                                  : undefined,
                            })
                          }
                        >
                          <option value="multiple-choice">اختيار من متعدد</option>
                          <option value="true-false">صح / خطأ</option>
                          <option value="text">إجابة نصية</option>
                        </select>
                      )}
                    </Field>

                    {assessmentTab !== 'evaluation' && (
                      <Field label="الدرجة">
                        <input
                          className="admin-input"
                          type="number"
                          min="0"
                          value={question.points ?? 1}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              points: Number(event.target.value),
                            })
                          }
                        />
                      </Field>
                    )}

                    <Field label="السؤال" full>
                      <textarea
                        className="admin-textarea"
                        rows={3}
                        value={question.question}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            question: event.target.value,
                          })
                        }
                      />
                    </Field>

                    {assessmentTab === 'evaluation' && question.type === 'multiple-choice' && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={{ display: 'block', fontSize: 12, marginBottom: 6, color: '#6b7890' }}>خيارات التقييم</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {RATING_OPTIONS.map((option) => (
                            <span key={option} style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e7ebf2', fontSize: 13 }}>{option}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {assessmentTab === 'evaluation' && (
                      <div
                        className="admin-card"
                        style={{
                          gridColumn: '1/-1',
                          padding: 12,
                          background: '#fffaf0',
                          border: '1px solid #f1dfb5',
                        }}
                      >
                        <strong style={{ fontSize: 13 }}>
                          تقييم رضا فقط
                        </strong>
                        <div
                          style={{
                            marginTop: 4,
                            color: '#6b7890',
                            fontSize: 12,
                          }}
                        >
                          كل سؤال تقييم من 5 درجات، والسؤال الأخير نصي اختياري لإبداء الرأي أو الاقتراحات. لا توجد درجة نجاح.
                        </div>
                      </div>
                    )}

                    {assessmentTab !== 'evaluation' &&
                      question.type === 'multiple-choice' && (
                      <div
                        style={{
                          gridColumn: '1/-1',
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(2, minmax(0, 1fr))',
                          gap: 10,
                        }}
                      >
                        {(question.options ?? ['', '', '', '']).map(
                          (option, optionIndex) => (
                            <div key={optionIndex}>
                              <label
                                style={{
                                  display: 'block',
                                  fontSize: 12,
                                  marginBottom: 5,
                                  color: '#6b7890',
                                }}
                              >
                                الخيار {optionIndex + 1}
                              </label>

                              <input
                                className="admin-input"
                                value={option}
                                onChange={(event) =>
                                  updateQuestionOption(
                                    question.id,
                                    optionIndex,
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                          ),
                        )}

                        <div style={{ gridColumn: '1/-1' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: 12,
                              marginBottom: 5,
                              color: '#6b7890',
                            }}
                          >
                            الإجابة الصحيحة
                          </label>

                          <select
                            className="admin-select"
                            value={String(
                              question.correctAnswer ?? '',
                            )}
                            onChange={(event) =>
                              updateQuestion(question.id, {
                                correctAnswer: event.target.value,
                              })
                            }
                          >
                            <option value="">اختر الإجابة الصحيحة</option>
                            {(question.options ?? [])
                              .filter((option) => option.trim())
                              .map((option, optionIndex) => (
                                <option key={optionIndex} value={option}>
                                  {option}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {assessmentTab !== 'evaluation' &&
                      question.type === 'true-false' && (
                      <Field label="الإجابة الصحيحة">
                        <select
                          className="admin-select"
                          value={String(
                            question.correctAnswer ?? '',
                          )}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              correctAnswer: event.target.value,
                            })
                          }
                        >
                          <option value="">اختر</option>
                          <option value="true">صح</option>
                          <option value="false">خطأ</option>
                        </select>
                      </Field>
                    )}

                    <Field label="شرح الإجابة" full>
                      <textarea
                        className="admin-textarea"
                        rows={2}
                        value={question.explanation ?? ''}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            explanation: event.target.value,
                          })
                        }
                        placeholder="اختياري"
                      />
                    </Field>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              className="admin-btn admin-btn-light"
              onClick={() => setAssessmentOpen(false)}
            >
              إغلاق
            </button>

            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={assessmentSaving}
              onClick={() => void saveAssessments()}
            >
              {assessmentSaving ? 'جاري الحفظ...' : 'حفظ جميع التقييمات'}
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="حذف البرنامج؟" onClose={() => setDeleteId(null)}>
          <p>سيتم حذف البرنامج من بيانات الإدارة الحالية.</p>

          <div className="admin-modal-footer">
            <button
              className="admin-btn admin-btn-light"
              onClick={() => setDeleteId(null)}
            >
              إلغاء
            </button>

            <button
              className="admin-btn admin-btn-danger"
              onClick={() => void removeCourse()}
            >
              حذف
            </button>
          </div>
        </Modal>
      )}

      {scheduleOpen && programForSchedule && (
        <Modal
          title={`إدارة المواعيد — ${programForSchedule.title}`}
          onClose={closeSchedules}
          width={1050}
        >
          <div className="admin-actions" style={{ marginBottom: 15 }}>
            <button
              className="admin-btn admin-btn-gold"
              onClick={() => void generate(2026)}
            >
              جدولة 2026
            </button>

            <button
              className="admin-btn admin-btn-gold"
              onClick={() => void generate(2027)}
            >
              جدولة 2027
            </button>

            <button
              className="admin-btn admin-btn-light"
              onClick={() => {
                setEditingSchedule(null);
                setScheduleForm(emptySchedule);
              }}
            >
              + إضافة موعد يدوي
            </button>

            <button
              className="admin-btn admin-btn-danger"
              onClick={() => void deleteAllSchedulesForProgram()}
            >
              إلغاء جدولة البرنامج بالكامل
            </button>
          </div>

          <form
            onSubmit={saveSchedule}
            className="admin-card"
            style={{ padding: 15, marginBottom: 15 }}
          >
            <div className="admin-form-grid">
              <Field label="نوع التنفيذ">
                <select
                  className="admin-select"
                  value={scheduleForm.delivery}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      delivery: event.target.value as
                        | 'in-person'
                        | 'online',
                      city:
                        event.target.value === 'online'
                          ? 'Online'
                          : 'الرياض',
                    })
                  }
                >
                  <option value="in-person">حضوري</option>
                  <option value="online">أونلاين</option>
                </select>
              </Field>

              <Field label="تاريخ البداية">
                <input
                  className="admin-input"
                  type="date"
                  required
                  value={scheduleForm.startDate}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      startDate: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="المدينة">
                <select
                  className="admin-select"
                  disabled={scheduleForm.delivery === 'online'}
                  value={
                    scheduleForm.delivery === 'online'
                      ? 'Online'
                      : scheduleForm.city
                  }
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      city: event.target.value,
                    })
                  }
                >
                  {cities.slice(0, 10).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="السعر">
                <input
                  className="admin-input"
                  value={`${priceFor(
                    scheduleForm.delivery === 'online'
                      ? 'Online'
                      : scheduleForm.city,
                    0,
                  ).toLocaleString('ar-SA')} SAR`}
                  readOnly
                />
              </Field>

              <Field label="الحد الأقصى">
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  value={scheduleForm.max}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      max: event.target.value,
                    })
                  }
                />
              </Field>

              {scheduleForm.delivery === 'in-person' ? (
                <Field label="الموقع">
                  <input
                    className="admin-input"
                    placeholder="يظهر للمشارك بعد التسجيل"
                    value={scheduleForm.location}
                    onChange={(event) =>
                      setScheduleForm({
                        ...scheduleForm,
                        location: event.target.value,
                      })
                    }
                  />
                </Field>
              ) : (
                <Field label="رابط حضور الدورة أونلاين">
                  <input
                    className="admin-input"
                    placeholder="Zoom أو Microsoft Teams أو أي رابط حضور"
                    value={scheduleForm.meeting}
                    onChange={(event) =>
                      setScheduleForm({
                        ...scheduleForm,
                        meeting: event.target.value,
                      })
                    }
                  />
                </Field>
              )}
            </div>

            <div
              className="admin-modal-footer"
              style={{ padding: '14px 0 0', border: 0 }}
            >
              <button className="admin-btn admin-btn-primary">
                {editingSchedule
                  ? 'حفظ تعديل الموعد'
                  : 'إضافة الموعد'}
              </button>

              {editingSchedule && (
                <button
                  type="button"
                  className="admin-btn admin-btn-light"
                  onClick={() => {
                    setEditingSchedule(null);
                    setScheduleForm(emptySchedule);
                  }}
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>

          <div className="admin-table-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>التنفيذ</th>
                  <th>المدينة</th>
                  <th>رابط الحضور</th>
                  <th>السعر</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {[...schedules]
                  .sort(
                    (a, b) =>
                      a.startDate.getTime() - b.startDate.getTime(),
                  )
                  .map((schedule) => (
                    <tr key={schedule.id}>
                      <td>{formatDate(schedule.startDate)}</td>
                      <td>
                        {schedule.onlineMeetingLink ? 'أونلاين' : 'حضوري'}
                      </td>
                      <td>{schedule.city || '—'}</td>
                      <td>
                        {schedule.onlineMeetingLink ? (
                          <a href={schedule.onlineMeetingLink} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-light">فتح الرابط</a>
                        ) : '—'}
                      </td>
                      <td>
                        {Number(schedule.price || 0).toLocaleString(
                          'ar-SA',
                        )}{' '}
                        SAR
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn-light"
                          onClick={() => editSchedule(schedule)}
                        >
                          تعديل
                        </button>{' '}
                        <button
                          className="admin-btn admin-btn-danger"
                          onClick={() =>
                            void deleteSchedule(schedule.id)
                          }
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}

                {schedules.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: 25,
                        color: '#6b7890',
                      }}
                    >
                      لا توجد مواعيد حتى الآن.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={
        full ? 'admin-field admin-field-full' : 'admin-field'
      }
    >
      <label>{label}</label>
      {children}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
  width = 700,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: number;
}) {
  return (
    <div className="admin-modal-backdrop">
      <div
        className="admin-modal"
        style={{ width: `min(${width}px, 95vw)` }}
      >
        <div className="admin-modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}
