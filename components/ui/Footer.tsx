import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>Impact Training</h3>
          <p>حلول تدريبية تساعد الأفراد والمنشآت على رفع مستوى الأداء.</p>
        </div>

        <div className="footer-links">
          <h3>روابط</h3>
          <Link href="/recorded-courses">الدورات المسجلة</Link>
          <Link href="/training-courses">الدورات التدريبية</Link>
          <Link href="/services">الخدمات</Link>
        </div>

        <div className="footer-contact">
          <h3>تواصل</h3>
          <Link href="/contact">تواصل معنا</Link>
          <Link href="/login">حساب المتدرب</Link>
        </div>
      </div>

      <div className="footer-bottom">
        © Impact Training
      </div>
    </footer>
  );
}
