/**
 * 파일 업로드 다이얼로그 컴포넌트
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-2.2 (파일 업로드)
 * @see docs/20_backend/20_API_SPECIFICATION.md - 파일 업로드 API 엔드포인트
 * @see docs/40_frontend/40_UI_UX_DESIGN.md - 파일 업로드 UI/UX
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (features/ui 레이어)
 */

import { Button } from '@shared/ui/Button';
import { uploadFile } from '../lib/fileService';
import type { FileMetadata } from '@shared/types';
import './FileUploadDialog.css';

export interface FileUploadDialogProps {
  onUploadSuccess?: (file: FileMetadata) => void;
  onCancel?: () => void;
  targetPath?: string;
}

export class FileUploadDialog {
  private element: HTMLElement;
  private overlay: HTMLElement;
  private fileInput!: HTMLInputElement;
  private dropZone!: HTMLElement;
  private onUploadSuccess?: (file: FileMetadata) => void;
  private onCancel?: () => void;
  private targetPath?: string;
  private isDragging: boolean = false;

  constructor(props: FileUploadDialogProps = {}) {
    this.onUploadSuccess = props.onUploadSuccess;
    this.onCancel = props.onCancel;
    this.targetPath = props.targetPath;
    this.element = document.createElement('div');
    this.overlay = document.createElement('div');
    this.render();
  }

  private render(): void {
    // Overlay
    this.overlay.className = 'file-upload-dialog__overlay';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.handleCancel();
      }
    });

    // Dialog
    const dialog = document.createElement('div');
    dialog.className = 'file-upload-dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'file-upload-dialog__header';
    const title = document.createElement('h2');
    title.textContent = '파일 업로드';
    header.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.className = 'file-upload-dialog__close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.setAttribute('aria-label', '닫기');
    closeButton.addEventListener('click', () => this.handleCancel());
    header.appendChild(closeButton);
    dialog.appendChild(header);

    // Drop Zone
    this.dropZone = document.createElement('div');
    this.dropZone.className = 'file-upload-dialog__dropzone';
    this.dropZone.innerHTML = `
      <i class="fas fa-cloud-upload-alt"></i>
      <p>파일을 드래그하여 놓거나 클릭하여 선택하세요</p>
      <p class="file-upload-dialog__hint">마크다운 파일만 업로드 가능 (.md, .markdown)</p>
    `;

    // 드래그앤드롭 이벤트
    this.setupDragAndDrop();

    // 파일 입력
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.md,.markdown';
    this.fileInput.className = 'file-upload-dialog__input';
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) this.handleFileSelect(file);
    });

    this.dropZone.addEventListener('click', () => {
      this.fileInput.click();
    });

    dialog.appendChild(this.dropZone);
    dialog.appendChild(this.fileInput);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'file-upload-dialog__actions';

    const cancelButton = new Button({
      label: '취소',
      variant: 'secondary',
      onClick: () => this.handleCancel(),
    });
    actions.appendChild(cancelButton.getElement());

    dialog.appendChild(actions);
    this.overlay.appendChild(dialog);
    this.element.appendChild(this.overlay);
  }

  private setupDragAndDrop(): void {
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.isDragging) {
        this.isDragging = true;
        this.dropZone.classList.add('file-upload-dialog__dropzone--dragging');
      }
    });

    this.dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = false;
      this.dropZone.classList.remove('file-upload-dialog__dropzone--dragging');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = false;
      this.dropZone.classList.remove('file-upload-dialog__dropzone--dragging');

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file && this.isMarkdownFile(file)) {
          this.handleFileSelect(file);
        } else {
          alert('마크다운 파일만 업로드할 수 있습니다.');
        }
      }
    });
  }

  private isMarkdownFile(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension === 'md' || extension === 'markdown';
  }

  private async handleFileSelect(file: File): Promise<void> {
    // 파일 크기 확인 (16MB 제한)
    const MAX_SIZE = 16 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('파일 크기는 16MB를 초과할 수 없습니다.');
      return;
    }

    try {
      this.showLoading();
      const uploadedFile = await uploadFile(file, this.targetPath);
      
      if (uploadedFile) {
        if (this.onUploadSuccess) {
          this.onUploadSuccess(uploadedFile);
        }
        this.destroy();
      } else {
        alert('파일 업로드에 실패했습니다.');
        this.hideLoading();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
      this.hideLoading();
    }
  }

  private showLoading(): void {
    this.dropZone.innerHTML = `
      <i class="fas fa-spinner fa-spin"></i>
      <p>업로드 중...</p>
    `;
    this.dropZone.classList.add('file-upload-dialog__dropzone--loading');
  }

  private hideLoading(): void {
    this.dropZone.innerHTML = `
      <i class="fas fa-cloud-upload-alt"></i>
      <p>파일을 드래그하여 놓거나 클릭하여 선택하세요</p>
      <p class="file-upload-dialog__hint">마크다운 파일만 업로드 가능 (.md, .markdown)</p>
    `;
    this.dropZone.classList.remove('file-upload-dialog__dropzone--loading');
    this.setupDragAndDrop();
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
