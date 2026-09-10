'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import type {
  StaffRole,
  StaffStatus,
  StaffUser,
} from '@/types/staff';

import { staffRepository } from '@/lib/data/repositories/staff-repository';

function getStaffSessionId() {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie
    .split('; ')
    .find((cookie) =>
      cookie.startsWith('impact_staff='),
    );

  if (!match) {
    return null;
  }

  return decodeURIComponent(
    match.split('=').slice(1).join('='),
  );
}

function getRoleLabel(role: StaffRole) {
  switch (role) {
    case 'admin':
      return 'مدير النظام';

    case 'coordinator':
      return 'منسق';

    case 'trainer':
      return 'مدرب';

    default:
      return role;
  }
}

function getStatusLabel(status: StaffStatus) {
  switch (status) {
    case 'active':
      return 'نشط';

    case 'inactive':
      return 'غير نشط';

    case 'suspended':
      return 'موقوف';

    default:
      return status;
  }
}

function formatDate(value?: Date) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: StaffRole;
  status: StaffStatus;
};

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'coordinator',
  status: 'active',
};

export default function UsersPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<StaffUser | null>(null);

  const [users, setUsers] =
    useState<StaffUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [search, setSearch] =
    useState('');

  const [roleFilter, setRoleFilter] =
    useState<StaffRole | ''>('');

  const [statusFilter, setStatusFilter] =
    useState<StaffStatus | ''>('');

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const sessionId =
        getStaffSessionId();

      if (!sessionId) {
        router.replace(
          '/login?next=/admin/users',
        );
        return;
      }

      const me =
        await staffRepository.findById(
          sessionId,
        );

      if (!me) {
        router.replace(
          '/login?next=/admin/users',
        );
        return;
      }

      if (me.role !== 'admin') {
        router.replace('/admin');
        return;
      }

      const allUsers =
        await staffRepository.findAll({
          sort: 'createdAt',
          order: 'desc',
        });

      setCurrentUser(me);
      setUsers(allUsers);
    } catch (err) {
      console.error(
        'Failed to load staff users:',
        err,
      );

      setError(
        'تعذر تحميل مستخدمي النظام.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return users.filter((user) => {
        const matchesSearch =
          !query ||
          user.name
            .toLowerCase()
            .includes(query) ||
          user.email
            .toLowerCase()
            .includes(query) ||
          (user.phone ?? '')
            .toLowerCase()
            .includes(query);

        const matchesRole =
          !roleFilter ||
          user.role === roleFilter;

        const matchesStatus =
          !statusFilter ||
          user.status === statusFilter;

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );
      });
    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ]);

  function openCreate() {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setMessage('');
    setError('');
    setShowForm(true);
  }

  function openEdit(user: StaffUser) {
    setEditingId(user.id);

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      password: '',
      role: user.role,
      status: user.status,
    });

    setMessage('');
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm({
      ...emptyForm,
    });
  }

  async function saveUser(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (!form.name.trim()) {
        throw new Error(
          'اسم المستخدم مطلوب.',
        );
      }

      if (!form.email.trim()) {
        throw new Error(
          'البريد الإلكتروني مطلوب.',
        );
      }

      if (!editingId && !form.password) {
        throw new Error(
          'كلمة المرور مطلوبة عند إنشاء مستخدم جديد.',
        );
      }

      if (editingId) {
        const updates: Parameters<
          typeof staffRepository.update
        >[1] = {
          name: form.name.trim(),
          email:
            form.email.trim().toLowerCase(),
          phone:
            form.phone.trim() ||
            undefined,
          role: form.role,
          status: form.status,
        };

        if (form.password) {
          updates.passwordHash =
            form.password;
        }

        await staffRepository.update(
          editingId,
          updates,
        );

        setMessage(
          'تم تحديث بيانات المستخدم بنجاح.',
        );
      } else {
        await staffRepository.create({
          name: form.name.trim(),
          email:
            form.email.trim().toLowerCase(),
          phone:
            form.phone.trim() ||
            undefined,
          password: form.password,
          role: form.role,
          status: form.status,
          assignedGroupIds: [],
        });

        setMessage(
          'تم إنشاء المستخدم بنجاح.',
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm({
        ...emptyForm,
      });

      await loadData();
    } catch (err) {
      console.error(
        'Failed to save staff user:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'تعذر حفظ المستخدم.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    user: StaffUser,
  ) {
    if (
      currentUser &&
      user.id === currentUser.id
    ) {
      setError(
        'لا يمكنك تعطيل حسابك الحالي من هنا.',
      );
      return;
    }

    setError('');
    setMessage('');

    try {
      const nextStatus =
        user.status === 'active'
          ? 'inactive'
          : 'active';

      await staffRepository.update(
        user.id,
        {
          status: nextStatus,
        },
      );

      setMessage(
        nextStatus === 'active'
          ? 'تم تفعيل المستخدم.'
          : 'تم تعطيل المستخدم.',
      );

      await loadData();
    } catch (err) {
      console.error(
        'Failed to change status:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحديث حالة المستخدم.',
      );
    }
  }

  async function deleteUser(
    user: StaffUser,
  ) {
    if (
      currentUser &&
      user.id === currentUser.id
    ) {
      setError(
        'لا يمكنك حذف حسابك الحالي.',
      );
      return;
    }

    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف المستخدم "${user.name}"؟\n\nلا يمكن التراجع عن هذه العملية.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(user.id);
    setError('');
    setMessage('');

    try {
      await staffRepository.delete(
        user.id,
      );

      setMessage(
        'تم حذف المستخدم.',
      );

      await loadData();
    } catch (err) {
      console.error(
        'Failed to delete staff user:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'تعذر حذف المستخدم.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          padding: 32,
        }}
      >
        <div className="admin-card">
          جاري تحميل مستخدمي النظام...
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main
      dir="rtl"
      style={{
        padding: 24,
        maxWidth: 1400,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'flex-start',
          gap: 20,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#B58A3A',
              marginBottom: 6,
            }}
          >
            إدارة النظام
          </div>

          <h1
            style={{
              margin: 0,
              color: '#0B2E67',
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            مستخدمو النظام
          </h1>

          <p
            style={{
              margin:
                '8px 0 0',
              color: '#6b7280',
              fontSize: 14,
            }}
          >
            إدارة حسابات المديرين والمنسقين
            والمدربين وصلاحيات الوصول.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={openCreate}
        >
          + إضافة مستخدم
        </button>
      </div>

      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#ecfdf5',
            border:
              '1px solid #a7f3d0',
            color: '#065f46',
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#fef2f2',
            border:
              '1px solid #fecaca',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      <section
        className="admin-card"
        style={{
          padding: 18,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(220px, 1fr) 180px 180px auto',
            gap: 10,
            alignItems: 'end',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              بحث
            </label>

            <input
              className="admin-input"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="الاسم أو البريد أو الجوال"
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              الدور
            </label>

            <select
              className="admin-select"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target
                    .value as StaffRole | '',
                )
              }
            >
              <option value="">
                جميع الأدوار
              </option>

              <option value="admin">
                مدير النظام
              </option>

              <option value="coordinator">
                منسق
              </option>

              <option value="trainer">
                مدرب
              </option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              الحالة
            </label>

            <select
              className="admin-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StaffStatus | '',
                )
              }
            >
              <option value="">
                جميع الحالات
              </option>

              <option value="active">
                نشط
              </option>

              <option value="inactive">
                غير نشط
              </option>

              <option value="suspended">
                موقوف
              </option>
            </select>
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-light"
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
            }}
          >
            مسح
          </button>
        </div>
      </section>

      <section
        className="admin-card"
        style={{
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding:
              '18px 20px',
            borderBottom:
              '1px solid #e5e7eb',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                color: '#0B2E67',
              }}
            >
              المستخدمون
            </h2>

            <p
              style={{
                margin:
                  '4px 0 0',
                fontSize: 13,
                color: '#6b7280',
              }}
            >
              {filteredUsers.length} مستخدم
            </p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            لا توجد نتائج مطابقة.
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse:
                  'collapse',
                minWidth: 850,
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      '#f8fafc',
                    textAlign: 'right',
                  }}
                >
                  <th style={thStyle}>
                    المستخدم
                  </th>

                  <th style={thStyle}>
                    البريد
                  </th>

                  <th style={thStyle}>
                    الدور
                  </th>

                  <th style={thStyle}>
                    الحالة
                  </th>

                  <th style={thStyle}>
                    آخر دخول
                  </th>

                  <th style={thStyle}>
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map(
                  (user) => {
                    const isMe =
                      currentUser.id ===
                      user.id;

                    return (
                      <tr
                        key={user.id}
                        style={{
                          borderTop:
                            '1px solid #e5e7eb',
                        }}
                      >
                        <td
                          style={tdStyle}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color:
                                '#111827',
                            }}
                          >
                            {user.name}
                            {isMe && (
                              <span
                                style={{
                                  marginRight: 8,
                                  fontSize: 11,
                                  color:
                                    '#B58A3A',
                                  fontWeight: 700,
                                }}
                              >
                                حسابك
                              </span>
                            )}
                          </div>

                          {user.phone && (
                            <div
                              style={{
                                marginTop: 3,
                                fontSize: 12,
                                color:
                                  '#6b7280',
                              }}
                            >
                              {user.phone}
                            </div>
                          )}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          {user.email}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          <span
                            style={{
                              display:
                                'inline-flex',
                              padding:
                                '5px 10px',
                              borderRadius: 999,
                              background:
                                user.role ===
                                'admin'
                                  ? '#e8eef8'
                                  : user.role ===
                                      'coordinator'
                                    ? '#fff7e6'
                                    : '#eef7f2',
                              color:
                                user.role ===
                                'admin'
                                  ? '#0B2E67'
                                  : user.role ===
                                      'coordinator'
                                    ? '#8a641c'
                                    : '#17633a',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {getRoleLabel(
                              user.role,
                            )}
                          </span>
                        </td>

                        <td
                          style={tdStyle}
                        >
                          <span
                            style={{
                              display:
                                'inline-flex',
                              alignItems:
                                'center',
                              gap: 5,
                              color:
                                user.status ===
                                'active'
                                  ? '#166534'
                                  : '#991b1b',
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius:
                                  '50%',
                                background:
                                  user.status ===
                                  'active'
                                    ? '#22c55e'
                                    : '#ef4444',
                              }}
                            />

                            {getStatusLabel(
                              user.status,
                            )}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color:
                              '#6b7280',
                            fontSize: 12,
                          }}
                        >
                          {formatDate(
                            user.lastLoginAt,
                          )}
                        </td>

                        <td
                          style={tdStyle}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              flexWrap:
                                'wrap',
                              gap: 7,
                            }}
                          >
                            <button
                              type="button"
                              className="admin-btn admin-btn-light"
                              onClick={() =>
                                openEdit(
                                  user,
                                )
                              }
                            >
                              تعديل
                            </button>

                            {!isMe && (
                              <>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn-light"
                                  onClick={() =>
                                    void toggleStatus(
                                      user,
                                    )
                                  }
                                >
                                  {user.status ===
                                  'active'
                                    ? 'تعطيل'
                                    : 'تفعيل'}
                                </button>

                                <button
                                  type="button"
                                  className="admin-btn"
                                  style={{
                                    border:
                                      '1px solid #fecaca',
                                    color:
                                      '#b91c1c',
                                    background:
                                      '#fff',
                                  }}
                                  disabled={
                                    deletingId ===
                                    user.id
                                  }
                                  onClick={() =>
                                    void deleteUser(
                                      user,
                                    )
                                  }
                                >
                                  {deletingId ===
                                  user.id
                                    ? 'حذف...'
                                    : 'حذف'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(15, 23, 42, 0.48)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            padding: 20,
          }}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <form
            onSubmit={saveUser}
            style={{
              width: '100%',
              maxWidth: 620,
              background:
                '#ffffff',
              borderRadius: 18,
              boxShadow:
                '0 20px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding:
                  '20px 22px',
                borderBottom:
                  '1px solid #e5e7eb',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: '#0B2E67',
                  fontSize: 22,
                }}
              >
                {editingId
                  ? 'تعديل المستخدم'
                  : 'إضافة مستخدم جديد'}
              </h2>

              <p
                style={{
                  margin:
                    '6px 0 0',
                  color: '#6b7280',
                  fontSize: 13,
                }}
              >
                {editingId
                  ? 'حدّث بيانات الحساب والدور والحالة.'
                  : 'أنشئ حسابًا جديدًا لأحد أعضاء فريق العمل.'}
              </p>
            </div>

            <div
              style={{
                padding: 22,
                display: 'grid',
                gap: 15,
              }}
            >
              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  الاسم
                </label>

                <input
                  className="admin-input"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target
                        .value,
                    })
                  }
                  placeholder="مثال: أحمد محمد"
                />
              </div>

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    البريد الإلكتروني
                  </label>

                  <input
                    className="admin-input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        email:
                          event.target
                            .value,
                      })
                    }
                    placeholder="name@impact.sa"
                  />
                </div>

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    رقم الجوال
                  </label>

                  <input
                    className="admin-input"
                    type="tel"
                    value={form.phone}
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        phone:
                          event.target
                            .value,
                      })
                    }
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label
                  style={
                    labelStyle
                  }
                >
                  كلمة المرور
                </label>

                <input
                  className="admin-input"
                  type="password"
                  required={!editingId}
                  value={form.password}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      password:
                        event.target
                          .value,
                    })
                  }
                  placeholder={
                    editingId
                      ? 'اتركها فارغة للإبقاء على الحالية'
                      : 'كلمة المرور'
                  }
                />

                {editingId && (
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 12,
                      color:
                        '#6b7280',
                    }}
                  >
                    عند التعديل، اترك الحقل
                    فارغًا إذا لم ترد تغيير
                    كلمة المرور.
                  </div>
                )}
              </div>

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    الدور
                  </label>

                  <select
                    className="admin-select"
                    value={form.role}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role:
                          event.target
                            .value as StaffRole,
                      })
                    }
                  >
                    <option value="coordinator">
                      منسق
                    </option>

                    <option value="trainer">
                      مدرب
                    </option>

                    <option value="admin">
                      مدير النظام
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    style={
                      labelStyle
                    }
                  >
                    الحالة
                  </label>

                  <select
                    className="admin-select"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status:
                          event.target
                            .value as StaffStatus,
                      })
                    }
                  >
                    <option value="active">
                      نشط
                    </option>

                    <option value="inactive">
                      غير نشط
                    </option>

                    <option value="suspended">
                      موقوف
                    </option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  padding: 13,
                  borderRadius: 10,
                  background:
                    '#f8fafc',
                  border:
                    '1px solid #e5e7eb',
                  fontSize: 12,
                  lineHeight: 1.8,
                  color:
                    '#475569',
                }}
              >
                <strong>
                  {getRoleLabel(
                    form.role,
                  )}
                </strong>

                {form.role ===
                  'coordinator' && (
                  <>
                    {' '}
                    — سيتمكن المنسق لاحقًا
                    من متابعة المجموعات والمدربين
                    والمتدربين والحضور والتقارير
                    المخصصة له.
                  </>
                )}

                {form.role ===
                  'trainer' && (
                  <>
                    {' '}
                    — سيتمكن المدرب لاحقًا
                    من الوصول إلى المجموعات
                    المخصصة له وتسجيل الحضور
                    ومتابعة المتدربين.
                  </>
                )}

                {form.role === 'admin' && (
                  <>
                    {' '}
                    — لديه صلاحيات إدارة النظام
                    كاملة.
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                padding:
                  '16px 22px',
                borderTop:
                  '1px solid #e5e7eb',
                display: 'flex',
                justifyContent:
                  'flex-start',
                gap: 10,
              }}
            >
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={saving}
              >
                {saving
                  ? 'جاري الحفظ...'
                  : editingId
                    ? 'حفظ التعديلات'
                    : 'إنشاء المستخدم'}
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={closeForm}
                disabled={saving}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: '13px 16px',
  fontSize: 12,
  fontWeight: 800,
  color: '#475569',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  verticalAlign: 'middle',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 6,
  color: '#374151',
};