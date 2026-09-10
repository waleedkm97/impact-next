'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { staffRepository } from '@/lib/data/repositories/staff-repository';

function setStaffSession(id: string) {
  document.cookie =
    `impact_staff=${encodeURIComponent(id)}; ` +
    `Max-Age=2592000; ` +
    `Path=/; ` +
    `SameSite=Lax`;
}

export default function Login() {
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [msg, setMsg] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const router = useRouter();

  const searchParams =
    useSearchParams();

  const next =
    searchParams.get('next') ||
    '/account';

  async function submit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setMsg('');

    setLoading(true);

    try {
      /*
       * أولاً نجرب حسابات الموظفين.
       */
      const staff =
        await staffRepository.login(
          email,
          password,
        );

      if (staff) {
        setStaffSession(staff.id);

        if (staff.role === 'admin') {
          router.push('/admin');
        } else if (
          staff.role === 'coordinator'
        ) {
          router.push(
            '/admin/coordinator',
          );
        } else {
          router.push(
            '/admin/trainer',
          );
        }

        router.refresh();

        return;
      }

      /*
       * إذا لم يكن حساب موظف،
       * نجرب حساب المتدرب المعتاد.
       */
      const user =
        await traineeRepository.loginUser(
          email,
          password,
        );

      if (!user) {
        setMsg(
          'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        );

        return;
      }

      router.push(
        next.startsWith('/')
          ? next
          : '/account',
      );

      router.refresh();
    } catch (error) {
      console.error(
        'Login error:',
        error,
      );

      setMsg(
        'حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="auth-page"
    >
      <form
        className="auth-card"
        onSubmit={submit}
      >
        <h1>
          تسجيل الدخول
        </h1>

        <p>
          ادخل إلى حسابك لمتابعة دوراتك
          وطلباتك وشهاداتك.
        </p>

        <label>
          البريد الإلكتروني

          <input
            type="email"
            required
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            autoComplete="email"
          />
        </label>

        <label>
          كلمة المرور

          <input
            type="password"
            required
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            autoComplete="current-password"
          />
        </label>

        {msg && (
          <div className="auth-error">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'جاري الدخول...'
            : 'دخول'}
        </button>

        <p className="auth-register">
          ليس لديك حساب؟{' '}
          <Link href="/register">
            إنشاء حساب جديد
          </Link>
        </p>
      </form>
    </main>
  );
}