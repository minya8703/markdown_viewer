/**
 * 에디터 컴포넌트
 * 전체 화면 마크다운 에디터
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-3.1 (편집 모드), FR-3.2 (Smart Paste), FR-3.3 (편집 종료)
 * @see docs/40_frontend/40_UI_UX_DESIGN.md - 편집 모드 UI 설계, 키보드 단축키
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (features 레이어), TypeScript 코딩 규약
 */

import { handleSmartPaste, hasUnsavedChanges } from '../lib/editor';
import { ConfirmCloseDialog } from './ConfirmCloseDialog';
import './Editor.css';

export interface EditorCallbacks {
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  onClose?: () => void;
}

export class Editor {
  private container: HTMLElement;
  private textarea: HTMLTextAreaElement | null = null;
  private callbacks: EditorCallbacks;
  private originalContent: string = '';
  private _fileName: string = '';

  constructor(container: HTMLElement, callbacks: EditorCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    this.container.className = 'editor';
    this.container.innerHTML = `
      <div class="editor__container">
        <div class="editor__header">
          <span class="editor__filename"></span>
          <div class="editor__actions">
            <button class="editor__save-btn" aria-label="저장 (Ctrl+S)">
              <i class="fas fa-save"></i>
              <span>저장</span>
            </button>
            <button class="editor__close-btn" aria-label="닫기 (Esc)">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="editor__content">
          <textarea 
            class="editor__textarea" 
            placeholder="마크다운을 입력하세요..."
            spellcheck="false"
          ></textarea>
        </div>
        <div class="editor__footer">
          <span class="editor__status"></span>
        </div>
      </div>
    `;

    this.textarea = this.container.querySelector('.editor__textarea') as HTMLTextAreaElement;
  }

  private setupEventListeners(): void {
    if (!this.textarea) return;

    // Smart Paste
    this.textarea.addEventListener('paste', (e) => {
      handleSmartPaste(e as ClipboardEvent, this.textarea!);
    });

    // 내용 변경 감지
    this.textarea.addEventListener('input', () => {
      if (this.callbacks.onContentChange) {
        this.callbacks.onContentChange(this.textarea!.value);
      }
      this.updateStatus();
    });

    // 저장 버튼
    const saveButton = this.container.querySelector('.editor__save-btn');
    saveButton?.addEventListener('click', () => {
      if (this.callbacks.onSave) {
        this.callbacks.onSave();
      }
    });

    // 닫기 버튼
    const closeButton = this.container.querySelector('.editor__close-btn');
    closeButton?.addEventListener('click', () => {
      this.handleClose();
    });

    // Ctrl+S 저장
    this.textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (this.callbacks.onSave) {
          this.callbacks.onSave();
        }
      }
    });

    // Esc로 닫기
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleClose();
      }
    });

    // beforeunload 이벤트 (페이지 떠날 때 확인)
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
        return e.returnValue;
      }
    });
  }

  private handleClose(): void {
    if (this.hasUnsavedChanges()) {
      const dialog = new ConfirmCloseDialog({
        onResult: (result) => {
          if (result === 'save-and-close') {
            if (this.callbacks.onSave) {
              this.callbacks.onSave();
            }
            setTimeout(() => {
              if (this.callbacks.onClose) {
                this.callbacks.onClose();
              }
            }, 100);
          } else if (result === 'close-without-save') {
            if (this.callbacks.onClose) {
              this.callbacks.onClose();
            }
          }
          // 'cancel'은 아무 작업 없음
        },
      });
      document.body.appendChild(dialog.getElement());
    } else {
      if (this.callbacks.onClose) {
        this.callbacks.onClose();
      }
    }
  }

  private hasUnsavedChanges(): boolean {
    if (!this.textarea) return false;
    return hasUnsavedChanges(this.originalContent, this.textarea.value);
  }

  private updateStatus(): void {
    const statusElement = this.container.querySelector('.editor__status');
    if (!statusElement) return;

    if (this.hasUnsavedChanges()) {
      statusElement.textContent = '저장되지 않음';
      statusElement.className = 'editor__status editor__status--unsaved';
    } else {
      statusElement.textContent = '저장됨';
      statusElement.className = 'editor__status editor__status--saved';
    }
  }

  /**
   * 콘텐츠 설정
   */
  setContent(content: string): void {
    this.originalContent = content;
    if (this.textarea) {
      this.textarea.value = content;
      this.updateStatus();
    }
  }

  /**
   * 파일명 설정
   */
  setFileName(fileName: string): void {
    this._fileName = fileName;
    const fileNameElement = this.container.querySelector('.editor__filename');
    if (fileNameElement) fileNameElement.textContent = fileName;
  }

  /** 현재 설정된 파일명 (헤더 표시용 등) */
  getFileName(): string {
    return this._fileName;
  }

  /**
   * 현재 콘텐츠 가져오기
   */
  getContent(): string {
    return this.textarea?.value || '';
  }

  /**
   * 원본 콘텐츠 가져오기
   */
  getOriginalContent(): string {
    return this.originalContent;
  }

  /**
   * 저장되지 않은 변경사항 여부 확인
   */
  checkUnsavedChanges(): boolean {
    return this.hasUnsavedChanges();
  }

  /**
   * 저장 상태 업데이트
   */
  setSaveStatus(status: 'saved' | 'saving' | 'failed'): void {
    const statusElement = this.container.querySelector('.editor__status');
    if (!statusElement) return;

    const statusText: Record<string, string> = {
      saved: '저장됨',
      saving: '저장 중...',
      failed: '저장 실패',
    };

    statusElement.textContent = statusText[status] || '';
    statusElement.className = `editor__status editor__status--${status}`;

    // 저장 성공 시 원본 콘텐츠 업데이트
    if (status === 'saved' && this.textarea) {
      this.originalContent = this.textarea.value;
    }
  }

  /**
   * 포커스 설정
   */
  focus(): void {
    if (this.textarea) {
      this.textarea.focus();
      // 커서를 끝으로 이동
      this.textarea.setSelectionRange(
        this.textarea.value.length,
        this.textarea.value.length
      );
    }
  }

  /**
   * 초기화
   */
  clear(): void {
    this.originalContent = '';
    this._fileName = '';
    if (this.textarea) {
      this.textarea.value = '';
    }
    this.updateStatus();
  }

  /**
   * 컨테이너 요소 반환
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * 에디터 제거
   */
  destroy(): void {
    // beforeunload 이벤트 리스너 제거는 자동으로 처리됨
    this.container.remove();
  }
}
