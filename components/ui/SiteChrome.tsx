'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
export default function SiteChrome({ children }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
    if (isAdmin)
        return <>{children}</>;
    return (<>
      <Navbar />
      {children}
      <Footer />
    </>);
}

