'use client';

import { useEffect, useState } from 'react';

export type Locale = 'ar' | 'en';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const queryLocale = new URLSearchParams(window.location.search).get('lang');
    const cookieLocale = document.cookie
      .split('; ')
      .find((item) => item.startsWith('impact_locale='))
      ?.split('=')[1];
    const nextLocale: Locale = queryLocale === 'en' || cookieLocale === 'en' ? 'en' : 'ar';
    setLocaleState(nextLocale);
    document.cookie = `impact_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'en' ? 'ltr' : 'rtl';
  }, []);

  function setLocale(nextLocale: Locale) {
    document.cookie = `impact_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'en' ? 'ltr' : 'rtl';
    window.location.reload();
  }

  return { locale, isEnglish: locale === 'en', setLocale };
}
