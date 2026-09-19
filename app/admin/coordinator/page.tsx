'use client';

import { useEffect, useMemo, useState } from 'react';
import { groupRepository } from '@/lib/data/repositories/group-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { staffRepository } from '@/lib/data/repositories/staff-repository';
import type { TrainingGroup } from '@/types/group';
import type { Trainee } from '@/types/trainee';
import type { StaffUser } from '@/types/staff';
import type { StaffPermission } from '@/types/staff';

type AssessmentKey = 'post' | 'evaluation';

const DEFAULT_ASSESSMENT_SETTINGS = {
  pre: { enabled: true },
  post: { enabled: false },
  evaluation: { enabled: false },
};

function getCookie(name: string) {
  if (typeof document === 'undefined') return '';

  const match = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));

  return match
    ? decodeURIComponent(match.split('=').slice(1).join('='))
    : '';
}

function getTraineeName(trainee: Trainee) {
  return (
    `${trainee.profile?.firstName ?? ''} ${trainee.profile?.lastName ?? ''}`.trim() ||
    trainee.email
  );
}
function formatDate(value?: Date | string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('ar-SA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function assessmentLabel(value?: string) {
  if (value === 'completed') return 'مكتمل';
  if (value === 'in_progress') return 'قيد التنفيذ';
  if (value === 'available') return 'متاح';
  return 'غير مكتمل';
}

function assessmentClass(value?: string) {
  return value === 'completed'
    ? 'admin-status admin-status-ok'
    : 'admin-status';
}

function can(permission: StaffUser['permissions'], value: StaffPermission) {
  return permission?.includes(value) ?? false;
}

export default function CoordinatorPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [trainers, setTrainers] = useState<StaffUser[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingAssessment, setSavingAssessment] =
    useState<AssessmentKey | null>(null);
  const [newTraineeId, setNewTraineeId] = useState('');
  const [newTraineeForm, setNewTraineeForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  async function load() {
    setLoading(true);

    try {

    const staffId = getCookie('impact_staff');

    if (!staffId) {
      window.location.href = '/login?next=/admin/coordinator';
      return;
    }

    const currentStaff = await staffRepository.findById(staffId);

    if (
      !currentStaff ||
      currentStaff.status !== 'active' ||
      currentStaff.role !== 'coordinator'
    ) {
      window.location.href = '/admin';
      return;
    }

    const [groupsResponse, traineesResponse, allStaff] = await Promise.all([
      fetch('/api/groups', { cache: 'no-store' }),
      fetch('/api/trainees/admin?activeOnly=true', { cache: 'no-store' }),
      staffRepository.findAll(),
    ]);

    const traineeData = traineesResponse.ok ? await traineesResponse.json() : { trainees: [] };
    const allTrainees = (traineeData.trainees ?? []).map((trainee: any) => ({
      ...trainee,
      profile: { firstName: trainee.firstName ?? '', lastName: trainee.lastName ?? '' },
      contact: { email: trainee.email ?? '', phone: trainee.phone ?? '' },
    }));

    const allGroups: TrainingGroup[] = groupsResponse.ok
      ? (await groupsResponse.json()).map((group: any) => ({
          ...group,
          traineeIds: Array.isArray(group.traineeIds) ? group.traineeIds : [],
          createdAt: new Date(group.createdAt),
          updatedAt: new Date(group.updatedAt),
        }))
      : [];

    setStaff(currentStaff);

    setGroups(
      allGroups.filter(
        (group) =>
          group.type === 'corporate' &&
          group.coordinatorId === currentStaff.id,
      ),
    );

    setTrainees(allTrainees);
    setTrainers(allStaff.filter((item) => item.role === 'trainer'));

    setLoading(false);
    } catch (error) {
      console.error('Failed to load coordinator dashboard:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? null;

  const members = useMemo(() => {
    if (!selectedGroup) return [];

    return trainees.filter((trainee) =>
      selectedGroup.traineeIds.includes(trainee.id),
    );
  }, [selectedGroup, trainees]);

  const assignedTrainer = useMemo(() => {
    if (!selectedGroup?.trainerId) return null;

    return (
      trainers.find((trainer) => trainer.id === selectedGroup.trainerId) ??
      null
    );
  }, [selectedGroup, trainers]);

  function getEnrollment(trainee: Trainee) {
    if (!selectedGroup) return undefined;

    return trainee.enrollments?.find(
      (item) =>
        item.groupId === selectedGroup.id ||
        (item.courseId === selectedGroup.courseId &&
          (!selectedGroup.scheduleId ||
            item.scheduleId === selectedGroup.scheduleId)),
    );
  }

  function getAssessmentSettings() {
    return (
      selectedGroup?.assessmentSettings ??
      DEFAULT_ASSESSMENT_SETTINGS
    );
  }

  async function toggleAssessment(type: AssessmentKey) {
    if (!selectedGroup || !can(staff?.permissions, 'editAssessments')) return;

    setSavingAssessment(type);

    try {
      const current = getAssessmentSettings();

      const nextEnabled =
        !current[type].enabled;

      const response = await fetch(
        `/api/groups/${encodeURIComponent(selectedGroup.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, enabled: nextEnabled }),
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

  async function addTrainee() {
    if (!selectedGroup || !newTraineeId || !can(staff?.permissions, 'createTrainee')) return;
    const response = await fetch(`/api/groups/${selectedGroup.id}/trainees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traineeId: newTraineeId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.error || 'تعذر إضافة المتدرب.');
      return;
    }
    setNewTraineeId('');
    await load();
  }

  async function removeTrainee(traineeId: string) {
    if (!selectedGroup || !can(staff?.permissions, 'deleteTrainee')) return;
    const response = await fetch(`/api/groups/${selectedGroup.id}/trainees`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traineeId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.error || 'تعذر حذف المتدرب.');
      return;
    }
    await load();
  }

  async function createTrainee() {
    if (!can(staff?.permissions, 'createTrainee')) return;
    const response = await fetch('/api/trainees/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTraineeForm, status: 'active', emailVerified: true }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      alert(data?.error || 'تعذر إنشاء المتدرب.');
      return;
    }
    setNewTraineeForm({ firstName: '', lastName: '', email: '', password: '' });
    setNewTraineeId(data.trainee.id);
    await load();
    setTrainees((current) => [
      ...current.filter((item) => item.id !== data.trainee.id),
      {
        ...data.trainee,
        profile: {
          firstName: data.trainee.firstName ?? '',
          lastName: data.trainee.lastName ?? '',
        },
        contact: {
          email: data.trainee.email ?? '',
          phone: data.trainee.phone ?? '',
        },
        enrollments: [],
        progress: [],
        certificates: [],
      },
    ]);
  }

  async function markAttendance(
    trainee: Trainee,
    dayIndex: number,
    status: 'present' | 'absent',
  ) {
    if (!selectedGroup) return;

    const enrollment = getEnrollment(trainee);

    if (!enrollment) {
      alert('لا يوجد تسجيل لهذه الدورة لدى المتدرب.');
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

  if (loading) {
    return (
      <main className="admin-page" dir="rtl">
        <section className="admin-card" style={{ padding: 24 }}>
          جاري تحميل لوحة المنسق...
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">COORDINATOR</div>
          <h1>لوحة المنسق</h1>
          <p>
            مرحبًا {staff?.name}. هنا تظهر المجموعات المسندة لك والمتدربون
            والحضور وحالة التقييمات والمدرب المسؤول.
          </p>
        </div>
      </header>

      <section
        className="admin-card"
        style={{ padding: 22, marginBottom: 18 }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
            }}
          >
            {(selectedGroup?.meetingLink || selectedGroup?.schedule?.onlineMeetingLink || selectedGroup?.course?.meetingLink) && (
              <a
                href={selectedGroup?.meetingLink || selectedGroup?.schedule?.onlineMeetingLink || selectedGroup?.course?.meetingLink || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-primary"
              >
                رابط الحضور
              </a>
            )}

            <div style={{ color: '#6b7280', fontSize: 13 }}>
              المجموعات المسندة
            </div>
            <strong style={{ display: 'block', marginTop: 6, fontSize: 25 }}>
              {groups.length}
            </strong>
          </div>

          <div
            style={{
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
            }}
          >
            <div style={{ color: '#6b7280', fontSize: 13 }}>
              إجمالي المتدربين
            </div>
            <strong style={{ display: 'block', marginTop: 6, fontSize: 25 }}>
              {groups.reduce((total, group) => total + group.traineeIds.length, 0)}
            </strong>
          </div>

          <div
            style={{
              padding: 16,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
            }}
          >
            <div style={{ color: '#6b7280', fontSize: 13 }}>
              المدربون المستخدمون
            </div>
            <strong style={{ display: 'block', marginTop: 6, fontSize: 25 }}>
              {
                new Set(
                  groups
                    .map((group) => group.trainerId)
                    .filter(Boolean),
                ).size
              }
            </strong>
          </div>
        </div>
      </section>

      <section
        className="admin-card"
        style={{ padding: 22, marginBottom: 18 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>المجموعات المسندة لي</h2>
            <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
              لا تظهر هنا إلا المجموعات التي تم تعيينك كمنسق لها.
            </p>
          </div>

          <span className="admin-tag">{groups.length} مجموعة</span>
        </div>

        {groups.length === 0 ? (
          <div className="admin-empty">
            لا توجد مجموعات مسندة لك حاليًا.
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
            {groups.map((group) => {
              const isSelected = group.id === selectedGroupId;
              const trainer = trainers.find(
                (item) => item.id === group.trainerId,
              );

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  style={{
                    textAlign: 'right',
                    padding: 18,
                    border: isSelected
                      ? '2px solid var(--admin-gold)'
                      : '1px solid #e5e7eb',
                    borderRadius: 14,
                    background: isSelected ? '#fffdf5' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      fontSize: 17,
                      marginBottom: 10,
                    }}
                  >
                    {group.courseTitle}
                  </strong>

                  <div
                    style={{
                      display: 'grid',
                      gap: 6,
                      color: '#6b7280',
                      fontSize: 13,
                    }}
                  >
                    <span>المجموعة: {group.name}</span>
                    <span>
                      التاريخ:{' '}
                      {group.corporateDate
                        ? formatDate(`${group.corporateDate}T00:00:00`)
                        : 'يحدد لاحقًا'}
                    </span>
                    <span>
                      المكان: {group.corporateLocation || '—'}
                    </span>
                    <span>
                      المدرب: {trainer?.name || 'غير معين'}
                    </span>
                    <span>المتدربون: {group.traineeIds.length}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedGroup && (
        <section className="admin-card" style={{ padding: 22 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              marginBottom: 18,
              paddingBottom: 16,
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div>
              <div className="eyebrow">GROUP</div>
              <h2 style={{ margin: '4px 0 8px' }}>
                {selectedGroup.courseTitle}
              </h2>

              <p style={{ margin: 0, color: '#6b7280' }}>
                {selectedGroup.name}
              </p>

              {(selectedGroup.meetingLink || selectedGroup.schedule?.onlineMeetingLink || selectedGroup.course?.meetingLink) && (
                <a
                  href={selectedGroup.meetingLink || selectedGroup.schedule?.onlineMeetingLink || selectedGroup.course?.meetingLink || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-primary"
                  style={{ display: 'inline-block', marginTop: 10 }}
                >
                  رابط الحضور
                </a>
              )}

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <span className="admin-tag">
                  التاريخ:{' '}
                  {selectedGroup.corporateDate
                    ? formatDate(
                        `${selectedGroup.corporateDate}T00:00:00`,
                      )
                    : 'يحدد لاحقًا'}
                </span>

                <span className="admin-tag">
                  المكان: {selectedGroup.corporateLocation || '—'}
                </span>

                <span className="admin-tag">
                  المدرب: {assignedTrainer?.name || 'غير معين'}
                </span>

                <span className="admin-tag">
                  {members.length} متدرب
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            {can(staff?.permissions, 'createTrainee') && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 16,
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                }}
              >
                <input className="admin-input" placeholder="الاسم الأول" value={newTraineeForm.firstName} onChange={(e) => setNewTraineeForm({ ...newTraineeForm, firstName: e.target.value })} />
                <input className="admin-input" placeholder="اسم العائلة" value={newTraineeForm.lastName} onChange={(e) => setNewTraineeForm({ ...newTraineeForm, lastName: e.target.value })} />
                <input className="admin-input" type="email" placeholder="البريد" value={newTraineeForm.email} onChange={(e) => setNewTraineeForm({ ...newTraineeForm, email: e.target.value })} />
                <input className="admin-input" type="password" placeholder="كلمة المرور" value={newTraineeForm.password} onChange={(e) => setNewTraineeForm({ ...newTraineeForm, password: e.target.value })} />
                <button type="button" className="admin-btn admin-btn-light" onClick={() => void createTrainee()}>إنشاء متدرب جديد</button>
                <select
                  className="admin-select"
                  value={newTraineeId}
                  onChange={(event) => setNewTraineeId(event.target.value)}
                >
                  <option value="">اختر متدربًا لإضافته</option>
                  {trainees
                    .filter((trainee) => !selectedGroup.traineeIds.includes(trainee.id))
                    .map((trainee) => (
                      <option key={trainee.id} value={trainee.id}>
                        {getTraineeName(trainee)}
                      </option>
                    ))}
                </select>
                <button type="button" className="admin-btn admin-btn-primary" onClick={() => void addTrainee()}>
                  إضافة متدرب
                </button>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 17 }}>
                  التقييمات
                </h3>
                <p
                  style={{
                    margin: '5px 0 0',
                    color: '#6b7280',
                    fontSize: 13,
                  }}
                >
                  يمكنك فتح أو إغلاق التقييم البعدي وتقييم الدورة للمتدربين في هذه المجموعة.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              {[
                ['post', 'التقييم البعدي'],
                ['evaluation', 'تقييم الدورة'],
              ].map(([type, label]) => {
                const key = type as AssessmentKey;
                const enabled =
                  getAssessmentSettings()[key].enabled;

                return (
                  <div
                    key={key}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <strong>{label}</strong>

                      <button
                        type="button"
                        className={
                          enabled
                            ? 'admin-btn admin-btn-primary'
                            : 'admin-btn admin-btn-light'
                        }
                        disabled={savingAssessment === key || !can(staff?.permissions, 'editAssessments')}
                        onClick={() =>
                          void toggleAssessment(key)
                        }
                      >
                        {savingAssessment === key
                          ? 'حفظ...'
                          : enabled
                            ? 'مفتوح'
                            : 'مغلق'}
                      </button>
                    </div>

                    <div
                      style={{
                        marginTop: 7,
                        color: '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      {enabled
                        ? 'التقييم متاح للمتدربين.'
                        : 'التقييم مغلق حاليًا.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {can(staff?.permissions, 'viewTrainingMaterials') && selectedGroup.materialAvailable && (
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  المادة التدريبية
                </h3>
                <p
                  style={{
                    margin: '5px 0 0',
                    color: '#6b7280',
                    fontSize: 13,
                  }}
                >
                  المادة الخاصة بهذه المجموعة.
                </p>
              </div>

              <a
                href={`/api/groups/${encodeURIComponent(selectedGroup.id)}/material`}
                target="_blank"
                rel="noreferrer"
                className="admin-btn admin-btn-primary"
              >
                فتح المادة
              </a>
            </div>
          )}

          {members.length === 0 ? (
            <div className="admin-empty">
              لا يوجد متدربون في هذه المجموعة حاليًا.
            </div>
          ) : (
            <div className="admin-table-card" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المتدرب</th>
                    <th>البريد</th>
                    <th>التقييم القبلي</th>
                    <th>التقييم البعدي</th>
                    <th>تقييم الدورة</th>
                    <th>اليوم 1</th>
                    <th>اليوم 2</th>
                    <th>اليوم 3</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((trainee) => {
                    const enrollment = getEnrollment(trainee);
                    const days = enrollment?.attendanceDays ?? [];

                    return (
                      <tr key={trainee.id}>
                        <td>
                          <strong>{getTraineeName(trainee)}</strong>
                        </td>

                        <td>{trainee.email}</td>

                        <td>
                          <span className={assessmentClass(enrollment?.preAssessment)}>
                            {assessmentLabel(enrollment?.preAssessment)}
                          </span>
                        </td>

                        <td>
                          <span className={assessmentClass(enrollment?.postAssessment)}>
                            {assessmentLabel(enrollment?.postAssessment)}
                          </span>
                        </td>

                        <td>
                          <span className={assessmentClass(enrollment?.courseEvaluation)}>
                            {assessmentLabel(enrollment?.courseEvaluation)}
                          </span>
                        </td>

                        {[0, 1, 2].map((dayIndex) => (
                          <td key={dayIndex}>
                            <div
                              style={{
                                display: 'flex',
                                gap: 4,
                                flexWrap: 'wrap',
                              }}
                            >
                              {can(staff?.permissions, 'manageAttendance') && <button
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
                              </button>}

                              {can(staff?.permissions, 'manageAttendance') && <button
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
                              </button>}

                              {can(staff?.permissions, 'deleteTrainee') && (
                                <button
                                  type="button"
                                  className="admin-btn admin-btn-danger"
                                  onClick={() => void removeTrainee(trainee.id)}
                                >
                                  حذف المتدرب
                                </button>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
