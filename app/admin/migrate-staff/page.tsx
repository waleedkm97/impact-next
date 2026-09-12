'use client';

import { useEffect, useState } from 'react';
import { staffRepository } from '@/lib/data/repositories/staff-repository';
import type { StaffUser } from '@/types/staff';

export default function MigrateStaffPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const result = await staffRepository.findAll();
        setUsers(result);
      } catch (err) {
        console.error(err);
        setError('فشل في قراءة بيانات الموظفين القديمة');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  async function migrateUsers() {
    setMigrating(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'import',
          users,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل نقل الموظفين');
      }

      setMessage(`تم نقل ${result.imported} موظف إلى PostgreSQL بنجاح.`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء نقل الموظفين',
      );
    } finally {
      setMigrating(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40 }}>جاري قراءة الموظفين...</div>;
  }

  return (
    <div
      dir="rtl"
      style={{
        padding: 40,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>نقل الموظفين إلى قاعدة البيانات</h1>

      <p>
        الموظفون الموجودون في النظام القديم:{' '}
        <strong>{users.length}</strong>
      </p>

      {users.length > 0 && (
        <button
          onClick={migrateUsers}
          disabled={migrating}
          style={{
            marginTop: 20,
            padding: '12px 24px',
            border: 0,
            borderRadius: 8,
            background: '#0B2E67',
            color: '#fff',
            cursor: migrating ? 'not-allowed' : 'pointer',
          }}
        >
          {migrating
            ? 'جاري النقل...'
            : 'نقل الموظفين إلى PostgreSQL'}
        </button>
      )}

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

      <div style={{ marginTop: 30 }}>
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
    </div>
  );
}