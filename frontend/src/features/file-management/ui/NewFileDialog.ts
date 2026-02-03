/**
 * 새 파일 생성 다이얼로그 컴포넌트
 * 
 * @see 02_REQUIREMENTS.md - FR-2.3 (파일 생성)
 * @see 03_API_SPECIFICATION.md - 파일 저장 API 엔드포인트
 * @see 05_UI_UX_DESIGN.md - 파일 생성 UI/UX
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (features/ui 레이어)
 */

import { Button } from '@shared/ui/Button';
import { saveFile } from '../lib/fileService';
import type { FileMetadata } from '@shared/types';
import './NewFileDialog.css';

export interface NewFileDialogProps {
  onFileCreated?: (file: FileMetadata) => void;
  onCancel?: () => void;
  defaultPath?: string;
}

export class NewFileDialog {
  private element: HTMLElement;
  private overlay: HTMLElement;
  private fileNameInput!: HTMLInputElement;
  private onFileCreated?: (file: FileMetadata) => void;
  private onCancel?: () => void;
  private defaultPath?: string;

  constructor(props: NewFileDialogProps = {}) {
    this.onFileCreated = props.onFileCreated;
    this.onCancel = props.onCancel;
    this.defaultPath = props.defaultPath;
    this.element = document.createElement('div');
    this.overlay = document.createElement('div');
    this.render();
  }

  private render(): void {
    // Overlay
    this.overlay.className = 'new-file-dialog__overlay';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.handleCancel();
      }
    });

    // Dialog
    const dialog = document.createElement('div');
    dialog.className = 'new-file-dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'new-file-dialog__header';
    const title = document.createElement('h2');
    title.textContent = '새 파일 생성';
    header.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.className = 'new-file-dialog__close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.setAttribute('aria-label', '닫기');
    closeButton.addEventListener('click', () => this.handleCancel());
    header.appendChild(closeButton);
    dialog.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'new-file-dialog__content';

    const label = document.createElement('label');
    label.className = 'new-file-dialog__label';
    label.textContent = '파일명';
    content.appendChild(label);

    this.fileNameInput = document.createElement('input');
    this.fileNameInput.type = 'text';
    this.fileNameInput.className = 'new-file-dialog__input';
    this.fileNameInput.placeholder = '예: my-document.md';
    this.fileNameInput.value = this.defaultPath || '';
    this.fileNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleCreate();
      }
    });
    content.appendChild(this.fileNameInput);

    const hint = document.createElement('p');
    hint.className = 'new-file-dialog__hint';
    hint.textContent = '파일명은 .md 확장자로 끝나야 합니다.';
    content.appendChild(hint);

    dialog.appendChild(content);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'new-file-dialog__actions';

    const cancelButton = new Button({
      label: '취소',
      variant: 'secondary',
      onClick: () => this.handleCancel(),
    });
    actions.appendChild(cancelButton.getElement());

    const createButton = new Button({
      label: '생성',
      variant: 'primary',
      onClick: () => this.handleCreate(),
    });
    actions.appendChild(createButton.getElement());

    dialog.appendChild(actions);
    this.overlay.appendChild(dialog);
    this.element.appendChild(this.overlay);

    // 포커스
    setTimeout(() => {
      this.fileNameInput.focus();
    }, 100);
  }

  private validateFileName(fileName: string): boolean {
    if (!fileName.trim()) {
      return false;
    }

    // .md 또는 .markdown 확장자 확인
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'md' || extension === 'markdown';
  }

  private async handleCreate(): Promise<void> {
    const fileName = this.fileNameInput.value.trim();

    if (!this.validateFileName(fileName)) {
      alert('올바른 파일명을 입력하세요. (.md 또는 .markdown 확장자 필요)');
      this.fileNameInput.focus();
      return;
    }

    try {
      // 빈 파일 생성
      const path = this.defaultPath 
        ? `${this.defaultPath}/${fileName}`
        : fileName;
      
      const success = await saveFile(path, '', false);
      
      if (success) {
        // 생성된 파일 정보 반환
        const fileMetadata: FileMetadata = {
          name: fileName,
          path: path,
          type: 'file',
          lastModified: new Date().toISOString(),
          encrypted: false,
        };

        if (this.onFileCreated) {
          this.onFileCreated(fileMetadata);
        }
        this.destroy();
      } else {
        alert('파일 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Create file error:', error);
      alert('파일 생성 중 오류가 발생했습니다.');
    }
  }

  private handleCancel(): void {
    if (this.onCancel) {
      this.onCancel();
    }
    this.destroy();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.element.remove();
  }
}
