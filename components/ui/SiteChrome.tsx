'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export default function SiteChrome({ children }: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch('/api/settings')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!active) return;
        const contact = payload?.settings?.contact || {};
        const raw = String(contact.whatsapp || contact.phone || '').replace(/\D/g, '');
        setWhatsappUrl(raw ? `https://wa.me/${raw}` : null);
      })
      .catch(() => {
        if (active) setWhatsappUrl(null);
      });

    return () => {
      active = false;
    };
  }, []);

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Navbar />
      {children}
      <Footer />

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل معنا عبر واتساب"
          title="واتساب"
          style={{
            position: 'fixed',
            right: 22,
            bottom: 22,
            zIndex: 500,
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#25D366',
            color: '#fff',
            boxShadow: '0 12px 30px rgba(0,0,0,.18)',
            border: '3px solid rgba(255,255,255,.92)',
          }}
        >
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20.5 11.3a8.5 8.5 0 0 1-12.6 7.4L4 20l1.4-3.6A8.5 8.5 0 1 1 20.5 11.3Z" stroke="currentColor" strokeWidth="1.7"/>
            <path d="M8.9 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .7.4.7 1.2 1.5 2.2 1.9.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5v.5c0 .4-.2.6-.5.8-.4.2-1.1.4-1.8.2-1.5-.3-2.8-1.1-3.9-2.2-1-1-1.8-2.2-2.1-3.5-.2-.8.1-1.5.3-1.9Z" fill="currentColor"/>
          </svg>
        </a>
      )}
    </>
  );
}
