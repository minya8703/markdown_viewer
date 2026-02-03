/**
 * 편집 종료 시 변경사항 확인 다이얼로그
 * 설계: 저장 후 닫기 / 저장하지 않고 닫기 / 취소 (05_UI_UX_DESIGN)
 */

import './ConfirmCloseDialog.css';

export type ConfirmCloseResult = 'save-and-close' | 'close-without-save' | 'cancel';

export interface ConfirmCloseDialogCallbacks {
  onResult: (result: ConfirmCloseResult) => void;
}

export class ConfirmCloseDialog {
  private element: HTMLElement;
  private callbacks: ConfirmCloseDialogCallbacks;

  constructor(callbacks: ConfirmCloseDialogCallbacks) {
    this.callbacks = callbacks;
    this.element = document.createElement('div');
    this.element.className = 'confirm-close-dialog';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-labelledby', 'confirm-close-dialog-title');
    this.element.setAttribute('aria-modal', 'true');
    this.render();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="confirm-close-dialog__backdrop"></div>
      <div class="confirm-close-dialog__container">
        <h2 id="confirm-close-dialog-title" class="confirm-close-dialog__title">
          저장되지 않은 변경사항이 있습니다.
        </h2>
        <p class="confirm-close-dialog__desc">
          편집을 종료하기 전에 저장하시겠습니까?
        </p>
        <div class="confirm-close-dialog__actions">
          <button type="button" class="confirm-close-dialog__btn confirm-close-dialog__btn--primary" data-result="save-and-close">
            저장 후 닫기
          </button>
          <button type="button" class="confirm-close-dialog__btn confirm-close-dialog__btn--secondary" data-result="close-without-save">
            저장하지 않고 닫기
          </button>
          <button type="button" class="confirm-close-dialog__btn confirm-close-dialog__btn--ghost" data-result="cancel">
            취소
          </button>
        </div>
      </div>
    `;

    const backdrop = this.element.querySelector('.confirm-close-dialog__backdrop');
    const buttons = this.element.querySelectorAll('[data-result]');

    const closeWith = (result: ConfirmCloseResult) => {
      this.callbacks.onResult(result);
      this.destroy();
    };

    backdrop?.addEventListener('click', () => closeWith('cancel'));

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const result = (btn as HTMLElement).dataset.result as ConfirmCloseResult;
        closeWith(result);
      });
    });

    const cancelBtn = this.element.querySelector('[data-result="cancel"]');
    cancelBtn?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') closeWith('cancel');
    });

    document.addEventListener('keydown', this.handleEscape);
  }

  private handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.callbacks.onResult('cancel');
      this.destroy();
    }
  };

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleEscape);
    this.element.remove();
  }
}
