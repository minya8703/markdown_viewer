/**
 * 아이콘 전용 버튼 컴포넌트
 * Font Awesome 아이콘을 사용하는 버튼
 * 
 * @see 02_REQUIREMENTS.md - FR-5.4 (직관적인 아이콘 기반 UI)
 * @see 05_UI_UX_DESIGN.md - 아이콘 매핑, 접근성 가이드라인
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (shared/ui 레이어)
 */

import './IconButton.css';

export interface IconButtonProps {
  icon: string; // Font Awesome 클래스 (예: 'fas fa-bars')
  ariaLabel: string; // 접근성을 위한 레이블
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  active?: boolean; // 활성 상태 (토글 버튼 등)
}

export class IconButton {
  private element: HTMLButtonElement;
  private iconElement: HTMLElement | null = null;

  constructor(props: IconButtonProps) {
    this.element = document.createElement('button');
    this.render(props);
  }

  private render(props: IconButtonProps): void {
    const {
      icon,
      ariaLabel,
      size = 'md',
      variant = 'default',
      disabled = false,
      onClick,
      active = false,
    } = props;

    this.element.type = 'button';
    this.element.className = `icon-btn icon-btn--${variant} icon-btn--${size}`;
    this.element.disabled = disabled;
    this.element.setAttribute('aria-label', ariaLabel);
    this.element.setAttribute('title', ariaLabel); // 툴팁 (설계: 아이콘에 툴팁 제공)
    this.element.setAttribute('role', 'button');

    if (active) {
      this.element.classList.add('icon-btn--active');
    }

    // 아이콘 렌더링
    this.iconElement = document.createElement('i');
    this.iconElement.className = icon;
    this.element.appendChild(this.iconElement);

    // 클릭 이벤트
    if (onClick) {
      this.element.addEventListener('click', (e) => {
        e.preventDefault();
        if (!disabled) {
          onClick();
        }
      });
    }
  }

  getElement(): HTMLButtonElement {
    return this.element;
  }

  setDisabled(disabled: boolean): void {
    this.element.disabled = disabled;
    if (disabled) {
      this.element.classList.add('icon-btn--disabled');
    } else {
      this.element.classList.remove('icon-btn--disabled');
    }
  }

  setActive(active: boolean): void {
    if (active) {
      this.element.classList.add('icon-btn--active');
    } else {
      this.element.classList.remove('icon-btn--active');
    }
  }

  setIcon(icon: string): void {
    if (this.iconElement) {
      this.iconElement.className = icon;
    }
  }

  setAriaLabel(ariaLabel: string): void {
    this.element.setAttribute('aria-label', ariaLabel);
    this.element.setAttribute('title', ariaLabel);
  }

  destroy(): void {
    this.element.remove();
  }
}
