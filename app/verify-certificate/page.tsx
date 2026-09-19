'use client';

import { FormEvent, useState } from 'react';

type VerificationResult = {
  status: string;
  certificateNumber: string;
  traineeName: string;
  courseTitle: string;
  issuedAt: string;
  duration: string;
  delivery: string;
  hours: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('ar-SA');
}

export default function VerifyCertificatePage() {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        `/api/certificate-verification?certificateNumber=${encodeURIComponent(
          certificateNumber.trim(),
        )}`,
        { cache: 'no-store' },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || 'لم يتم العثور على شهادة بهذا الرقم.',
        );
      }

      setResult(data.certificate);
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : 'تعذر التحقق من الشهادة.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 px-6 py-14">
      <section className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 shadow-sm md:p-10">
        <div className="text-center">
          <p className="text-sm font-semibold text-[#B48732]">Impact Training</p>
          <h1 className="mt-3 text-3xl font-bold text-[#062b67]">
            التحقق من الشهادة
          </h1>
          <p className="mt-3 text-gray-600">
            أدخل رقم الشهادة للتحقق من صحتها وبياناتها الأساسية.
          </p>
        </div>

        <form onSubmit={verify} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            value={certificateNumber}
            onChange={(event) => setCertificateNumber(event.target.value)}
            placeholder="مثال: IMP-26-001"
            aria-label="رقم الشهادة"
            className="min-h-12 flex-1 rounded-xl border px-4 text-left outline-none focus:border-[#062b67]"
            dir="ltr"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-xl bg-[#062b67] px-6 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'جارٍ التحقق...' : 'تحقق من الشهادة'}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <h2 className="text-xl font-bold text-green-800">{result.status}</h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">رقم الشهادة</dt>
                <dd className="mt-1 font-semibold text-[#062b67]" dir="ltr">
                  {result.certificateNumber}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">اسم المتدرب</dt>
                <dd className="mt-1 font-semibold text-[#062b67]">{result.traineeName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">اسم الدورة</dt>
                <dd className="mt-1 font-semibold text-[#062b67]">{result.courseTitle}</dd>
              </div>
              <div>
                <dt className="text-gray-500">تاريخ الإصدار</dt>
                <dd className="mt-1 font-semibold text-[#062b67]">{formatDate(result.issuedAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">مدة الدورة</dt>
                <dd className="mt-1 font-semibold text-[#062b67]">{result.duration}</dd>
              </div>
              <div>
                <dt className="text-gray-500">طريقة التدريب</dt>
                <dd className="mt-1 font-semibold text-[#062b67]">
                  {result.delivery} · {result.hours} ساعة تدريبية
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </main>
  );
}
