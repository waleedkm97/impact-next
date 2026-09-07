'use client';

import { useEffect, useState } from 'react';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';

interface TraineeForm {
  firstName: string;
  lastName: string;
  firstNameEnglish: string;
  lastNameEnglish: string;
  email: string;
  phone: string;
  company: string;
  password: string;
}

const initialForm: TraineeForm = {
  firstName: '',
  lastName: '',
  firstNameEnglish: '',
  lastNameEnglish: '',
  email: '',
  phone: '',
  company: '',
  password: '',
};

export default function Students() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<TraineeForm>(initialForm);
  const [search, setSearch] = useState('');
  const [attendanceTrainee, setAttendanceTrainee] = useState<any>(null);

  async function load() {
    setItems(await traineeRepository.findAll());
  }

  useEffect(() => {
    void load();
  }, []);

  function add() {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  }

  function edit(trainee: any) {
    setEditing(trainee.id);
    setForm({
      firstName: trainee.profile?.firstName ?? '',
      lastName: trainee.profile?.lastName ?? '',
      firstNameEnglish: trainee.profile?.firstNameEnglish ?? '',
      lastNameEnglish: trainee.profile?.lastNameEnglish ?? '',
      email: trainee.email ?? '',
      phone: trainee.contact?.phone ?? '',
      company: trainee.company?.companyName ?? '',
      password: '',
    });
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();

    const data: any = {
      profile: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        firstNameEnglish: form.firstNameEnglish.trim() || undefined,
        lastNameEnglish: form.lastNameEnglish.trim() || undefined,
      },
      contact: {
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      email: form.email.trim(),
      company: form.company.trim()
        ? { companyName: form.company.trim() }
        : undefined,
      status: 'active',
      emailVerified: true,
    };

    if (form.password) {
      data.passwordHash = form.password;
    }

    if (editing) {
      await traineeRepository.update(editing, data);
    } else {
      if (!form.password) {
        alert('أدخل كلمة المرور.');
        return;
      }

      await traineeRepository.create({
        ...data,
        passwordHash: form.password,
        enrollments: [],
        progress: [],
        certificates: [],
      });
    }

    setOpen(false);
    await load();
  }

  async function openAttendance(trainee: any) {
    const enrollment = trainee.enrollments?.[0];
    if (!enrollment) {
      alert('لا توجد دورة مسجلة لهذا المتدرب.');
      return;
    }
    await traineeRepository.ensureAttendanceDays(trainee.id, enrollment.id ?? enrollment.courseId);
    const refreshed = await traineeRepository.findById(trainee.id);
    setAttendanceTrainee(refreshed);
  }

  async function markAttendance(traineeId: string, enrollmentId: string, dayIndex: number, status: 'present' | 'absent') {
    const updated = await traineeRepository.updateAttendanceDay(traineeId, enrollmentId, dayIndex, status);
    setAttendanceTrainee((current: any) => current ? { ...current, enrollments: current.enrollments.map((e: any) => e.id === updated.id ? updated : e) } : current);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('حذف حساب المتدرب؟')) {
      return;
    }

    await traineeRepository.delete(id);
    await load();
  }

  const visible = items.filter((trainee) => {
    const text = [
      trainee.profile?.firstName,
      trainee.profile?.lastName,
      trainee.profile?.firstNameEnglish,
      trainee.profile?.lastNameEnglish,
      trainee.email,
      trainee.company?.companyName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return !search || text.includes(search.toLowerCase());
  });

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>المتدربون</h1>
          <p>إنشاء وإدارة حسابات المتدربين وبياناتهم وربطهم بالشركات.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={add}>
          + إضافة متدرب
        </button>
      </header>

      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="البحث بالاسم أو البريد أو الشركة..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الاسم بالإنجليزي</th>
              <th>البريد</th>
              <th>الشركة</th>
              <th>الدورات</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((trainee) => (
              <tr key={trainee.id}>
                <td>
                  <strong>
                    {trainee.profile?.firstName} {trainee.profile?.lastName}
                  </strong>
                </td>
                <td>
                  {trainee.profile?.firstNameEnglish || trainee.profile?.lastNameEnglish
                    ? `${trainee.profile?.firstNameEnglish ?? ''} ${trainee.profile?.lastNameEnglish ?? ''}`.trim()
                    : '—'}
                </td>
                <td>{trainee.email}</td>
                <td>{trainee.company?.companyName || '—'}</td>
                <td>{trainee.enrollments?.length ?? 0}</td>
                <td>
                  <span className="admin-status admin-status-ok">نشط</span>
                </td>
                <td>
                  <button
                    className="admin-btn admin-btn-light"
                    onClick={() => edit(trainee)}
                  >
                    تعديل
                  </button>{' '}
                  <button
                    className="admin-btn admin-btn-light"
                    onClick={() => void openAttendance(trainee)}
                  >
                    الحضور
                  </button>{' '}
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => void remove(trainee.id)}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {attendanceTrainee && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: 760 }}>
            <div className="admin-modal-header">
              <h2>الحضور — {attendanceTrainee.profile?.firstName} {attendanceTrainee.profile?.lastName}</h2>
              <button type="button" className="admin-modal-close" onClick={() => setAttendanceTrainee(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              {(attendanceTrainee.enrollments ?? []).map((enrollment: any) => (
                <div key={enrollment.id ?? enrollment.courseId} style={{ marginBottom: 20 }}>
                  <h3>{enrollment.courseTitle}</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {(enrollment.attendanceDays ?? []).map((day: any, index: number) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10 }}>
                        <strong>اليوم {index + 1} — {new Date(day.date).toLocaleDateString('en-GB')}</strong>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className={`admin-btn ${day.status === 'present' ? 'admin-btn-primary' : 'admin-btn-light'}`} onClick={() => void markAttendance(attendanceTrainee.id, enrollment.id ?? enrollment.courseId, index, 'present')}>حاضر</button>
                          <button type="button" className={`admin-btn ${day.status === 'absent' ? 'admin-btn-danger' : 'admin-btn-light'}`} onClick={() => void markAttendance(attendanceTrainee.id, enrollment.id ?? enrollment.courseId, index, 'absent')}>غائب</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-light" onClick={() => setAttendanceTrainee(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="admin-modal-backdrop">
          <form className="admin-modal" style={{ maxWidth: 760 }} onSubmit={save}>
            <div className="admin-modal-header">
              <h2>{editing ? 'تعديل متدرب' : 'إضافة متدرب'}</h2>
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
                  <label>الاسم الأول</label>
                  <input
                    className="admin-input"
                    required
                    value={form.firstName}
                    onChange={(event) =>
                      setForm({ ...form, firstName: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>اسم العائلة</label>
                  <input
                    className="admin-input"
                    required
                    value={form.lastName}
                    onChange={(event) =>
                      setForm({ ...form, lastName: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>الاسم الأول بالإنجليزي</label>
                  <input
                    className="admin-input"
                    dir="ltr"
                    value={form.firstNameEnglish}
                    onChange={(event) =>
                      setForm({ ...form, firstNameEnglish: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>اسم العائلة بالإنجليزي</label>
                  <input
                    className="admin-input"
                    dir="ltr"
                    value={form.lastNameEnglish}
                    onChange={(event) =>
                      setForm({ ...form, lastNameEnglish: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>البريد</label>
                  <input
                    className="admin-input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>الهاتف</label>
                  <input
                    className="admin-input"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>الشركة</label>
                  <input
                    className="admin-input"
                    value={form.company}
                    onChange={(event) => setForm({ ...form, company: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>{editing ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</label>
                  <input
                    className="admin-input"
                    type="password"
                    required={!editing}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </button>
              <button className="admin-btn admin-btn-primary">حفظ الحساب</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
