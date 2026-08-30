import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Impact Training</span>

            <h1>تعلم اليوم... واصنع أثر الغد.</h1>

            <p className="hero-text">
              منصة تدريبية تساعد الأفراد والمنشآت على تطوير المهارات
              ورفع مستوى الأداء من خلال حلول تدريبية متخصصة.
            </p>

            <div className="hero-actions">
              <Link href="/recorded-courses" className="btn-primary">
                استكشف الدورات
              </Link>
              <Link href="/services" className="btn-secondary">
                خدمات المؤسسات
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-card">
              <div className="about-image" />
              <p>برامج عملية مصممة لتحقيق نتائج ملموسة في بيئة العمل.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section courses-section">
        <div className="section-inner">
          <div className="section-header">
            <h2>اكتشف دورات مصممة لرفع مستوى الأداء</h2>
            <p className="section-lead">
              تعلّم بالوقت والطريقة التي تناسبك.
            </p>
          </div>

          <div className="cards">
            {[
              "مهارات البيع وتحويل الفرص لنتائج ملموسة",
              "إدارة الوقت ورفع الإنتاجية",
              "تطوير المهارات المهنية",
            ].map((course) => (
              <article key={course} className="card">
                <span className="card-label">دورة مسجلة</span>
                <h3>{course}</h3>
                <p>
                  دورة تدريبية تساعدك على تطوير مهاراتك وتحقيق نتائج
                  عملية.
                </p>
                <Link href="/course-details" className="btn-secondary">
                  عرض الدورة
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about">
        <div className="section-inner">
          <div className="cards">
            {[
              "تعلّم بطرق تعكس احتياجاتك المهنية",
              "برامج تدريبية مباشرة بقيادة مختصين",
              "خدمات مهنية للمؤسسات والفرق",
              "حلول تدريبية واستشارية متكاملة",
            ].map((item) => (
              <article key={item} className="card">
                <h3>{item}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="section-inner">
          <div className="cta-box">
            <h2>ابدأ رحلتك التعليمية اليوم</h2>
            <p className="section-lead">
              اختر المسار التدريبي المناسب لك وابدأ في تطوير مهاراتك.
            </p>
            <Link href="/recorded-courses" className="btn-primary">
              استكشف الدورات
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
