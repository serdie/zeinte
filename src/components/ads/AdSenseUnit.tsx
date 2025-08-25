"use client";

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';

interface AdSenseUnitProps {
  adSlot: string;
  className?: string;
}

const AdSenseUnit = ({ adSlot, className }: AdSenseUnitProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [pathname, searchParams]);

  // Si no hay adSlot, no renderizar nada
  if (!adSlot || adSlot.includes('YOUR_AD_SLOT_ID')) {
    return (
        <div className={cn("flex items-center justify-center h-24 bg-muted/50 rounded-lg text-muted-foreground text-sm", className)}>
           {t('adsense.placeholder', {defaultValue: "Advertisement Placeholder"})}
        </div>
    );
  }

  return (
    <div className={cn("text-center", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
       <Script
        id={`adsbygoogle-init-${adSlot}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (adsbygoogle = window.adsbygoogle || []).push({});
          `,
        }}
      />
    </div>
  );
};

export default AdSenseUnit;
