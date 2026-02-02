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
  onSaveClick?: () => void;
  onEncryptionToggle?: () => void; // 암호화 토글
  onSettingsClick?: () => void;
  onUserClick?: () => void;
}

export class Header {
  private element: HTMLElement;
  private menuButton!: IconButton; // render()에서 초기화됨
  private editButton: IconButton | null = null; // 편집 모드가 아닐 때만 생성
  private saveButton: IconButton | null = null; // 편집 모드일 때만 생성
  private encryptionButton: IconButton | null = null; // 편집 모드일 때만 생성
  private settingsButton!: IconButton; // render()에서 초기화됨
  private userButton!: IconButton; // render()에서 초기화됨
  private fileNameElement!: HTMLElement; // render()에서 초기화됨
  private saveStatusElement: HTMLElement | null = null; // 편집 모드일 때만 생성

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

    // 편집 버튼 (편집 모드가 아닐 때만 표시)
    if (!isEditMode) {
      this.editButton = new IconButton({
        icon: 'fas fa-edit',
        ariaLabel: '편집 모드',
        onClick: onEditClick,
      });
      buttonContainer.appendChild(this.editButton.getElement());
    } else {
      this.editButton = null;
    }

    // 저장 버튼 (편집 모드에서만 표시)
    if (isEditMode && onSaveClick) {
      this.saveButton = new IconButton({
        icon: 'fas fa-save',
        ariaLabel: '저장',
        onClick: onSaveClick,
        disabled: saveStatus === 'saving',
      });
      buttonContainer.appendChild(this.saveButton.getElement());

      // 암호화 토글 버튼 (편집 모드에서만 표시)
      if (onEncryptionToggle) {
        this.encryptionButton = new IconButton({
          icon: isEncryptionEnabled ? 'fas fa-lock' : 'fas fa-unlock',
          ariaLabel: isEncryptionEnabled ? '암호화 비활성화' : '암호화 활성화',
          onClick: onEncryptionToggle,
          active: isEncryptionEnabled,
        });
        buttonContainer.appendChild(this.encryptionButton.getElement());
      }

      // 저장 상태 표시
      this.saveStatusElement = document.createElement('span');
      this.saveStatusElement.className = `header__save-status header__save-status--${saveStatus}`;
      this.updateSaveStatus(saveStatus);
      buttonContainer.appendChild(this.saveStatusElement);
    }

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

  setEditMode(_isEditMode: boolean): void {
    // 편집 모드에 따라 버튼 표시/숨김
    // 실제 구현에서는 Header 재렌더링 또는 버튼 토글
    // 현재는 ViewerPage에서 Header를 재생성하는 방식 사용
    // TODO: 동적 모드 전환 구현 (현재는 재생성 방식 사용)
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

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.menuButton.destroy();
    if (this.editButton) {
      this.editButton.destroy();
    }
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
