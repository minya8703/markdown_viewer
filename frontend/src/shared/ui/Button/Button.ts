/**
 * 공유 Button 컴포넌트
 * 재사용 가능한 버튼 UI 컴포넌트
 * 
 * @see 05_UI_UX_DESIGN.md - 버튼 컴포넌트 설계
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (shared/ui 레이어), 컴포넌트 네이밍 규약
 */

import './Button.css';

export interface ButtonProps {
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export class Button {
  private element: HTMLButtonElement;

  constructor(props: ButtonProps) {
    this.element = document.createElement('button');
    this.render(props);
  }

  private render(props: ButtonProps): void {
    const {
      label,
      icon,
      variant = 'primary',
      size = 'md',
      disabled = false,
      ariaLabel,
      onClick,
      type = 'button',
    } = props;

    this.element.type = type;
    this.element.className = `btn btn--${variant} btn--${size}`;
    this.element.disabled = disabled;
    
    if (ariaLabel) {
      this.element.setAttribute('aria-label', ariaLabel);
    }

    if (onClick) {
      this.element.addEventListener('click', onClick);
    }

    // 아이콘과 라벨 렌더링
    if (icon) {
      const iconElement = document.createElement('i');
      iconElement.className = icon;
      this.element.appendChild(iconElement);
    }

    if (label) {
      const labelElement = document.createTextNode(label);
      this.element.appendChild(labelElement);
    }
  }

  getElement(): HTMLButtonElement {
    return this.element;
  }

  setDisabled(disabled: boolean): void {
    this.element.disabled = disabled;
  }

  destroy(): void {
    this.element.remove();
  }
}
