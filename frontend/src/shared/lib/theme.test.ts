/**
 * 테마 유틸 단위 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, initTheme } from './theme';

describe('theme', () => {
  let html: HTMLElement;

  beforeEach(() => {
    html = document.documentElement;
    html.removeAttribute('data-theme');
    localStorage.clear();
  });

  describe('applyTheme', () => {
    it('light 시 data-theme="light"가 설정된다', () => {
      applyTheme('light');
      expect(html.getAttribute('data-theme')).toBe('light');
    });

    it('dark 시 data-theme="dark"가 설정된다', () => {
      applyTheme('dark');
      expect(html.getAttribute('data-theme')).toBe('dark');
    });

    it('auto 시 data-theme가 제거된다', () => {
      applyTheme('light');
      applyTheme('auto');
      expect(html.getAttribute('data-theme')).toBeNull();
    });
  });

  describe('initTheme', () => {
    it('localStorage에 theme이 없으면 light를 적용한다', () => {
      initTheme();
      expect(html.getAttribute('data-theme')).toBe('light');
    });

    it('localStorage에 appearance.theme이 light이면 light를 적용한다', () => {
      localStorage.setItem(
        'app_settings',
        JSON.stringify({ appearance: { theme: 'light' } })
      );
      initTheme();
      expect(html.getAttribute('data-theme')).toBe('light');
    });

    it('localStorage에 appearance.theme이 dark이면 dark를 적용한다', () => {
      localStorage.setItem(
        'app_settings',
        JSON.stringify({ appearance: { theme: 'dark' } })
      );
      initTheme();
      expect(html.getAttribute('data-theme')).toBe('dark');
    });

    it('localStorage에 appearance.theme이 auto이면 data-theme를 제거한다', () => {
      localStorage.setItem(
        'app_settings',
        JSON.stringify({ appearance: { theme: 'auto' } })
      );
      initTheme();
      expect(html.getAttribute('data-theme')).toBeNull();
    });

    it('잘못된 JSON이면 light를 적용한다', () => {
      localStorage.setItem('app_settings', 'invalid');
      initTheme();
      expect(html.getAttribute('data-theme')).toBe('light');
    });
  });
});
