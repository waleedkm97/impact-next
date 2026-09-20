'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      alert('رابط إعادة تعيين كلمة المرور غير صالح.');
      return;
    }

    if (newPassword.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/trainees/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            'حدث خطأ أثناء إعادة تعيين كلمة المرور.'
        );
        return;
      }

      setSuccess(true);
    } catch {
      alert('تعذر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f8fafc',
        }}
      >
        <section
          style={{
            width: '100%',
            maxWidth: 460,
            background: '#ffffff',
            border: '1px solid #dbe3ee',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: 0,
              color: '#062b67',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            تم تغيير كلمة المرور
          </h1>

          <p
            style={{
              marginTop: 12,
              color: '#6b7890',
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
          </p>

          <Link
            href="/login"
            style={{
              display: 'inline-block',
              marginTop: 20,
              padding: '12px 20px',
              borderRadius: 10,
              background: '#062b67',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            الانتقال لتسجيل الدخول
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f8fafc',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#ffffff',
          border: '1px solid #dbe3ee',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h1
          style={{
            margin: 0,
            color: '#062b67',
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          إعادة تعيين كلمة المرور
        </h1>

        <p
          style={{
            marginTop: 10,
            color: '#6b7890',
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          أدخل كلمة المرور الجديدة لحسابك.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <label
            style={{
              display: 'block',
              color: '#1f2937',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            كلمة المرور الجديدة

            <input
              type="password"
              required
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              autoComplete="new-password"
              style={{
                width: '100%',
                marginTop: 8,
                padding: '12px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <label
            style={{
              display: 'block',
              marginTop: 16,
              color: '#1f2937',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            تأكيد كلمة المرور

            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              autoComplete="new-password"
              style={{
                width: '100%',
                marginTop: 8,
                padding: '12px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              width: '100%',
              marginTop: 20,
              padding: '13px 16px',
              border: 0,
              borderRadius: 10,
              background: '#062b67',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              cursor:
                loading || !token ? 'default' : 'pointer',
              opacity: loading || !token ? 0.7 : 1,
            }}
          >
            {loading
              ? 'جاري تغيير كلمة المرور...'
              : 'تغيير كلمة المرور'}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          <Link
            href="/login"
            style={{
              color: '#1d5fa7',
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </section>
    </main>
  );
}
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main
          dir="rtl"
          className="min-h-screen flex items-center justify-center"
        >
          جاري تحميل إعادة تعيين كلمة المرور...
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}