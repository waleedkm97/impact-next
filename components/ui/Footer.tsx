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

  <Link href="/contact">
    {isEnglish ? 'Contact us' : 'تواصل معنا'}
  </Link>

  <Link href="/login">
    {isEnglish ? 'Trainee account' : 'حساب المتدرب'}
  </Link>

  <Link href="/verify-certificate">
    {isEnglish ? 'Certificate verification' : 'التحقق من الشهادة'}
  </Link>

  <div
  className="footer-socials"
  aria-label={isEnglish ? 'Social media' : 'حسابات التواصل الاجتماعي'}
>
  <a
    href="https://www.instagram.com/impact_training.sa/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Instagram"
    title="Instagram"
  >
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="4.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="17.4"
        cy="6.7"
        r="1.1"
        fill="currentColor"
      />
    </svg>
  </a>

  <a
    href="https://www.linkedin.com/company/impact-training-sa/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="LinkedIn"
    title="LinkedIn"
  >
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5.2 3.5C5.2 4.88 4.08 6 2.7 6S.2 4.88.2 3.5 1.32 1 2.7 1 5.2 2.12 5.2 3.5Z" />
      <path d="M.6 8h4.2v13.2H.6V8Z" />
      <path d="M7.2 8h4v1.8h.06c.56-1.03 1.94-2.12 3.99-2.12 4.26 0 5.05 2.8 5.05 6.44v7.08h-4.2v-6.28c0-1.5-.03-3.42-2.08-3.42-2.08 0-2.4 1.62-2.4 3.31v6.39H7.2V8Z" />
    </svg>
  </a>
</div>
</div>
      </div>

      <div className="footer-bottom">
        © Impact Training
      </div>
    </footer>
  );
}