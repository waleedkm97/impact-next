import './globals.css';
import SiteChrome from '@/components/ui/SiteChrome';

export const metadata = {
  title: 'Impact Training',
  description: 'Impact Training & Consulting',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
