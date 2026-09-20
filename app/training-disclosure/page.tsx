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
    <main dir="rtl" className="disclosure-page">
      <style jsx>{`
        .disclosure-page { background:#f5f7fa; color:#0a1931; }
        .disclosure-hero {
          position:relative; overflow:hidden; padding:110px 24px 96px;
          background:linear-gradient(125deg,#06182d 0%,#0a1931 52%,#153b65 100%);
          color:#fff;
        }
        .disclosure-hero::after {
          content:''; position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(circle at 78% 20%, rgba(181,138,58,.18), transparent 30%);
        }
        .disclosure-inner { width:min(1180px,100%); margin:0 auto; position:relative; z-index:1; }
        .disclosure-hero .eyebrow { color:#d9b56a; font-weight:900; font-size:13px; }
        .disclosure-hero h1 { color:#fff !important; font-size:clamp(40px,6vw,66px); line-height:1.08; margin:14px 0 18px; font-weight:900; }
        .disclosure-hero p { max-width:720px; color:rgba(255,255,255,.84); font-size:18px; line-height:2; margin:0; }
        .disclosure-cta { display:inline-flex; margin-top:28px; padding:14px 24px; border-radius:12px; background:#b58a3a; color:#fff; text-decoration:none; font-weight:900; }
        .disclosure-grid { width:min(1180px,100%); margin:0 auto; padding:70px 24px; display:grid; grid-template-columns:1.1fr .9fr; gap:26px; }
        .disclosure-card { background:#fff; border:1px solid #e2e8ef; border-radius:20px; box-shadow:0 14px 36px rgba(10,25,49,.06); padding:30px; }
        .disclosure-card h2 { margin:0 0 12px; color:#0a1931; font-size:26px; }
        .disclosure-card p { margin:0; color:#64748b; line-height:2; }
        .steps { display:grid; gap:13px; margin-top:22px; }
        .step { display:flex; gap:12px; align-items:flex-start; }
        .step-num { width:34px;height:34px;flex:0 0 34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#0a1931;color:#fff;font-size:13px;font-weight:900; }
        .step span:last-child { color:#40516a; line-height:1.85; }
        .benefit-grid { width:min(1180px,100%); margin:0 auto; padding:0 24px 70px; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:14px; }
        .benefit { min-height:150px; padding:20px; border-radius:16px; background:#0a1931; color:#fff; border:1px solid rgba(181,138,58,.35); }
        .benefit::before { content:'+'; color:#d9b56a; font-size:20px; font-weight:900; }
        .benefit p { margin:8px 0 0; line-height:1.8; color:rgba(255,255,255,.82); font-size:13px; }
        .disclosure-bottom { width:min(1180px,100%); margin:0 auto 80px; padding:28px; border-radius:20px; background:#fff; border:1px solid #e2e8ef; display:flex; justify-content:space-between; align-items:center; gap:18px; }
        .disclosure-bottom strong { font-size:22px; color:#0a1931; }
        @media(max-width:900px){ .disclosure-grid{grid-template-columns:1fr}.benefit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.disclosure-bottom{flex-direction:column;align-items:flex-start} }
        @media(max-width:600px){ .benefit-grid{grid-template-columns:1fr}.disclosure-hero{padding-top:82px}.disclosure-grid{padding:50px 18px}.benefit-grid{padding:0 18px 50px}.disclosure-bottom{margin:0 18px 50px}.disclosure-hero p{font-size:16px} }
      `}</style>

      <section className="disclosure-hero">
        <div className="disclosure-inner">
          <div className="eyebrow">IMPACT TRAINING</div>
          <h1>الإفصاح التدريبي</h1>
          <p>نساعد منشأتك على استكمال الإفصاح التدريبي عبر منصة قوى من خلال التدريب والتوثيق والمتابعة، مع تنظيم رحلة التدريب بما ينسجم مع احتياج المنشأة.</p>
          <Link href="/contact" className="disclosure-cta">اطلب خدمة الإفصاح التدريبي</Link>
        </div>
      </section>

      <section className="disclosure-grid">
        <article className="disclosure-card">
          <h2>حل عملي لمنشأتك</h2>
          <p>نساند المنشآت في تنظيم رحلة التدريب من تحديد الاحتياج إلى تنفيذ البرامج وتجهيز السجلات والبيانات والشهادات، ثم مساندة مسؤول الموارد البشرية خلال استكمال الإفصاح عبر منصة قوى.</p>
        </article>

        <article className="disclosure-card">
          <h2>كيف نساعدك؟</h2>
          <div className="steps">
            {steps.map((step, index) => (
              <div className="step" key={step}>
                <span className="step-num">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="benefit-grid">
        {benefits.map((benefit) => (
          <article className="benefit" key={benefit}>
            <p>{benefit}</p>
          </article>
        ))}
      </section>

      <div className="disclosure-bottom">
        <strong>هل تريد تجهيز رحلة الإفصاح التدريبي لمنشأتك؟</strong>
        <Link href="/contact" className="disclosure-cta">تواصل معنا</Link>
      </div>
    </main>
  );
}
