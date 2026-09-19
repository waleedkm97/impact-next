import Link from "next/link";
import Image from "next/image";
import { useLocale } from '@/hooks/use-locale';

export default function Footer() {
  const { isEnglish } = useLocale();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image
            src="/assets/logo/logo_white-remove.png"
            alt="Impact Training"
            width={180}
            height={80}
            style={{
              width: "180px",
              height: "auto",
              objectFit: "contain",
              marginBottom: "12px",
            }}
          />
          <p>{isEnglish ? 'Learning solutions that help people and organizations improve performance.' : 'حلول تدريبية تساعد الأفراد والمنشآت على رفع مستوى الأداء.'}</p>
        </div>

        <div className="footer-links">
          <h3>{isEnglish ? 'Links' : 'روابط'}</h3>
          <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
          <Link href="/recorded-courses">{isEnglish ? 'Recorded courses' : 'الدورات المسجلة'}</Link>
          <Link href="/training-courses">{isEnglish ? 'Training courses' : 'الدورات التدريبية'}</Link>
          <Link href="/services">{isEnglish ? 'Services' : 'الخدمات'}</Link>
          <Link href="/training-disclosure">{isEnglish ? 'Training disclosure' : 'الإفصاح التدريبي'}</Link>
        </div>

        <div className="footer-contact">
          <h3>{isEnglish ? 'Contact' : 'تواصل'}</h3>
          <Link href="/contact">{isEnglish ? 'Contact us' : 'تواصل معنا'}</Link>
          <Link href="/login">{isEnglish ? 'Trainee account' : 'حساب المتدرب'}</Link>
          <Link href="/verify-certificate">{isEnglish ? 'Certificate verification' : 'التحقق من الشهادة'}</Link>
        </div>
      </div>

      <div className="footer-bottom">
        © Impact Training
      </div>
    </footer>
  );
}