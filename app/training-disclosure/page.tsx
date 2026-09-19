'use client';

import Link from 'next/link';

const steps = [
  'مراجعة وضع المنشأة واحتياجها التدريبي.',
  'تحديد البرامج التدريبية المناسبة.',
  'تنفيذ التدريب حضوريًا أو أونلاين.',
  'متابعة حضور وإتمام الموظفين.',
  'تجهيز السجلات والبيانات والشهادات.',
  'مساندة المنشأة في إكمال الإفصاح عبر منصة قوى.',
];

const benefits = [
  'حلول تدريبية مصممة حسب احتياج المنشأة.',
  'تدريب حضوري وأونلاين.',
  'دورات مهنية وتخصصية.',
  'توثيق منظم للتدريب.',
  'دعم المنشآت خلال رحلة الإفصاح.',
];

export default function TrainingDisclosurePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F5F5] text-[#0A1931]">
      <section className="bg-[#0A1931] px-6 py-20 text-white md:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold tracking-wide text-[#A07F33]">Impact Training</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            الإفصاح التدريبي
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            نساعد منشأتك على استكمال الإفصاح التدريبي عبر منصة قوى من خلال التدريب والتوثيق والمتابعة.
          </p>
          <Link href="/contact" className="mt-8 inline-flex rounded-xl bg-[#A07F33] px-6 py-3 font-semibold text-white">
            اطلب خدمة الإفصاح التدريبي
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="text-sm font-semibold text-[#A07F33]">حل عملي لمنشأتك</p>
          <h2 className="mt-3 text-3xl font-bold">نحو تدريب موثق ومنظم</h2>
          <p className="mt-5 leading-8 text-slate-600">
            نساعد المنشآت على تنظيم واستكمال متطلبات الإفصاح التدريبي من خلال توفير البرامج التدريبية المناسبة، وتجهيز بيانات التدريب والسجلات والشهادات، ومساندة مسؤول الموارد البشرية في إكمال إجراءات الإفصاح عبر منصة قوى.
          </p>
        </div>
        <div className="border-r-4 border-[#A07F33] bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold">كيف نساعدك؟</h2>
          <ol className="mt-6 space-y-4">
            {steps.map((step, index) => <li key={step} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A1931] text-sm font-bold text-white">{index + 1}</span><span className="leading-7 text-slate-700">{step}</span></li>)}
          </ol>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold">المخرجات</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {['خطة تدريب مناسبة', 'سجلات وبيانات تدريب منظمة', 'شهادات وملف متابعة واضح'].map((item) => <div key={item} className="border-t-4 border-[#A07F33] bg-[#F5F5F5] p-6 font-semibold">{item}</div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold">لماذا Impact Training؟</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {benefits.map((benefit) => <div key={benefit} className="bg-[#0A1931] p-5 text-sm leading-7 text-white">{benefit}</div>)}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-slate-200 pt-8 md:flex-row md:items-center">
          <p className="text-xl font-bold">هل تريد تجهيز رحلة الإفصاح التدريبي لمنشأتك؟</p>
          <Link href="/contact" className="rounded-xl bg-[#A07F33] px-6 py-3 font-semibold text-white">اطلب خدمة الإفصاح التدريبي</Link>
        </div>
      </section>
    </main>
  );
}