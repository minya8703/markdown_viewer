/**
 * 복호화 다이얼로그 컴포넌트
 * 암호화된 파일 읽기 시 비밀번호 입력
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-4.1 (파일 암호화)
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (features/ui 레이어)
 */

import './EncryptionDialog.css'; // 같은 스타일 사용

type ElementWithKeydown = HTMLElement & { __keydownHandler?: (e: KeyboardEvent) => void };

export interface DecryptionDialogProps {
  fileName: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export class DecryptionDialog {
  private element: HTMLElement;
  private props: DecryptionDialogProps;
  private passwordInput: HTMLInputElement | null = null;

  constructor(props: DecryptionDialogProps) {
    this.props = props;
    this.element = document.createElement('div');
    this.element.className = 'encryption-dialog';
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="encryption-dialog__overlay">
        <div class="encryption-dialog__container">
          <div class="encryption-dialog__header">
            <h2 class="encryption-dialog__title">
              <i class="fas fa-unlock"></i>
              파일 복호화
            </h2>
            <button class="encryption-dialog__close-btn" aria-label="닫기">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="encryption-dialog__content">
            <p class="encryption-dialog__info">
              파일 "<strong>${this.props.fileName}</strong>"은(는) 암호화되어 있습니다.
              비밀번호를 입력하여 복호화하세요.
            </p>

            <div class="encryption-dialog__form">
              <div class="encryption-dialog__field">
                <label class="encryption-dialog__label" for="decryptPassword">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="decryptPassword"
                  class="encryption-dialog__input"
                  placeholder="비밀번호를 입력하세요"
                  autocomplete="current-password"
                />
                <div class="encryption-dialog__error" id="passwordError"></div>
              </div>
            </div>
          </div>

          <div class="encryption-dialog__footer">
            <button class="encryption-dialog__cancel-btn" id="cancelBtn">
              취소
            </button>
            <button class="encryption-dialog__confirm-btn" id="confirmBtn">
              복호화
            </button>
          </div>
        </div>
      </div>
    `;

    this.passwordInput = this.element.querySelector('#decryptPassword') as HTMLInputElement;
  }

  private setupEventListeners(): void {
    // 닫기 버튼
    const closeBtn = this.element.querySelector('.encryption-dialog__close-btn');
    closeBtn?.addEventListener('click', () => {
      this.props.onCancel();
    });

    // 취소 버튼
    const cancelBtn = this.element.querySelector('#cancelBtn');
    cancelBtn?.addEventListener('click', () => {
      this.props.onCancel();
    });

    // 확인 버튼
    const confirmBtn = this.element.querySelector('#confirmBtn') as HTMLButtonElement;
    confirmBtn?.addEventListener('click', () => {
      this.handleConfirm();
    });

    // Enter 키로 확인
    this.passwordInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleConfirm();
      }
    });

    // Esc 키로 취소
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.props.onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    (this.element as ElementWithKeydown).__keydownHandler = handleKeyDown;

    // 포커스 설정
    setTimeout(() => {
      this.passwordInput?.focus();
    }, 100);
  }

  private handleConfirm(): void {
    if (!this.passwordInput) {
      return;
    }

    const password = this.passwordInput.value.trim();
    if (password === '') {
      const errorElement = this.element.querySelector('#passwordError') as HTMLElement;
      if (errorElement) {
        errorElement.textContent = '비밀번호를 입력해주세요.';
        errorElement.style.display = 'block';
      }
      return;
    }

    // 키보드 이벤트 리스너 제거
    const handler = (this.element as ElementWithKeydown).__keydownHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
    }

    this.props.onConfirm(password);
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    const handler = (this.element as ElementWithKeydown).__keydownHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
    }
    this.element.remove();
  }
}
