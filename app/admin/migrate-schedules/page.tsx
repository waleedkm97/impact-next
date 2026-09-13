'use client';

import { useEffect, useState } from 'react';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import type { Schedule } from '@/types/schedule';

export default function MigrateSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState('');

  async function loadSchedules() {
    try {
      setLoading(true);
      setMessage('');

      const list = await scheduleRepository.findAll({
        sort: 'startDate',
        order: 'asc',
      });

      setSchedules(list);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      setMessage('حدث خطأ أثناء تحميل المواعيد.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedules();
  }, []);

  async function migrateSchedules() {
    if (schedules.length === 0) {
      setMessage('لا توجد مواعيد لترحيلها.');
      return;
    }

    const confirmed = window.confirm(
      `سيتم ترحيل ${schedules.length} موعد إلى PostgreSQL. هل تريد المتابعة؟`,
    );

    if (!confirmed) return;

    try {
      setMigrating(true);
      setMessage('');

      const response = await fetch('/api/migrate-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedules,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || 'Schedule migration failed',
        );
      }

      setMessage(
        `تم الترحيل بنجاح: ${result.imported} موعد، وتم تخطي ${result.skipped} من أصل ${result.total}.`,
      );
    } catch (error) {
      console.error('Migration failed:', error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء الترحيل.',
      );
    } finally {
      setMigrating(false);
    }
  }

  const cities = Array.from(
    new Set(
      schedules
        .map((schedule) => schedule.city)
        .filter(Boolean),
    ),
  );

  const onlineCount = schedules.filter(
    (schedule) =>
      schedule.city === 'Online' ||
      schedule.city === 'أونلاين' ||
      Boolean(schedule.onlineMeetingLink),
  ).length;

  const inPersonCount = schedules.length - onlineCount;

  return (
    <main
      dir="rtl"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            ترحيل مواعيد البرامج
          </h1>

          <p
            style={{
              marginTop: 8,
              color: '#666',
            }}
          >
            مراجعة وترحيل جميع المواعيد من البيانات الحالية إلى PostgreSQL.
          </p>
        </div>

        <button
          type="button"
          onClick={migrateSchedules}
          disabled={loading || migrating || schedules.length === 0}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '12px 20px',
            background:
              loading || migrating || schedules.length === 0
                ? '#aaa'
                : '#3B2932',
            color: '#fff',
            fontWeight: 700,
            cursor:
              loading || migrating || schedules.length === 0
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {migrating
            ? 'جاري الترحيل...'
            : 'ترحيل إلى PostgreSQL'}
        </button>
      </div>

      {message && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            borderRadius: 10,
            background: '#f5f5f5',
            border: '1px solid #ddd',
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div>جاري تحميل المواعيد...</div>
      ) : (
        <>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <StatCard
              label="إجمالي المواعيد"
              value={schedules.length}
            />

            <StatCard
              label="حضوري"
              value={inPersonCount}
            />

            <StatCard
              label="أونلاين"
              value={onlineCount}
            />

            <StatCard
              label="المدن"
              value={cities.length}
            />
          </section>

          <section
            style={{
              marginBottom: 24,
              padding: 20,
              border: '1px solid #e5e5e5',
              borderRadius: 12,
              background: '#fff',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 12,
                fontSize: 20,
              }}
            >
              المدن الموجودة
            </h2>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {cities.map((city) => (
                <span
                  key={city}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: '#f3f3f3',
                    fontSize: 14,
                  }}
                >
                  {city}
                </span>
              ))}
            </div>
          </section>

          <section
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <div
              style={{
                padding: 20,
                borderBottom: '1px solid #e5e5e5',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                }}
              >
                قائمة المواعيد
              </h2>
            </div>

            {schedules.length === 0 ? (
              <div
                style={{
                  padding: 30,
                  textAlign: 'center',
                  color: '#777',
                }}
              >
                لا توجد مواعيد.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: 900,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>البرنامج</th>
                      <th style={thStyle}>المدينة</th>
                      <th style={thStyle}>التاريخ</th>
                      <th style={thStyle}>الوقت</th>
                      <th style={thStyle}>السعر</th>
                      <th style={thStyle}>المقاعد</th>
                      <th style={thStyle}>الحالة</th>
                    </tr>
                  </thead>

                  <tbody>
                    {schedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td style={tdStyle}>
                          <div
                            style={{
                              fontWeight: 600,
                            }}
                          >
                            {schedule.courseTitle}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              color: '#888',
                              fontSize: 12,
                            }}
                          >
                            {schedule.title}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          {schedule.city || '—'}
                        </td>

                        <td style={tdStyle}>
                          {formatDate(schedule.startDate)}
                          {' → '}
                          {formatDate(schedule.endDate)}
                        </td>

                        <td style={tdStyle}>
                          {schedule.startTime}
                          {' - '}
                          {schedule.endTime}
                        </td>

                        <td style={tdStyle}>
                          {formatPrice(schedule.price)}
                        </td>

                        <td style={tdStyle}>
                          {schedule.currentParticipants}
                          {' / '}
                          {schedule.maxParticipants}
                        </td>

                        <td style={tdStyle}>
                          {schedule.published
                            ? 'منشور'
                            : 'غير منشور'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        padding: 20,
        border: '1px solid #e5e5e5',
        borderRadius: 12,
        background: '#fff',
      }}
    >
      <div
        style={{
          color: '#777',
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function formatDate(value: Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatPrice(value?: number) {
  if (typeof value !== 'number') {
    return '—';
  }

  return `${value.toLocaleString('en-US')} SAR`;
}

const thStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '14px 16px',
  background: '#f7f7f7',
  borderBottom: '1px solid #e5e5e5',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '14px 16px',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top',
};