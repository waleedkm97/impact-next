'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { serviceRepository } from '@/lib/data/repositories/service-repository';
import type { Service } from '@/types/service';
import { useLocale } from '@/hooks/use-locale';

const iconSet = ['↗', '▣', '◎', '◌', '◇', '▤'];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const { isEnglish } = useLocale();

  useEffect(() => {
    serviceRepository.findAll().then(setServices);
  }, []);

  const cards = [
    { title: isEnglish ? 'Training disclosure' : 'الإفصاح التدريبي', description: isEnglish ? 'Support for training disclosure, documentation and follow-up through Qiwa.' : 'نساعد منشأتك على استكمال الإفصاح التدريبي من خلال التدريب والتوثيق والمتابعة.', href: '/training-disclosure' },
    ...services.map((service) => ({ title: isEnglish ? 'Professional learning service' : service.title, description: isEnglish ? 'A focused service designed to support capability development and measurable workplace impact.' : (service.shortDescription || service.description), href: `/service-details?id=${service.id}` })),
  ];

  return (
    <main dir={isEnglish ? 'ltr' : 'rtl'} className="services-page">
      <style jsx>{`
        .services-page { background:#f5f7fa; color:#0a1931; min-height:100vh; }
        .services-hero { padding:90px 24px 50px; text-align:center; background:linear-gradient(180deg,#fff 0%,#f5f7fa 100%); }
        .services-hero .eyebrow { color:#b58a3a; font-size:13px; font-weight:900; }
        .services-hero h1 { margin:12px auto 0; max-width:900px; color:#0a1931; font-size:clamp(34px,5vw,56px); line-height:1.15; font-weight:900; }
        .services-hero p { max-width:760px; margin:16px auto 0; color:#66758a; line-height:2; }
        .services-grid-pro { width:min(1180px,100%); margin:0 auto; padding:30px 24px 90px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; }
        .service-pro { position:relative; overflow:hidden; min-height:270px; height:100%; display:flex; flex-direction:column; padding:28px; background:#fff; border:1px solid #e2e8ef; border-radius:22px; box-shadow:0 14px 34px rgba(10,25,49,.06); transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .service-pro:hover { transform:translateY(-5px); box-shadow:0 20px 42px rgba(10,25,49,.10); border-color:#d0ad5e; }
        .service-pro::after { content:''; position:absolute; inset-inline-end:0; top:0; width:5px; height:100%; background:linear-gradient(#d4ae60,#9f7a33); }
        .service-pro-icon { width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:#f7f0df;color:#9f7a33;font-size:20px;font-weight:900; }
        .service-pro h3 { margin:22px 0 10px; font-size:20px; color:#0a1931; }
        .service-pro p { margin:0; color:#67778c; line-height:1.9; font-size:13px; }
        .service-pro a { margin-top:auto; align-self:flex-start; padding:10px 15px; border-radius:10px; background:#0a1931; color:#fff; text-decoration:none; font-weight:900; font-size:12px; }
        .service-pro a:hover { background:#b58a3a; }
        @media(max-width:900px){.services-grid-pro{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:600px){.services-grid-pro{grid-template-columns:1fr;padding:20px 18px 60px}.services-hero{padding:70px 18px 30px}}
      `}</style>

      <section className="services-hero">
        <div className="eyebrow">{isEnglish ? 'Our services' : 'خدماتنا'}</div>
        <h1>{isEnglish ? 'Integrated learning and consulting solutions' : 'حلول تدريبية واستشارية متكاملة'}</h1>
        <p>{isEnglish ? 'Specialized solutions that help organizations develop capability, improve performance and create measurable impact.' : 'نقدم حلولًا متخصصة تساعد منشأتك على تطوير الكفاءات وتحسين الأداء وتحقيق أثر ملموس.'}</p>
      </section>

      <section className="services-grid-pro">
        {cards.map((card, index) => (
          <article className="service-pro" key={`${card.title}-${index}`}>
            <div className="service-pro-icon">{iconSet[index % iconSet.length]}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <Link href={card.href}>{isEnglish ? 'View details' : 'عرض التفاصيل'}</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
