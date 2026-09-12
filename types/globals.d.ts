declare function importScripts(...urls: string[]): void;

interface Window {
  __seeContentLoaded?: boolean;
  SeeEngine: {
    simplifyPage(): Promise<{ ok: boolean; state: string; message: string }>;
    restorePage(): { ok: boolean; state: string; message: string };
  };
  SeeRenderer: {
    state: { simplified: boolean };
    applyDisplay(settings: unknown): void;
  };
  SeeSettings: {
    getSettings(): Promise<unknown>;
    saveSettings(settings: unknown): Promise<unknown>;
  };
}
