import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'alc-theme';
const THEMES: readonly AppTheme[] = ['dark', 'light', 'system'];

/** Owns `html[data-theme]`. Dark (Walnut) is the default; light is Oak. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;

  readonly theme = signal<AppTheme>(readStoredTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.root.dataset['theme'] = theme;
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Storage can be unavailable (private mode); the theme still applies for this visit.
      }
    });
  }
}

function readStoredTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    if (stored && THEMES.includes(stored)) return stored;
  } catch {
    // Fall through to the default.
  }
  return 'dark';
}
