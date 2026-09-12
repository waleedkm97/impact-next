'use client';

import { useEffect, useState } from 'react';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import type { Trainee } from '@/types/trainee';

export default function MigrateTraineesPage() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTrainees() {
      try {
        const result = await traineeRepository.findAll();
        setTrainees(result);
      } catch (err) {
        console.error(err);
        setError('فشل في قراءة بيانات المتدربين القديمة');
      } finally {
        setLoading(false);
      }
    }

    loadTrainees();
  }, []);

  if (loading) {
    return <div style={{ padding: 40 }}>جاري قراءة المتدربين...</div>;
  }

  if (error) {
    return (
      <div dir="rtl" style={{ padding: 40 }}>
        <h1>خطأ</h1>
        <p>{error}</p>
      </div>
    );
  }

  const totalEnrollments = trainees.reduce(
    (total, trainee) => total + (trainee.enrollments?.length ?? 0),
    0,
  );

  const totalProgressRecords = trainees.reduce(
    (total, trainee) => total + (trainee.progress?.length ?? 0),
    0,
  );

  const totalCertificates = trainees.reduce(
    (total, trainee) => total + (trainee.certificates?.length ?? 0),
    0,
  );

  const totalAttendanceDays = trainees.reduce(
    (total, trainee) =>
      total +
      (trainee.enrollments ?? []).reduce(
        (enrollmentTotal, enrollment) =>
          enrollmentTotal + (enrollment.attendanceDays?.length ?? 0),
        0,
      ),
    0,
  );

  return (
    <div
      dir="rtl"
      style={{
        padding: 40,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>بيانات المتدربين القديمة</h1>

      <div style={{ marginTop: 20, marginBottom: 30 }}>
        <p>
          عدد المتدربين:{' '}
          <strong>{trainees.length}</strong>
        </p>

        <p>
          إجمالي التسجيلات في الدورات:{' '}
          <strong>{totalEnrollments}</strong>
        </p>

        <p>
          سجلات التقدم:{' '}
          <strong>{totalProgressRecords}</strong>
        </p>

        <p>
          الشهادات:{' '}
          <strong>{totalCertificates}</strong>
        </p>

        <p>
          أيام الحضور:{' '}
          <strong>{totalAttendanceDays}</strong>
        </p>
      </div>

      {trainees.length === 0 ? (
        <p>لا يوجد متدربون في IndexedDB.</p>
      ) : (
        <div>
          {trainees.map((trainee) => (
            <div
              key={trainee.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 20,
                marginBottom: 15,
              }}
            >
              <p>
                <strong>الاسم:</strong>{' '}
                {trainee.profile?.firstName}{' '}
                {trainee.profile?.lastName}
              </p>

              <p>
                <strong>الإيميل:</strong>{' '}
                {trainee.email}
              </p>

              <p>
                <strong>الهاتف:</strong>{' '}
                {trainee.contact?.phone || 'غير موجود'}
              </p>

              <p>
                <strong>الحالة:</strong>{' '}
                {trainee.status}
              </p>

              <p>
                <strong>التسجيلات:</strong>{' '}
                {trainee.enrollments?.length ?? 0}
              </p>

              <p>
                <strong>التقدم:</strong>{' '}
                {trainee.progress?.length ?? 0}
              </p>

              <p>
                <strong>الشهادات:</strong>{' '}
                {trainee.certificates?.length ?? 0}
              </p>

              <p>
                <strong>ID:</strong>{' '}
                {trainee.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}