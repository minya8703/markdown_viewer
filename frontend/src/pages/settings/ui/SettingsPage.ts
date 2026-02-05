/**
 * Settings 페이지
 * 애플리케이션 설정 관리 페이지
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-5 (사용자 경험), 설정 관련 요구사항
 * @see docs/40_frontend/40_UI_UX_DESIGN.md - 설정 화면 UI 설계
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (pages 레이어), TypeScript 코딩 규약
 */

import { applyTheme } from '@shared/lib/theme';
import type { AutoSaveConfig, EncryptionConfig } from '@shared/types';
import './SettingsPage.css';

type ElementWithKeydown = HTMLElement & { __keydownHandler?: (e: KeyboardEvent) => void };

export interface SettingsPageProps {
  onClose?: () => void;
  onSave?: (settings: SettingsData) => void;
  /** true면 전용 화면 레이아웃(전체 화면, 오버레이 아님) */
  fullPage?: boolean;
}

export interface SettingsData {
  autoSave: AutoSaveConfig;
  encryption: EncryptionConfig;
  editor: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    wordWrap: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
  };
}

export class SettingsPage {
  private element: HTMLElement;
  private props: SettingsPageProps;
  private settings: SettingsData;

  constructor(props: SettingsPageProps = {}) {
    this.props = props;
    this.element = document.createElement('div');
    this.element.className = 'settings-page' + (props.fullPage ? ' settings-page--full' : '');
    
    // localStorage에서 설정 로드
    this.settings = this.loadSettings();
    
    this.render();
    this.setupEventListeners();
  }

  private loadSettings(): SettingsData {
    const defaultSettings: SettingsData = {
      autoSave: {
        enabled: true,
        interval: 180, // 3분
        minChanges: 10,
      },
      encryption: {
        enabled: false,
        algorithm: 'AES-256-GCM',
      },
      editor: {
        fontSize: 16,
        fontFamily: 'Courier New, Monaco, Menlo, monospace',
        lineHeight: 1.6,
        wordWrap: true,
      },
      appearance: {
        theme: 'light',
      },
    };

    try {
      const saved = localStorage.getItem('app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    return defaultSettings;
  }

  private saveSettings(settings: SettingsData): void {
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings));
      this.settings = settings;
      
      if (this.props.onSave) {
        this.props.onSave(settings);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="settings-page__container">
        <div class="settings-page__header">
          <h1 class="settings-page__title">설정</h1>
          <button class="settings-page__close-btn" aria-label="닫기">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="settings-page__content">
          <!-- 자동 저장 설정 -->
          <section class="settings-section">
            <h2 class="settings-section__title">
              <i class="fas fa-save"></i>
              자동 저장
            </h2>
            <div class="settings-section__content">
              <div class="settings-item">
                <label class="settings-item__label">
                  <input 
                    type="checkbox" 
                    class="settings-item__checkbox" 
                    id="autoSaveEnabled"
                    ${this.settings.autoSave.enabled ? 'checked' : ''}
                  />
                  <span>자동 저장 활성화</span>
                </label>
              </div>
              
              <div class="settings-item">
                <label class="settings-item__label" for="autoSaveInterval">
                  저장 간격 (초)
                </label>
                <input 
                  type="number" 
                  class="settings-item__input" 
                  id="autoSaveInterval"
                  min="30" 
                  max="600" 
                  step="30"
                  value="${this.settings.autoSave.interval}"
                  ${!this.settings.autoSave.enabled ? 'disabled' : ''}
                />
                <span class="settings-item__hint">30초 ~ 600초 (기본: 180초)</span>
              </div>

              <div class="settings-item">
                <label class="settings-item__label" for="autoSaveMinChanges">
                  즉시 저장 최소 변경 횟수
                </label>
                <input 
                  type="number" 
                  class="settings-item__input" 
                  id="autoSaveMinChanges"
                  min="1" 
                  max="100" 
                  step="1"
                  value="${this.settings.autoSave.minChanges}"
                  ${!this.settings.autoSave.enabled ? 'disabled' : ''}
                />
                <span class="settings-item__hint">이 횟수 이상 변경 시 즉시 저장 (기본: 10)</span>
              </div>
            </div>
          </section>

          <!-- 편집기 설정 -->
          <section class="settings-section">
            <h2 class="settings-section__title">
              <i class="fas fa-edit"></i>
              편집기
            </h2>
            <div class="settings-section__content">
              <div class="settings-item">
                <label class="settings-item__label" for="editorFontSize">
                  글꼴 크기
                </label>
                <input 
                  type="number" 
                  class="settings-item__input" 
                  id="editorFontSize"
                  min="12" 
                  max="24" 
                  step="1"
                  value="${this.settings.editor.fontSize}"
                />
                <span class="settings-item__hint">12px ~ 24px (기본: 16px)</span>
              </div>

              <div class="settings-item">
                <label class="settings-item__label" for="editorFontFamily">
                  글꼴
                </label>
                <select class="settings-item__select" id="editorFontFamily">
                  <option value="Courier New, Monaco, Menlo, monospace" ${this.settings.editor.fontFamily.includes('Courier') ? 'selected' : ''}>
                    Courier New
                  </option>
                  <option value="Consolas, Monaco, monospace" ${this.settings.editor.fontFamily.includes('Consolas') ? 'selected' : ''}>
                    Consolas
                  </option>
                  <option value="Monaco, Menlo, monospace" ${this.settings.editor.fontFamily.includes('Monaco') && !this.settings.editor.fontFamily.includes('Courier') ? 'selected' : ''}>
                    Monaco
                  </option>
                  <option value="'Fira Code', monospace" ${this.settings.editor.fontFamily.includes('Fira') ? 'selected' : ''}>
                    Fira Code
                  </option>
                </select>
              </div>

              <div class="settings-item">
                <label class="settings-item__label" for="editorLineHeight">
                  줄 간격
                </label>
                <input 
                  type="number" 
                  class="settings-item__input" 
                  id="editorLineHeight"
                  min="1.0" 
                  max="2.5" 
                  step="0.1"
                  value="${this.settings.editor.lineHeight}"
                />
                <span class="settings-item__hint">1.0 ~ 2.5 (기본: 1.6)</span>
              </div>

              <div class="settings-item">
                <label class="settings-item__label">
                  <input 
                    type="checkbox" 
                    class="settings-item__checkbox" 
                    id="editorWordWrap"
                    ${this.settings.editor.wordWrap ? 'checked' : ''}
                  />
                  <span>자동 줄바꿈</span>
                </label>
              </div>
            </div>
          </section>

          <!-- 암호화 설정 -->
          <section class="settings-section">
            <h2 class="settings-section__title">
              <i class="fas fa-lock"></i>
              파일 암호화
            </h2>
            <div class="settings-section__content">
              <div class="settings-item">
                <label class="settings-item__label">
                  <input 
                    type="checkbox" 
                    class="settings-item__checkbox" 
                    id="encryptionEnabled"
                    ${this.settings.encryption.enabled ? 'checked' : ''}
                  />
                  <span>새 파일 저장 시 암호화 (기본값)</span>
                </label>
                <span class="settings-item__hint">클라이언트 사이드 AES-256-GCM 암호화</span>
              </div>
            </div>
          </section>

          <!-- 외관 설정 -->
          <section class="settings-section">
            <h2 class="settings-section__title">
              <i class="fas fa-palette"></i>
              외관
            </h2>
            <div class="settings-section__content">
              <div class="settings-item">
                <label class="settings-item__label" for="appearanceTheme">
                  테마
                </label>
                <select class="settings-item__select" id="appearanceTheme">
                  <option value="light" ${this.settings.appearance.theme === 'light' ? 'selected' : ''}>
                    밝은 테마
                  </option>
                  <option value="dark" ${this.settings.appearance.theme === 'dark' ? 'selected' : ''}>
                    어두운 테마
                  </option>
                  <option value="auto" ${this.settings.appearance.theme === 'auto' ? 'selected' : ''}>
                    시스템 설정 따르기
                  </option>
                </select>
                <span class="settings-item__hint">밝은/어두운 테마 또는 OS 설정 따르기</span>
              </div>
            </div>
          </section>
        </div>

        <div class="settings-page__footer">
          <button class="settings-page__reset-btn" id="resetSettings">
            기본값으로 재설정
          </button>
          <div class="settings-page__actions">
            <button class="settings-page__cancel-btn" id="cancelSettings">
              취소
            </button>
            <button class="settings-page__save-btn" id="saveSettings">
              저장
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // 닫기 버튼
    const closeBtn = this.element.querySelector('.settings-page__close-btn');
    closeBtn?.addEventListener('click', () => {
      this.handleClose();
    });

    // 취소 버튼
    const cancelBtn = this.element.querySelector('#cancelSettings');
    cancelBtn?.addEventListener('click', () => {
      this.handleClose();
    });

    // 저장 버튼
    const saveBtn = this.element.querySelector('#saveSettings');
    saveBtn?.addEventListener('click', () => {
      this.handleSave();
    });

    // 기본값 재설정 버튼
    const resetBtn = this.element.querySelector('#resetSettings');
    resetBtn?.addEventListener('click', () => {
      this.handleReset();
    });

    // 자동 저장 활성화 체크박스
    const autoSaveEnabled = this.element.querySelector('#autoSaveEnabled') as HTMLInputElement;
    autoSaveEnabled?.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      const intervalInput = this.element.querySelector('#autoSaveInterval') as HTMLInputElement;
      const minChangesInput = this.element.querySelector('#autoSaveMinChanges') as HTMLInputElement;
      
      if (intervalInput) intervalInput.disabled = !enabled;
      if (minChangesInput) minChangesInput.disabled = !enabled;
    });

    // Esc 키로 닫기
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    // cleanup을 위해 저장
    (this.element as ElementWithKeydown).__keydownHandler = handleKeyDown;
  }

  private handleSave(): void {
    const settings: SettingsData = {
      autoSave: {
        enabled: (this.element.querySelector('#autoSaveEnabled') as HTMLInputElement)?.checked ?? true,
        interval: parseInt((this.element.querySelector('#autoSaveInterval') as HTMLInputElement)?.value || '180', 10),
        minChanges: parseInt((this.element.querySelector('#autoSaveMinChanges') as HTMLInputElement)?.value || '10', 10),
      },
      encryption: {
        enabled: (this.element.querySelector('#encryptionEnabled') as HTMLInputElement)?.checked ?? false,
        algorithm: 'AES-256-GCM',
      },
      editor: {
        fontSize: parseInt((this.element.querySelector('#editorFontSize') as HTMLInputElement)?.value || '16', 10),
        fontFamily: (this.element.querySelector('#editorFontFamily') as HTMLSelectElement)?.value || 'Courier New, Monaco, Menlo, monospace',
        lineHeight: parseFloat((this.element.querySelector('#editorLineHeight') as HTMLInputElement)?.value || '1.6'),
        wordWrap: (this.element.querySelector('#editorWordWrap') as HTMLInputElement)?.checked ?? true,
      },
      appearance: {
        theme: (this.element.querySelector('#appearanceTheme') as HTMLSelectElement)?.value as 'light' | 'dark' | 'auto' || 'light',
      },
    };

    this.saveSettings(settings);
    applyTheme(settings.appearance.theme);
    this.handleClose();
  }

  private handleReset(): void {
    if (confirm('모든 설정을 기본값으로 재설정하시겠습니까?')) {
      localStorage.removeItem('app_settings');
      this.settings = this.loadSettings();
      applyTheme(this.settings.appearance.theme);
      this.render();
      this.setupEventListeners();
    }
  }

  private handleClose(): void {
    // 키보드 이벤트 리스너 제거
    const handler = (this.element as ElementWithKeydown).__keydownHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
    }

    if (this.props.onClose) {
      this.props.onClose();
    } else {
      this.element.remove();
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  getSettings(): SettingsData {
    return this.settings;
  }

  destroy(): void {
    // 라우터 전환 시 정리만 수행 (onClose는 사용자 취소/저장 시에만 호출)
    const handler = (this.element as HTMLElement & { __keydownHandler?: (e: KeyboardEvent) => void }).__keydownHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
    }
  }
}
