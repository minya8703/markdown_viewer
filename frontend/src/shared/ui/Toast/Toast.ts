/**
 * Toast 알림 컴포넌트
 * 사용자에게 알림 메시지를 표시하는 컴포넌트
 * 
 * @see docs/40_frontend/40_UI_UX_DESIGN.md - UI 피드백 (알림)
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (shared/ui 레이어)
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // 밀리초
}

export class Toast {
  private static container: HTMLElement | null = null;
  private static toasts: Map<string, HTMLElement> = new Map();

  static init(): void {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('role', 'status');
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  }

  static show(options: ToastOptions): void {
    this.init();

    const { message, type = 'info', duration = 3000 } = options;
    const toastId = `toast-${Date.now()}-${Math.random()}`;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('id', toastId);
    toast.setAttribute('role', 'alert');

    const icon = this.getIcon(type);
    const iconElement = document.createElement('i');
    iconElement.className = icon;
    toast.appendChild(iconElement);

    const messageElement = document.createTextNode(message);
    toast.appendChild(messageElement);

    this.container!.appendChild(toast);
    this.toasts.set(toastId, toast);

    // 애니메이션
    requestAnimationFrame(() => {
      toast.classList.add('toast--show');
    });

    // 자동 제거
    setTimeout(() => {
      this.hide(toastId);
    }, duration);
  }

  static hide(toastId: string): void {
    const toast = this.toasts.get(toastId);
    if (!toast) return;

    toast.classList.remove('toast--show');
    toast.classList.add('toast--hide');

    setTimeout(() => {
      toast.remove();
      this.toasts.delete(toastId);
    }, 300);
  }

  private static getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle',
    };
    return icons[type];
  }

  static success(message: string, duration?: number): void {
    this.show({ message, type: 'success', duration });
  }

  static error(message: string, duration?: number): void {
    this.show({ message, type: 'error', duration });
  }

  static warning(message: string, duration?: number): void {
    this.show({ message, type: 'warning', duration });
  }

  static info(message: string, duration?: number): void {
    this.show({ message, type: 'info', duration });
  }
}
