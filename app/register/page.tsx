'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type RegisterForm = {
  firstName: string;
  lastName: string;
  firstNameEnglish: string;
  lastNameEnglish: string;
  gender: 'male' | 'female' | '';
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    firstNameEnglish: '',
    lastNameEnglish: '',
    gender: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(
    field: keyof RegisterForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMsg('');

    if (form.password.length < 6) {
      setMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMsg('تأكيد كلمة المرور غير مطابق.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/trainees/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          firstNameEnglish: form.firstNameEnglish.trim(),
          lastNameEnglish: form.lastNameEnglish.trim(),
          gender: form.gender,
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (
        !response.ok ||
        !data?.success ||
        !data?.trainee?.id
      ) {
        setMsg(
          data?.error ||
            'تعذر إنشاء الحساب. حاول مرة أخرى.',
        );
        return;
      }

      document.cookie =
        `impact_sql_trainee=${encodeURIComponent(
          data.trainee.id,
        )}; Max-Age=2592000; Path=/; SameSite=Lax`;

      router.push('/account');
      router.refresh();
    } catch (error) {
      console.error('Registration error:', error);

      setMsg(
        'حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.',
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
        <h1>إنشاء حساب جديد</h1>

        <p>
          أنشئ حساب متدرب جديد للوصول إلى دوراتك
          وطلباتك وشهاداتك.
        </p>

        <label>
          الاسم الأول

          <input
            type="text"
            required
            value={form.firstName}
            onChange={(event) =>
              updateField(
                'firstName',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          اسم العائلة

          <input
            type="text"
            required
            value={form.lastName}
            onChange={(event) =>
              updateField(
                'lastName',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          الاسم الأول بالإنجليزي

          <input
            type="text"
            dir="ltr"
            value={form.firstNameEnglish}
            onChange={(event) =>
              updateField(
                'firstNameEnglish',
                event.target.value,
              )
            }
          />
        </label>

        <label>
          اسم العائلة بالإنجليزي

          <input
            type="text"
            dir="ltr"
            value={form.lastNameEnglish}
            onChange={(event) =>
              updateField(
                'lastNameEnglish',
                event.target.value,
              )
            }
          />
        </label>

<label>
  الجنس

  <select
    required
    value={form.gender}
    onChange={(event) =>
      updateField(
        'gender',
        event.target.value as 'male' | 'female',
      )
    }
  >
    <option value="">اختر الجنس</option>
    <option value="male">ذكر</option>
    <option value="female">أنثى</option>
  </select>
</label>

        <label>
          البريد الإلكتروني

          <input
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              updateField(
                'email',
                event.target.value,
              )
            }
            autoComplete="email"
          />
        </label>

        <label>
          رقم الجوال

          <input
            type="tel"
            value={form.phone}
            onChange={(event) =>
              updateField(
                'phone',
                event.target.value,
              )
            }
            autoComplete="tel"
          />
        </label>

        <label>
          كلمة المرور

          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(event) =>
              updateField(
                'password',
                event.target.value,
              )
            }
            autoComplete="new-password"
          />
        </label>

        <label>
          تأكيد كلمة المرور

          <input
            type="password"
            required
            minLength={6}
            value={form.confirmPassword}
            onChange={(event) =>
              updateField(
                'confirmPassword',
                event.target.value,
              )
            }
            autoComplete="new-password"
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
            ? 'جاري إنشاء الحساب...'
            : 'إنشاء الحساب'}
        </button>

        <p className="auth-register">
          لديك حساب بالفعل؟{' '}

          <Link href="/login">
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </main>
  );
}