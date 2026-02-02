/**
 * 파일 삭제 확인 다이얼로그 컴포넌트
 * 
 * @see 02_REQUIREMENTS.md - FR-2.4 (파일 삭제), FR-4.3 (안전한 파일 삭제)
 * @see 03_API_SPECIFICATION.md - 파일 삭제 API 엔드포인트
 * @see 05_UI_UX_DESIGN.md - 파일 삭제 UI/UX
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (features/ui 레이어)
 */

import { Button } from '@shared/ui/Button';
import { deleteFile } from '../lib/fileService';
import './DeleteFileDialog.css';

export interface DeleteFileDialogProps {
  fileName: string;
  filePath: string;
  onDeleteSuccess?: () => void;
  onCancel?: () => void;
  allowSecureDelete?: boolean;
}

export class DeleteFileDialog {
  private element: HTMLElement;
  private overlay: HTMLElement;
  private secureDeleteCheckbox: HTMLInputElement | null = null;
  private onDeleteSuccess?: () => void;
  private onCancel?: () => void;
  private filePath: string;
  private fileName: string;

  constructor(props: DeleteFileDialogProps) {
    this.fileName = props.fileName;
    this.filePath = props.filePath;
    this.onDeleteSuccess = props.onDeleteSuccess;
    this.onCancel = props.onCancel;
    this.element = document.createElement('div');
    this.overlay = document.createElement('div');
    this.render(props);
  }

  private render(props: DeleteFileDialogProps): void {
    const { allowSecureDelete = false } = props;

    // Overlay
    this.overlay.className = 'delete-file-dialog__overlay';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.handleCancel();
      }
    });

    // Dialog
    const dialog = document.createElement('div');
    dialog.className = 'delete-file-dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'delete-file-dialog__header';
    const title = document.createElement('h2');
    title.textContent = '파일 삭제';
    header.appendChild(title);
    dialog.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.className = 'delete-file-dialog__content';

    const icon = document.createElement('div');
    icon.className = 'delete-file-dialog__icon';
    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    content.appendChild(icon);

    const message = document.createElement('p');
    message.className = 'delete-file-dialog__message';
    message.textContent = `"${this.fileName}" 파일을 삭제하시겠습니까?`;
    content.appendChild(message);

    const warning = document.createElement('p');
    warning.className = 'delete-file-dialog__warning';
    warning.textContent = '이 작업은 되돌릴 수 없습니다.';
    content.appendChild(warning);

    // 안전한 삭제 옵션
    if (allowSecureDelete) {
      const secureDeleteContainer = document.createElement('div');
      secureDeleteContainer.className = 'delete-file-dialog__secure-delete';

      this.secureDeleteCheckbox = document.createElement('input');
      this.secureDeleteCheckbox.type = 'checkbox';
      this.secureDeleteCheckbox.id = 'secure-delete';
      this.secureDeleteCheckbox.className = 'delete-file-dialog__checkbox';

      const label = document.createElement('label');
      label.htmlFor = 'secure-delete';
      label.className = 'delete-file-dialog__checkbox-label';
      label.textContent = '안전한 삭제 (데이터 완전 제거)';

      secureDeleteContainer.appendChild(this.secureDeleteCheckbox);
      secureDeleteContainer.appendChild(label);
      content.appendChild(secureDeleteContainer);
    }

    dialog.appendChild(content);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'delete-file-dialog__actions';

    const cancelButton = new Button({
      label: '취소',
      variant: 'secondary',
      onClick: () => this.handleCancel(),
    });
    actions.appendChild(cancelButton.getElement());

    const deleteButton = new Button({
      label: '삭제',
      variant: 'primary',
      onClick: () => this.handleDelete(),
    });
    deleteButton.getElement().classList.add('delete-file-dialog__delete-button');
    actions.appendChild(deleteButton.getElement());

    dialog.appendChild(actions);
    this.overlay.appendChild(dialog);
    this.element.appendChild(this.overlay);
  }

  private async handleDelete(): Promise<void> {
    const secureDelete = this.secureDeleteCheckbox?.checked || false;

    try {
      const success = await deleteFile(this.filePath, secureDelete);
      
      if (success) {
        if (this.onDeleteSuccess) {
          this.onDeleteSuccess();
        }
        this.destroy();
      } else {
        alert('파일 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete file error:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
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
