/**
 * 테마 적용 유틸
 * 설정의 밝은/어두운/자동 테마를 document에 반영
 *
 * @see 05_UI_UX_DESIGN.md - 외관 설정, 테마
 */

export type ThemeMode = 'light' | 'dark' | 'auto';

const SETTINGS_KEY = 'app_settings';

/** localStorage의 app_settings에서 현재 테마 반환 */
export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const theme = parsed?.appearance?.theme as ThemeMode | undefined;
      if (theme === 'light' || theme === 'dark' || theme === 'auto') return theme;
    }
  } catch {
    // 무시
  }
  return 'light';
}

/** 테마를 app_settings에 저장 후 적용 */
export function saveStoredTheme(theme: ThemeMode): void {
  try {
    let settings: Record<string, unknown> = {};
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        settings = JSON.parse(saved) as Record<string, unknown>;
      } catch {
        // 무시
      }
    }
    if (!settings.appearance || typeof settings.appearance !== 'object') {
      settings.appearance = {};
    }
    (settings.appearance as Record<string, string>).theme = theme;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // 무시
  }
  applyTheme(theme);
}

export function applyTheme(theme: ThemeMode): void {
  const html = document.documentElement;

  if (theme === 'auto') {
    html.removeAttribute('data-theme');
    return;
  }

  html.setAttribute('data-theme', theme);
}

/**
 * localStorage의 app_settings에서 테마를 읽어 적용
 */
export function initTheme(): void {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const theme = parsed?.appearance?.theme as ThemeMode | undefined;
      if (theme === 'light' || theme === 'dark' || theme === 'auto') {
        applyTheme(theme);
        return;
      }
    }
  } catch {
    // 무시
  }
  applyTheme('light');
}
