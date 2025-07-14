
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdSenseUnitProps {
  adSlot: string;
  className?: string;
  style?: React.CSSProperties;
}

const ADSENSE_CLIENT_ID = "ca-pub-6929403056848474";

export default function AdSenseUnit({ adSlot, className, style }: AdSenseUnitProps) {
  const { userTier } = useAuth();
  const pathname = usePathname(); // Use pathname to trigger re-fetch on navigation

  useEffect(() => {
    if (userTier === 'free') {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Don't log the common error, as it can be noisy.
        if (!(e instanceof Error && e.message.includes("All 'ins' elements"))) {
            console.error('AdSense error:', e);
        }
      }
    }
  }, [userTier, adSlot, pathname]); // Re-run if userTier, adSlot, or path changes

  if (userTier !== 'free') {
    return null;
  }

  // The key={pathname} forces React to re-mount the component on route change,
  // which helps in re-requesting ads on navigation without the push() error.
  return (
    <div key={pathname} className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
