'use client';

import { useEffect, useState } from 'react';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';

interface TraineeForm {
  firstName: string;
  lastName: string;
  firstNameEnglish: string;
  lastNameEnglish: string;
  gender: 'male' | 'female' | '';
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
  gender: '',
  email: '',
  phone: '',
  company: '',
  password: '',
};

function assessmentStatus(
  state: string | undefined,
  score: number | undefined,
) {
  if (state === 'completed') {
    return {
      label: `مكتمل${typeof score === 'number' ? ` — ${score}/100` : ''}`,
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

function formatDate(value?: Date | string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getAnswerEntries(
  answers?: Record<string, string>,
) {
  if (!answers) return [];

  return Object.entries(answers);
}

export default function Students() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<TraineeForm>(initialForm);
  const [search, setSearch] = useState('');
  const [attendanceTrainee, setAttendanceTrainee] = useState<any>(null);
  const [resultsTrainee, setResultsTrainee] = useState<any>(null);

  async function load() {
    await traineeRepository.refresh();
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
      gender: trainee.profile?.gender ?? '',
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
  gender: form.gender || undefined,
},

      contact: {
        email: form.email.trim(),
        phone: form.phone.trim(),
      },

      email: form.email.trim(),

      company: form.company.trim()
        ? {
            companyName: form.company.trim(),
          }
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

    await traineeRepository.ensureAttendanceDays(
      trainee.id,
      enrollment.id ?? enrollment.courseId,
    );

    const refreshed = await traineeRepository.findById(trainee.id);

    setAttendanceTrainee(refreshed);
  }

  async function markAttendance(
    traineeId: string,
    enrollmentId: string,
    dayIndex: number,
    status: 'present' | 'absent',
  ) {
    const updated = await traineeRepository.updateAttendanceDay(
      traineeId,
      enrollmentId,
      dayIndex,
      status,
    );

    setAttendanceTrainee((current: any) =>
      current
        ? {
            ...current,
            enrollments: current.enrollments.map((e: any) =>
              e.id === updated.id ? updated : e,
            ),
          }
        : current,
    );

    await load();
  }

  async function openResults(trainee: any) {
    await traineeRepository.refresh();

    const refreshed = await traineeRepository.findById(trainee.id);

    setResultsTrainee(refreshed ?? trainee);
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

          <p>
            إنشاء وإدارة حسابات المتدربين وبياناتهم وربطهم بالشركات.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={add}
        >
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
                    {trainee.profile?.firstName}{' '}
                    {trainee.profile?.lastName}
                  </strong>
                </td>

                <td>
                  {trainee.profile?.firstNameEnglish ||
                  trainee.profile?.lastNameEnglish
                    ? `${trainee.profile?.firstNameEnglish ?? ''} ${
                        trainee.profile?.lastNameEnglish ?? ''
                      }`.trim()
                    : '—'}
                </td>

                <td>{trainee.email}</td>

                <td>
                  {trainee.company?.companyName || '—'}
                </td>

                <td>
                  {trainee.enrollments?.length ?? 0}
                </td>

                <td>
                  <span className="admin-status admin-status-ok">
                    نشط
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    onClick={() => edit(trainee)}
                  >
                    تعديل
                  </button>{' '}

                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    onClick={() => void openResults(trainee)}
                  >
                    النتائج
                  </button>{' '}

                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    onClick={() => void openAttendance(trainee)}
                  >
                    الحضور
                  </button>{' '}
                  {' '}

<button
                    type="button"
                    className="admin-btn admin-btn-light"
                    onClick={async () => {
                      try {
                        await traineeRepository.refresh();

                        const refreshed = await traineeRepository.findById(
                          trainee.id,
                        );

                        if (!refreshed) {
                          alert('لم يتم العثور على حساب المتدرب.');
                          return;
                        }

                        const enrollments = refreshed.enrollments ?? [];
                        let certificateEnrollment: any = null;

                        for (const enrollment of enrollments) {
                          const certificate =
                            await traineeRepository.issueCertificateIfEligible(
                              refreshed.id,
                              enrollment.id ?? enrollment.courseId,
                            );

                          if (certificate) {
                            certificateEnrollment = enrollment;
                            break;
                          }
                        }

                        if (!certificateEnrollment) {
                          alert(
                            'لا توجد شهادة مستحقة لهذا المتدرب حتى الآن. تأكد من إكمال Pre-Assessment وPost-Assessment وتقييم الدورة، وإكمال التقدم إذا كانت الدورة مسجلة.',
                          );
                          return;
                        }

                        window.open(
                          `/certificate?traineeId=${encodeURIComponent(
                            refreshed.id,
                          )}&courseId=${encodeURIComponent(
                            certificateEnrollment.courseId,
                          )}`,
                          '_blank',
                          'noopener,noreferrer',
                        );
                      } catch (error) {
                        console.error(
                          'Failed to open trainee certificate:',
                          error,
                        );
                        alert('تعذر تجهيز الشهادة. حاول مرة أخرى.');
                      }
                    }}
                  >
                    الشهادة
                  </button>

                  <button
                    type="button"
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

      {/* =========================
          RESULTS MODAL
         ========================= */}

      {resultsTrainee && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal"
            style={{ maxWidth: 900 }}
          >
            <div className="admin-modal-header">
              <div>
                <h2>
                  نتائج المتدرب
                </h2>

                <p style={{ margin: '6px 0 0' }}>
                  {resultsTrainee.profile?.firstName}{' '}
                  {resultsTrainee.profile?.lastName}

                  {resultsTrainee.profile?.firstNameEnglish ||
                  resultsTrainee.profile?.lastNameEnglish
                    ? ` — ${
                        resultsTrainee.profile?.firstNameEnglish ?? ''
                      } ${
                        resultsTrainee.profile?.lastNameEnglish ?? ''
                      }`.trim()
                    : ''}
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setResultsTrainee(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              {(resultsTrainee.enrollments ?? []).length === 0 ? (
                <div
                  style={{
                    padding: 30,
                    textAlign: 'center',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                  }}
                >
                  لا توجد دورات مسجلة لهذا المتدرب.
                </div>
              ) : (
                (resultsTrainee.enrollments ?? []).map(
                  (enrollment: any) => {
                    const pre = assessmentStatus(
                      enrollment.preAssessment,
                      enrollment.preAssessmentScore,
                    );

                    const post = assessmentStatus(
                      enrollment.postAssessment,
                      enrollment.postAssessmentScore,
                    );

                    const evaluation = assessmentStatus(
                      enrollment.courseEvaluation,
                      enrollment.courseEvaluationScore,
                    );

                    const preAnswers = getAnswerEntries(
                      enrollment.preAssessmentAnswers,
                    );

                    const postAnswers = getAnswerEntries(
                      enrollment.postAssessmentAnswers,
                    );

                    const evaluationAnswers = getAnswerEntries(
                      enrollment.courseEvaluationAnswers,
                    );

                    return (
                      <div
                        key={
                          enrollment.id ??
                          enrollment.courseId
                        }
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 14,
                          padding: 20,
                          marginBottom: 18,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            alignItems: 'center',
                            gap: 15,
                            marginBottom: 18,
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                margin: 0,
                              }}
                            >
                              {enrollment.courseTitle}
                            </h3>

                            <div
                              style={{
                                marginTop: 6,
                                color: '#6b7280',
                              }}
                            >
                              التسجيل:{' '}
                              {formatDate(
                                enrollment.enrolledAt,
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              minWidth: 110,
                              textAlign: 'center',
                              padding: 12,
                              borderRadius: 10,
                              background: '#f8fafc',
                            }}
                          >
                            <strong>
                              {enrollment.progress ?? 0}%
                            </strong>

                            <div
                              style={{
                                fontSize: 12,
                                color: '#6b7280',
                              }}
                            >
                              التقدم
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(3, minmax(0, 1fr))',
                            gap: 12,
                          }}
                        >
                          {/* PRE */}

                          <div
                            style={{
                              border:
                                '1px solid #e5e7eb',
                              borderRadius: 12,
                              padding: 16,
                            }}
                          >
                            <strong>
                              Pre-Assessment
                            </strong>

                            <div
                              style={{
                                marginTop: 12,
                              }}
                            >
                              <span
                                className={pre.className}
                              >
                                {pre.label}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop: 10,
                                fontSize: 13,
                                color: '#6b7280',
                              }}
                            >
                              تاريخ الإكمال:{' '}
                              {formatDate(
                                enrollment.preAssessmentCompletedAt,
                              )}
                            </div>
                          </div>

                          {/* POST */}

                          <div
                            style={{
                              border:
                                '1px solid #e5e7eb',
                              borderRadius: 12,
                              padding: 16,
                            }}
                          >
                            <strong>
                              Post-Assessment
                            </strong>

                            <div
                              style={{
                                marginTop: 12,
                              }}
                            >
                              <span
                                className={post.className}
                              >
                                {post.label}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop: 10,
                                fontSize: 13,
                                color: '#6b7280',
                              }}
                            >
                              تاريخ الإكمال:{' '}
                              {formatDate(
                                enrollment.postAssessmentCompletedAt,
                              )}
                            </div>
                          </div>

                          {/* EVALUATION */}

                          <div
                            style={{
                              border:
                                '1px solid #e5e7eb',
                              borderRadius: 12,
                              padding: 16,
                            }}
                          >
                            <strong>
                              Course Evaluation
                            </strong>

                            <div
                              style={{
                                marginTop: 12,
                              }}
                            >
                              <span
                                className={
                                  evaluation.className
                                }
                              >
                                {evaluation.label}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop: 10,
                                fontSize: 13,
                                color: '#6b7280',
                              }}
                            >
                              تاريخ الإكمال:{' '}
                              {formatDate(
                                enrollment.courseEvaluationCompletedAt,
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ANSWERS */}

                        {(preAnswers.length > 0 ||
                          postAnswers.length > 0 ||
                          evaluationAnswers.length >
                            0) && (
                          <details
                            style={{
                              marginTop: 18,
                            }}
                          >
                            <summary
                              style={{
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              عرض إجابات المتدرب
                            </summary>

                            <div
                              style={{
                                marginTop: 14,
                                display: 'grid',
                                gap: 14,
                              }}
                            >
                              {preAnswers.length > 0 && (
                                <div>
                                  <strong>
                                    إجابات Pre-Assessment
                                  </strong>

                                  <div
                                    style={{
                                      marginTop: 8,
                                      display: 'grid',
                                      gap: 6,
                                    }}
                                  >
                                    {preAnswers.map(
                                      ([questionId, answer]) => (
                                        <div
                                          key={questionId}
                                          style={{
                                            padding: 10,
                                            background:
                                              '#f8fafc',
                                            borderRadius: 8,
                                          }}
                                        >
                                          <strong>
                                            {questionId}
                                          </strong>
                                          : {answer}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                              {postAnswers.length > 0 && (
                                <div>
                                  <strong>
                                    إجابات Post-Assessment
                                  </strong>

                                  <div
                                    style={{
                                      marginTop: 8,
                                      display: 'grid',
                                      gap: 6,
                                    }}
                                  >
                                    {postAnswers.map(
                                      ([questionId, answer]) => (
                                        <div
                                          key={questionId}
                                          style={{
                                            padding: 10,
                                            background:
                                              '#f8fafc',
                                            borderRadius: 8,
                                          }}
                                        >
                                          <strong>
                                            {questionId}
                                          </strong>
                                          : {answer}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                              {evaluationAnswers.length >
                                0 && (
                                <div>
                                  <strong>
                                    إجابات Course Evaluation
                                  </strong>

                                  <div
                                    style={{
                                      marginTop: 8,
                                      display: 'grid',
                                      gap: 6,
                                    }}
                                  >
                                    {evaluationAnswers.map(
                                      ([questionId, answer]) => (
                                        <div
                                          key={questionId}
                                          style={{
                                            padding: 10,
                                            background:
                                              '#f8fafc',
                                            borderRadius: 8,
                                          }}
                                        >
                                          <strong>
                                            {questionId}
                                          </strong>
                                          : {answer}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  },
                )
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() => setResultsTrainee(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          ATTENDANCE MODAL
         ========================= */}

      {attendanceTrainee && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal"
            style={{ maxWidth: 760 }}
          >
            <div className="admin-modal-header">
              <h2>
                الحضور —{' '}
                {attendanceTrainee.profile?.firstName}{' '}
                {attendanceTrainee.profile?.lastName}
              </h2>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setAttendanceTrainee(null)
                }
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              {(attendanceTrainee.enrollments ?? []).map(
                (enrollment: any) => (
                  <div
                    key={
                      enrollment.id ??
                      enrollment.courseId
                    }
                    style={{
                      marginBottom: 20,
                    }}
                  >
                    <h3>
                      {enrollment.courseTitle}
                    </h3>

                    <div
                      style={{
                        display: 'grid',
                        gap: 10,
                      }}
                    >
                      {(enrollment.attendanceDays ?? []).map(
                        (day: any, index: number) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              alignItems: 'center',
                              gap: 12,
                              padding: 12,
                              border:
                                '1px solid #e5e7eb',
                              borderRadius: 10,
                            }}
                          >
                            <strong>
                              اليوم {index + 1} —{' '}
                              {new Date(
                                day.date,
                              ).toLocaleDateString(
                                'en-GB',
                              )}
                            </strong>

                            <div
                              style={{
                                display: 'flex',
                                gap: 6,
                              }}
                            >
                              <button
                                type="button"
                                className={`admin-btn ${
                                  day.status ===
                                  'present'
                                    ? 'admin-btn-primary'
                                    : 'admin-btn-light'
                                }`}
                                onClick={() =>
                                  void markAttendance(
                                    attendanceTrainee.id,
                                    enrollment.id ??
                                      enrollment.courseId,
                                    index,
                                    'present',
                                  )
                                }
                              >
                                حاضر
                              </button>

                              <button
                                type="button"
                                className={`admin-btn ${
                                  day.status ===
                                  'absent'
                                    ? 'admin-btn-danger'
                                    : 'admin-btn-light'
                                }`}
                                onClick={() =>
                                  void markAttendance(
                                    attendanceTrainee.id,
                                    enrollment.id ??
                                      enrollment.courseId,
                                    index,
                                    'absent',
                                  )
                                }
                              >
                                غائب
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() =>
                  setAttendanceTrainee(null)
                }
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          ADD / EDIT TRAINEE MODAL
         ========================= */}

      {open && (
        <div className="admin-modal-backdrop">
          <form
            className="admin-modal"
            style={{ maxWidth: 760 }}
            onSubmit={save}
          >
            <div className="admin-modal-header">
              <h2>
                {editing
                  ? 'تعديل متدرب'
                  : 'إضافة متدرب'}
              </h2>

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
                      setForm({
                        ...form,
                        firstName:
                          event.target.value,
                      })
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
                      setForm({
                        ...form,
                        lastName:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    الاسم الأول بالإنجليزي
                  </label>

                  <input
                    className="admin-input"
                    dir="ltr"
                    value={form.firstNameEnglish}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        firstNameEnglish:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    اسم العائلة بالإنجليزي
                  </label>
<div className="admin-field">
  <label>الجنس</label>

  <select
    className="admin-input"
    required
    value={form.gender}
    onChange={(event) =>
      setForm({
        ...form,
        gender: event.target.value as 'male' | 'female' | '',
      })
    }
  >
    <option value="">اختر الجنس</option>
    <option value="male">ذكر</option>
    <option value="female">أنثى</option>
  </select>
</div>
                  <input
                    className="admin-input"
                    dir="ltr"
                    value={form.lastNameEnglish}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        lastNameEnglish:
                          event.target.value,
                      })
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
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>الهاتف</label>

                  <input
                    className="admin-input"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        phone: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>الشركة</label>

                  <input
                    className="admin-input"
                    value={form.company}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        company:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    {editing
                      ? 'كلمة مرور جديدة (اختياري)'
                      : 'كلمة المرور'}
                  </label>

                  <input
                    className="admin-input"
                    type="password"
                    required={!editing}
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password:
                          event.target.value,
                      })
                    }
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

              <button className="admin-btn admin-btn-primary">
                حفظ الحساب
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}