/**
 * 사용자 메뉴 컴포넌트
 * 사용자 프로필 및 로그아웃 메뉴
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-1.1 (Google 로그인), FR-1.2 (사용자별 폴더 관리)
 * @see docs/40_frontend/40_UI_UX_DESIGN.md - 사용자 메뉴 UI 설계
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (widgets 레이어), TypeScript 코딩 규약
 */

import { logout } from '@features/auth';
import type { User } from '@shared/types';
import './UserMenu.css';

export interface UserMenuProps {
  user: User;
  onClose?: () => void;
}

export class UserMenu {
  private element: HTMLElement;
  private props: UserMenuProps;
  private isOpen: boolean = false;

  constructor(props: UserMenuProps) {
    this.props = props;
    this.element = document.createElement('div');
    this.element.className = 'user-menu';
    this.render();
    this.setupEventListeners();
  }

  private render(): void {
    const { user } = this.props;

    this.element.innerHTML = `
      <div class="user-menu__overlay"></div>
      <div class="user-menu__container">
        <div class="user-menu__header">
          <div class="user-menu__profile">
            ${user.picture 
              ? `<img src="${user.picture}" alt="${user.name}" class="user-menu__avatar" />`
              : `<div class="user-menu__avatar user-menu__avatar--default">
                  <i class="fas fa-user"></i>
                </div>`
            }
            <div class="user-menu__info">
              <div class="user-menu__name">${user.name}</div>
              <div class="user-menu__email">${user.email}</div>
            </div>
          </div>
        </div>
        <div class="user-menu__content">
          <div class="user-menu__storage">
            <div class="user-menu__storage-label">저장 공간</div>
            <div class="user-menu__storage-info">
              <span class="user-menu__storage-used">${this.formatBytes(user.storageUsed)}</span>
              <span class="user-menu__storage-separator">/</span>
              <span class="user-menu__storage-quota">${this.formatBytes(user.storageQuota)}</span>
            </div>
            <div class="user-menu__storage-bar">
              <div 
                class="user-menu__storage-bar-fill" 
                style="width: ${(user.storageUsed / user.storageQuota) * 100}%"
              ></div>
            </div>
          </div>
        </div>
        <div class="user-menu__footer">
          <button class="user-menu__logout-btn" aria-label="로그아웃">
            <i class="fas fa-sign-out-alt"></i>
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // 오버레이 클릭 시 닫기
    const overlay = this.element.querySelector('.user-menu__overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.close();
      });
    }

    // 로그아웃 버튼
    const logoutBtn = this.element.querySelector('.user-menu__logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await logout();
      });
    }

    // ESC 키로 닫기
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    this.element.addEventListener('destroy', () => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  open(): void {
    this.isOpen = true;
    this.element.classList.add('user-menu--open');
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpen = false;
    this.element.classList.remove('user-menu--open');
    document.body.style.overflow = '';
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.close();
    this.element.dispatchEvent(new Event('destroy'));
    this.element.remove();
  }
}
