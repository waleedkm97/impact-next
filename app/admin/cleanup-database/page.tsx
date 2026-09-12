'use client';

import { useEffect, useState } from 'react';

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'coordinator' | 'trainer';
  status: 'active' | 'inactive' | 'suspended';
};

export default function CleanupDatabasePage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/staff');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل تحميل المستخدمين');
      }

      setUsers(result.users);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تحميل المستخدمين',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function deleteNonAdmins() {
    const nonAdmins = users.filter((user) => user.role !== 'admin');

    if (nonAdmins.length === 0) {
      setMessage('لا يوجد موظفون غير مديرين للحذف.');
      return;
    }

    setDeleting(true);
    setMessage('');
    setError('');

    try {
      let deleted = 0;

      for (const user of nonAdmins) {
        const response = await fetch(`/api/staff/${user.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);

          throw new Error(
            result?.error ||
              `فشل حذف المستخدم ${user.email}`,
          );
        }

        deleted++;
      }

      setMessage(`تم حذف ${deleted} مستخدم غير مدير من PostgreSQL بنجاح.`);

      await loadUsers();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء حذف المستخدمين',
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div dir="rtl" style={{ padding: 40 }}>
        جاري قراءة المستخدمين من PostgreSQL...
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        padding: 40,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>تنظيف حسابات الموظفين التجريبية</h1>

      <p style={{ marginTop: 15 }}>
        المستخدمون الموجودون حاليًا في PostgreSQL:{' '}
        <strong>{users.length}</strong>
      </p>

      <div style={{ marginTop: 25 }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 20,
              marginBottom: 15,
            }}
          >
            <p>
              <strong>الاسم:</strong> {user.name}
            </p>

            <p>
              <strong>الإيميل:</strong> {user.email}
            </p>

            <p>
              <strong>الدور:</strong> {user.role}
            </p>

            <p>
              <strong>الحالة:</strong> {user.status}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={deleteNonAdmins}
        disabled={deleting}
        style={{
          marginTop: 15,
          padding: '12px 24px',
          border: 0,
          borderRadius: 8,
          background: '#0B2E67',
          color: '#fff',
          cursor: deleting ? 'not-allowed' : 'pointer',
        }}
      >
        {deleting
          ? 'جاري الحذف...'
          : 'حذف حسابات المنسق والمدرب'}
      </button>

      {message && (
        <p
          style={{
            marginTop: 20,
            fontWeight: 'bold',
          }}
        >
          {message}
        </p>
      )}

      {error && (
        <p
          style={{
            marginTop: 20,
            color: 'red',
            fontWeight: 'bold',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}