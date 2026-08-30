import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo">
          Impact
        </Link>

        <div className="nav-links">
          <Link href="/">الرئيسية</Link>
          <Link href="/recorded-courses">الدورات المسجلة</Link>
          <Link href="/training-courses">الدورات التدريبية</Link>
          <Link href="/services">الخدمات</Link>
          <Link href="/contact">تواصل معنا</Link>
        </div>

        <div className="nav-actions">
          <Link href="/login" className="nav-login">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </nav>
  );
}
