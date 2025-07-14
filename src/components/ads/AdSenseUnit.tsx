
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdSenseUnitProps {
  adSlot: string;
  className?: string;
  style?: React.CSSProperties;
}

const ADSENSE_CLIENT_ID = "ca-pub-6929403056848474";

export default function AdSenseUnit({ adSlot, className, style }: AdSenseUnitProps) {
  const { userTier } = useAuth();

  useEffect(() => {
    if (userTier === 'free') {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [userTier, adSlot]); // Re-run if adSlot changes

  if (userTier !== 'free') {
    return null;
  }

  return (
    <div className={className} style={style}>
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
