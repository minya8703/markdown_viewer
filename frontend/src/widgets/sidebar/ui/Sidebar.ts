/**
 * Sidebar 위젯
 * 파일 탐색기 사이드바 컴포넌트
 * 
 * @see 05_UI_UX_DESIGN.md - Sidebar 컴포넌트 설계, 파일 탐색 UI
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (widgets 레이어), CSS 스타일 규약
 */

import { Button } from '@shared/ui/Button';
import './Sidebar.css';

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  encrypted?: boolean; // 암호화된 파일 여부
  children?: FileItem[];
}

export interface SidebarProps {
  files?: FileItem[];
  isOpen?: boolean;
  position?: 'left' | 'right';
  onFileClick?: (path: string) => void;
  onNewFileClick?: () => void;
  onUploadClick?: () => void;
  onLocalFileClick?: () => void; // 로컬 파일 열기
  onFileDelete?: (path: string, name: string) => void;
  onSearch?: (query: string) => void;
}

export class Sidebar {
  private element: HTMLElement;
  private fileListElement: HTMLElement;
  private searchInput: HTMLInputElement | null = null;
  private isOpen: boolean;
  private onFileClick?: (path: string) => void;
  private onFileDelete?: (path: string, name: string) => void;

  constructor(props: SidebarProps) {
    this.element = document.createElement('aside');
    this.isOpen = props.isOpen ?? false;
    this.onFileClick = props.onFileClick;
    this.onFileDelete = props.onFileDelete;
    this.render(props);
  }

  private render(props: SidebarProps): void {
    const {
      files = [],
      position = 'left',
      onFileClick,
      onNewFileClick,
      onUploadClick,
      onLocalFileClick,
      onFileDelete,
      onSearch,
    } = props;

    this.element.className = `sidebar sidebar--${position}`;
    if (!this.isOpen) {
      this.element.classList.add('sidebar--hidden');
    }

    // 검색 입력
    if (onSearch) {
      const searchContainer = document.createElement('div');
      searchContainer.className = 'sidebar__search';
      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.placeholder = '파일 검색...';
      this.searchInput.className = 'sidebar__search-input';
      this.searchInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        onSearch(target.value);
      });
      searchContainer.appendChild(this.searchInput);
      this.element.appendChild(searchContainer);
    }

    // 파일 목록
    this.fileListElement = document.createElement('div');
    this.fileListElement.className = 'sidebar__file-list';
    this.renderFileList(files, onFileClick);
    this.element.appendChild(this.fileListElement);

    // 액션 버튼
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'sidebar__actions';

    if (onNewFileClick) {
      const newFileButton = new Button({
        label: '새 파일',
        icon: 'fas fa-plus',
        variant: 'primary',
        size: 'sm',
        onClick: onNewFileClick,
      });
      actionsContainer.appendChild(newFileButton.getElement());
    }

    if (onUploadClick) {
      const uploadButton = new Button({
        label: '업로드',
        icon: 'fas fa-upload',
        variant: 'secondary',
        size: 'sm',
        onClick: onUploadClick,
      });
      actionsContainer.appendChild(uploadButton.getElement());
    }

    if (onLocalFileClick) {
      const localFileButton = new Button({
        label: '로컬 파일 열기',
        icon: 'fas fa-folder-open',
        variant: 'secondary',
        size: 'sm',
        onClick: onLocalFileClick,
      });
      actionsContainer.appendChild(localFileButton.getElement());
    }

    this.element.appendChild(actionsContainer);
  }

  private renderFileList(
    files: FileItem[],
    onFileClick?: (path: string) => void,
    onFileDelete?: (path: string, name: string) => void
  ): void {
    this.fileListElement.innerHTML = '';

    if (files.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'sidebar__empty';
      emptyMessage.textContent = '파일이 없습니다';
      this.fileListElement.appendChild(emptyMessage);
      return;
    }

    files.forEach((file) => {
      const item = this.createFileItem(file, onFileClick, onFileDelete);
      this.fileListElement.appendChild(item);
    });
  }


  private createFileItem(
    file: FileItem,
    onFileClick?: (path: string) => void,
    onFileDelete?: (path: string, name: string) => void
  ): HTMLElement {
    const item = document.createElement('div');
    item.className = `sidebar__item sidebar__item--${file.type}`;

    // 파일 아이콘
    const icon = document.createElement('i');
    icon.className = file.type === 'directory' ? 'fas fa-folder' : 'fas fa-file';
    item.appendChild(icon);

    // 암호화 아이콘 (파일이고 암호화된 경우)
    if (file.type === 'file' && file.encrypted) {
      const lockIcon = document.createElement('i');
      lockIcon.className = 'fas fa-lock sidebar__item-encrypted';
      lockIcon.setAttribute('aria-label', '암호화된 파일');
      lockIcon.title = '암호화된 파일 - 비밀번호가 필요합니다';
      item.appendChild(lockIcon);
    }

    const name = document.createElement('span');
    name.className = 'sidebar__item-name';
    name.textContent = file.name;
    item.appendChild(name);

    // 컨텍스트 메뉴 (우클릭)
    if (file.type === 'file') {
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(e, file, onFileClick);
      });
    }

    if (onFileClick) {
      item.addEventListener('click', () => {
        onFileClick(file.path);
      });
      item.classList.add('sidebar__item--clickable');
    }

    // 디렉토리인 경우 자식 파일 렌더링
    if (file.type === 'directory' && file.children && file.children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'sidebar__children';
      file.children.forEach((child) => {
        const childItem = this.createFileItem(child, onFileClick, onFileDelete);
        childrenContainer.appendChild(childItem);
      });
      item.appendChild(childrenContainer);
    }

    return item;
  }

  private showContextMenu(
    e: MouseEvent,
    file: FileItem,
    onFileClick?: (path: string) => void
  ): void {
    // 컨텍스트 메뉴는 향후 구현
    // 현재는 기본 동작만 수행
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.element.classList.remove('sidebar--hidden');
    } else {
      this.element.classList.add('sidebar--hidden');
    }
  }

  open(): void {
    this.isOpen = true;
    this.element.classList.remove('sidebar--hidden');
  }

  close(): void {
    this.isOpen = false;
    this.element.classList.add('sidebar--hidden');
  }

  updateFiles(files: FileItem[]): void {
    this.renderFileList(files, this.onFileClick, this.onFileDelete);
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.element.remove();
  }
}
