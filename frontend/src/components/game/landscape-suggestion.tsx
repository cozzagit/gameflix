'use client';

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Overlay that suggests the user to rotate their phone to landscape
 * when playing a game in portrait mode on a mobile device.
 * Only shows once per session (dismissed state kept in component state).
 */
export function LandscapeSuggestion() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detect mobile via touch support and screen width
    const checkMobile = () => {
      const hasTouchScreen =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrow = window.innerWidth < 768;
      setIsMobile(hasTouchScreen && isNarrow);
    };

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkMobile();
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Don't render if not applicable
  if (!isMobile || !isPortrait || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
      {/* Animated phone icon */}
      <div className="mb-8 animate-rotate-phone">
        <Smartphone className="w-20 h-20 text-gameflix-primary" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <h2 className="text-xl font-bold text-gameflix-text-bright text-center mb-2">
        Ruota il telefono
      </h2>
      <p className="text-sm text-gameflix-text-dim text-center mb-8 max-w-xs">
        Ruota il telefono per un&apos;esperienza migliore
      </p>

      {/* Dismiss button */}
      <Button
        variant="ghost"
        onClick={() => setDismissed(true)}
        className="text-gameflix-text-dim hover:text-gameflix-text"
      >
        Continua in verticale
      </Button>
    </div>
  );
}
