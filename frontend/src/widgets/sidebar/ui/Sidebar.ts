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
  private fileListElement!: HTMLElement;
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

    // 디렉토리 접기/펼치기 화살표
    if (file.type === 'directory' && file.children && file.children.length > 0) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'sidebar__toggle';
      toggle.setAttribute('aria-label', '폴더 접기/펼치기');
      toggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.toggle('sidebar__item--collapsed');
        toggle.querySelector('i')?.classList.toggle('sidebar__toggle-icon--open', !item.classList.contains('sidebar__item--collapsed'));
      });
      item.appendChild(toggle);
    }

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

    // 컨텍스트 메뉴 (우클릭, 파일만)
    if (file.type === 'file') {
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(e, file, onFileDelete);
      });
    }

    if (file.type === 'file' && onFileClick) {
      item.addEventListener('click', () => {
        onFileClick(file.path);
      });
      item.classList.add('sidebar__item--clickable');
    }

    // 디렉토리: 클릭 시 접기/펼치기 (파일 클릭과 구분)
    if (file.type === 'directory' && file.children && file.children.length > 0) {
      item.classList.add('sidebar__item--clickable');
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.sidebar__toggle')) return;
        item.classList.toggle('sidebar__item--collapsed');
        const iconEl = item.querySelector('.sidebar__toggle i');
        iconEl?.classList.toggle('sidebar__toggle-icon--open', !item.classList.contains('sidebar__item--collapsed'));
      });
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'sidebar__children';
      file.children.forEach((child) => {
        const childItem = this.createFileItem(child, onFileClick, onFileDelete);
        childrenContainer.appendChild(childItem);
      });
      item.appendChild(childrenContainer);
      // 펼친 상태가 기본이므로 토글 아이콘 회전
      item.querySelector('.sidebar__toggle i')?.classList.add('sidebar__toggle-icon--open');
    }

    return item;
  }

  private contextMenuEl: HTMLElement | null = null;
  private contextMenuOutsideHandler: ((ev: MouseEvent) => void) | null = null;

  private showContextMenu(
    e: MouseEvent,
    file: FileItem,
    onFileDelete?: (path: string, name: string) => void
  ): void {
    this.closeContextMenu();

    const menu = document.createElement('div');
    menu.className = 'sidebar__context-menu';
    menu.setAttribute('role', 'menu');

    if (onFileDelete) {
      const deleteItem = document.createElement('button');
      deleteItem.type = 'button';
      deleteItem.className = 'sidebar__context-menu-item sidebar__context-menu-item--danger';
      deleteItem.setAttribute('role', 'menuitem');
      deleteItem.innerHTML = '<i class="fas fa-trash-alt"></i> 삭제';
      deleteItem.addEventListener('click', () => {
        onFileDelete(file.path, file.name);
        this.closeContextMenu();
      });
      menu.appendChild(deleteItem);
    }

    const x = e.clientX;
    const y = e.clientY;
    const padding = 4;
    menu.style.position = 'fixed';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    document.body.appendChild(menu);

    const rect = menu.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - padding;
    if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - padding;
    if (left < padding) left = padding;
    if (top < padding) top = padding;
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    this.contextMenuEl = menu;

    const closeOnClickOutside = (ev: MouseEvent) => {
      if (menu.contains(ev.target as Node)) return;
      this.closeContextMenu();
    };
    this.contextMenuOutsideHandler = closeOnClickOutside;
    requestAnimationFrame(() => document.addEventListener('click', closeOnClickOutside));
  }

  private closeContextMenu(): void {
    if (this.contextMenuOutsideHandler) {
      document.removeEventListener('click', this.contextMenuOutsideHandler);
      this.contextMenuOutsideHandler = null;
    }
    if (this.contextMenuEl?.parentNode) {
      this.contextMenuEl.parentNode.removeChild(this.contextMenuEl);
      this.contextMenuEl = null;
    }
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
    this.closeContextMenu();
    this.element.remove();
  }
}
