'use client';

import { useState, useCallback } from 'react';
import { BurnInProtection } from '@/components/dashboard/BurnInProtection';
import { SpaceSwitcher } from '@/components/dashboard/SpaceSwitcher';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { TrialBanner } from '@/components/premium/TrialBanner';
import { UpgradePrompt } from '@/components/premium/UpgradePrompt';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { usePremiumStore } from '@/stores';

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const canShowUpgradePrompt = usePremiumStore((s) => s.canShowUpgradePrompt);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleUpgrade = useCallback(() => {
    if (canShowUpgradePrompt()) {
      setUpgradePromptOpen(true);
    }
  }, [canShowUpgradePrompt]);

  const handleCloseUpgradePrompt = useCallback(() => {
    setUpgradePromptOpen(false);
  }, []);

  return (
    <main className="h-screen w-screen bg-black overflow-hidden">
      {/* Onboarding wizard (conditional on first visit) */}
      <OnboardingWizard />

      <BurnInProtection>
        {/* Trial banner (shows only during trial) */}
        <TrialBanner />

        {/* Space switcher with settings gear */}
        <SpaceSwitcher onOpenSettings={handleOpenSettings} />

        {/* Dashboard grid with upgrade callback */}
        <DashboardGrid onUpgrade={handleUpgrade} />
      </BurnInProtection>

      {/* Settings panel (slide-in drawer) */}
      <SettingsPanel isOpen={settingsOpen} onClose={handleCloseSettings} />

      {/* Upgrade prompt modal */}
      <UpgradePrompt
        isOpen={upgradePromptOpen}
        onClose={handleCloseUpgradePrompt}
      />
    </main>
  );
}
