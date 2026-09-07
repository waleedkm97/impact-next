'use client';

import { useEffect, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { groupRepository } from '@/lib/data/repositories/group-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import type { Course } from '@/types/course';
import type { TrainingGroup } from '@/types/group';
import type { Trainee } from '@/types/trainee';
import type { Schedule } from '@/types/schedule';

type AssessmentKey =
  | 'preAssessment'
  | 'postAssessment'
  | 'courseEvaluation';

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
  if (type === 'preAssessment') {
    return 'التقييم القبلي';
  }

  if (type === 'postAssessment') {
    return 'التقييم البعدي';
  }

  return 'تقييم الدورة';
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [selectedId, setSelectedId] = useState('');
  const [memberId, setMemberId] = useState('');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [savingAssessment, setSavingAssessment] =
    useState<AssessmentKey | null>(null);

  const [form, setForm] = useState({
    name: '',
    courseId: '',
    companyName: '',
    responsibleName: '',
    responsibleEmail: '',
    responsiblePhone: '',
    scheduleId: '',
    notes: '',
  });

  async function load() {
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
        filter: { published: true },
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

    if (!selectedId && groupList[0]) {
      setSelectedId(groupList[0].id);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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

    const group = await groupRepository.create({
      name:
        form.name.trim() ||
        form.companyName.trim() ||
        `مجموعة ${course.title}`,
      type: 'corporate',
      status: 'active',
      courseId: course.id,
      courseTitle: course.title,
      scheduleId:
        form.scheduleId || undefined,
      companyName:
        form.companyName.trim() || undefined,
      responsibleName:
        form.responsibleName.trim() || undefined,
      responsibleEmail:
        form.responsibleEmail.trim() || undefined,
      responsiblePhone:
        form.responsiblePhone.trim() || undefined,
      traineeIds: [],
      notes: form.notes.trim() || undefined,
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

    setSelectedId(group.id);
    setOpen(false);

    resetForm();

    await load();
  }

  async function updateGroup(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!editingId) {
      return;
    }

    const course = courses.find(
      (item) => item.id === form.courseId,
    );

    if (!course) {
      alert('اختر الدورة.');
      return;
    }

    await groupRepository.update(editingId, {
      name:
        form.name.trim() ||
        form.companyName.trim() ||
        `مجموعة ${course.title}`,
      courseId: course.id,
      courseTitle: course.title,
      scheduleId:
        form.scheduleId || undefined,
      companyName:
        form.companyName.trim() || undefined,
      responsibleName:
        form.responsibleName.trim() || undefined,
      responsibleEmail:
        form.responsibleEmail.trim() || undefined,
      responsiblePhone:
        form.responsiblePhone.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });

    setOpen(false);
    setEditingId(null);

    resetForm();

    await load();
  }

  function resetForm() {
    setForm({
      name: '',
      courseId: '',
      companyName: '',
      responsibleName: '',
      responsibleEmail: '',
      responsiblePhone: '',
      scheduleId: '',
      notes: '',
    });
  }

  function startEdit() {
    if (!selected) {
      return;
    }

    setEditingId(selected.id);

    setForm({
      name: selected.name || '',
      courseId: selected.courseId || '',
      companyName:
        selected.companyName || '',
      responsibleName:
        selected.responsibleName || '',
      responsibleEmail:
        selected.responsibleEmail || '',
      responsiblePhone:
        selected.responsiblePhone || '',
      scheduleId:
        selected.scheduleId || '',
      notes: selected.notes || '',
    });

    setOpen(true);
  }

  async function deleteSelected() {
    if (!selected) {
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف مجموعة "${
        selected.companyName || selected.name
      }"؟`,
    );

    if (!confirmed) {
      return;
    }

    await groupRepository.delete(selected.id);

    setSelectedId('');

    await load();
  }

  async function addMember() {
    if (!selectedId || !memberId) {
      return;
    }

    try {
      await groupRepository.addTrainee(
        selectedId,
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
    if (!selectedId) {
      return;
    }

    await groupRepository.removeTrainee(
      selectedId,
      traineeId,
    );

    await load();
  }

  function getSettings() {
    if (!selected?.assessmentSettings) {
      return DEFAULT_ASSESSMENT_SETTINGS;
    }

    return selected.assessmentSettings;
  }

  async function toggleAssessment(
    type: AssessmentKey,
  ) {
    if (!selected) {
      return;
    }

    if (type === 'preAssessment') {
      alert(
        'التقييم القبلي مفتوح تلقائيًا لجميع متدربي المجموعة من البداية.',
      );
      return;
    }

    const settings = getSettings();

    const enabled =
      type === 'postAssessment'
        ? settings.post.enabled
        : settings.evaluation.enabled;

    const nextState = enabled
      ? 'locked'
      : 'available';

    const confirmed = window.confirm(
      enabled
        ? `هل تريد إغلاق ${getAssessmentLabel(
            type,
          )} لجميع متدربي المجموعة؟`
        : `هل تريد إظهار ${getAssessmentLabel(
            type,
          )} لجميع متدربي المجموعة؟`,
    );

    if (!confirmed) {
      return;
    }

    setSavingAssessment(type);

    try {
      const result =
        await groupRepository.setAssessmentForGroup(
          selected.id,
          type,
          nextState,
        );

      setGroups((currentGroups) =>
        currentGroups.map((group) =>
          group.id === result.group.id
            ? result.group
            : group,
        ),
      );

      alert(
        `${getAssessmentLabel(
          type,
        )} أصبح ${
          nextState === 'available'
            ? 'متاحًا'
            : 'مغلقًا'
        } لـ ${result.updatedCount} متدرب.`,
      );

      await load();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر تحديث التقييم.',
      );
    } finally {
      setSavingAssessment(null);
    }
  }

  const selected =
    groups.find(
      (group) => group.id === selectedId,
    ) ?? null;

  const members = selected
    ? trainees.filter((trainee) =>
        selected.traineeIds.includes(
          trainee.id,
        ),
      )
    : [];

  const assessmentSettings =
    selected?.assessmentSettings ??
    DEFAULT_ASSESSMENT_SETTINGS;

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">Admin</div>

          <h1>المجموعات والشركات</h1>

          <p>
            نتعامل مع كل شركة كمجموعة مرتبطة
            بدورة، ثم نضيف موظفيها إلى المجموعة.
          </p>
        </div>

        <button
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setEditingId(null);
            resetForm();
            setOpen(true);
          }}
        >
          + إضافة مجموعة شركة
        </button>
      </header>

      <div className="admin-dashboard-grid">
        <section className="admin-card">
          <div className="admin-modal-header">
            <h2>المجموعات</h2>
          </div>

          <div className="admin-list">
            {groups.length === 0 ? (
              <div className="admin-empty">
                لا توجد مجموعات حتى الآن.
              </div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  className="admin-list-row"
                  style={{
                    textAlign: 'right',
                    border:
                      group.id === selectedId
                        ? '2px solid var(--admin-gold)'
                        : undefined,
                  }}
                  onClick={() =>
                    setSelectedId(group.id)
                  }
                >
                  <strong>
                    {group.companyName ||
                      group.name}
                  </strong>

                  <span>
                    {group.traineeIds.length}{' '}
                    متدرب · {group.courseTitle}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-modal-header">
            <div>
              <h2>
                {selected?.companyName ||
                  selected?.name ||
                  'اختر مجموعة'}
              </h2>

              {selected && (
                <p>{selected.courseTitle}</p>
              )}
            </div>

            {selected && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
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
            )}
          </div>

          {selected ? (
            <div className="admin-modal-body">
              <div
                className="admin-meta"
                style={{ marginBottom: 18 }}
              >
                <span className="admin-tag">
                  {selected.responsibleName ||
                    'بدون مسؤول'}
                </span>

                <span className="admin-tag">
                  {selected.traineeIds.length}{' '}
                  متدرب
                </span>
              </div>

              {/* ========================= */}
              {/* التحكم في التقييمات للمجموعة */}
              {/* ========================= */}

              <div
                className="admin-card"
                style={{
                  marginBottom: 20,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    marginBottom: 16,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 19,
                    }}
                  >
                    التحكم في تقييمات المجموعة
                  </h3>

                  <p
                    style={{
                      marginTop: 6,
                      opacity: 0.75,
                    }}
                  >
                    أي زر هنا يطبق على جميع
                    متدربي هذه المجموعة دفعة واحدة.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                  }}
                >
                  {/* Pre */}

                  <div
                    className="admin-list-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong>
                        التقييم القبلي
                      </strong>

                      <span>
                        مفتوح تلقائيًا من بداية
                        الدورة لجميع المتدربين
                      </span>
                    </div>

                    <span className="admin-tag">
                      مفتوح
                    </span>
                  </div>

                  {/* Post */}

                  <div
                    className="admin-list-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong>
                        التقييم البعدي
                      </strong>

                      <span>
                        التحكم لجميع متدربي
                        المجموعة
                      </span>
                    </div>

                    <button
                      type="button"
                      className={
                        assessmentSettings.post
                          .enabled
                          ? 'admin-btn admin-btn-primary'
                          : 'admin-btn admin-btn-light'
                      }
                      disabled={
                        savingAssessment ===
                        'postAssessment'
                      }
                      onClick={() =>
                        void toggleAssessment(
                          'postAssessment',
                        )
                      }
                    >
                      {savingAssessment ===
                      'postAssessment'
                        ? 'جارٍ التطبيق...'
                        : assessmentSettings.post
                              .enabled
                          ? 'إغلاق للجميع'
                          : 'إظهار للجميع'}
                    </button>
                  </div>

                  {/* Evaluation */}

                  <div
                    className="admin-list-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong>
                        تقييم الدورة
                      </strong>

                      <span>
                        تقييم الدورة والمدرب
                        والمواد
                      </span>
                    </div>

                    <button
                      type="button"
                      className={
                        assessmentSettings
                          .evaluation.enabled
                          ? 'admin-btn admin-btn-primary'
                          : 'admin-btn admin-btn-light'
                      }
                      disabled={
                        savingAssessment ===
                        'courseEvaluation'
                      }
                      onClick={() =>
                        void toggleAssessment(
                          'courseEvaluation',
                        )
                      }
                    >
                      {savingAssessment ===
                      'courseEvaluation'
                        ? 'جارٍ التطبيق...'
                        : assessmentSettings
                              .evaluation
                              .enabled
                          ? 'إغلاق للجميع'
                          : 'إظهار للجميع'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================= */}
              {/* إضافة متدرب */}
              {/* ========================= */}

              <div
                className="admin-form-grid"
                style={{ marginBottom: 18 }}
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
                    اختر متدربًا لإضافته
                  </option>

                  {trainees
                    .filter(
                      (trainee) =>
                        !selected.traineeIds.includes(
                          trainee.id,
                        ),
                    )
                    .map((trainee) => (
                      <option
                        key={trainee.id}
                        value={trainee.id}
                      >
                        {
                          trainee.profile
                            .firstName
                        }{' '}
                        {
                          trainee.profile
                            .lastName
                        }{' '}
                        — {trainee.email}
                      </option>
                    ))}
                </select>

                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() =>
                    void addMember()
                  }
                >
                  إضافة للمجموعة
                </button>
              </div>

              {/* ========================= */}
              {/* المتدربون */}
              {/* ========================= */}

              <div className="admin-list">
                {members.length === 0 ? (
                  <div className="admin-empty">
                    لم تتم إضافة متدربين لهذه
                    المجموعة.
                  </div>
                ) : (
                  members.map((trainee) => (
                    <div
                      className="admin-list-row"
                      key={trainee.id}
                    >
                      <div>
                        <strong>
                          {
                            trainee.profile
                              .firstName
                          }{' '}
                          {
                            trainee.profile
                              .lastName
                          }
                        </strong>

                        <span>
                          {trainee.email}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          className="admin-btn admin-btn-light"
                          onClick={() => {
                            const enrollment =
                              trainee.enrollments.find(
                                (item) =>
                                  item.groupId ===
                                  selected.id,
                              );

                            if (
                              enrollment
                            ) {
                              void traineeRepository
                                .updateAttendance(
                                  trainee.id,
                                  enrollment.id ??
                                    enrollment.courseId,
                                  'present',
                                )
                                .then(load);
                            }
                          }}
                        >
                          حاضر
                        </button>

                        <button
                          type="button"
                          className="admin-btn admin-btn-light"
                          onClick={() => {
                            const enrollment =
                              trainee.enrollments.find(
                                (item) =>
                                  item.groupId ===
                                  selected.id,
                              );

                            if (
                              enrollment
                            ) {
                              void traineeRepository
                                .updateAttendance(
                                  trainee.id,
                                  enrollment.id ??
                                    enrollment.courseId,
                                  'absent',
                                )
                                .then(load);
                            }
                          }}
                        >
                          غائب
                        </button>

                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() =>
                            void removeMember(
                              trainee.id,
                            )
                          }
                        >
                          إزالة
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="admin-empty">
              اختر مجموعة لعرض المتدربين.
            </div>
          )}
        </section>
      </div>

      {/* ========================= */}
      {/* نافذة المجموعة */}
      {/* ========================= */}

      {open && (
        <div className="admin-modal-backdrop">
          <form
            className="admin-modal"
            style={{ maxWidth: 760 }}
            onSubmit={
              editingId
                ? updateGroup
                : createGroup
            }
          >
            <div className="admin-modal-header">
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

            <div className="admin-modal-body">
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
                        name: event.target.value,
                      })
                    }
                    placeholder="يُستخدم اسم الشركة تلقائيًا إذا تركته فارغًا"
                  />
                </div>

                <div className="admin-field">
                  <label>الدورة</label>

                  <select
                    className="admin-select"
                    required
                    value={form.courseId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        courseId:
                          event.target.value,
                      })
                    }
                  >
                    <option value="">
                      اختر الدورة
                    </option>

                    {courses.map((course) => (
                      <option
                        key={course.id}
                        value={course.id}
                      >
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-field">
                  <label>الموعد</label>

                  <select
                    className="admin-select"
                    value={form.scheduleId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        scheduleId:
                          event.target.value,
                      })
                    }
                  >
                    <option value="">
                      بدون موعد محدد
                    </option>

                    {schedules
                      .filter(
                        (schedule) =>
                          schedule.courseId ===
                          form.courseId,
                      )
                      .map((schedule) => (
                        <option
                          key={schedule.id}
                          value={schedule.id}
                        >
                          {schedule.startDate.toLocaleDateString(
                            'ar-SA',
                          )}{' '}
                          —{' '}
                          {schedule.city ||
                            'أونلاين'}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="admin-field">
                  <label>اسم الشركة</label>

                  <input
                    className="admin-input"
                    required
                    value={form.companyName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        companyName:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    اسم المسؤول
                  </label>

                  <input
                    className="admin-input"
                    value={form.responsibleName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsibleName:
                          event.target.value,
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
                    value={form.responsibleEmail}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsibleEmail:
                          event.target.value,
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
                    value={form.responsiblePhone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsiblePhone:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                className="admin-field"
                style={{ marginTop: 14 }}
              >
                <label>ملاحظات</label>

                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="admin-modal-footer">
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