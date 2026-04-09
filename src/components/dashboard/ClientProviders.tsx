'use client';

import { useWakeLock } from '@/hooks/useWakeLock';
import { useNightMode } from '@/hooks/useNightMode';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useServiceWorker } from '@/hooks/useServiceWorker';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  useWakeLock();
  useNightMode();
  usePremiumStatus();
  useServiceWorker();

  return <>{children}</>;
}
