'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      alert('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    setLoading(true);

    try {
      // سيتم ربط إرسال رابط إعادة التعيين لاحقًا
      alert('سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } finally {
      setLoading(false);
    }
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
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          نسيت كلمة المرور؟
        </h1>

        <p
          style={{
            marginTop: 10,
            color: '#6b7890',
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          أدخل بريدك الإلكتروني وسنساعدك في إعادة تعيين كلمة المرور.
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
            البريد الإلكتروني

            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="example@email.com"
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
            disabled={loading}
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
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'جاري الإرسال...'
              : 'إرسال رابط إعادة التعيين'}
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