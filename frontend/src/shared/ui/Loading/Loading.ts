/**
 * 로딩 인디케이터 컴포넌트
 */

export class Loading {
  private element: HTMLElement;

  constructor(size: 'sm' | 'md' | 'lg' = 'md') {
    this.element = document.createElement('div');
    this.element.className = `loading loading--${size}`;
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-label', '로딩 중');
    
    const spinner = document.createElement('div');
    spinner.className = 'loading__spinner';
    this.element.appendChild(spinner);
  }

  getElement(): HTMLElement {
    return this.element;
  }

  show(): void {
    this.element.classList.add('loading--visible');
  }

  hide(): void {
    this.element.classList.remove('loading--visible');
  }

  destroy(): void {
    this.element.remove();
  }
}
