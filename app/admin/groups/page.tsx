'use client';

import { useEffect, useMemo, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { groupRepository } from '@/lib/data/repositories/group-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';

import type { Course } from '@/types/course';
import type { TrainingGroup } from '@/types/group';
import type { Trainee } from '@/types/trainee';
import type { Schedule } from '@/types/schedule';

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
  return trainee.enrollments?.find(
    (enrollment) =>
      enrollment.groupId === group.id ||
      (
        enrollment.courseId === group.courseId &&
        (!group.scheduleId ||
          enrollment.scheduleId === group.scheduleId)
      ),
  );
}

function assessmentStateLabel(
  state: string | undefined,
  score?: number,
) {
  if (state === 'completed') {
    return {
      label:
        typeof score === 'number'
          ? `${score}/100`
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

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [memberId, setMemberId] = useState('');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [savingAssessment, setSavingAssessment] =
    useState<AssessmentKey | null>(null);

  const [reportOpen, setReportOpen] = useState(false);

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
    materialUrl: '',
    notes: '',
  });

  async function load() {
    await traineeRepository.refresh();

    const [
      groupList,
      courseList,
      traineeList,
      scheduleList,
    ] = await Promise.all([
      groupRepository.findAll(),
      courseRepository.findAll(),
      traineeRepository.findAll(),
      scheduleRepository.findAll({
        sort: 'startDate',
        order: 'asc',
      }),
    ]);

    setGroups(groupList);

    setCourses(
      courseList.filter(
        (course) => course.type === 'training',
      ),
    );

    setTrainees(traineeList);
    setSchedules(scheduleList);

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
        date.setDate(date.getDate() + 2);
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
      materialUrl: '',
      notes: '',
    });

    setOpen(true);
  }

  function startEdit() {
    if (!selectedGroup) return;

    setEditingId(selectedGroup.id);

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

    const group = await groupRepository.create({
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
    });

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

    await groupRepository.update(
      editingId,
      {
        name:
          form.name.trim() ||
          form.companyName.trim() ||
          `مجموعة ${course.title}`,

        courseId: course.id,

        courseTitle: course.title,

        scheduleId: undefined,

        corporateDate:
          form.corporateDate || undefined,

        corporateDelivery:
          form.corporateDelivery,

        corporateLocation:
          form.corporateLocation.trim() || undefined,

        materialUrl:
          form.materialUrl || undefined,

        companyName:
          form.companyName.trim() ||
          undefined,

        responsibleName:
          form.responsibleName.trim() ||
          undefined,

        responsibleEmail:
          form.responsibleEmail.trim() ||
          undefined,

        responsiblePhone:
          form.responsiblePhone.trim() ||
          undefined,

        notes:
          form.notes.trim() || undefined,
      },
    );

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
      await groupRepository.addTrainee(
        selectedGroupId,
        memberId,
      );

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

  async function removeMember(
    traineeId: string,
  ) {
    if (!selectedGroupId) return;

    await groupRepository.removeTrainee(
      selectedGroupId,
      traineeId,
    );

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

      const assessmentField =
        type === 'pre'
          ? 'preAssessment'
          : type === 'post'
            ? 'postAssessment'
            : 'courseEvaluation';

      await groupRepository.setAssessmentForGroup(
        selectedGroup.id,
        assessmentField,
        next[type].enabled ? 'available' : 'locked',
      );

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

    await traineeRepository.ensureAttendanceDays(
      trainee.id,
      enrollment.id ??
        enrollment.courseId,
    );

    await traineeRepository.updateAttendanceDay(
      trainee.id,
      enrollment.id ??
        enrollment.courseId,
      dayIndex,
      status,
    );

    await load();
  }

  /*
   * =========================
   * REPORT
   * =========================
   */

  async function openReport() {
    await traineeRepository.refresh();
    await load();
    setReportOpen(true);
  }

  async function printGroupCertificates() {
    if (!selectedGroup) return;

    await traineeRepository.refresh();
    const eligibleCount = members.filter((trainee) =>
      trainee.enrollments.some(
        (enrollment) =>
          enrollment.courseId === selectedGroup.courseId &&
          enrollment.groupId === selectedGroup.id &&
          enrollment.preAssessment === 'completed' &&
          enrollment.postAssessment === 'completed' &&
          enrollment.courseEvaluation === 'completed',
      ),
    ).length;

    if (eligibleCount === 0) {
      alert('لا توجد شهادات مستحقة حاليًا لمتدربي هذه المجموعة.');
      return;
    }

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
                          date.setDate(date.getDate() + 2);
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
                      👥{' '}
                      {members.length}{' '}
                      متدرب
                    </span>

                    <span className="admin-tag">
                      المسؤول:{' '}
                      {selectedGroup.responsibleName ||
                        '—'}
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
              </div>

              {/* =========================
                  ADD TRAINEE
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
                <h3
                  style={{
                    margin:
                      '0 0 12px',
                    fontSize: 17,
                  }}
                >
                  إضافة متدرب للدورة
                </h3>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr auto',
                    gap: 10,
                  }}
                >
                  <select
                    className="admin-select"
                    value={memberId}
                    onChange={(event) =>
                      setMemberId(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      اختر متدربًا
                    </option>

                    {availableTrainees.map(
                      (trainee) => (
                        <option
                          key={trainee.id}
                          value={trainee.id}
                        >
                          {getTraineeName(
                            trainee,
                          )}{' '}
                          — {trainee.email}
                        </option>
                      ),
                    )}
                  </select>

                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      void addMember()
                    }
                  >
                    إضافة للدورة
                  </button>
                </div>
              </div>

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

                          <th>
                            اليوم 1
                          </th>

                          <th>
                            اليوم 2
                          </th>

                          <th>
                            اليوم 3
                          </th>

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
                                enrollment
                                  ?.preAssessment,
                                enrollment
                                  ?.preAssessmentScore,
                              );

                            const post =
                              assessmentStateLabel(
                                enrollment
                                  ?.postAssessment,
                                enrollment
                                  ?.postAssessmentScore,
                              );

                            const evaluation =
                              assessmentStateLabel(
                                enrollment
                                  ?.courseEvaluation,
                                enrollment
                                  ?.courseEvaluationScore,
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

                                {/* DAY 1 */}

                                <td>
                                  <div
                                    style={{
                                      display:
                                        'flex',
                                      gap: 4,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={
                                        days[0]
                                          ?.status ===
                                        'present'
                                          ? 'admin-btn admin-btn-primary'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          0,
                                          'present',
                                        )
                                      }
                                    >
                                      حاضر
                                    </button>

                                    <button
                                      type="button"
                                      className={
                                        days[0]
                                          ?.status ===
                                        'absent'
                                          ? 'admin-btn admin-btn-danger'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          0,
                                          'absent',
                                        )
                                      }
                                    >
                                      غائب
                                    </button>
                                  </div>
                                </td>

                                {/* DAY 2 */}

                                <td>
                                  <div
                                    style={{
                                      display:
                                        'flex',
                                      gap: 4,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={
                                        days[1]
                                          ?.status ===
                                        'present'
                                          ? 'admin-btn admin-btn-primary'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          1,
                                          'present',
                                        )
                                      }
                                    >
                                      حاضر
                                    </button>

                                    <button
                                      type="button"
                                      className={
                                        days[1]
                                          ?.status ===
                                        'absent'
                                          ? 'admin-btn admin-btn-danger'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          1,
                                          'absent',
                                        )
                                      }
                                    >
                                      غائب
                                    </button>
                                  </div>
                                </td>

                                {/* DAY 3 */}

                                <td>
                                  <div
                                    style={{
                                      display:
                                        'flex',
                                      gap: 4,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={
                                        days[2]
                                          ?.status ===
                                        'present'
                                          ? 'admin-btn admin-btn-primary'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          2,
                                          'present',
                                        )
                                      }
                                    >
                                      حاضر
                                    </button>

                                    <button
                                      type="button"
                                      className={
                                        days[2]
                                          ?.status ===
                                        'absent'
                                          ? 'admin-btn admin-btn-danger'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          2,
                                          'absent',
                                        )
                                      }
                                    >
                                      غائب
                                    </button>
                                  </div>
                                </td>

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
          REPORT MODAL
         ========================= */}

      {reportOpen &&
        selectedGroup && (
          <div className="admin-modal-backdrop">
            <div
              className="admin-modal"
              style={{
                maxWidth: 1200,
              }}
            >
              <div
                className="admin-modal-header"
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                    }}
                  >
                    تقرير المجموعة
                  </h2>

                  <p
                    style={{
                      margin:
                        '6px 0 0',
                      color:
                        '#6b7280',
                    }}
                  >
                    {selectedCompany}
                    {' — '}
                    {
                      selectedGroup.courseTitle
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() =>
                    setReportOpen(false)
                  }
                >
                  ×
                </button>
              </div>

              <div
                className="admin-modal-body"
              >
                {/* COURSE INFORMATION */}

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(4, minmax(0, 1fr))',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      padding: 14,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      الدورة
                    </div>

                    <strong>
                      {
                        selectedGroup.courseTitle
                      }
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      التاريخ
                    </div>

                    <strong>
                      {formatDateLong(selectedStartDate)}

                      {selectedEndDate &&
                        ` — ${formatDateLong(selectedEndDate)}`}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      المكان
                    </div>

                    <strong>
                      {selectedLocation}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      عدد المتدربين
                    </div>

                    <strong>
                      {members.length}
                    </strong>
                  </div>
                </div>

                {/* REPORT TABLE */}

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
                          #
                        </th>

                        <th>
                          المتدرب
                        </th>

                        <th>
                          اليوم 1
                        </th>

                        <th>
                          اليوم 2
                        </th>

                        <th>
                          اليوم 3
                        </th>

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
                          التقدم
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {members.map(
                        (
                          trainee,
                          index,
                        ) => {
                          const enrollment =
                            getEnrollment(
                              trainee,
                              selectedGroup,
                            );

                          const days =
                            enrollment
                              ?.attendanceDays ??
                            [];

                          return (
                            <tr
                              key={
                                trainee.id
                              }
                            >
                              <td>
                                {index + 1}
                              </td>

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
                                {attendanceLabel(
                                  days[0]
                                    ?.status,
                                )}
                              </td>

                              <td>
                                {attendanceLabel(
                                  days[1]
                                    ?.status,
                                )}
                              </td>

                              <td>
                                {attendanceLabel(
                                  days[2]
                                    ?.status,
                                )}
                              </td>

                              <td>
                                {typeof enrollment
                                  ?.preAssessmentScore ===
                                'number'
                                  ? `${enrollment.preAssessmentScore}/100`
                                  : enrollment?.preAssessment ===
                                      'completed'
                                    ? 'مكتمل'
                                    : '—'}
                              </td>

                              <td>
                                {typeof enrollment
                                  ?.postAssessmentScore ===
                                'number'
                                  ? `${enrollment.postAssessmentScore}/100`
                                  : enrollment?.postAssessment ===
                                      'completed'
                                    ? 'مكتمل'
                                    : '—'}
                              </td>

                              <td>
                                {typeof enrollment
                                  ?.courseEvaluationScore ===
                                'number'
                                  ? `${enrollment.courseEvaluationScore}/100`
                                  : enrollment?.courseEvaluation ===
                                      'completed'
                                    ? 'مكتمل'
                                    : '—'}
                              </td>

                              <td>
                                {enrollment?.progress ??
                                  0}
                                %
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                className="admin-modal-footer"
              >
                <button
                  type="button"
                  className="admin-btn admin-btn-light"
                  onClick={() =>
                    setReportOpen(false)
                  }
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() =>
                    window.print()
                  }
                >
                  طباعة التقرير
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
                  <label>المدينة / مكان التنفيذ</label>
                  <input
                    className="admin-input"
                    required
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
                  {form.materialUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                      <span style={{ color: '#067647', fontWeight: 700, fontSize: 12 }}>تم تحديد مادة خاصة لهذه المجموعة.</span>
                      <a href={form.materialUrl} target="_blank" rel="noreferrer" className="admin-btn admin-btn-light" style={{ textDecoration: 'none' }}>معاينة</a>
                      <button type="button" className="admin-btn admin-btn-light" onClick={() => setForm({ ...form, materialUrl: '' })}>إزالة</button>
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