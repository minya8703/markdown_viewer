/**
 * 암호화 다이얼로그 컴포넌트
 * 파일 저장 시 암호화 옵션 및 비밀번호 입력
 * 
 * @see 02_REQUIREMENTS.md - FR-4.1 (파일 암호화)
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (features/ui 레이어)
 */

import { fileEncryption } from '../lib/crypto';
import './EncryptionDialog.css';

type ElementWithKeydown = HTMLElement & { __keydownHandler?: (e: KeyboardEvent) => void };

export interface EncryptionDialogProps {
  fileName: string;
  onConfirm: (password: string, rememberPassword: boolean) => void;
  onCancel: () => void;
}

export class EncryptionDialog {
  private element: HTMLElement;
  private props: EncryptionDialogProps;
  private passwordInput: HTMLInputElement | null = null;
  private confirmPasswordInput: HTMLInputElement | null = null;
  private rememberPasswordCheckbox: HTMLInputElement | null = null;
  private strengthIndicator: HTMLElement | null = null;

  constructor(props: EncryptionDialogProps) {
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
              <i class="fas fa-lock"></i>
              파일 암호화
            </h2>
            <button class="encryption-dialog__close-btn" aria-label="닫기">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="encryption-dialog__content">
            <p class="encryption-dialog__info">
              파일 "<strong>${this.props.fileName}</strong>"을(를) 암호화하여 저장합니다.
            </p>
            <p class="encryption-dialog__warning">
              <i class="fas fa-exclamation-triangle"></i>
              비밀번호를 잊어버리면 파일을 복구할 수 없습니다. 안전한 곳에 보관하세요.
            </p>

            <div class="encryption-dialog__form">
              <div class="encryption-dialog__field">
                <label class="encryption-dialog__label" for="encryptPassword">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="encryptPassword"
                  class="encryption-dialog__input"
                  placeholder="비밀번호를 입력하세요"
                  autocomplete="new-password"
                />
                <div class="encryption-dialog__strength" id="passwordStrength"></div>
              </div>

              <div class="encryption-dialog__field">
                <label class="encryption-dialog__label" for="encryptConfirmPassword">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  id="encryptConfirmPassword"
                  class="encryption-dialog__input"
                  placeholder="비밀번호를 다시 입력하세요"
                  autocomplete="new-password"
                />
                <div class="encryption-dialog__error" id="passwordError"></div>
              </div>

              <div class="encryption-dialog__field">
                <label class="encryption-dialog__label">
                  <input
                    type="checkbox"
                    id="rememberPassword"
                    class="encryption-dialog__checkbox"
                  />
                  <span>이 비밀번호를 기억하기 (localStorage에 저장)</span>
                </label>
                <p class="encryption-dialog__hint">
                  다음에 같은 비밀번호로 암호화할 때 자동으로 입력됩니다.
                </p>
              </div>
            </div>
          </div>

          <div class="encryption-dialog__footer">
            <button class="encryption-dialog__cancel-btn" id="cancelBtn">
              취소
            </button>
            <button class="encryption-dialog__confirm-btn" id="confirmBtn" disabled>
              암호화하여 저장
            </button>
          </div>
        </div>
      </div>
    `;

    this.passwordInput = this.element.querySelector('#encryptPassword') as HTMLInputElement;
    this.confirmPasswordInput = this.element.querySelector('#encryptConfirmPassword') as HTMLInputElement;
    this.rememberPasswordCheckbox = this.element.querySelector('#rememberPassword') as HTMLInputElement;
    this.strengthIndicator = this.element.querySelector('#passwordStrength');
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

    // 비밀번호 입력 시 강도 표시
    this.passwordInput?.addEventListener('input', () => {
      this.updatePasswordStrength();
      this.validateForm();
    });

    // 비밀번호 확인 입력 시 일치 여부 확인
    this.confirmPasswordInput?.addEventListener('input', () => {
      this.validateForm();
    });

    // Enter 키로 확인
    this.passwordInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !confirmBtn.disabled) {
        this.handleConfirm();
      }
    });

    this.confirmPasswordInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !confirmBtn.disabled) {
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
  }

  private updatePasswordStrength(): void {
    if (!this.passwordInput || !this.strengthIndicator) return;

    const password = this.passwordInput.value;
    if (password === '') {
      this.strengthIndicator.textContent = '';
      this.strengthIndicator.className = 'encryption-dialog__strength';
      return;
    }

    const validation = fileEncryption.validatePasswordStrength(password);
    this.strengthIndicator.textContent = validation.message;
    this.strengthIndicator.className = `encryption-dialog__strength encryption-dialog__strength--${validation.strength}`;
  }

  private validateForm(): boolean {
    if (!this.passwordInput || !this.confirmPasswordInput) return false;

    const password = this.passwordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;
    const errorElement = this.element.querySelector('#passwordError') as HTMLElement;
    const confirmBtn = this.element.querySelector('#confirmBtn') as HTMLButtonElement;

    // 비밀번호 강도 검증
    const validation = fileEncryption.validatePasswordStrength(password);
    if (!validation.isValid) {
      if (errorElement) {
        errorElement.textContent = validation.message;
        errorElement.style.display = 'block';
      }
      if (confirmBtn) confirmBtn.disabled = true;
      return false;
    }

    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      if (errorElement) {
        errorElement.textContent = '비밀번호가 일치하지 않습니다.';
        errorElement.style.display = 'block';
      }
      if (confirmBtn) confirmBtn.disabled = true;
      return false;
    }

    // 모든 검증 통과
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
    if (confirmBtn) confirmBtn.disabled = false;
    return true;
  }

  private handleConfirm(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.passwordInput || !this.rememberPasswordCheckbox) {
      return;
    }

    const password = this.passwordInput.value;
    const rememberPassword = this.rememberPasswordCheckbox.checked;

    // 키보드 이벤트 리스너 제거
    const handler = (this.element as ElementWithKeydown).__keydownHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
    }

    this.props.onConfirm(password, rememberPassword);
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
