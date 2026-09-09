'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameEnglish, setFirstNameEnglish] = useState('');
  const [lastNameEnglish, setLastNameEnglish] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [running, setRunning] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMsg('');
    setRunning(true);

    try {
      if (await traineeRepository.findByEmail(email)) {
        setMsg('هذا البريد مستخدم بالفعل.');
        return;
      }

      await traineeRepository.create({
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          firstNameEnglish: firstNameEnglish.trim() || undefined,
          lastNameEnglish: lastNameEnglish.trim() || undefined,
          gender: gender || undefined,
        },
        contact: {
          email: email.trim(),
          phone: phone.trim(),
        },
        email: email.trim(),
        passwordHash: password,
        enrollments: [],
        progress: [],
        certificates: [],
        status: 'active',
        emailVerified: true,
      });

      const user = await traineeRepository.loginUser(email, password);

      if (!user) {
        setMsg('تم إنشاء الحساب، لكن تعذر تسجيل الدخول تلقائيًا.');
        return;
      }

      router.push('/account');
    } catch {
      setMsg('تعذر إنشاء الحساب. حاول مرة أخرى.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <main dir="rtl" className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>إنشاء حساب</h1>
        <p>أنشئ حسابك للتسجيل في الدورات ومتابعة طلباتك وشهاداتك.</p>

        <div className="auth-form-grid">
          <label>
            الاسم الأول
            <input
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>

          <label>
            اسم العائلة
            <input
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>
        </div>

        <div className="auth-form-grid">
          <label>
            الاسم الأول بالإنجليزي
            <input
              value={firstNameEnglish}
              onChange={(event) => setFirstNameEnglish(event.target.value)}
              dir="ltr"
              placeholder="First Name"
            />
          </label>

          <label>
            اسم العائلة بالإنجليزي
            <input
              value={lastNameEnglish}
              onChange={(event) => setLastNameEnglish(event.target.value)}
              dir="ltr"
              placeholder="Last Name"
            />
          </label>
        </div>

        <label>
          الجنس
          <select
            required
            value={gender}
            onChange={(event) =>
              setGender(event.target.value as 'male' | 'female' | '')
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <label>
          رقم الجوال
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>

        <label>
          كلمة المرور
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>

        {msg && <div className="auth-error">{msg}</div>}

        <button type="submit" disabled={running}>
          {running ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
        </button>

        <p className="auth-register">
          لديك حساب؟ <Link href="/login">تسجيل الدخول</Link>
        </p>
      </form>
    </main>
  );
}