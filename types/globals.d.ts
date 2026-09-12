declare function importScripts(...urls: string[]): void;

interface SeeSettingsShape {
  autoRunTrustedSites: boolean;
  trustedSites: string[];
  allowedSensitiveSites: string[];
  disabledSites: string[];
  display: Record<string, unknown>;
}

interface Navigator {
  deviceMemory?: number;
}

interface Window {
  __seeContentLoaded?: boolean;
  SeeEngine: {
    simplifyPage(): Promise<{ ok: boolean; state: string; message: string }>;
    restorePage(): { ok: boolean; state: string; message: string };
    speakSimplifiedText(): { ok: boolean; state: string; message: string };
    cancel(): void;
  };
  SeeRenderer: {
    state: { simplified: boolean };
    applyDisplay(settings: unknown): void;
  };
  SeeSettings: {
    getSettings(): Promise<SeeSettingsShape>;
    saveSettings(settings: unknown): Promise<SeeSettingsShape>;
    setOnboardingState(onboarded: boolean): Promise<void>;
    getSiteKey(url: string): string;
  };
}
