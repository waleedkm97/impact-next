'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { groupRepository } from '@/lib/data/repositories/group-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { staffRepository } from '@/lib/data/repositories/staff-repository';
import type { TrainingGroup } from '@/types/group';
import type { Trainee } from '@/types/trainee';
import type { StaffUser } from '@/types/staff';
import type { StaffPermission } from '@/types/staff';

function can(permission: StaffUser['permissions'], value: StaffPermission) {
  return permission?.includes(value) ?? false;
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}

function getTraineeName(trainee: Trainee) {
  return `${trainee.profile?.firstName ?? ''} ${trainee.profile?.lastName ?? ''}`.trim() || trainee.email;
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

export default function TrainerPage() {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [newTraineeId, setNewTraineeId] = useState('');
  const [newTraineeForm, setNewTraineeForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  async function load() {
    setLoading(true);

    try {

    const staffId = getCookie('impact_staff');
    if (!staffId) {
      window.location.href = '/login?next=/admin/trainer';
      return;
    }

    const currentStaff = await staffRepository.findById(staffId);

    if (!currentStaff || currentStaff.status !== 'active' || currentStaff.role !== 'trainer') {
      window.location.href = '/admin';
      return;
    }

    const [groupsResponse, traineesResponse] = await Promise.all([
      fetch('/api/groups', { cache: 'no-store' }),
      fetch('/api/trainees/admin?activeOnly=true', { cache: 'no-store' }),
    ]);

    const allGroups: TrainingGroup[] = groupsResponse.ok ? (await groupsResponse.json()).map((group: any) => ({
      ...group,
      traineeIds: Array.isArray(group.traineeIds) ? group.traineeIds : [],
      createdAt: new Date(group.createdAt),
      updatedAt: new Date(group.updatedAt),
    })) : [];
    const traineeData = traineesResponse.ok ? await traineesResponse.json() : { trainees: [] };
    const allTrainees = (traineeData.trainees ?? []).map((trainee: any) => ({
      ...trainee,
      profile: { firstName: trainee.firstName ?? '', lastName: trainee.lastName ?? '' },
      contact: { email: trainee.email ?? '', phone: trainee.phone ?? '' },
    }));

    setStaff(currentStaff);
    setGroups(
      allGroups.filter(
        (group) =>
          group.type === 'corporate' &&
          group.trainerId === currentStaff.id,
      ),
    );
    setTrainees(allTrainees);
    setLoading(false);
    } catch (error) {
      console.error('Failed to load trainer dashboard:', error);
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

  async function markAttendance(
    trainee: Trainee,
    dayIndex: number,
    status: 'present' | 'absent',
  ) {
    if (!selectedGroup || !can(staff?.permissions, 'manageAttendance')) return;

    const enrollment = trainee.enrollments?.find(
      (item) =>
        item.groupId === selectedGroup.id ||
        (item.courseId === selectedGroup.courseId &&
          (!selectedGroup.scheduleId ||
            item.scheduleId === selectedGroup.scheduleId)),
    );

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

  if (loading) {
    return (
      <main className="admin-page" dir="rtl">
        <section className="admin-card" style={{ padding: 24 }}>
          جاري تحميل لوحة المدرب...
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">TRAINER</div>
          <h1>لوحة المدرب</h1>
          <p>
            مرحبًا {staff?.name}. هنا تظهر المجموعات المسندة لك والمتدربون
            والحضور.
          </p>
        </div>
      </header>

      <section className="admin-card" style={{ padding: 22, marginBottom: 18 }}>
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
              لا تظهر هنا إلا المجموعات التي تم تعيينك كمدرب لها.
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {groups.map((group) => {
              const isSelected = group.id === selectedGroupId;

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
            </div>

            <span className="admin-tag">
              {members.length} متدرب
            </span>
          </div>

          {can(staff?.permissions, 'viewTrainingMaterials') && selectedGroup.materialAvailable && (
            <div style={{ marginBottom: 18, padding: 14, border: '1px solid #e5e7eb', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>المادة التدريبية</strong>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>المادة الخاصة بالمجموعة.</p>
              </div>
              <a href={`/api/groups/${encodeURIComponent(selectedGroup.id)}/material`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-primary">فتح المادة</a>
            </div>
          )}

          {(selectedGroup.meetingLink || selectedGroup.schedule?.onlineMeetingLink || selectedGroup.course?.meetingLink) && (
            <a
              href={selectedGroup.meetingLink || selectedGroup.schedule?.onlineMeetingLink || selectedGroup.course?.meetingLink || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-primary"
            >
              رابط الحضور
            </a>
          )}

          {members.length === 0 ? (
            <div className="admin-empty">
              لا يوجد متدربون في هذه المجموعة حاليًا.
            </div>
          ) : (
            <>
            {can(staff?.permissions, 'createTrainee') && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input className="admin-input" placeholder="الاسم الأول" value={newTraineeForm.firstName} onChange={(e) => setNewTraineeForm({ ...newTraineeForm, firstName: e.target.value })} />
                <input className="admin-input" placeholder="اسم العائلة" value={newTraineeForm.lastName} onChange={(e) => setNewTraineeForm({ ...newTraineeForm, lastName: e.target.value })} />
                <input className="admin-input" type="email" placeholder="البريد" value={newTraineeForm.email} onChange={(e) => setNewTraineeForm({ ...newTraineeForm, email: e.target.value })} />
                <input className="admin-input" type="password" placeholder="كلمة المرور" value={newTraineeForm.password} onChange={(e) => setNewTraineeForm({ ...newTraineeForm, password: e.target.value })} />
                <button type="button" className="admin-btn admin-btn-light" onClick={() => void createTrainee()}>إنشاء متدرب جديد</button>
                <select className="admin-select" value={newTraineeId} onChange={(event) => setNewTraineeId(event.target.value)}>
                  <option value="">اختر متدربًا لإضافته</option>
                  {trainees.filter((trainee) => !selectedGroup.traineeIds.includes(trainee.id)).map((trainee) => (
                    <option key={trainee.id} value={trainee.id}>{getTraineeName(trainee)}</option>
                  ))}
                </select>
                <button type="button" className="admin-btn admin-btn-primary" onClick={() => void addTrainee()}>إضافة متدرب</button>
              </div>
            )}
            <div className="admin-table-card" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المتدرب</th>
                    <th>البريد</th>
                    <th>اليوم 1</th>
                    <th>اليوم 2</th>
                    <th>اليوم 3</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((trainee) => {
                    const enrollment = trainee.enrollments?.find(
                      (item) =>
                        item.groupId === selectedGroup.id ||
                        (item.courseId === selectedGroup.courseId &&
                          (!selectedGroup.scheduleId ||
                            item.scheduleId === selectedGroup.scheduleId)),
                    );

                    const days = enrollment?.attendanceDays ?? [];

                    return (
                      <tr key={trainee.id}>
                        <td>
                          <strong>{getTraineeName(trainee)}</strong>
                        </td>
                        <td>{trainee.email}</td>

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
                                style={{ padding: '5px 8px', fontSize: 12 }}
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
                                style={{ padding: '5px 8px', fontSize: 12 }}
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
                                <button type="button" className="admin-btn admin-btn-danger" onClick={() => void removeTrainee(trainee.id)}>
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
            </>
          )}
        </section>
      )}
    </main>
  );
}
