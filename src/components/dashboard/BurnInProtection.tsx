'use client';

import { useBurnInProtection } from '@/hooks/useBurnInProtection';

interface BurnInProtectionProps {
  children: React.ReactNode;
}

export function BurnInProtection({ children }: BurnInProtectionProps) {
  const offset = useBurnInProtection();

  return (
    <div
      className="w-full h-full"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 2s ease-in-out',
      }}
    >
      {children}
    </div>
  );
}
