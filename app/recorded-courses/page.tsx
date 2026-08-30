import Link from "next/link";

const courses = [
  {
    id: 1,
    title: "مهارات البيع وتحويل الفرص لنتائج ملموسة",
    description:
      "دورة مسجلة تساعدك على تطوير مهارات البيع وتحويل الفرص إلى نتائج.",
    price: 299,
  },
  {
    id: 2,
    title: "إدارة الوقت",
    description: "تعلم أساليب عملية لإدارة وقتك ورفع إنتاجيتك.",
    price: 249,
  },
  {
    id: 3,
    title: "المهارات المهنية",
    description:
      "مجموعة من المهارات العملية التي يحتاجها الموظف في بيئة العمل.",
    price: 199,
  },
];

export default function RecordedCoursesPage() {
  return (
    <main>
      <section className="section page-hero">
        <div className="section-inner">
          <div className="section-header">
            <h1>تعلّم في وقتك، وطور مهاراتك بثقة</h1>
            <p className="section-lead">
              دورات مسجلة يمكنك الوصول إليها والتعلم منها في الوقت المناسب لك.
            </p>
          </div>

          <div className="cards">
            {courses.map((course) => (
              <article key={course.id} className="card">
                <div className="about-image card-placeholder" />
                <span className="card-label">دورة مسجلة</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-price-stack">
                  <strong>{course.price} ريال</strong>
                </div>
                <Link
                  href={`/course-details?id=${course.id}`}
                  className="btn-primary"
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
