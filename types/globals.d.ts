declare function importScripts(...urls: string[]): void;

interface BetaEyeSettingsShape {
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
  BetaEyeEngine: {
    simplifyPage(): Promise<{ ok: boolean; state: string; message: string }>;
    restorePage(): { ok: boolean; state: string; message: string };
    speakSimplifiedText(): { ok: boolean; state: string; message: string };
    cancel(): void;
  };
  BetaEyeRenderer: {
    state: { simplified: boolean };
    applyDisplay(settings: unknown): void;
  };
  BetaEyeSettings: {
    getSettings(): Promise<BetaEyeSettingsShape>;
    saveSettings(settings: unknown): Promise<BetaEyeSettingsShape>;
    setOnboardingState(onboarded: boolean): Promise<void>;
    getOpenRouterKey(): Promise<string>;
    saveOpenRouterKey(key: string): Promise<void>;
    getSiteKey(url: string): string;
  };
}
