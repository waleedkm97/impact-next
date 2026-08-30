import Link from "next/link";

export default function TrainingCoursesPage() {
  return (
    <main>
      <section className="section page-hero">
        <div className="section-inner">
          <div className="section-header">
            <h1>صمم برنامجك التدريبي</h1>
            <p className="section-lead">
              برامج تدريبية مصممة لتلبية احتياجات الأفراد والمنشآت.
            </p>
          </div>

          <h2>البرامج العامة المجدولة</h2>

          <div className="cards">
            {[1, 2, 3].map((program) => (
              <article key={program} className="card">
                <div className="about-image card-placeholder" />
                <h3>برنامج تدريبي {program}</h3>
                <p>برنامج تدريبي متكامل بقيادة مختصين.</p>
                <Link href="/training-program" className="btn-primary">
                  التفاصيل
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
