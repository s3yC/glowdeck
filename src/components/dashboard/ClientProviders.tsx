'use client';

import { useWakeLock } from '@/hooks/useWakeLock';
import { useNightMode } from '@/hooks/useNightMode';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  useWakeLock();
  useNightMode();
  usePremiumStatus();

  return <>{children}</>;
}
