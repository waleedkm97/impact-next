import Link from "next/link";

const services = [
  "التدريب المؤسسي",
  "الاستشارات",
  "تطوير القيادات",
  "التقييمات",
];

export default function ServicesPage() {
  return (
    <main>
      <section className="section page-hero">
        <div className="section-inner">
          <div className="section-header">
            <h1>هل تحتاج برنامجاً تدريبياً مصمماً خصيصاً لمنشأتك؟</h1>
            <p className="section-lead">
              نقدم حلولًا تدريبية واستشارية مصممة حسب احتياجات المؤسسات
              والفرق.
            </p>
          </div>

          <h2>حلول تدريبية واستشارية متكاملة</h2>

          <div className="service-grid">
            {services.map((service, index) => (
              <article key={service} className="service-card">
                <h3>{service}</h3>
                <p>حل متكامل مصمم لتلبية احتياجات منشأتك.</p>
                <Link
                  href={`/service-details?id=${index + 1}`}
                  className="btn-secondary"
                >
                  عرض التفاصيل
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
