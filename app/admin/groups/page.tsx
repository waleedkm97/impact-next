'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { groupRepository } from '@/lib/data/repositories/group-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import { staffRepository } from '@/lib/data/repositories/staff-repository';

import type { Course } from '@/types/course';
import type { TrainingGroup } from '@/types/group';
import type { Trainee } from '@/types/trainee';
import type { Schedule } from '@/types/schedule';
import type { StaffUser } from '@/types/staff';

type AssessmentKey = 'pre' | 'post' | 'evaluation';

const DEFAULT_ASSESSMENT_SETTINGS: NonNullable<
  TrainingGroup['assessmentSettings']
> = {
  pre: {
    enabled: true,
  },
  post: {
    enabled: false,
  },
  evaluation: {
    enabled: false,
  },
};

function getAssessmentLabel(type: AssessmentKey) {
  if (type === 'pre') return 'Pre Assessment';
  if (type === 'post') return 'Post Assessment';
  return 'Course Evaluation';
}

function formatDate(value?: Date | string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('ar-SA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateLong(value?: Date | string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getTraineeName(trainee: Trainee) {
  return `${trainee.profile?.firstName ?? ''} ${
    trainee.profile?.lastName ?? ''
  }`.trim();
}

function getEnglishName(trainee: Trainee) {
  return `${trainee.profile?.firstNameEnglish ?? ''} ${
    trainee.profile?.lastNameEnglish ?? ''
  }`.trim();
}

function getEnrollment(
  trainee: Trainee,
  group: TrainingGroup,
) {
  const groupWithEnrollments = group as TrainingGroup & {
    enrollments?: Array<{
      id: string;
      traineeId: string;
      courseId?: string;
      courseTitle?: string;
      scheduleId?: string | null;
      groupId?: string | null;
      trainerId?: string | null;
      coordinatorId?: string | null;
      status?: string;
      progress?: number;
      attendance?: string;
      attendanceMode?: string | null;
      preAssessment?: string | null;
      postAssessment?: string | null;
      courseEvaluation?: string | null;
      preAssessmentScore?: number | string | null;
      postAssessmentScore?: number | string | null;
      courseEvaluationScore?: number | string | null;
      preAssessmentAnswers?: unknown;
      postAssessmentAnswers?: unknown;
      courseEvaluationAnswers?: unknown;
      preAssessmentCompletedAt?: string | Date | null;
      postAssessmentCompletedAt?: string | Date | null;
      courseEvaluationCompletedAt?: string | Date | null;
      completedAt?: string | Date | null;
      certificateId?: string | null;
      enrolledAt?: string | Date;
      createdAt?: string | Date;
      updatedAt?: string | Date;
      attendanceDays?: Array<{
        id?: string;
        date?: string | Date;
        status?: string;
      }>;
    }>;
  };

  const groupEnrollment = groupWithEnrollments.enrollments?.find(
    (enrollment) => enrollment.traineeId === trainee.id,
  );

  const traineeEnrollment = groupEnrollment?.id
    ? trainee.enrollments?.find(
        (enrollment) => enrollment.id === groupEnrollment.id,
      )
    : trainee.enrollments?.find(
        (enrollment) =>
          enrollment.groupId === group.id ||
          (
            enrollment.courseId === group.courseId &&
            (!group.scheduleId ||
              enrollment.scheduleId === group.scheduleId)
          ),
      );

  if (groupEnrollment) {
    return {
      ...traineeEnrollment,
      ...groupEnrollment,
      preAssessmentScore:
        groupEnrollment.preAssessmentScore != null
          ? Number(groupEnrollment.preAssessmentScore)
          : traineeEnrollment?.preAssessmentScore != null
            ? Number(traineeEnrollment.preAssessmentScore)
            : undefined,
      postAssessmentScore:
        groupEnrollment.postAssessmentScore != null
          ? Number(groupEnrollment.postAssessmentScore)
          : traineeEnrollment?.postAssessmentScore != null
            ? Number(traineeEnrollment.postAssessmentScore)
            : undefined,
      courseEvaluationScore:
        groupEnrollment.courseEvaluationScore != null
          ? Number(groupEnrollment.courseEvaluationScore)
          : traineeEnrollment?.courseEvaluationScore != null
            ? Number(traineeEnrollment.courseEvaluationScore)
            : undefined,
      preAssessment:
        groupEnrollment.preAssessment ??
        traineeEnrollment?.preAssessment,
      postAssessment:
        groupEnrollment.postAssessment ??
        traineeEnrollment?.postAssessment,
      courseEvaluation:
        groupEnrollment.courseEvaluation ??
        traineeEnrollment?.courseEvaluation,
    };
  }

  return traineeEnrollment;
}

function assessmentStateLabel(
  state: string | undefined,
  score?: number | string | null,
  scale: 5 | 100 = 100,
) {
  if (state === 'completed') {
    const numericScore =
      score !== null &&
      score !== undefined &&
      Number.isFinite(Number(score))
        ? Number(score)
        : null;

    return {
      label:
        numericScore !== null
          ? `${numericScore}/${scale}`
          : 'مكتمل',
      className: 'admin-status admin-status-ok',
    };
  }

  if (state === 'available') {
    return {
      label: 'متاح',
      className: 'admin-status',
    };
  }

  return {
    label: 'مغلق',
    className: 'admin-status',
  };
}

function attendanceLabel(status?: string) {
  if (status === 'present') return 'حاضر';
  if (status === 'absent') return 'غائب';
  return 'لم يسجل';
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [newTraineeOpen, setNewTraineeOpen] = useState(false);
 const [newTraineeForm, setNewTraineeForm] = useState({
  firstName: '',
  lastName: '',
  firstNameEn: '',
  lastNameEn: '',
  gender: 'male' as 'male' | 'female',
  email: '',
  phone: '',
  password: '',
});
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingAssessment, setSavingAssessment] = useState<AssessmentKey | null>(null);
  const [generatingAssessments, setGeneratingAssessments] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCourseData, setReportCourseData] =
    useState<Record<string, unknown> | null>(null);
  const [assignmentTrainerId, setAssignmentTrainerId] = useState('');
  const [assignmentCoordinatorId, setAssignmentCoordinatorId] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [materialChanged, setMaterialChanged] = useState(false);
  const [resultEditor, setResultEditor] = useState<{
    traineeId: string;
    traineeName: string;
    enrollmentId: string;
    pre: string;
    post: string;
  } | null>(null);
  const [savingResults, setSavingResults] = useState(false);
  const [form, setForm] = useState({
    name: '',
    courseId: '',
    companyName: '',
    responsibleName: '',
    responsibleEmail: '',
    responsiblePhone: '',
   corporateDate: '',
corporateDelivery: 'حضوري' as 'حضوري' | 'أونلاين',
corporateLocation: '',
trainingDays: '',
trainingHours: '',
    meetingLink: '',
    expectedTrainees: '',
    materialUrl: '',
    notes: '',
  });
  async function load() {
  const [
    courseList,
    scheduleList,
    staffList,
  ] = await Promise.all([
    courseRepository.findAll(),
    scheduleRepository.findAll({
      sort: 'startDate',
      order: 'asc',
    }),
    staffRepository.findAll(),
  ]);

  const traineeResponse = await fetch(
    '/api/trainees/admin?activeOnly=true',
    { cache: 'no-store' },
  );

  if (!traineeResponse.ok && traineeResponse.status !== 403) {
    throw new Error('تعذر تحميل المتدربين النشطين.');
  }

  const traineeData = traineeResponse.ok
    ? await traineeResponse.json()
    : { trainees: [] };
  const traineeList: Trainee[] = (traineeData.trainees ?? []).map(
    (trainee: any) => ({
      ...trainee,
      profile: {
        firstName: trainee.firstName ?? '',
        lastName: trainee.lastName ?? '',
        firstNameEnglish: trainee.firstNameEnglish ?? '',
        lastNameEnglish: trainee.lastNameEnglish ?? '',
      },
      contact: {
        email: trainee.email ?? '',
        phone: trainee.phone ?? '',
      },
      enrollments: Array.isArray(trainee.enrollments)
        ? trainee.enrollments.map((enrollment: any) => ({
            ...enrollment,
            preAssessmentScore:
              enrollment.preAssessmentScore != null
                ? Number(enrollment.preAssessmentScore)
                : undefined,
            postAssessmentScore:
              enrollment.postAssessmentScore != null
                ? Number(enrollment.postAssessmentScore)
                : undefined,
            courseEvaluationScore:
              enrollment.courseEvaluationScore != null
                ? Number(enrollment.courseEvaluationScore)
                : undefined,
          }))
        : [],
      progress: [],
      certificates: [],
    }),
  );

  let groupList: TrainingGroup[] = [];

  try {
    const localGroups = await groupRepository.findAll();

    groupList = Array.isArray(localGroups)
      ? localGroups.map((group) => ({
          ...group,
          traineeIds: Array.isArray(group.traineeIds)
            ? group.traineeIds
            : [],
        }))
      : [];
  } catch (error) {
    console.error(
      'Failed to load groups from repository:',
      error,
    );
  }

  try {
    const groupsResponse = await fetch('/api/groups', {
      cache: 'no-store',
    });

    if (groupsResponse.ok) {
      const sqlGroups = await groupsResponse.json();

      if (Array.isArray(sqlGroups)) {
        const mappedSqlGroups: TrainingGroup[] = sqlGroups.map(
          (group: any) => ({
            ...group,
            traineeIds: Array.isArray(group.traineeIds)
              ? group.traineeIds
              : [],
            trainingDays:
              group.trainingDays != null
                ? Number(group.trainingDays)
                : undefined,
            trainingHours:
              group.trainingHours != null
                ? Number(group.trainingHours)
                : undefined,
            createdAt: new Date(group.createdAt),
            updatedAt: new Date(group.updatedAt),
          }),
        );

        const byId = new Map(
          groupList.map((group) => [group.id, group]),
        );

        mappedSqlGroups.forEach((group) => {
          byId.set(group.id, {
            ...byId.get(group.id),
            ...group,
          });
        });

        groupList = Array.from(byId.values());
      }
    }
  } catch (error) {
    console.error(
      'Failed to load groups from SQL:',
      error,
    );
  }

  setGroups(groupList);

  setCourses(
    courseList.filter(
      (course) => course.type === 'training',
    ),
  );

  setTrainees(traineeList);
  setSchedules(scheduleList);
  setStaffUsers(
    staffList.filter(
      (staff) => staff.status === 'active',
    ),
  );

  if (
    selectedCompany &&
    !groupList.some(
      (group) =>
        (group.companyName || group.name) ===
        selectedCompany,
    )
  ) {
    setSelectedCompany('');
    setSelectedGroupId('');
  }
}

  useEffect(() => {
    void load();
  }, []);

  /*
   * =========================
   * COMPANIES
   * =========================
   */

  const companies = useMemo(() => {
    const map = new Map<
      string,
      TrainingGroup[]
    >();

    groups.forEach((group) => {
      const company =
        group.companyName?.trim() ||
        group.name?.trim() ||
        'شركة بدون اسم';

      const existing = map.get(company) ?? [];

      existing.push(group);

      map.set(company, existing);
    });

    return Array.from(map.entries()).map(
      ([name, companyGroups]) => ({
        name,
        groups: companyGroups,
      }),
    );
  }, [groups]);

  const companyGroups = useMemo(() => {
    if (!selectedCompany) return [];

    return groups.filter(
      (group) =>
        (group.companyName || group.name) ===
        selectedCompany,
    );
  }, [groups, selectedCompany]);

  const selectedGroup =
    groups.find(
      (group) => group.id === selectedGroupId,
    ) ?? null;

  useEffect(() => {
    setAssignmentTrainerId(selectedGroup?.trainerId ?? '');
    setAssignmentCoordinatorId(selectedGroup?.coordinatorId ?? '');
  }, [selectedGroupId, selectedGroup?.trainerId, selectedGroup?.coordinatorId]);

  const selectedSchedule = selectedGroup
    ? schedules.find(
        (schedule) =>
          schedule.id === selectedGroup.scheduleId,
      )
    : undefined;

  const selectedStartDate = selectedGroup?.corporateDate
    ? new Date(`${selectedGroup.corporateDate}T00:00:00`)
    : selectedSchedule?.startDate;

  const selectedEndDate = selectedGroup?.corporateDate
    ? (() => {
        const date = new Date(`${selectedGroup.corporateDate}T00:00:00`);
        const trainingDays = Math.max(
          1,
          selectedGroup.trainingDays ?? 3,
        );
        date.setDate(
          date.getDate() + trainingDays - 1,
        );
        return date;
      })()
    : selectedSchedule?.endDate;

  const selectedLocation =
    selectedGroup?.corporateLocation ||
    selectedSchedule?.city ||
    selectedSchedule?.location ||
    '—';

  const selectedDelivery =
    selectedGroup?.corporateDelivery ||
    (selectedSchedule?.onlineMeetingLink ? 'أونلاين' : 'حضوري');

  const members = selectedGroup
    ? trainees.filter((trainee) =>
        selectedGroup.traineeIds.includes(
          trainee.id,
        ),
      )
    : [];

  const availableTrainees = selectedGroup
    ? trainees.filter(
        (trainee) =>
          !selectedGroup.traineeIds.includes(
            trainee.id,
          ),
      )
    : [];

  /*
   * =========================
   * FORM
   * =========================
   */

function resetForm() {
  setForm({
    name: '',
    courseId: '',
    companyName: selectedCompany || '',
    responsibleName: '',
    responsibleEmail: '',
    responsiblePhone: '',
    corporateDate: '',
    corporateDelivery: 'حضوري',
    corporateLocation: '',
    trainingDays: '',
    trainingHours: '',
    meetingLink: '',
    expectedTrainees: '',
    materialUrl: '',
    notes: '',
  });
}

function startCreate() {
  setEditingId(null);

  setForm({
    name: '',
    courseId: '',
    companyName: selectedCompany || '',
    responsibleName: '',
    responsibleEmail: '',
    responsiblePhone: '',
    corporateDate: '',
    corporateDelivery: 'حضوري',
    corporateLocation: '',
    trainingDays: '',
    trainingHours: '',
    meetingLink: '',
    expectedTrainees: '',
    materialUrl: '',
    notes: '',
  });

  setOpen(true);
}

  function startEdit() {
    if (!selectedGroup) return;

    setEditingId(selectedGroup.id);
    setMaterialChanged(false);

    setForm({
      name: selectedGroup.name || '',
      courseId: selectedGroup.courseId || '',
      companyName:
        selectedGroup.companyName || '',
      responsibleName:
        selectedGroup.responsibleName || '',
      responsibleEmail:
        selectedGroup.responsibleEmail || '',
      responsiblePhone:
        selectedGroup.responsiblePhone || '',
      corporateDate:
        selectedGroup.corporateDate || '',
      corporateDelivery:
        selectedGroup.corporateDelivery || 'حضوري',
      corporateLocation:
  selectedGroup.corporateLocation || '',
trainingDays:
  selectedGroup.trainingDays != null
    ? String(selectedGroup.trainingDays)
    : '',
trainingHours:
  selectedGroup.trainingHours != null
    ? String(selectedGroup.trainingHours)
    : '',
      meetingLink: selectedGroup.meetingLink || '',
      expectedTrainees: selectedGroup.expectedTrainees
        ? String(selectedGroup.expectedTrainees)
        : '',
      materialUrl:
        selectedGroup.materialUrl || '',
      notes: selectedGroup.notes || '',
    });

    setOpen(true);
  }

  function readGroupMaterialFile(file: File) {
    if (file.type !== 'application/pdf') {
      alert('يرجى اختيار ملف PDF فقط.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        materialUrl: String(reader.result || ''),
      }));
      setMaterialChanged(true);
    };
    reader.readAsDataURL(file);
  }

  async function createGroup(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    const course = courses.find(
      (item) => item.id === form.courseId,
    );

    if (!course) {
      alert('اختر الدورة.');
      return;
    }

    const companyName =
      form.companyName.trim();

  const group = {
  id: `group-${crypto.randomUUID()}`,
  name:
    form.name.trim() ||
    companyName ||
    `مجموعة ${course.title}`,

  type: 'corporate',

  status: 'active',

  courseId: course.id,

  courseTitle: course.title,

  scheduleId: undefined,

  corporateDate:
    form.corporateDate || undefined,

  corporateDelivery:
    form.corporateDelivery,

 corporateLocation:
    form.corporateLocation.trim() || undefined,

trainingDays:
    form.trainingDays
      ? Number(form.trainingDays)
      : undefined,

trainingHours:
    form.trainingHours
      ? Number(form.trainingHours)
      : undefined,

  meetingLink:
    form.meetingLink.trim() || undefined,

  expectedTrainees: form.expectedTrainees
    ? Number(form.expectedTrainees)
    : undefined,

  materialUrl:
    form.materialUrl || undefined,

  companyName:
    companyName || undefined,

  responsibleName:
    form.responsibleName.trim() ||
    undefined,

  responsibleEmail:
    form.responsibleEmail.trim() ||
    undefined,

  responsiblePhone:
    form.responsiblePhone.trim() ||
    undefined,

  traineeIds: [],
  trainerId: undefined,
  coordinatorId: undefined,
  maxParticipants: undefined,

  notes:
    form.notes.trim() || undefined,

  assessmentSettings: {
    pre: {
      enabled: true,
    },
    post: {
      enabled: false,
    },
    evaluation: {
      enabled: false,
    },
  },
};

const sqlResponse = await fetch('/api/groups', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: group.id,
    name: group.name,
    type: group.type,
    status: group.status,
    courseId: group.courseId,
    courseTitle: group.courseTitle,
    scheduleId: group.scheduleId,
    corporateDate: group.corporateDate,
    corporateDelivery:
      group.corporateDelivery,
    corporateLocation:
      group.corporateLocation,
    trainingDays:
      group.trainingDays,
    trainingHours:
      group.trainingHours,
    meetingLink: group.meetingLink,
    expectedTrainees: group.expectedTrainees,
    materialUrl: group.materialUrl,
    companyName: group.companyName,
    responsibleName:
      group.responsibleName,
    responsibleEmail:
      group.responsibleEmail,
    responsiblePhone:
      group.responsiblePhone,
    trainerId: group.trainerId,
    coordinatorId:
      group.coordinatorId,
    maxParticipants:
      group.maxParticipants,
    notes: group.notes,
    assessmentSettings:
      group.assessmentSettings,
  }),
});

if (!sqlResponse.ok) {
  const result = await sqlResponse
    .json()
    .catch(() => null);

  throw new Error(
    result?.error ||
      'تم إنشاء المجموعة محليًا ولكن تعذر حفظها في قاعدة البيانات.',
  );
}

    setSelectedCompany(
      companyName ||
        group.name ||
        'شركة بدون اسم',
    );

    setSelectedGroupId(group.id);

    setOpen(false);
    resetForm();

    await load();
  }

  async function updateGroup(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!editingId) return;

    const course = courses.find(
      (item) => item.id === form.courseId,
    );

    if (!course) {
      alert('اختر الدورة.');
      return;
    }

    const sqlResponse = await fetch(
      `/api/groups/${encodeURIComponent(editingId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name:
            form.name.trim() ||
            form.companyName.trim() ||
            `مجموعة ${course.title}`,

          courseId: course.id,

          courseTitle: course.title,

          corporateDate:
            form.corporateDate || null,

          corporateDelivery:
            form.corporateDelivery,

          corporateLocation:
            form.corporateLocation.trim() ||
            null,

          trainingDays:
            form.trainingDays
              ? Number(form.trainingDays)
              : null,

          trainingHours:
            form.trainingHours
              ? Number(form.trainingHours)
              : null,

          meetingLink:
            form.meetingLink.trim() || null,

          expectedTrainees: form.expectedTrainees
            ? Number(form.expectedTrainees)
            : null,

          ...(materialChanged
            ? { materialUrl: form.materialUrl || null }
            : {}),

          companyName:
            form.companyName.trim() || null,

          responsibleName:
            form.responsibleName.trim() || null,

          responsibleEmail:
            form.responsibleEmail.trim() ||
            null,

          responsiblePhone:
            form.responsiblePhone.trim() ||
            null,

          notes:
            form.notes.trim() || null,
        }),
      },
    );

    if (!sqlResponse.ok) {
      const result = await sqlResponse
        .json()
        .catch(() => null);

      throw new Error(
        result?.error ||
          'تم تعديل المجموعة محليًا ولكن تعذر حفظ التعديل في قاعدة البيانات.',
      );
    }

    setOpen(false);
    setEditingId(null);

    const newCompany =
      form.companyName.trim();

    setSelectedCompany(
      newCompany || selectedCompany,
    );

    resetForm();

    await load();
  }

  async function saveStaffAssignment() {
    if (!selectedGroup) return;

    const course = courses.find((item) => item.id === selectedGroup.courseId);
    if (!course) {
      alert('تعذر العثور على الدورة المرتبطة بالمجموعة.');
      return;
    }

    const trainer = staffUsers.find((staff) => staff.id === assignmentTrainerId);
    const coordinator = staffUsers.find((staff) => staff.id === assignmentCoordinatorId);

    if (assignmentTrainerId && trainer?.role !== 'trainer') {
      alert('المدرب المختار غير صالح.');
      return;
    }

    if (assignmentCoordinatorId && coordinator?.role !== 'coordinator') {
      alert('المنسق المختار غير صالح.');
      return;
    }

    setSavingAssignment(true);

    try {
      const sqlResponse = await fetch(
        `/api/groups/${encodeURIComponent(selectedGroup.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trainerId: assignmentTrainerId || null,
            coordinatorId: assignmentCoordinatorId || null,
          }),
        },
      );

      if (!sqlResponse.ok) {
        const result = await sqlResponse
          .json()
          .catch(() => null);

        throw new Error(
          result?.error ||
            'تم حفظ التعيين محليًا ولكن تعذر حفظه في قاعدة البيانات.',
        );
      }

      await load();
      alert('تم حفظ المدرب والمنسق للمجموعة.');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر حفظ تعيين المدرب والمنسق.',
      );
    } finally {
      setSavingAssignment(false);
    }
  }

  async function deleteSelected() {
    if (!selectedGroup) return;

    const company =
      selectedGroup.companyName ||
      selectedGroup.name;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف مجموعة "${company}"؟`,
    );

    if (!confirmed) return;

    await groupRepository.delete(
      selectedGroup.id,
    );
    const sqlResponse = await fetch(
      `/api/groups/${encodeURIComponent(selectedGroup.id)}`,
      {
        method: 'DELETE',
      },
    );

    if (!sqlResponse.ok) {
      const result = await sqlResponse
        .json()
        .catch(() => null);

      throw new Error(
        result?.error ||
          'تم حذف المجموعة محليًا ولكن تعذر حذفها من قاعدة البيانات.',
      );
    }
    setSelectedGroupId('');

    await load();
  }

  /*
   * =========================
   * MEMBERS
   * =========================
   */

  async function addMember() {
    if (!selectedGroupId || !memberId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/groups/${selectedGroupId}/trainees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            traineeId: memberId,
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.error || 'تعذر تسجيل المتدرب في قاعدة البيانات.',
        );
      }

      setMemberId('');

      await load();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر إضافة المتدرب.',
      );
    }
  }

  async function createAndAddMember() {
    if (!selectedGroupId) return;

    const firstName = newTraineeForm.firstName.trim();
    const lastName = newTraineeForm.lastName.trim();
    const email = newTraineeForm.email.trim();
    const phone = newTraineeForm.phone.trim();
    const password = newTraineeForm.password;
if (!email && !phone) {
  throw new Error(
    'يرجى إدخال البريد الإلكتروني أو رقم الجوال على الأقل.',
  );
}
    if (!firstName || !lastName) {
      alert('الاسم الأول واسم العائلة مطلوبان.');
      return;
    }

    if (!email && !phone) {
      alert('أدخل البريد الإلكتروني أو رقم الجوال على الأقل.');
      return;
    }

    if (!password) {
      alert('كلمة المرور مطلوبة.');
      return;
    }

    try {
      const response = await fetch(
        `/api/groups/${encodeURIComponent(selectedGroupId)}/trainees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
         body: JSON.stringify({
  createTrainee: true,
  firstName,
  lastName,
  firstNameEn: newTraineeForm.firstNameEn.trim(),
  lastNameEn: newTraineeForm.lastNameEn.trim(),
  gender: newTraineeForm.gender,
  email,
  phone,
  password,
}),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || 'تعذر إنشاء المتدرب وربطه بالمجموعة.',
        );
      }

      setNewTraineeForm({
  firstName: '',
  lastName: '',
  firstNameEn: '',
  lastNameEn: '',
  gender: 'male',
  email: '',
  phone: '',
  password: '',
});
      setNewTraineeOpen(false);
      await load();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر إنشاء المتدرب وربطه بالمجموعة.',
      );
    }
  }

  async function removeMember(
    traineeId: string,
  ) {
    if (!selectedGroupId) return;

const sqlResponse = await fetch(
  `/api/groups/${encodeURIComponent(selectedGroupId)}/trainees`,
  {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      traineeId,
    }),
  },
);

if (!sqlResponse.ok) {
  const result = await sqlResponse
    .json()
    .catch(() => null);

  throw new Error(
    result?.error ||
      'تم حذف المتدرب محليًا ولكن تعذر حذفه من قاعدة البيانات.',
  );
}

await load();
  }

  /*
   * =========================
   * ASSESSMENTS
   * =========================
   */

  function getSettings() {
    return (
      selectedGroup?.assessmentSettings ??
      DEFAULT_ASSESSMENT_SETTINGS
    );
  }

  async function toggleAssessment(
    type: AssessmentKey,
  ) {
    if (!selectedGroup) return;

    setSavingAssessment(type);

    try {
      const current = getSettings();

      const next = {
        pre: {
          ...current.pre,
        },

        post: {
          ...current.post,
        },

        evaluation: {
          ...current.evaluation,
        },
      };

      if (type === 'pre') {
        next.pre = {
          ...next.pre,
          enabled: true,
        };
      } else {
        next[type] = {
          ...next[type],
          enabled:
            !next[type].enabled,
        };
      }

      if (type === 'pre') return;

      const response = await fetch(
        `/api/groups/${encodeURIComponent(selectedGroup.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, enabled: next[type].enabled }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'تعذر تحديث إتاحة تقييم المجموعة.');
      }

      await load();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر تحديث إعدادات التقييم.',
      );
    } finally {
      setSavingAssessment(null);
    }
  }

  /*
   * =========================
   * ATTENDANCE
   * =========================
   */

  async function markAttendance(
    trainee: Trainee,
    dayIndex: number,
    status: 'present' | 'absent',
  ) {
    if (!selectedGroup) return;

    const enrollment =
      getEnrollment(
        trainee,
        selectedGroup,
      );

    if (!enrollment) {
      alert(
        'لا يوجد تسجيل لهذه الدورة لدى المتدرب.',
      );
      return;
    }

    const response = await fetch('/api/course-learning', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollmentId: enrollment.id,
        dayIndex,
        status,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || 'تعذر حفظ الحضور.');
    }

    if (result?.enrollment) {
      setTrainees((current) => current.map((item) =>
        item.id === trainee.id
          ? {
              ...item,
              enrollments: item.enrollments.map((itemEnrollment) =>
                itemEnrollment.id === enrollment.id
                  ? { ...itemEnrollment, ...result.enrollment }
                  : itemEnrollment,
              ),
            }
          : item,
      ));
    }
  }

  async function saveAdminAssessmentResults() {
    if (!selectedGroup || !resultEditor) return;

    const preValue =
      resultEditor.pre.trim() === ''
        ? null
        : Number(resultEditor.pre);
    const postValue =
      resultEditor.post.trim() === ''
        ? null
        : Number(resultEditor.post);

    if (
      (preValue !== null &&
        (!Number.isFinite(preValue) ||
          preValue < 0 ||
          preValue > 100)) ||
      (postValue !== null &&
        (!Number.isFinite(postValue) ||
          postValue < 0 ||
          postValue > 100))
    ) {
      alert('النتيجة يجب أن تكون رقمًا من 0 إلى 100.');
      return;
    }

    setSavingResults(true);

    try {
      const response = await fetch(
        `/api/groups/${encodeURIComponent(selectedGroup.id)}/results`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enrollmentId: resultEditor.enrollmentId,
            preAssessmentScore: preValue,
            postAssessmentScore: postValue,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'تعذر حفظ نتائج التقييم.',
        );
      }

      setResultEditor(null);
      await load();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر حفظ نتائج التقييم.',
      );
    } finally {
      setSavingResults(false);
    }
  }

  async function generateAssessmentsForTrainee(
    trainee: Trainee,
    options?: { evaluation?: boolean },
  ) {
    if (!selectedGroup) return;

    const enrollment = getEnrollment(trainee, selectedGroup);

    if (!enrollment?.id) {
      alert('لا يوجد تسجيل مرتبط بهذا المتدرب داخل المجموعة.');
      return;
    }

    setGeneratingAssessments(true);

    try {
      const pre = Math.floor(Math.random() * 31) + 45;
      const post = Math.min(100, pre + Math.floor(Math.random() * 21) + 10);

      const response = await fetch(
        `/api/groups/${encodeURIComponent(selectedGroup.id)}/results`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            options?.evaluation
              ? {
                  enrollmentId: enrollment.id,
                  courseEvaluationScore: 5,
                }
              : {
                  enrollmentId: enrollment.id,
                  preAssessmentScore: pre,
                  postAssessmentScore: post,
                },
          ),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            (options?.evaluation
              ? 'تعذر إنشاء تقييم الدورة.'
              : 'تعذر إنشاء نتائج التقييم القبلي والبعدي.'),
        );
      }

      await load();

      alert(
        options?.evaluation
          ? 'تم إنشاء تقييم الدورة للمتدرب بتقدير 5/5.'
          : 'تم إنشاء التقييم القبلي والبعدي للمتدرب.',
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر إنشاء التقييم.',
      );
    } finally {
      setGeneratingAssessments(false);
    }
  }

  function mergeAssessmentEnrollment(updatedEnrollment: any) {
    if (!selectedGroupId || !updatedEnrollment?.id) return;

    const normalizedEnrollment = {
      ...updatedEnrollment,
      preAssessmentScore:
        updatedEnrollment.preAssessmentScore != null
          ? Number(updatedEnrollment.preAssessmentScore)
          : undefined,
      postAssessmentScore:
        updatedEnrollment.postAssessmentScore != null
          ? Number(updatedEnrollment.postAssessmentScore)
          : undefined,
      courseEvaluationScore:
        updatedEnrollment.courseEvaluationScore != null
          ? Number(updatedEnrollment.courseEvaluationScore)
          : undefined,
    };

    // Keep the group data and trainee data synchronized. The table can read
    // the enrollment from either source, so both must retain the same result.
    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== selectedGroupId) {
          return group;
        }

        const groupWithEnrollments = group as TrainingGroup & {
          enrollments?: Array<Record<string, any>>;
        };

        const existingEnrollments =
          Array.isArray(groupWithEnrollments.enrollments)
            ? groupWithEnrollments.enrollments
            : [];

        const enrollmentIndex = existingEnrollments.findIndex(
          (enrollment) => enrollment.id === normalizedEnrollment.id,
        );

        const previousEnrollment =
          enrollmentIndex >= 0
            ? existingEnrollments[enrollmentIndex]
            : {};

        const nextEnrollment = {
          ...previousEnrollment,
          ...normalizedEnrollment,
          preAssessmentScore:
            normalizedEnrollment.preAssessmentScore != null
              ? normalizedEnrollment.preAssessmentScore
              : previousEnrollment.preAssessmentScore,
          postAssessmentScore:
            normalizedEnrollment.postAssessmentScore != null
              ? normalizedEnrollment.postAssessmentScore
              : previousEnrollment.postAssessmentScore,
          courseEvaluationScore:
            normalizedEnrollment.courseEvaluationScore != null
              ? normalizedEnrollment.courseEvaluationScore
              : previousEnrollment.courseEvaluationScore,
          preAssessment:
            normalizedEnrollment.preAssessment !== undefined &&
            normalizedEnrollment.preAssessment !== null
              ? normalizedEnrollment.preAssessment
              : previousEnrollment.preAssessment,
          postAssessment:
            normalizedEnrollment.postAssessment !== undefined &&
            normalizedEnrollment.postAssessment !== null
              ? normalizedEnrollment.postAssessment
              : previousEnrollment.postAssessment,
          courseEvaluation:
            normalizedEnrollment.courseEvaluation !== undefined &&
            normalizedEnrollment.courseEvaluation !== null
              ? normalizedEnrollment.courseEvaluation
              : previousEnrollment.courseEvaluation,
        };

        const nextEnrollments = [...existingEnrollments];

        if (enrollmentIndex >= 0) {
          nextEnrollments[enrollmentIndex] = nextEnrollment;
        } else {
          nextEnrollments.push(nextEnrollment);
        }

        return {
          ...group,
          enrollments: nextEnrollments,
        } as TrainingGroup;
      }),
    );

    setTrainees((currentTrainees) =>
      currentTrainees.map((trainee) => {
        if (trainee.id !== normalizedEnrollment.traineeId) {
          return trainee;
        }

        const existingEnrollments = Array.isArray(trainee.enrollments)
          ? trainee.enrollments
          : [];

        const enrollmentIndex = existingEnrollments.findIndex(
          (enrollment) => enrollment.id === normalizedEnrollment.id,
        );

        if (enrollmentIndex < 0) {
          return {
            ...trainee,
            enrollments: [
              ...existingEnrollments,
              normalizedEnrollment,
            ],
          };
        }

        const previousEnrollment = existingEnrollments[enrollmentIndex];

        const nextEnrollment = {
          ...previousEnrollment,
          ...normalizedEnrollment,
          preAssessmentScore:
            normalizedEnrollment.preAssessmentScore != null
              ? normalizedEnrollment.preAssessmentScore
              : previousEnrollment.preAssessmentScore,
          postAssessmentScore:
            normalizedEnrollment.postAssessmentScore != null
              ? normalizedEnrollment.postAssessmentScore
              : previousEnrollment.postAssessmentScore,
          courseEvaluationScore:
            normalizedEnrollment.courseEvaluationScore != null
              ? normalizedEnrollment.courseEvaluationScore
              : previousEnrollment.courseEvaluationScore,
          preAssessment:
            normalizedEnrollment.preAssessment !== undefined &&
            normalizedEnrollment.preAssessment !== null
              ? normalizedEnrollment.preAssessment
              : previousEnrollment.preAssessment,
          postAssessment:
            normalizedEnrollment.postAssessment !== undefined &&
            normalizedEnrollment.postAssessment !== null
              ? normalizedEnrollment.postAssessment
              : previousEnrollment.postAssessment,
          courseEvaluation:
            normalizedEnrollment.courseEvaluation !== undefined &&
            normalizedEnrollment.courseEvaluation !== null
              ? normalizedEnrollment.courseEvaluation
              : previousEnrollment.courseEvaluation,
        };

        const nextEnrollments = [...existingEnrollments];
        nextEnrollments[enrollmentIndex] = nextEnrollment;

        return {
          ...trainee,
          enrollments: nextEnrollments,
        };
      }),
    );
  }

  async function generatePrePostAssessments() {
    if (!selectedGroup || members.length === 0) {
      alert('لا يوجد متدربون مرتبطون بهذه المجموعة.');
      return;
    }

    setGeneratingAssessments(true);

    try {
      for (const trainee of members) {
        const enrollment = getEnrollment(trainee, selectedGroup);

        if (!enrollment?.id) continue;

        // Generate Pre first, then guarantee that Post is higher.
        const pre = Math.floor(Math.random() * 31) + 45;
        const post = pre + Math.floor(Math.random() * 21) + 10;

        const response = await fetch(
          `/api/groups/${encodeURIComponent(selectedGroup.id)}/results`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              enrollmentId: enrollment.id,
              preAssessmentScore: pre,
              postAssessmentScore: Math.min(100, post),
            }),
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              'تعذر إنشاء التقييم القبلي والبعدي لجميع المتدربين.',
          );
        }

        if (data?.enrollment) {
          mergeAssessmentEnrollment(data.enrollment);
        }
      }

      alert('تم إنشاء التقييم القبلي والبعدي لجميع المتدربين، والبعدي أعلى من القبلي.');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر إنشاء التقييم القبلي والبعدي لجميع المتدربين.',
      );
    } finally {
      setGeneratingAssessments(false);
    }
  }

  async function generateCourseEvaluations() {
    if (!selectedGroup || members.length === 0) {
      alert('لا يوجد متدربون مرتبطون بهذه المجموعة.');
      return;
    }

    setGeneratingAssessments(true);

    try {
      for (const trainee of members) {
        const enrollment = getEnrollment(trainee, selectedGroup);

        if (!enrollment?.id) continue;

        const response = await fetch(
          `/api/groups/${encodeURIComponent(selectedGroup.id)}/results`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              enrollmentId: enrollment.id,
              courseEvaluationScore: 5,
            }),
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error || 'تعذر إنشاء تقييم الدورة.',
          );
        }

        if (data?.enrollment) {
          mergeAssessmentEnrollment(data.enrollment);
        }
      }

      alert('تم إنشاء تقييم الدورة لجميع المشاركين بتقدير 5/5.');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر إنشاء تقييم الدورة.',
      );
    } finally {
      setGeneratingAssessments(false);
    }
  }

  /*
   * =========================
   * REPORT
   * =========================
   */

  async function openReport() {
    if (!selectedGroup) return;

    // Do NOT refresh/reload the whole page state here.
    // The assessment results have already been saved and merged into the
    // current group/trainee state. Calling load() here was replacing that
    // state with the older repository snapshot, which made Pre/Post/Evaluation
    // appear to disappear immediately after opening the report.

    try {
      const response = await fetch(
        `/api/courses?id=${encodeURIComponent(selectedGroup.courseId)}`,
        { cache: 'no-store' },
      );

      if (!response.ok) {
        setReportCourseData(null);
      } else {
        const data = await response.json();
        setReportCourseData(
          data?.course && typeof data.course === 'object'
            ? data.course
            : null,
        );
      }
    } catch (error) {
      console.error('Failed to load report course:', error);
      setReportCourseData(null);
    }

    setReportOpen(true);
  }

  async function printGroupCertificates() {
    if (!selectedGroup) return;

    await traineeRepository.refresh();

    window.open(
      `/certificate?groupId=${encodeURIComponent(selectedGroup.id)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }


  /*
   * =========================
   * UI DATA
   * =========================
   */

  const assessmentSettings =
    selectedGroup?.assessmentSettings ??
    DEFAULT_ASSESSMENT_SETTINGS;


  const reportTrainingDays = Math.max(
    1,
    selectedGroup?.trainingDays ?? 3,
  );

  const reportTrainer = selectedGroup
    ? staffUsers.find((staff) => staff.id === selectedGroup.trainerId)
    : undefined;

  function reportText(...keys: string[]) {
    for (const key of keys) {
      const value = reportCourseData?.[key];

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

 function reportList(...keys: string[]) {
  for (const key of keys) {
    const value = reportCourseData?.[key];

    if (Array.isArray(value)) {
      const items = value
        .map((item) => String(item).trim())
        .filter(Boolean);

      if (items.length) return items;
    }

    if (typeof value === 'string' && value.trim()) {
      const items = value
        .split(/\r?\n|•|·/)
        .map((item) =>
          item
            .trim()
            .replace(/^[-–—*]\s*/, ''),
        )
        .filter(Boolean);

      if (items.length) return items;
    }
  }

  return [];
}
function reportOutlineItems() {
  const raw = reportText(
    'outline',
    'topics',
    'curriculum',
    'content',
  );

  if (!raw) return [];

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const mainMatch = line.match(
        /^(\d+)\s*[\.\-\)]\s*(.+)$/,
      );

      if (mainMatch) {
        return {
          type: 'main' as const,
          text: `${mainMatch[1]}. ${mainMatch[2].trim()}`,
        };
      }

      return {
        type: 'sub' as const,
        text: line.replace(/^[-–—*•]\s*/, '').trim(),
      };
    });
}

  function reportScore(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : null;
    }

    return null;
  }

  const reportRows = selectedGroup
    ? members.map((trainee) => {
        const traineeEnrollment = getEnrollment(trainee, selectedGroup);
        const groupEnrollment = (selectedGroup as TrainingGroup & { enrollments?: any[] })
          .enrollments?.find(
            (item) => item.traineeId === trainee.id,
          );
        const enrollment = traineeEnrollment || groupEnrollment;
        const pre = reportScore(enrollment?.preAssessmentScore);
        const post = reportScore(enrollment?.postAssessmentScore);
        const rawEvaluation = reportScore(
          enrollment?.courseEvaluationScore,
        );
        const evaluation =
          rawEvaluation !== null
            ? rawEvaluation <= 5
              ? rawEvaluation
              : rawEvaluation / 20
            : null;
        const attendanceDays = enrollment?.attendanceDays ?? [];
        const presentDays = attendanceDays.filter(
          (day: { status?: string } | null | undefined) =>
  day?.status === 'present',
        ).length;

        return {
          trainee,
          enrollment,
          pre,
          post,
          evaluation,
          attendanceDays,
          presentDays,
        };
      })
    : [];

  const average = (values: Array<number | null>) => {
    const valid = values.filter(
      (value): value is number => value !== null,
    );

    if (!valid.length) return null;

    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  };

  const reportPreAverage = average(
    reportRows.map((row) => row.pre),
  );
  const reportPostAverage = average(
    reportRows.map((row) => row.post),
  );
  const reportEvaluationAverage = average(
    reportRows.map((row) => row.evaluation),
  );
  const reportImprovement =
    reportPreAverage !== null && reportPostAverage !== null
      ? reportPostAverage - reportPreAverage
      : null;

  return (
    <main
      className="admin-page"
      dir="rtl"
    >
      {/* =========================
          HEADER
         ========================= */}

      <header className="admin-page-header">
        <div>
          <div className="eyebrow">
            Admin
          </div>

          <h1>
            المجموعات والشركات
          </h1>

          <p>
            إدارة الشركات والدورات والمتدربين
            والحضور والتقييمات والتقارير من
            مكان واحد.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={startCreate}
        >
          + إضافة مجموعة شركة
        </button>
      </header>

      {/* =========================
          COMPANY LIST
         ========================= */}

      {!selectedCompany && (
        <section
          className="admin-card"
          style={{
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                الشركات
              </h2>

              <p
                style={{
                  margin:
                    '6px 0 0',
                  color: '#6b7280',
                }}
              >
                اختر الشركة لعرض الدورات
                التابعة لها.
              </p>
            </div>

            <span className="admin-tag">
              {companies.length} شركة
            </span>
          </div>

          {companies.length === 0 ? (
            <div className="admin-empty">
              لا توجد شركات حتى الآن.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 14,
              }}
            >
              {companies.map(
                (company) => (
                  <button
                    key={company.name}
                    type="button"
                    onClick={() => {
                      setSelectedCompany(
                        company.name,
                      );

                      setSelectedGroupId(
                        company.groups[0]?.id ??
                          '',
                      );
                    }}
                    style={{
                      textAlign: 'right',
                      padding: 20,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 14,
                      background:
                        '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {company.name}
                    </div>

                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: 14,
                      }}
                    >
                      {company.groups.length}{' '}
                      دورة
                    </div>

                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      {company.groups.reduce(
                        (
                          total,
                          group,
                        ) =>
                          total +
                          group
                            .traineeIds
                            .length,
                        0,
                      )}{' '}
                      متدرب
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================
          COMPANY VIEW
         ========================= */}

      {selectedCompany && (
        <>
          <div
            style={{
              marginBottom: 18,
            }}
          >
            <button
              type="button"
              className="admin-btn admin-btn-light"
              onClick={() => {
                setSelectedCompany('');
                setSelectedGroupId('');
              }}
            >
              ← العودة للشركات
            </button>
          </div>

          {/* COMPANY HEADER */}

          <section
            className="admin-card"
            style={{
              padding: 22,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div>
                <div className="eyebrow">
                  COMPANY
                </div>

                <h2
                  style={{
                    margin:
                      '4px 0',
                    fontSize: 28,
                  }}
                >
                  {selectedCompany}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: '#6b7280',
                  }}
                >
                  {companyGroups.length}{' '}
                  دورة مرتبطة بالشركة
                </p>
              </div>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={startCreate}
              >
                + إضافة دورة للشركة
              </button>
            </div>
          </section>

          {/* =========================
              COURSES
             ========================= */}

          <section
            className="admin-card"
            style={{
              padding: 22,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                دورات الشركة
              </h2>

              <p
                style={{
                  margin:
                    '6px 0 0',
                  color: '#6b7280',
                }}
              >
                اختر الدورة لعرض المتدربين
                والحضور والتقييمات.
              </p>
            </div>

            {companyGroups.length === 0 ? (
              <div className="admin-empty">
                لا توجد دورات لهذه الشركة.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                {companyGroups.map(
                  (group) => {
                    const schedule =
                      schedules.find(
                        (item) =>
                          item.id ===
                          group.scheduleId,
                      );
                    const groupStartDate = group.corporateDate
                      ? new Date(`${group.corporateDate}T00:00:00`)
                      : schedule?.startDate;
                    const groupEndDate = group.corporateDate
                      ? (() => {
                          const date = new Date(`${group.corporateDate}T00:00:00`);
                          const trainingDays = Math.max(
                            1,
                            group.trainingDays ?? 3,
                          );
                          date.setDate(
                            date.getDate() + trainingDays - 1,
                          );
                          return date;
                        })()
                      : schedule?.endDate;
                    const groupLocation =
                      group.corporateLocation ||
                      schedule?.city ||
                      schedule?.location ||
                      '—';

                    const isSelected =
                      group.id ===
                      selectedGroupId;

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() =>
                          setSelectedGroupId(
                            group.id,
                          )
                        }
                        style={{
                          textAlign:
                            'right',
                          padding: 18,
                          border: isSelected
                            ? '2px solid var(--admin-gold)'
                            : '1px solid #e5e7eb',
                          borderRadius: 14,
                          background:
                            isSelected
                              ? '#fffdf5'
                              : '#ffffff',
                          cursor:
                            'pointer',
                        }}
                      >
                        <strong
                          style={{
                            display:
                              'block',
                            fontSize: 17,
                            marginBottom: 10,
                          }}
                        >
                          {group.courseTitle}
                        </strong>

                        <div
                          style={{
                            display:
                              'grid',
                            gap: 6,
                            color:
                              '#6b7280',
                            fontSize: 13,
                          }}
                        >
                          <span>
                            📅{' '}
                            {formatDate(groupStartDate)}
                            {groupEndDate
                              ? ` — ${formatDate(groupEndDate)}`
                              : ''}
                          </span>

                          <span>
                            📍{' '}
                            {groupLocation}
                          </span>

                          <span>
                            ⏱️ {group.trainingDays ?? 3} أيام
                            {group.trainingHours != null
                              ? ` — ${group.trainingHours} ساعة`
                              : ''}
                          </span>

                          <span>
                            👥{' '}
                            {group.traineeIds
                              .length}{' '}
                            متدرب
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>

          {/* =========================
              SELECTED COURSE
             ========================= */}

          {selectedGroup && (
            <section
              className="admin-card"
              style={{
                padding: 22,
              }}
            >
              {/* COURSE HEADER */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'flex-start',
                  gap: 20,
                  paddingBottom: 18,
                  borderBottom:
                    '1px solid #e5e7eb',
                  marginBottom: 18,
                }}
              >
                <div>
                  <div className="eyebrow">
                    COURSE
                  </div>

                  <h2
                    style={{
                      margin:
                        '4px 0 12px',
                      fontSize: 25,
                    }}
                  >
                    {selectedGroup.courseTitle}
                  </h2>

                  <div
                    style={{
                      display:
                        'flex',
                      flexWrap:
                        'wrap',
                      gap: 8,
                    }}
                  >
                    <span className="admin-tag">
                      📅{' '}
                      {formatDate(selectedStartDate)}
                      {selectedEndDate
                        ? ` — ${formatDate(selectedEndDate)}`
                        : ''}
                    </span>

                    <span className="admin-tag">
                      📍{' '}
                      {selectedLocation}
                    </span>

                    <span className="admin-tag">
                      {selectedDelivery === 'أونلاين' ? '💻' : '🏢'}{' '}
                      {selectedDelivery}
                    </span>

                    <span className="admin-tag">
                      ⏱️ {selectedGroup.trainingDays ?? 3} أيام
                    </span>

                    <span className="admin-tag">
                      🕐 {selectedGroup.trainingHours ?? '—'} ساعة
                    </span>

                    <span className="admin-tag">
                      👥{' '}
                      {members.length}{' '}
                      متدرب
                    </span>

                    {selectedGroup.expectedTrainees ? (
                      <span className="admin-tag">
                        المتوقع: {selectedGroup.expectedTrainees} متدرب
                      </span>
                    ) : null}

                    {selectedGroup.meetingLink ? (
                      <a
                        className="admin-tag"
                        href={selectedGroup.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        فتح رابط التدريب
                      </a>
                    ) : null}

                    <span className="admin-tag">
                      المسؤول:{' '}
                      {selectedGroup.responsibleName ||
                        '—'}
                    </span>

                    <span className="admin-tag">
                      المدرب:{' '}
                      {staffUsers.find((staff) => staff.id === selectedGroup.trainerId)?.name || '—'}
                    </span>

                    <span className="admin-tag">
                      المنسق:{' '}
                      {staffUsers.find((staff) => staff.id === selectedGroup.coordinatorId)?.name || '—'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'flex',
                    gap: 8,
                    flexWrap:
                      'wrap',
                    justifyContent:
                      'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      void openReport()
                    }
                  >
                    التقرير والنتائج
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => void printGroupCertificates()}
                  >
                    شهادات المجموعة
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    onClick={startEdit}
                  >
                    تعديل
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    onClick={() =>
                      void deleteSelected()
                    }
                  >
                    حذف
                  </button>
                </div>
              </div>

              {/* =========================
                  STAFF ASSIGNMENT
                 ========================= */}

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17 }}>
                      تعيين فريق المجموعة
                    </h3>
                    <p
                      style={{
                        margin: '4px 0 0',
                        color: '#6b7280',
                        fontSize: 13,
                      }}
                    >
                      التعيين هنا خاص بهذه المجموعة فقط، ويمكن تغييره لاحقًا دون تعديل الدورة.
                    </p>
                  </div>
                  <span className="admin-tag">
                    {assignmentTrainerId || assignmentCoordinatorId
                      ? 'تم التعيين'
                      : 'غير معين'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                  }}
                >
                  <div className="admin-field">
                    <label>المدرب</label>
                    <select
                      className="admin-select"
                      value={assignmentTrainerId}
                      onChange={(event) =>
                        setAssignmentTrainerId(event.target.value)
                      }
                    >
                      <option value="">بدون تعيين</option>
                      {staffUsers
                        .filter((staff) => staff.role === 'trainer')
                        .map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} — {staff.email}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label>المنسق</label>
                    <select
                      className="admin-select"
                      value={assignmentCoordinatorId}
                      onChange={(event) =>
                        setAssignmentCoordinatorId(event.target.value)
                      }
                    >
                      <option value="">بدون تعيين</option>
                      {staffUsers
                        .filter((staff) => staff.role === 'coordinator')
                        .map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} — {staff.email}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={savingAssignment}
                    onClick={() => void saveStaffAssignment()}
                  >
                    {savingAssignment ? 'حفظ...' : 'حفظ تعيين المجموعة'}
                  </button>
                </div>
              </div>

              {/* =========================
                  ASSESSMENT SETTINGS
                 ========================= */}

              <div
                style={{
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 17,
                      }}
                    >
                      التقييمات
                    </h3>

                    <p
                      style={{
                        margin:
                          '4px 0 0',
                        color:
                          '#6b7280',
                        fontSize: 13,
                      }}
                    >
                      التحكم في فتح وإغلاق
                      التقييمات لهذه الدورة.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',
                    gap: 10,
                  }}
                >
                  {/* PRE */}

                  <div
                    style={{
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Pre Assessment
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            '#6b7280',
                        }}
                      >
                        مفتوح دائمًا
                      </span>

                      <span className="admin-status admin-status-ok">
                        مفتوح
                      </span>
                    </div>
                  </div>

                  {/* POST */}

                  <div
                    style={{
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Post Assessment
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            '#6b7280',
                        }}
                      >
                        بعد انتهاء الدورة
                      </span>

                      <button
                        type="button"
                        className={
                          assessmentSettings
                            .post
                            .enabled
                            ? 'admin-btn admin-btn-primary'
                            : 'admin-btn admin-btn-light'
                        }
                        disabled={
                          savingAssessment ===
                          'post'
                        }
                        onClick={() =>
                          void toggleAssessment(
                            'post',
                          )
                        }
                      >
                        {savingAssessment ===
                        'post'
                          ? 'حفظ...'
                          : assessmentSettings
                                .post
                                .enabled
                            ? 'مفتوح'
                            : 'مغلق'}
                      </button>
                    </div>
                  </div>

                  {/* EVALUATION */}

                  <div
                    style={{
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Course Evaluation
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            '#6b7280',
                        }}
                      >
                        تقييم الدورة والمدرب
                      </span>

                      <button
                        type="button"
                        className={
                          assessmentSettings
                            .evaluation
                            .enabled
                            ? 'admin-btn admin-btn-primary'
                            : 'admin-btn admin-btn-light'
                        }
                        disabled={
                          savingAssessment ===
                          'evaluation'
                        }
                        onClick={() =>
                          void toggleAssessment(
                            'evaluation',
                          )
                        }
                      >
                        {savingAssessment ===
                        'evaluation'
                          ? 'حفظ...'
                          : assessmentSettings
                                .evaluation
                                .enabled
                            ? 'مفتوح'
                            : 'مغلق'}
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    disabled={generatingAssessments}
                    onClick={() => void generatePrePostAssessments()}
                  >
                    {generatingAssessments
                      ? 'جاري الإنشاء...'
                      : 'إنشاء التقييم القبلي والبعدي للكل'}
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    disabled={generatingAssessments}
                    onClick={() => void generateCourseEvaluations()}
                  >
                    {generatingAssessments
                      ? 'جاري الإنشاء...'
                      : 'إنشاء تقييم الدورة للكل'}
                  </button>
                </div>
              </div>

              {/* =========================
                  ADD TRAINEE
                 ========================= */}

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontSize: 17,
                  }}
                >
                  إضافة متدرب للدورة
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: 10,
                  }}
                >
                  <select
                    className="admin-select"
                    value={memberId}
                    onChange={(event) =>
                      setMemberId(event.target.value)
                    }
                  >
                    <option value="">
                      اختر متدربًا موجودًا
                    </option>

                    {availableTrainees.map((trainee) => (
                      <option
                        key={trainee.id}
                        value={trainee.id}
                      >
                        {getTraineeName(trainee)}
                        {trainee.email ? ` — ${trainee.email}` : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => void addMember()}
                  >
                    إضافة للدورة
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    onClick={() => setNewTraineeOpen(true)}
                  >
                    إضافة متدرب جديد
                  </button>
                </div>
              </div>

              {newTraineeOpen && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.55)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      width: 'min(760px, 100%)',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      background: '#fff',
                      borderRadius: 16,
                      padding: 24,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 20,
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: 20 }}>
                        إضافة متدرب جديد للمجموعة
                      </h3>
                      <button
                        type="button"
                        className="admin-btn admin-btn-light"
                        onClick={() => setNewTraineeOpen(false)}
                      >
                        إلغاء
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 14,
                      }}
                    >
                      <label>
                        <span>الاسم الأول *</span>
                        <input
                          className="admin-input"
                          value={newTraineeForm.firstName}
                          onChange={(event) =>
                            setNewTraineeForm((current) => ({
                              ...current,
                              firstName: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>اسم العائلة *</span>
                        <input
                          className="admin-input"
                          value={newTraineeForm.lastName}
                          onChange={(event) =>
                            setNewTraineeForm((current) => ({
                              ...current,
                              lastName: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>الاسم الأول بالإنجليزي</span>
                        <input
                          className="admin-input"
                          value={newTraineeForm.firstNameEn}
                          onChange={(event) =>
                            setNewTraineeForm((current) => ({
                              ...current,
                              firstNameEn: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>اسم العائلة بالإنجليزي</span>
                        <input
                          className="admin-input"
                          value={newTraineeForm.lastNameEn}
                          onChange={(event) =>
                            setNewTraineeForm((current) => ({
                              ...current,
                              lastNameEn: event.target.value,
                            }))
                          }
                        />
                      </label>

<label>
  <span>الجنس *</span>
  <select
    className="admin-input"
    value={newTraineeForm.gender}
    onChange={(event) =>
      setNewTraineeForm((current) => ({
        ...current,
        gender: event.target.value as 'male' | 'female',
      }))
    }
  >
    <option value="male">ذكر</option>
    <option value="female">أنثى</option>
  </select>
</label>

                      <label>
                        <span>البريد الإلكتروني</span>
                        <input
                          className="admin-input"
                          type="email"
                          value={newTraineeForm.email}
                          onChange={(event) =>
                            setNewTraineeForm((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>رقم الجوال</span>
                        <input
                          className="admin-input"
                          value={newTraineeForm.phone}
                          onChange={(event) =>
                            setNewTraineeForm((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label style={{ gridColumn: '1 / -1' }}>
                        <span>كلمة المرور *</span>
                        <input
                          className="admin-input"
                          type="password"
                          value={newTraineeForm.password}
                          onChange={(event) =>
                            setNewTraineeForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 10,
                        marginTop: 20,
                      }}
                    >
                      <button
                        type="button"
                        className="admin-btn admin-btn-light"
                        onClick={() => setNewTraineeOpen(false)}
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={() => void createAndAddMember()}
                      >
                        حفظ وإضافة للمجموعة
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================
                  TRAINEES TABLE
                 ========================= */}

              <div>
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18,
                      }}
                    >
                      المتدربون
                    </h3>

                    <p
                      style={{
                        margin:
                          '4px 0 0',
                        color:
                          '#6b7280',
                        fontSize: 13,
                      }}
                    >
                      الحضور والتقييمات الخاصة
                      بكل متدرب.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      void openReport()
                    }
                  >
                    عرض التقرير الكامل
                  </button>
                </div>

                {members.length === 0 ? (
                  <div className="admin-empty">
                    لم تتم إضافة متدربين لهذه
                    الدورة.
                  </div>
                ) : (
                  <div
                    className="admin-table-card"
                    style={{
                      overflowX:
                        'auto',
                    }}
                  >
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>
                            المتدرب
                          </th>

                          <th>
                            البريد
                          </th>

                          {Array.from(
                            {
                              length: Math.max(
                                1,
                                Number(selectedGroup?.trainingDays ?? 3),
                              ),
                            },
                            (_, index) => (
                              <th key={`attendance-header-${index}`}>
                                اليوم {index + 1}
                              </th>
                            ),
                          )}

                          <th>
                            Pre
                          </th>

                          <th>
                            Post
                          </th>

                          <th>
                            Evaluation
                          </th>

                          <th>
                            النتائج
                          </th>

                          <th>
                            إزالة
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {members.map(
                          (trainee) => {
                            const enrollment =
                              getEnrollment(
                                trainee,
                                selectedGroup,
                              );

                            const days =
                              enrollment
                                ?.attendanceDays ??
                              [];

                            const pre =
                              assessmentStateLabel(
                                enrollment?.preAssessment ?? undefined,
                                enrollment?.preAssessmentScore,
                              );

                            const post =
                              assessmentStateLabel(
                                enrollment?.postAssessment ?? undefined,
                                enrollment?.postAssessmentScore,
                              );

                            const evaluation =
                              assessmentStateLabel(
                                enrollment?.courseEvaluation ?? undefined,
                                enrollment?.courseEvaluationScore,
                                5,
                              );

                            return (
                              <tr
                                key={
                                  trainee.id
                                }
                              >
                                <td>
                                  <strong>
                                    {getTraineeName(
                                      trainee,
                                    )}
                                  </strong>

                                  {getEnglishName(
                                    trainee,
                                  ) && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color:
                                          '#6b7280',
                                        marginTop: 3,
                                      }}
                                    >
                                      {
                                        getEnglishName(
                                          trainee,
                                        )
                                      }
                                    </div>
                                  )}
                                </td>

                                <td>
                                  {trainee.email}
                                </td>

                                {Array.from(
                                  {
                                    length: Math.max(
                                      1,
                                      Number(selectedGroup?.trainingDays ?? 3),
                                    ),
                                  },
                                  (_, dayIndex) => (
                                    <td key={`attendance-${trainee.id}-${dayIndex}`}>
                                      <div
                                        style={{
                                          display: 'flex',
                                          gap: 4,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          className={
                                            days[dayIndex]?.status === 'present'
                                              ? 'admin-btn admin-btn-primary'
                                              : 'admin-btn admin-btn-light'
                                          }
                                          style={{
                                            padding: '5px 8px',
                                            fontSize: 12,
                                          }}
                                          onClick={() =>
                                            void markAttendance(
                                              trainee,
                                              dayIndex,
                                              'present',
                                            )
                                          }
                                        >
                                          حاضر
                                        </button>

                                        <button
                                          type="button"
                                          className={
                                            days[dayIndex]?.status === 'absent'
                                              ? 'admin-btn admin-btn-danger'
                                              : 'admin-btn admin-btn-light'
                                          }
                                          style={{
                                            padding: '5px 8px',
                                            fontSize: 12,
                                          }}
                                          onClick={() =>
                                            void markAttendance(
                                              trainee,
                                              dayIndex,
                                              'absent',
                                            )
                                          }
                                        >
                                          غائب
                                        </button>
                                      </div>
                                    </td>
                                  ),
                                )}

                                {/* PRE */}

                                <td>
                                  <span
                                    className={
                                      pre.className
                                    }
                                  >
                                    {pre.label}
                                  </span>
                                </td>

                                {/* POST */}

                                <td>
                                  <span
                                    className={
                                      post.className
                                    }
                                  >
                                    {post.label}
                                  </span>
                                </td>

                                {/* EVALUATION */}

                                <td>
                                  <span
                                    className={
                                      evaluation.className
                                    }
                                  >
                                    {
                                      evaluation.label
                                    }
                                  </span>
                                </td>

                                {/* RESULTS */}

                                <td>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-light"
                                    style={{
                                      padding:
                                        '6px 10px',
                                    }}
                                    onClick={() => {
                                      if (!enrollment?.id) {
                                        alert(
                                          'لا يوجد تسجيل مرتبط بهذا المتدرب داخل المجموعة.',
                                        );
                                        return;
                                      }

                                      setResultEditor({
                                        traineeId:
                                          trainee.id,
                                        traineeName:
                                          getTraineeName(
                                            trainee,
                                          ),
                                        enrollmentId:
                                          enrollment.id,
                                        pre:
                                          enrollment
                                            .preAssessmentScore !=
                                          null
                                            ? String(
                                                enrollment.preAssessmentScore,
                                              )
                                            : '',
                                        post:
                                          enrollment
                                            .postAssessmentScore !=
                                          null
                                            ? String(
                                                enrollment.postAssessmentScore,
                                              )
                                            : '',
                                      });
                                    }}
                                  >
                                    إدخال النتائج
                                  </button>

                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-light"
                                    style={{
                                      padding: '6px 10px',
                                      marginTop: 6,
                                    }}
                                    disabled={generatingAssessments}
                                    onClick={() =>
                                      void generateAssessmentsForTrainee(
                                        trainee,
                                      )
                                    }
                                  >
                                    إنشاء Pre / Post
                                  </button>

                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-light"
                                    style={{
                                      padding: '6px 10px',
                                      marginTop: 6,
                                    }}
                                    disabled={generatingAssessments}
                                    onClick={() =>
                                      void generateAssessmentsForTrainee(
                                        trainee,
                                        { evaluation: true },
                                      )
                                    }
                                  >
                                    إنشاء Evaluation
                                  </button>
                                </td>

                                {/* REMOVE */}

                                <td>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-danger"
                                    style={{
                                      padding:
                                        '6px 10px',
                                    }}
                                    onClick={() =>
                                      void removeMember(
                                        trainee.id,
                                      )
                                    }
                                  >
                                    إزالة
                                  </button>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* =========================
          ADMIN RESULTS MODAL
         ========================= */}

      {resultEditor && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal"
            style={{
              maxWidth: 520,
            }}
          >
            <div className="admin-modal-header">
              <div>
                <h2 style={{ margin: 0 }}>
                  إدخال نتائج التقييم
                </h2>
                <p
                  style={{
                    margin: '5px 0 0',
                    color: '#6b7280',
                    fontSize: 13,
                  }}
                >
                  {resultEditor.traineeName || 'المتدرب'}
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  if (!savingResults) {
                    setResultEditor(null);
                  }
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: 20,
                display: 'grid',
                gap: 14,
              }}
            >
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  color: '#475569',
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                أدخل نتيجة التقييم القبلي والبعدي كما تم اعتمادها
                من فريق التدريب. التقرير سيحسب متوسط النتائج ونسبة
                التحسن تلقائيًا.
              </div>

              <div className="admin-field">
                <label>التقييم القبلي / Pre Assessment</label>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={resultEditor.pre}
                  onChange={(event) =>
                    setResultEditor({
                      ...resultEditor,
                      pre: event.target.value,
                    })
                  }
                  placeholder="مثال: 62"
                />
              </div>

              <div className="admin-field">
                <label>التقييم البعدي / Post Assessment</label>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={resultEditor.post}
                  onChange={(event) =>
                    setResultEditor({
                      ...resultEditor,
                      post: event.target.value,
                    })
                  }
                  placeholder="مثال: 88"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  paddingTop: 6,
                }}
              >
                <button
                  type="button"
                  className="admin-btn admin-btn-light"
                  disabled={savingResults}
                  onClick={() => setResultEditor(null)}
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={savingResults}
                  onClick={() =>
                    void saveAdminAssessmentResults()
                  }
                >
                  {savingResults ? 'جاري الحفظ...' : 'حفظ النتائج'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          REPORT MODAL
         ========================= */}

      {reportOpen &&
        selectedGroup && (
          <div className="admin-modal-backdrop report-print-backdrop">
            <style>{`
              .report-content-page {
                position: relative;
                box-sizing: border-box;
                min-height: 760px;
                margin: 0;
                border: 1px solid #dce3eb;
                border-top: 4px solid #0A1931;
                background:
                  radial-gradient(circle at 92% 10%, rgba(160,127,51,.08), transparent 230px),
                  radial-gradient(circle at 8% 88%, rgba(10,25,49,.045), transparent 260px),
                  linear-gradient(180deg, #f8fafc 0%, #ffffff 24%, #ffffff 82%, #f5f7f9 100%);
                overflow: hidden;
              }



              .report-modal-scroll {
                scrollbar-width: thin;
                scrollbar-color: #A07F33 #eef1f5;
              }

              .report-modal-scroll::-webkit-scrollbar {
                width: 10px;
              }

              .report-modal-scroll::-webkit-scrollbar-track {
                background: #eef1f5;
              }

              .report-modal-scroll::-webkit-scrollbar-thumb {
                background: #A07F33;
                border-radius: 999px;
                border: 2px solid #eef1f5;
              }

              @media print {
                @page {
                  size: A4 portrait;
                  margin: 0;
                }

                html,
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: auto !important;
                  min-width: 0 !important;
                  max-width: none !important;
                  background: #ffffff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                .admin-sidebar,
                .report-no-print {
                  display: none !important;
                  visibility: hidden !important;
                }

                .admin-main,
                .admin-page {
                  width: auto !important;
                  min-width: 0 !important;
                  max-width: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: visible !important;
                }

                .admin-page > * {
                  display: none !important;
                }

                .admin-page > .report-print-backdrop {
                  display: block !important;
                  position: static !important;
                  width: 100% !important;
                  min-width: 0 !important;
                  max-width: none !important;
                  height: auto !important;
                  min-height: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  background: #ffffff !important;
                  visibility: visible !important;
                }

                .report-print-backdrop .report-print-root,
                .report-print-backdrop .report-print-root * {
                  visibility: visible !important;
                }

                .report-print-root {
                  counter-reset: reportPage;
                  position: static !important;
                  display: block !important;
                  width: 100% !important;
                  min-width: 0 !important;
                  max-width: none !important;
                  height: auto !important;
                  min-height: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                  box-shadow: none !important;
                  border: 0 !important;
                  overflow: visible !important;
                  color: #111827 !important;
                }

                .report-modal-scroll {
                  position: static !important;
                  width: 100% !important;
                  min-width: 0 !important;
                  max-width: none !important;
                  max-height: none !important;
                  height: auto !important;
                  overflow: visible !important;
                }

                /*
                 * The browser print sheet is already A4 because of @page.
                 * Report pages therefore use the full containing width instead
                 * of forcing html/body/admin-main to 210mm. This prevents the
                 * RTL admin layout from leaving an artificial strip on the
                 * right side.
                 *
                 * 296mm is intentional: it is an imperceptible 1mm safety
                 * allowance inside an A4 sheet and prevents Chrome's
                 * fragmentation engine from pushing a full-height element
                 * onto an extra page.
                 */
                .report-page {
                  counter-increment: reportPage;
                  position: relative !important;
                  display: block !important;
                  box-sizing: border-box !important;
                  width: 100% !important;
                  min-width: 0 !important;
                  max-width: none !important;
                  height: 296mm !important;
                  min-height: 296mm !important;
                  max-height: 296mm !important;
                  margin: 0 !important;
                  padding: 17mm 12mm 12mm !important;
                  overflow: hidden !important;
                  border: 0 !important;
                  border-top: 3px solid #0A1931 !important;
                  border-bottom: 3px solid #A07F33 !important;
                  box-shadow: inset 0 0 0 1px #dfe5ec !important;
                  break-inside: avoid !important;
                  page-break-inside: avoid !important;
                  break-before: auto !important;
                  page-break-before: auto !important;
                  break-after: page !important;
                  page-break-after: always !important;
                  background:
                    radial-gradient(
                      circle at 92% 10%,
                      rgba(160,127,51,.10) 0,
                      rgba(160,127,51,0) 48mm
                    ),
                    radial-gradient(
                      circle at 8% 88%,
                      rgba(10,25,49,.055) 0,
                      rgba(10,25,49,0) 50mm
                    ),
                    linear-gradient(
                      145deg,
                      #f7f9fc 0%,
                      #ffffff 54%,
                      #fbf7ed 100%
                    ) !important;
                }

                /* The final report section has a non-report footer sibling,
                   so target it explicitly to prevent Chrome from creating
                   one extra blank page after the report. */
                .report-print-root > .report-last-page {
                  break-after: auto !important;
                  page-break-after: auto !important;
                }

                .report-print-root > .report-cover-page {
                  height: 296mm !important;
                  min-height: 296mm !important;
                  max-height: 296mm !important;
                  padding: 12mm !important;
                  overflow: hidden !important;
                  break-before: auto !important;
                  page-break-before: auto !important;
                  background:
                    radial-gradient(
                      circle at 86% 20%,
                      rgba(10,25,49,.08) 0,
                      rgba(10,25,49,0) 48mm
                    ),
                    radial-gradient(
                      circle at 10% 82%,
                      rgba(160,127,51,.12) 0,
                      rgba(160,127,51,0) 42mm
                    ),
                    linear-gradient(
                      145deg,
                      #eef2f6 0%,
                      #ffffff 52%,
                      #f8f2e5 100%
                    ) !important;
                }

                .report-cover-page > div:first-child {
                  position: relative !important;
                  z-index: 2 !important;
                  margin: 0 !important;
                }

                .report-cover-page > div:first-child > div:first-child {
                  margin-bottom: 0 !important;
                }

                /* Move the cover title and metadata upward so the cover
                   uses the A4 page instead of creating an overflow tail. */
                .report-cover-page > div:first-child > div:nth-child(2) {
                  margin-top: 42mm !important;
                }

                .report-cover-page > div:last-child {
                  position: absolute !important;
                  right: 10mm !important;
                  left: 10mm !important;
                  bottom: 48mm !important;
                  margin: 0 !important;
                  z-index: 3 !important;
                }

                .report-cover-page > div:last-child > div {
                  min-height: 20mm !important;
                  box-sizing: border-box !important;
                }

                /* Repeat the Impact Training logo on every report page.
                   It is absolutely positioned so it never changes pagination. */
                .report-content-page::after {
                  content: "";
                  position: absolute !important;
                  top: 7mm !important;
                  left: 10mm !important;
                  width: 31mm !important;
                  height: 11mm !important;
                  background-image: url("/assets/logo/logo_blue-remove.png") !important;
                  background-repeat: no-repeat !important;
                  background-position: left center !important;
                  background-size: contain !important;
                  z-index: 5 !important;
                  pointer-events: none !important;
                }

                .report-content-page {
                  background:
                    radial-gradient(
                      circle at 92% 10%,
                      rgba(160,127,51,.075) 0,
                      rgba(160,127,51,0) 44mm
                    ),
                    radial-gradient(
                      circle at 8% 88%,
                      rgba(10,25,49,.04) 0,
                      rgba(10,25,49,0) 46mm
                    ),
                    linear-gradient(
                      145deg,
                      #f8fafc 0%,
                      #ffffff 55%,
                      #fcf8ef 100%
                    ) !important;
                }


                .report-content-page > div:first-child {
                  position: relative !important;
                  z-index: 2 !important;
                }

                /* Allow the topics section to continue onto another printed page
                   instead of clipping long course outlines. */
                .report-topics-page {
                  height: auto !important;
                  min-height: 296mm !important;
                  max-height: none !important;
                  overflow: visible !important;
                  break-inside: auto !important;
                  page-break-inside: auto !important;
                  break-after: page !important;
                  page-break-after: always !important;
                }

                .report-topics-page > div {
                  overflow: visible !important;
                }

                /*
                 * Keep the tables readable. They are given a fixed,
                 * predictable row height so the whole table stays on its
                 * dedicated report page.
                 */
                .report-attendance-page {
                  padding: 17mm 10mm 15mm !important;
                }

                .report-attendance-page h2 {
                  margin: 3px 0 10px !important;
                  font-size: 22px !important;
                }

                .report-attendance-page table {
                  width: 100% !important;
                  font-size: 11px !important;
                  table-layout: fixed !important;
                }

                .report-attendance-page th {
  padding: 9px 5px !important;
  line-height: 1.2 !important;
}

.report-attendance-page td {
  padding: 6px 5px !important;
  line-height: 1.2 !important;
  height: 9mm !important;
}

                .report-assessment-page {
                  padding: 17mm 10mm 15mm !important;
                }

                .report-assessment-page h2 {
                  margin: 3px 0 10px !important;
                  font-size: 22px !important;
                }

                .report-assessment-page > div[style*="padding: 18px"] {
                  padding: 12px !important;
                  margin-bottom: 8px !important;
                }

                .report-assessment-page h3 {
                  margin-bottom: 8px !important;
                  font-size: 16px !important;
                }

                .report-assessment-page table {
                  width: 100% !important;
                  table-layout: fixed !important;
                  font-size: 10.5px !important;
                }

                .report-assessment-page th {
                  padding: 5px !important;
                  line-height: 1.1 !important;
                }

            .report-assessment-page td {
  padding: 5px 5px !important;
  line-height: 1.15 !important;
  height: 8mm !important;
}

                .report-evaluation-page {
                  padding: 17mm 10mm 15mm !important;
                }

                .report-evaluation-page > div[style*="padding: 18px"] {
                  padding: 14px !important;
                  margin-bottom: 10px !important;
                }

                .report-evaluation-page table {
                  width: 100% !important;
                  table-layout: fixed !important;
                  font-size: 11px !important;
                }

                .report-evaluation-page th {
                  padding: 6px !important;
                }

      .report-evaluation-page td {
  padding: 5px 6px !important;
  height: 8mm !important;
}
              }
            `}</style>

            <div
              className="admin-modal report-print-root report-modal-scroll"
              style={{
                maxWidth: 1180,
                background: '#ffffff',
                color: '#111827',
                padding: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight: 'calc(100vh - 48px)',
                position: 'relative',
              }}
            >
              {/* REPORT COVER / HEADER */}
              <div
                className="report-page report-cover-page"
                style={{
                  minHeight: 760,
                  padding: 34,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  background:
                    'linear-gradient(145deg, #f8fafc 0%, #ffffff 58%, #f7f3e8 100%)',
                  borderBottom: '6px solid #A07F33',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 24,
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: 22,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          letterSpacing: 2,
                          color: '#A07F33',
                          fontWeight: 800,
                          marginBottom: 8,
                        }}
                      >
                        IMPACT TRAINING
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6b7280',
                        }}
                      >
                        تقرير تنفيذ برنامج تدريبي
                      </div>
                    </div>

                    <div
                      style={{
                        width: 180,
                        height: 70,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src="/assets/logo/logo_blue-remove.png"
                        alt="Impact Training"
                        style={{
                          maxWidth: '175px',
                          maxHeight: '65px',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 82, textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '8px 18px',
                        borderRadius: 999,
                        background: '#f5f5f5',
                        color: '#0A1931',
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 22,
                      }}
                    >
                      تقرير تنفيذ برنامج تدريبي
                    </div>

                    <h1
                      style={{
                        margin: 0,
                        fontSize: 34,
                        lineHeight: 1.35,
                        color: '#0A1931',
                      }}
                    >
                      {selectedGroup.courseTitle}
                    </h1>

                    <div
                      style={{
                        marginTop: 18,
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#A07F33',
                      }}
                    >
                      {selectedCompany || selectedGroup.companyName || '—'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${selectedDelivery === 'أونلاين' ? 3 : 4}, minmax(0, 1fr))`,
                    gap: 12,
                  }}
                >
                  {[
                    ['التاريخ', `${formatDateLong(selectedStartDate)}${selectedEndDate ? ` — ${formatDateLong(selectedEndDate)}` : ''}`],
                    ...(selectedDelivery === 'أونلاين' ? [] : [['الموقع', selectedLocation]]),
                    ['مدة التنفيذ', `${reportTrainingDays} أيام`],
                    ['عدد المشاركين', `${members.length} متدرب`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: 14,
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        background: '#ffffff',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 5 }}>
                        {label}
                      </div>
                      <strong style={{ fontSize: 13 }}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXECUTIVE SUMMARY */}
              <section className="report-page report-content-page" style={{ padding: '30px 34px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    gap: 20,
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <div style={{ color: '#A07F33', fontSize: 12, fontWeight: 800 }}>
                      01 — ملخص التنفيذ
                    </div>
                    <h2 style={{ margin: '5px 0 0', color: '#0A1931', fontSize: 24 }}>
                      البيانات الأساسية للبرنامج
                    </h2>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  {[
                    ['البرنامج', selectedGroup.courseTitle || '—'],
                    ['الشركة', selectedCompany || selectedGroup.companyName || '—'],
                    ['نوع التنفيذ', selectedDelivery || '—'],
                    ['عدد الأيام', `${reportTrainingDays} أيام`],
                    ['عدد الساعات', selectedGroup.trainingHours != null ? `${selectedGroup.trainingHours} ساعة` : '—'],
                    ['عدد المشاركين', `${members.length} متدرب`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: 14,
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,.86)',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 5 }}>
                        {label}
                      </div>
                      <strong style={{ fontSize: 13 }}>{value}</strong>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    background: '#0A1931',
                    color: '#ffffff',
                  }}
                >
                  <div style={{ color: '#d7c38c', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                    الملخص التنفيذي
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.9, fontSize: 14 }}>
                    تم تنفيذ البرنامج التدريبي لصالح {selectedCompany || selectedGroup.companyName || 'الجهة المستفيدة'}
                    {' '}وفق البيانات المسجلة للمجموعة، وبمدة تنفيذ قدرها {reportTrainingDays} أيام
                    {selectedGroup.trainingHours != null ? ` وإجمالي ${selectedGroup.trainingHours} ساعة تدريبية` : ''}
                    {' '}وبمشاركة {members.length} متدرب. يعرض هذا التقرير بيانات التنفيذ والحضور ونتائج التقييمات المسجلة في النظام.
                  </p>
                </div>
              </section>

              {/* COURSE CONTENT */}
              <section className="report-page report-content-page" style={{ padding: '10px 34px 30px' }}>
                <div style={{ color: '#A07F33', fontSize: 12, fontWeight: 800 }}>
                  02 — وصف البرنامج وأهدافه
                </div>
                <h2 style={{ margin: '5px 0 18px', color: '#0A1931', fontSize: 24 }}>
                  وصف البرنامج وأهدافه
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                    <h3 style={{ margin: '0 0 9px', color: '#0A1931' }}>وصف البرنامج</h3>
                    <p style={{ margin: 0, lineHeight: 1.9, color: '#374151' }}>
                      {reportText('description', 'summary', 'overview') || 'لا توجد نبذة وصفية مسجلة لهذه الدورة.'}
                    </p>
                  </div>

                  <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                    <h3 style={{ margin: '0 0 10px', color: '#0A1931' }}>الأهداف التدريبية</h3>
                    {(() => {
                      const items = reportList('objectives', 'learningObjectives', 'goals');
                      return Array.isArray(items) && items.length ? (
                        <ol style={{ margin: 0, paddingRight: 20, lineHeight: 1.9, color: '#374151' }}>
                          {(items as string[]).map((item) => (
                            <li key={item} style={{ marginBottom: 5 }}>{item}</li>
                          ))}
                        </ol>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: 13 }}>
                          لا توجد بيانات مسجلة في الدورة.
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </section>

              {/* TOPICS AND OUTCOMES */}
              <section
  className="report-page report-content-page report-topics-page"
  style={{ padding: '10px 34px 30px' }}
>
                <div style={{ color: '#A07F33', fontSize: 12, fontWeight: 800 }}>
                  03 — المحاور ومخرجات التعلم
                </div>
                <h2 style={{ margin: '5px 0 18px', color: '#0A1931', fontSize: 24 }}>
                  المحاور والموضوعات ومخرجات التعلم
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div
  style={{
    padding: 18,
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    background: 'rgba(255,255,255,.82)',
  }}
>
  <h3
    style={{
      margin: '0 0 14px',
      color: '#0A1931',
    }}
  >
    المحاور والموضوعات
  </h3>

  {(() => {
    const items = reportOutlineItems();

    return items.length ? (
      <div
        style={{
          display: 'grid',
          gap: 8,
          color: '#374151',
          lineHeight: 1.9,
        }}
      >
        {items.map((item, index) =>
          item.type === 'main' ? (
            <div
              key={`outline-main-${index}`}
              style={{
                marginTop: index === 0 ? 0 : 8,
                color: '#0A1931',
                fontWeight: 800,
              }}
            >
              {item.text}
            </div>
          ) : (
            <div
              key={`outline-sub-${index}`}
              style={{
                paddingRight: 18,
              }}
            >
              • {item.text}
            </div>
          ),
        )}
      </div>
    ) : (
      <div
        style={{
          color: '#9ca3af',
          fontSize: 13,
        }}
      >
        لا توجد بيانات مسجلة في الدورة.
      </div>
    );
  })()}
</div>
               {[
  ['مخرجات التعلم', reportList('outcomes', 'learningOutcomes', 'results')],
].map(([title, items]) => (
                    <div
                      key={title as string}
                      style={{
                        padding: 18,
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,.82)',
                      }}
                    >
                      <h3 style={{ margin: '0 0 10px', color: '#0A1931' }}>{title as string}</h3>
                      {Array.isArray(items) && items.length ? (
                        <ol style={{ margin: 0, paddingRight: 20, lineHeight: 1.9, color: '#374151' }}>
                          {(items as string[]).map((item) => (
                            <li key={item} style={{ marginBottom: 5 }}>{item}</li>
                          ))}
                        </ol>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: 13 }}>
                          لا توجد بيانات مسجلة في الدورة.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* ATTENDANCE */}
              <section className="report-page report-content-page report-attendance-page" style={{ padding: '10px 34px 30px' }}>
                <div style={{ color: '#A07F33', fontSize: 12, fontWeight: 800 }}>
                  04 — الحضور والمشاركة
                </div>
                <h2 style={{ margin: '5px 0 18px', color: '#0A1931', fontSize: 24 }}>
                  سجل حضور المتدربين
                </h2>

                <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#0A1931', color: '#ffffff' }}>
                        <th style={{ padding: 10, textAlign: 'right' }}>#</th>
                        <th style={{ padding: 10, textAlign: 'right' }}>المتدرب</th>
                        {Array.from({ length: reportTrainingDays }, (_, index) => (
                          <th key={index} style={{ padding: 10, textAlign: 'center' }}>
                            اليوم {index + 1}
                          </th>
                        ))}
                        <th style={{ padding: 10, textAlign: 'center' }}>نسبة الحضور</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((row, index) => (
                        <tr key={row.trainee.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                          <td style={{ padding: 9 }}>{index + 1}</td>
                          <td style={{ padding: 9, fontWeight: 700 }}>
                            {getTraineeName(row.trainee) || '—'}
                            {getEnglishName(row.trainee) ? (
                              <div style={{ color: '#6b7280', fontSize: 10, marginTop: 2 }}>
                                {getEnglishName(row.trainee)}
                              </div>
                            ) : null}
                          </td>
                          {Array.from({ length: reportTrainingDays }, (_, dayIndex) => (
                            <td key={dayIndex} style={{ padding: 9, textAlign: 'center' }}>
                              {attendanceLabel(row.attendanceDays[dayIndex]?.status)}
                            </td>
                          ))}
                          <td style={{ padding: 9, textAlign: 'center', fontWeight: 700 }}>
                            {reportTrainingDays > 0
                              ? `${Math.round((row.presentDays / reportTrainingDays) * 100)}%`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                      {!reportRows.length ? (
                        <tr>
                          <td colSpan={reportTrainingDays + 3} style={{ padding: 18, textAlign: 'center', color: '#9ca3af' }}>
                            لا يوجد متدربون مرتبطون بهذه المجموعة.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ASSESSMENT SUMMARY */}
              <section className="report-page report-content-page report-assessment-page" style={{ padding: '10px 34px 30px' }}>
                <div style={{ color: '#A07F33', fontSize: 12, fontWeight: 800 }}>
                  05 — التقييم القبلي والبعدي
                </div>
                <h2 style={{ margin: '5px 0 18px', color: '#0A1931', fontSize: 24 }}>
                  نتائج التقييم القبلي والبعدي
                </h2>

                <div
                  style={{
                    padding: 18,
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    marginBottom: 18,
                  }}
                >
                  <h3 style={{ margin: '0 0 14px', color: '#0A1931', fontSize: 18 }}>
                    التقييم القبلي والبعدي
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
                    {[
                      ['متوسط التقييم القبلي', reportPreAverage],
                      ['متوسط التقييم البعدي', reportPostAverage],
                      ['متوسط التحسن', reportImprovement],
                    ].map(([label, value]) => (
                      <div key={label as string} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fbfbfc' }}>
                        <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 6 }}>{label as string}</div>
                        <strong style={{ fontSize: 22, color: '#0A1931' }}>
                          {typeof value === 'number' ? `${value.toFixed(1)}/100` : '—'}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#0A1931', color: '#ffffff' }}>
                          <th style={{ padding: 10, textAlign: 'right' }}>#</th>
                          <th style={{ padding: 10, textAlign: 'right' }}>المتدرب</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>التقييم القبلي</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>التقييم البعدي</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>التحسن</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportRows.map((row, index) => {
                          const improvement = row.pre !== null && row.post !== null
                            ? row.post - row.pre
                            : null;
                          return (
                            <tr key={`pre-post-${row.trainee.id}`} style={{ borderTop: '1px solid #e5e7eb' }}>
                              <td style={{ padding: 9 }}>{index + 1}</td>
                              <td style={{ padding: 9, fontWeight: 700 }}>{getTraineeName(row.trainee) || '—'}</td>
                              <td style={{ padding: 9, textAlign: 'center' }}>{row.pre !== null ? `${row.pre}/100` : '—'}</td>
                              <td style={{ padding: 9, textAlign: 'center' }}>{row.post !== null ? `${row.post}/100` : '—'}</td>
                              <td style={{ padding: 9, textAlign: 'center' }}>{improvement !== null ? `${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}` : '—'}</td>
                            </tr>
                          );
                        })}
                        {!reportRows.length ? (
                          <tr>
                            <td colSpan={5} style={{ padding: 18, textAlign: 'center', color: '#9ca3af' }}>
                              لا توجد نتائج مسجلة للتقييم القبلي والبعدي.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>


              </section>


              {/* COURSE EVALUATION */}
              <section className="report-page report-content-page report-assessment-page report-evaluation-page" style={{ padding: '10px 34px 30px' }}>
                <div style={{ color: '#A07F33', fontSize: 12, fontWeight: 800 }}>
                  06 — تقييم الدورة
                </div>
                <h2 style={{ margin: '5px 0 18px', color: '#0A1931', fontSize: 24 }}>
                  تقييم الدورة
                </h2>

                <div
                  style={{
                    padding: 18,
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                  }}
                >
                  <h3 style={{ margin: '0 0 14px', color: '#0A1931', fontSize: 18 }}>
                    تقييم الدورة
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12, marginBottom: 18 }}>
                    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fbfbfc' }}>
                      <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 6 }}>متوسط تقييم الدورة</div>
                      <strong style={{ fontSize: 22, color: '#0A1931' }}>
                        {typeof reportEvaluationAverage === 'number' ? `${reportEvaluationAverage.toFixed(1)}/5` : '—'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#0A1931', color: '#ffffff' }}>
                          <th style={{ padding: 10, textAlign: 'right' }}>#</th>
                          <th style={{ padding: 10, textAlign: 'right' }}>المتدرب</th>
                          <th style={{ padding: 10, textAlign: 'center' }}>تقييم الدورة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportRows.map((row, index) => (
                          <tr key={`evaluation-${row.trainee.id}`} style={{ borderTop: '1px solid #e5e7eb' }}>
                            <td style={{ padding: 9 }}>{index + 1}</td>
                            <td style={{ padding: 9, fontWeight: 700 }}>{getTraineeName(row.trainee) || '—'}</td>
                            <td style={{ padding: 9, textAlign: 'center' }}>
                              {row.evaluation !== null ? `${row.evaluation}/5` : '—'}
                            </td>
                          </tr>
                        ))}
                        {!reportRows.length ? (
                          <tr>
                            <td colSpan={3} style={{ padding: 18, textAlign: 'center', color: '#9ca3af' }}>
                              لا توجد تقييمات مسجلة للدورة.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* FOLLOW UP / SIGNATURES */}
              <section className="report-page report-content-page report-last-page" style={{ padding: '10px 34px 34px' }}>
                <div style={{ color: '#A07F33', fontSize: 12, fontWeight: 800 }}>
                  07 — المتابعة والاعتماد
                </div>
                <h2 style={{ margin: '5px 0 18px', color: '#0A1931', fontSize: 24 }}>
                  التوصيات والاعتماد
                </h2>

                <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 22 }}>
                  <ul style={{ margin: 0, paddingRight: 20, lineHeight: 1.9, color: '#374151' }}>
                    <li>متابعة تطبيق المهارات والمعارف المكتسبة في بيئة العمل.</li>
                    <li>مراجعة نتائج التقييمات وتحديد الموضوعات التي تحتاج إلى دعم إضافي.</li>
                    <li>تنفيذ قياس لاحق لأثر البرنامج عند توفر بيانات الأداء التشغيلي.</li>
                  </ul>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 12, minHeight: 105 }}>
                    <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 28 }}>المدرب</div>
                    <div style={{ borderTop: '1px solid #9ca3af', paddingTop: 8, fontWeight: 700 }}>{reportTrainer?.name || '—'}</div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 22,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    fontSize: 11,
                    color: '#6b7280',
                  }}
                >
                  <span>Impact Training — تقرير تنفيذ برنامج تدريبي</span>
                </div>
              </section>

              <div className="admin-modal-footer report-no-print">
                <button
                  type="button"
                  className="admin-btn admin-btn-light"
                  onClick={() => setReportOpen(false)}
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => window.print()}
                >
                  🖨️ طباعة التقرير
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =========================
          CREATE / EDIT GROUP
         ========================= */}

      {open && (
        <div className="admin-modal-backdrop">
          <form
            className="admin-modal"
            style={{
              maxWidth: 760,
            }}
            onSubmit={
              editingId
                ? updateGroup
                : createGroup
            }
          >
            <div
              className="admin-modal-header"
            >
              <h2>
                {editingId
                  ? 'تعديل مجموعة شركة'
                  : 'إضافة مجموعة شركة'}
              </h2>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <div
              className="admin-modal-body"
            >
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>
                    اسم المجموعة
                  </label>

                  <input
                    className="admin-input"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name:
                          event.target
                            .value,
                      })
                    }
                    placeholder="اختياري"
                  />
                </div>

                <div className="admin-field">
                  <label>
                    اسم الشركة
                  </label>

                  <input
                    className="admin-input"
                    required
                    value={
                      form.companyName
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        companyName:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    الدورة
                  </label>

                  <select
                    className="admin-select"
                    required
                    value={
                      form.courseId
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        courseId:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      اختر الدورة
                    </option>

                    {courses.map(
                      (course) => (
                        <option
                          key={
                            course.id
                          }
                          value={
                            course.id
                          }
                        >
                          {
                            course.title
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="admin-field">
                  <label>تاريخ الدورة</label>
                  <input
                    className="admin-input"
                    type="date"
                    required
                    value={form.corporateDate}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        corporateDate: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>طريقة التنفيذ</label>
                  <select
                    className="admin-select"
                    value={form.corporateDelivery}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        corporateDelivery: event.target.value as 'حضوري' | 'أونلاين',
                      })
                    }
                  >
                    <option value="حضوري">حضوري</option>
                    <option value="أونلاين">أونلاين</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label>عدد أيام التدريب</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={1}
                    value={form.trainingDays}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        trainingDays: event.target.value,
                      })
                    }
                    placeholder="مثال: 3"
                  />
                </div>

                <div className="admin-field">
                  <label>عدد ساعات التدريب</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={1}
                    value={form.trainingHours}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        trainingHours: event.target.value,
                      })
                    }
                    placeholder="مثال: 15"
                  />
                </div>

                <div className="admin-field">
                  <label>المدينة / مكان التنفيذ</label>
                  <input
                    className="admin-input"
                    required
                    disabled={form.corporateDelivery === 'أونلاين'}
                    placeholder="مثال: الرياض أو مقر الشركة"
                    value={form.corporateLocation}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        corporateLocation: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>رابط التدريب / رابط الاجتماع (اختياري)</label>
                  <input
                    className="admin-input"
                    type="url"
                    placeholder="https://..."
                    value={form.meetingLink}
                    onChange={(event) =>
                      setForm({ ...form, meetingLink: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>عدد المتدربين المتوقع (اختياري)</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    value={form.expectedTrainees}
                    onChange={(event) =>
                      setForm({ ...form, expectedTrainees: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>المادة التدريبية الخاصة بالمجموعة</label>
                  <input
                    className="admin-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readGroupMaterialFile(file);
                    }}
                  />
                  {form.materialUrl || (editingId && selectedGroup?.materialAvailable) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                      <span style={{ color: '#067647', fontWeight: 700, fontSize: 12 }}>تم تحديد مادة خاصة لهذه المجموعة.</span>
                      <a href={editingId ? `/api/groups/${encodeURIComponent(editingId)}/material` : form.materialUrl} target="_blank" rel="noreferrer" className="admin-btn admin-btn-light" style={{ textDecoration: 'none' }}>معاينة</a>
                      <button type="button" className="admin-btn admin-btn-light" onClick={() => { setForm({ ...form, materialUrl: '' }); setMaterialChanged(true); }}>إزالة</button>
                    </div>
                  ) : (
                    <small style={{ color: '#7a8799', marginTop: 5 }}>اتركها فارغة لاستخدام المادة العامة للبرنامج.</small>
                  )}
                </div>
                <div className="admin-field">
                  <label>
                    اسم المسؤول
                  </label>

                  <input
                    className="admin-input"
                    value={
                      form.responsibleName
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsibleName:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    بريد المسؤول
                  </label>

                  <input
                    className="admin-input"
                    type="email"
                    value={
                      form.responsibleEmail
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsibleEmail:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    جوال المسؤول
                  </label>

                  <input
                    className="admin-input"
                    value={
                      form.responsiblePhone
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsiblePhone:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                className="admin-field"
                style={{
                  marginTop: 14,
                }}
              >
                <label>
                  ملاحظات
                </label>

                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={
                    form.notes
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes:
                        event.target
                          .value,
                    })
                  }
                />
              </div>
            </div>

            <div
              className="admin-modal-footer"
            >
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                إلغاء
              </button>

              <button className="admin-btn admin-btn-primary">
                {editingId
                  ? 'حفظ التعديلات'
                  : 'حفظ المجموعة'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
