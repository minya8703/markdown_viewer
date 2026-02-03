/**
 * Header 위젯
 * 상단 고정 헤더 컴포넌트
 * 
 * @see 05_UI_UX_DESIGN.md - Header 컴포넌트 설계, 아이콘 매핑
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (widgets 레이어), CSS 스타일 규약
 */

import { IconButton } from '@shared/ui/IconButton';
import './Header.css';

export interface HeaderProps {
  fileName?: string;
  isEditMode?: boolean;
  saveStatus?: 'saved' | 'saving' | 'failed' | 'unsaved';
  isEncryptionEnabled?: boolean; // 암호화 활성화 여부
  onMenuClick?: () => void;
  onEditClick?: () => void;
  /** 단일 저장 (기본: 일반 저장). 드롭다운 사용 시 onSavePlainClick/onSaveEncryptClick 사용 */
  onSaveClick?: () => void;
  /** 저장 옵션 드롭다운: 일반 저장 (설계: 저장 버튼 옆 드롭다운) */
  onSavePlainClick?: () => void;
  /** 저장 옵션 드롭다운: 암호화하여 저장 */
  onSaveEncryptClick?: () => void;
  /** 저장 옵션 드롭다운: 다른 이름으로 저장 (로컬) */
  onSaveAsClick?: () => void;
  onEncryptionToggle?: () => void; // 암호화 토글
  onSettingsClick?: () => void;
  onUserClick?: () => void;
}

export class Header {
  private element: HTMLElement;
  private menuButton!: IconButton; // render()에서 초기화됨
  private editButton: IconButton | null = null; // 편집 모드가 아닐 때만 생성
  private saveButton: IconButton | null = null; // 편집 모드일 때만 생성
  private saveDropdownWrap: HTMLElement | null = null; // 저장 드롭다운 래퍼
  private encryptionButton: IconButton | null = null; // 편집 모드일 때만 생성
  private settingsButton!: IconButton; // render()에서 초기화됨
  private userButton!: IconButton; // render()에서 초기화됨
  private fileNameElement!: HTMLElement; // render()에서 초기화됨
  private saveStatusElement: HTMLElement | null = null; // 편집 모드일 때만 생성
  private viewActionsWrap: HTMLElement | null = null; // 뷰 모드 액션 (편집 버튼)
  private editActionsWrap: HTMLElement | null = null; // 편집 모드 액션 (저장, 암호화, 상태)

  constructor(props: HeaderProps) {
    this.element = document.createElement('header');
    this.element.className = 'header';
    this.render(props);
  }

  private render(props: HeaderProps): void {
    const {
      fileName = '',
      isEditMode = false,
      saveStatus = 'saved',
      isEncryptionEnabled = false,
      onMenuClick,
      onEditClick,
      onSaveClick,
      onSavePlainClick,
      onSaveEncryptClick,
      onSaveAsClick,
      onEncryptionToggle,
      onSettingsClick,
      onUserClick,
    } = props;

    // 메뉴 버튼 (햄버거)
    this.menuButton = new IconButton({
      icon: 'fas fa-bars',
      ariaLabel: '메뉴 열기',
      onClick: onMenuClick,
    });
    this.element.appendChild(this.menuButton.getElement());

    // 파일명 표시
    const fileNameContainer = document.createElement('div');
    fileNameContainer.className = 'header__filename';
    this.fileNameElement = document.createElement('span');
    this.fileNameElement.className = 'header__filename-text';
    this.fileNameElement.textContent = fileName || '문서 없음';
    fileNameContainer.appendChild(this.fileNameElement);
    this.element.appendChild(fileNameContainer);

    // 버튼 컨테이너
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'header__actions';

    // 뷰 모드 액션 래퍼 (편집 버튼) — 동적 모드 전환 시 표시/숨김
    this.viewActionsWrap = document.createElement('div');
    this.viewActionsWrap.className = 'header__actions-view';
    this.editButton = new IconButton({
      icon: 'fas fa-edit',
      ariaLabel: '편집 모드',
      onClick: onEditClick,
    });
    this.viewActionsWrap.appendChild(this.editButton.getElement());
    buttonContainer.appendChild(this.viewActionsWrap);

    // 편집 모드 액션 래퍼 (저장, 암호화, 상태) — 동적 모드 전환 시 표시/숨김
    const hasSaveActions = onSaveClick || onSavePlainClick || onSaveEncryptClick || onSaveAsClick;
    this.editActionsWrap = document.createElement('div');
    this.editActionsWrap.className = 'header__actions-edit';

    if (hasSaveActions) {
      const useDropdown = onSavePlainClick != null && (onSaveEncryptClick != null || onSaveAsClick != null);
      this.saveDropdownWrap = document.createElement('div');
      this.saveDropdownWrap.className = 'header__save-dropdown';

      this.saveButton = new IconButton({
        icon: 'fas fa-save',
        ariaLabel: useDropdown ? '저장 옵션' : '저장',
        onClick: useDropdown
          ? () => this.toggleSaveDropdown()
          : (onSaveClick ?? (() => {})),
        disabled: saveStatus === 'saving',
      });
      this.saveDropdownWrap.appendChild(this.saveButton.getElement());

      if (useDropdown) {
        const arrow = document.createElement('button');
        arrow.type = 'button';
        arrow.className = 'header__save-dropdown-arrow';
        arrow.setAttribute('aria-label', '저장 옵션 열기');
        arrow.innerHTML = '<i class="fas fa-chevron-down"></i>';
        arrow.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleSaveDropdown();
        });
        this.saveDropdownWrap.appendChild(arrow);

        const menu = document.createElement('div');
        menu.className = 'header__save-dropdown-menu';
        menu.setAttribute('role', 'menu');
        menu.innerHTML = `
          <button type="button" role="menuitem" class="header__save-dropdown-item" data-action="plain" ${saveStatus === 'saving' ? 'disabled' : ''}>
            <i class="fas fa-save"></i> 일반 저장
          </button>
          <button type="button" role="menuitem" class="header__save-dropdown-item" data-action="encrypt" ${saveStatus === 'saving' ? 'disabled' : ''}>
            <i class="fas fa-lock"></i> 암호화하여 저장
          </button>
          ${onSaveAsClick ? '<button type="button" role="menuitem" class="header__save-dropdown-item" data-action="saveas" ' + (saveStatus === 'saving' ? 'disabled' : '') + '><i class="fas fa-file-export"></i> 다른 이름으로 저장</button>' : ''}
        `;
        menu.querySelector('[data-action="plain"]')?.addEventListener('click', () => {
          onSavePlainClick?.();
          this.closeSaveDropdown();
        });
        menu.querySelector('[data-action="encrypt"]')?.addEventListener('click', () => {
          onSaveEncryptClick?.();
          this.closeSaveDropdown();
        });
        if (onSaveAsClick) {
          menu.querySelector('[data-action="saveas"]')?.addEventListener('click', () => {
            onSaveAsClick();
            this.closeSaveDropdown();
          });
        }
        menu.addEventListener('click', (e) => e.stopPropagation());
        this.saveDropdownWrap.appendChild(menu);
      }

      this.editActionsWrap.appendChild(this.saveDropdownWrap);
    }

    if (onEncryptionToggle) {
      this.encryptionButton = new IconButton({
        icon: isEncryptionEnabled ? 'fas fa-lock' : 'fas fa-unlock',
        ariaLabel: isEncryptionEnabled ? '암호화 비활성화' : '암호화 활성화',
        onClick: onEncryptionToggle,
        active: isEncryptionEnabled,
      });
      this.editActionsWrap.appendChild(this.encryptionButton.getElement());
    }

    this.saveStatusElement = document.createElement('span');
    this.saveStatusElement.className = `header__save-status header__save-status--${saveStatus}`;
    this.updateSaveStatus(saveStatus);
    this.editActionsWrap.appendChild(this.saveStatusElement);

    buttonContainer.appendChild(this.editActionsWrap);

    this.setEditMode(isEditMode);

    // 설정 버튼
    this.settingsButton = new IconButton({
      icon: 'fas fa-cog',
      ariaLabel: '설정',
      onClick: onSettingsClick,
    });
    buttonContainer.appendChild(this.settingsButton.getElement());

    // 사용자 버튼
    this.userButton = new IconButton({
      icon: 'fas fa-user',
      ariaLabel: '사용자 메뉴',
      onClick: onUserClick,
    });
    buttonContainer.appendChild(this.userButton.getElement());

    this.element.appendChild(buttonContainer);
  }

  updateFileName(fileName: string): void {
    this.fileNameElement.textContent = fileName || '문서 없음';
  }

  updateSaveStatus(status: 'saved' | 'saving' | 'failed' | 'unsaved'): void {
    if (!this.saveStatusElement) return;

    this.saveStatusElement.className = `header__save-status header__save-status--${status}`;
    
    const statusText: Record<string, string> = {
      saved: '저장됨',
      saving: '저장 중...',
      failed: '저장 실패',
      unsaved: '저장되지 않음',
    };

    this.saveStatusElement.textContent = statusText[status] || '';

    // 저장 버튼 비활성화
    if (this.saveButton) {
      this.saveButton.setDisabled(status === 'saving');
    }
  }

  setEditMode(isEditMode: boolean): void {
    if (this.viewActionsWrap) {
      this.viewActionsWrap.style.display = isEditMode ? 'none' : 'flex';
    }
    if (this.editActionsWrap) {
      this.editActionsWrap.style.display = isEditMode ? 'flex' : 'none';
    }
  }

  /**
   * 암호화 상태 업데이트
   */
  updateEncryptionStatus(enabled: boolean): void {
    if (this.encryptionButton) {
      this.encryptionButton.setIcon(enabled ? 'fas fa-lock' : 'fas fa-unlock');
      this.encryptionButton.setAriaLabel(enabled ? '암호화 비활성화' : '암호화 활성화');
      this.encryptionButton.setActive(enabled);
    }
  }

  private toggleSaveDropdown(): void {
    this.saveDropdownWrap?.classList.toggle('header__save-dropdown--open');
    if (this.saveDropdownWrap?.classList.contains('header__save-dropdown--open')) {
      setTimeout(() => {
        document.addEventListener('click', this.closeSaveDropdownBound);
      }, 0);
    } else {
      document.removeEventListener('click', this.closeSaveDropdownBound);
    }
  }

  private closeSaveDropdownBound = (): void => this.closeSaveDropdown();

  private closeSaveDropdown(): void {
    this.saveDropdownWrap?.classList.remove('header__save-dropdown--open');
    document.removeEventListener('click', this.closeSaveDropdownBound);
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.menuButton.destroy();
    if (this.editButton) {
      this.editButton.destroy();
    }
    this.closeSaveDropdown();
    if (this.saveButton) {
      this.saveButton.destroy();
    }
    if (this.encryptionButton) {
      this.encryptionButton.destroy();
    }
    this.settingsButton.destroy();
    this.userButton.destroy();
    this.element.remove();
  }
}
