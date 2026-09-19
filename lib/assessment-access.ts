export type AssessmentType = 'pre' | 'post' | 'evaluation';

export type AssessmentAccess = {
  type: AssessmentType;
  exists: boolean;
  available: boolean;
  completed: boolean;
  reason: string | null;
  scope: 'course' | 'schedule' | 'group';
};

type AssessmentSettings = {
  post?: { enabled?: boolean };
  evaluation?: { enabled?: boolean };
};

type AssessmentAccessInput = {
  type: AssessmentType;
  assessmentExists: boolean;
  enrollment: {
    preAssessment?: string | null;
    postAssessment?: string | null;
    courseEvaluation?: string | null;
    preAssessmentCompletedAt?: Date | string | null;
    postAssessmentCompletedAt?: Date | string | null;
    courseEvaluationCompletedAt?: Date | string | null;
    scheduleId?: string | null;
    groupId?: string | null;
  };
  course: {
    id?: string;
    type?: 'recorded' | 'training' | string | null;
    trainingKind?: 'public' | 'corporate' | string | null;
    postAssessmentEnabled?: boolean | null;
    courseEvaluationEnabled?: boolean | null;
  };
  schedule?: {
    id?: string;
    courseId?: string;
    postAssessmentEnabled?: boolean | null;
    courseEvaluationEnabled?: boolean | null;
  } | null;
  group?: {
    id?: string;
    courseId?: string;
    assessmentSettings?: unknown;
  } | null;
};

function groupSettings(value: unknown): AssessmentSettings | null {
  return value && typeof value === 'object'
    ? (value as AssessmentSettings)
    : null;
}

function enrollmentState(input: AssessmentAccessInput) {
  const completedAt =
    input.type === 'pre'
      ? input.enrollment.preAssessmentCompletedAt
      : input.type === 'post'
        ? input.enrollment.postAssessmentCompletedAt
        : input.enrollment.courseEvaluationCompletedAt;

  if (input.type === 'pre') {
    return input.enrollment.preAssessment === 'completed' || completedAt
      ? 'completed'
      : input.enrollment.preAssessment;
  }

  if (input.type === 'post') {
    return input.enrollment.postAssessment === 'completed' || completedAt
      ? 'completed'
      : input.enrollment.postAssessment;
  }

  return input.enrollment.courseEvaluation === 'completed' || completedAt
    ? 'completed'
    : input.enrollment.courseEvaluation;
}

export function resolveAssessmentAccess(
  input: AssessmentAccessInput,
): AssessmentAccess {
  let scope: AssessmentAccess['scope'] = 'course';

  if (input.course.type === 'recorded') {
    scope = 'course';
  } else if (input.course.trainingKind === 'corporate') {
    scope = 'group';
  } else {
    scope = 'schedule';
  }

  if (!input.assessmentExists) {
    return {
      type: input.type,
      exists: false,
      available: false,
      completed: false,
      scope,
      reason: 'لم يتم إضافة هذا التقييم للدورة.',
    };
  }

  const relatedSchedule =
    input.schedule &&
    input.enrollment.scheduleId === input.schedule.id &&
    input.schedule.courseId === input.course.id;
  const relatedGroup =
    input.group &&
    input.enrollment.groupId === input.group.id &&
    input.group.courseId === input.course.id;

  if (enrollmentState(input) === 'completed') {
    return {
      type: input.type,
      exists: true,
      available: false,
      completed: true,
      scope,
      reason: 'تم إكمال هذا التقييم.',
    };
  }

  // التقييم القبلي مفتوح دائمًا بمجرد وجوده.
  if (input.type === 'pre') {
    return {
      type: input.type,
      exists: true,
      available: true,
      completed: false,
      scope,
      reason: null,
    };
  }

  const key =
    input.type === 'post'
      ? 'postAssessmentEnabled'
      : 'courseEvaluationEnabled';

  let enabled = false;
  let reason = 'التقييم مغلق حاليًا من الإدارة.';

  if (scope === 'group') {
    const settings = groupSettings(
      input.group?.assessmentSettings,
    );

    const setting =
      input.type === 'post'
        ? settings?.post
        : settings?.evaluation;

    enabled = Boolean(relatedGroup && setting?.enabled === true);

    if (!relatedGroup) {
      reason = 'إعدادات مجموعة التدريب غير متاحة.';
    }
  } else if (scope === 'schedule') {
    enabled = Boolean(relatedSchedule && input.schedule?.[key] === true);

    if (!relatedSchedule) {
      reason = 'إعدادات موعد التدريب غير متاحة.';
    }
  } else {
    enabled = input.course[key] === true;
  }

  return {
    type: input.type,
    exists: true,
    available: enabled,
    completed: false,
    scope,
    reason: enabled ? null : reason,
  };
}

export function initialAssessmentStates(
  input: Omit<AssessmentAccessInput, 'type' | 'assessmentExists'> & {
    assessmentTypes: AssessmentType[];
  },
) {
  const has = (type: AssessmentType) =>
    input.assessmentTypes.includes(type);

  return {
    preAssessment: resolveAssessmentAccess({
      ...input,
      type: 'pre',
      assessmentExists: has('pre'),
    }).available
      ? 'available'
      : 'locked',

    postAssessment: resolveAssessmentAccess({
      ...input,
      type: 'post',
      assessmentExists: has('post'),
    }).available
      ? 'available'
      : 'locked',

    courseEvaluation: resolveAssessmentAccess({
      ...input,
      type: 'evaluation',
      assessmentExists: has('evaluation'),
    }).available
      ? 'available'
      : 'locked',
  } as const;
}