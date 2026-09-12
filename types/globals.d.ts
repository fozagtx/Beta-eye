declare function importScripts(...urls: string[]): void;

interface RedactoSettingsShape {
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
  __betaEyeContentLoaded?: boolean;
  RedactoEngine: {
    simplifyPage(): Promise<{ ok: boolean; state: string; message: string }>;
    restorePage(): { ok: boolean; state: string; message: string };
    speakSimplifiedText(): { ok: boolean; state: string; message: string };
    cancel(): void;
  };
  RedactoRenderer: {
    state: { simplified: boolean };
    applyDisplay(settings: unknown): void;
  };
  RedactoSettings: {
    getSettings(): Promise<RedactoSettingsShape>;
    saveSettings(settings: unknown): Promise<RedactoSettingsShape>;
    setOnboardingState(onboarded: boolean): Promise<void>;
    getSiteKey(url: string): string;
  };
}
