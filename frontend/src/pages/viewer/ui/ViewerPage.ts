/**
 * Viewer 페이지
 * 메인 마크다운 뷰어 페이지
 * 
 * @see 02_REQUIREMENTS.md - FR-2 (파일 관리), FR-3 (마크다운 편집), FR-5 (사용자 경험)
 * @see 03_API_SPECIFICATION.md - 파일 관리 API, 마크다운 처리 API
 * @see 05_UI_UX_DESIGN.md - 뷰어 화면 레이아웃, 편집 모드 UI, 사용자 흐름
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처, TypeScript 코딩 규약
 */

import { Header } from '@widgets/header';
import { Sidebar, FileItem } from '@widgets/sidebar';
import { Footer } from '@widgets/footer';
import { UserMenu } from '@widgets/user-menu';
import { MarkdownRenderer } from '@features/markdown-renderer';
import { Editor } from '@features/editor';
import { AutoSaveManager } from '@features/auto-save';
import { SettingsPage } from '@pages/settings';
import { EncryptionDialog } from '@features/encryption/ui/EncryptionDialog';
import { DecryptionDialog } from '@features/encryption/ui/DecryptionDialog';
import { fileEncryption } from '@features/encryption';
import { getCurrentUser, logout } from '@features/auth';
import {
  openLocalFile,
  saveLocalFile,
  saveAsLocalFile,
  isFileSystemAccessSupported,
  type LocalFileInfo,
} from '@features/local-file';
import { Loading } from '@shared/ui/Loading';
import { Toast } from '@shared/ui/Toast';
import {
  FileUploadDialog,
  NewFileDialog,
  DeleteFileDialog,
  getFileList,
  readFile,
  getLastDocument,
  saveFile,
} from '@features/file-management';
import { apiClient, TokenManager } from '@shared/api/client';
import type { FileContent, FileMetadata, SaveStatus, User } from '@shared/types';
import './ViewerPage.css';

export interface ViewerPageProps {
  initialFilePath?: string;
}

export class ViewerPage {
  private element: HTMLElement;
  private header!: Header;
  private sidebar!: Sidebar;
  private footer!: Footer;
  private markdownRenderer!: MarkdownRenderer;
  private editor: Editor | null = null;
  private autoSaveManager: AutoSaveManager | null = null;
  private contentArea!: HTMLElement;
  private loading!: Loading;
  private currentFile: FileContent | null = null;
  private isEditMode: boolean = false;
  private isSidebarOpen: boolean = false;
  private saveStatus: SaveStatus = 'saved';
  private allFiles: FileMetadata[] = []; // 전체 파일 목록 (검색용)
  private searchQuery: string = ''; // 현재 검색어
  private isEncryptionEnabled: boolean = false; // 현재 파일 암호화 여부
  private userMenu: UserMenu | null = null; // 사용자 메뉴
  private currentUser: User | null = null; // 현재 사용자 정보
  private isLocalFileMode: boolean = false; // 로컬 파일 모드 여부
  private localFileInfo: LocalFileInfo | null = null; // 로컬 파일 정보

  constructor(props: ViewerPageProps = {}) {
    this.element = document.createElement('div');
    this.element.className = 'viewer-page';
    this.render();
    this.init(props);
  }

  private render(): void {
    // Header
    this.header = new Header({
      fileName: '',
      isEditMode: this.isEditMode,
      saveStatus: this.saveStatus,
      isEncryptionEnabled: this.isEncryptionEnabled,
      onMenuClick: () => this.toggleSidebar(),
      onEditClick: () => this.enterEditMode(),
      onSaveClick: () => this.handleSave(),
      onEncryptionToggle: () => this.toggleEncryption(),
      onSettingsClick: () => this.handleSettings(),
      onUserClick: () => this.handleUserMenu(),
    });
    this.element.appendChild(this.header.getElement());

    // Main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'viewer-page__main';

    // Sidebar
    this.sidebar = new Sidebar({
      files: [],
      isOpen: this.isSidebarOpen,
      onFileClick: (path) => this.loadFile(path),
      onNewFileClick: () => this.handleNewFile(),
      onUploadClick: () => this.handleUpload(),
      onLocalFileClick: () => this.handleOpenLocalFile(),
      onFileDelete: (path, name) => this.handleDeleteFile(path, name),
      onSearch: (query) => this.handleSearch(query),
    });
    mainContainer.appendChild(this.sidebar.getElement());

    // Content area
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'viewer-page__content-wrapper';

    this.contentArea = document.createElement('div');
    this.contentArea.className = 'viewer-page__content';
    contentWrapper.appendChild(this.contentArea);

    // Markdown renderer
    const rendererContainer = document.createElement('div');
    rendererContainer.className = 'viewer-page__renderer';
    this.markdownRenderer = new MarkdownRenderer(rendererContainer);
    this.contentArea.appendChild(rendererContainer);

    mainContainer.appendChild(contentWrapper);
    this.element.appendChild(mainContainer);

    // Footer
    this.footer = new Footer({
      adSenseClientId: import.meta.env.VITE_ADSENSE_CLIENT_ID,
    });
    this.element.appendChild(this.footer.getElement());

    // Loading
    this.loading = new Loading();
    this.element.appendChild(this.loading.getElement());

    // Toast는 static 메서드만 사용
    Toast.init();
  }

  private async init(props: ViewerPageProps): Promise<void> {
    // 사용자 정보 로드
    await this.loadUserInfo();

    // 파일 목록 로드
    await this.loadFileList();

    // 초기 파일 로드
    if (props.initialFilePath) {
      await this.loadFile(props.initialFilePath);
    } else {
      // 마지막 문서 자동 로드
      await this.loadLastDocument();
    }
  }

  private async loadUserInfo(): Promise<void> {
    try {
      this.currentUser = await getCurrentUser();
      if (!this.currentUser) {
        Toast.error('사용자 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      Toast.error('사용자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }

  private async loadFileList(): Promise<void> {
    try {
      const files = await getFileList();
      // 전체 파일 목록 저장 (검색용)
      this.allFiles = files;
      // 검색어가 있으면 필터링, 없으면 전체 표시
      this.applySearchFilter();
    } catch (error) {
      console.error('Failed to load file list:', error);
      Toast.error('파일 목록을 불러오는 중 오류가 발생했습니다.');
    }
  }

  private applySearchFilter(): void {
    let filteredFiles = this.allFiles;

    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      filteredFiles = this.allFiles.filter((file) => {
        const fileName = file.name.toLowerCase();
        const filePath = file.path.toLowerCase();
        return fileName.includes(query) || filePath.includes(query);
      });
    }

    const fileItems = this.transformToFileItems(filteredFiles);
    this.sidebar.updateFiles(fileItems);
  }

  private transformToFileItems(files: FileMetadata[]): FileItem[] {
    // FileMetadata를 FileItem 형식으로 변환
    return files.map((file) => ({
      name: file.name,
      path: file.path,
      type: file.type,
      encrypted: file.encrypted || false, // 암호화 여부 전달
      // children은 API 응답에 포함되지 않으므로 별도 처리 필요
      // 실제 구현에서는 서버에서 트리 구조를 반환하거나 클라이언트에서 구성
    }));
  }

  private async loadFile(path: string): Promise<void> {
    try {
      this.loading.show();
      const fileContent = await readFile(path);
      
      if (fileContent) {
        this.currentFile = fileContent;
        // 파일의 암호화 상태로 초기화 (이미 암호화된 파일이면 활성화)
        this.isEncryptionEnabled = fileContent.encrypted || false;
        this.header.updateFileName(fileContent.name);
        
        // 편집 모드일 때 암호화 상태 업데이트
        if (this.isEditMode) {
          this.header.updateEncryptionStatus(this.isEncryptionEnabled);
        }
        
        // 암호화된 파일인 경우 복호화 처리
        if (fileContent.encrypted) {
          await this.handleDecryption(fileContent);
          return;
        }
        
        // 편집 모드가 아닐 때만 렌더링
        if (!this.isEditMode) {
          // localStorage에서 임시 저장된 내용 확인
          const tempContent = localStorage.getItem(`file_content_${path}`);
          const contentToRender = tempContent || fileContent.content || '';

          // 마크다운 렌더링
          if (contentToRender) {
            this.markdownRenderer.render(contentToRender);
          } else if (fileContent.html) {
            // 서버에서 렌더링된 HTML이 있는 경우
            const container = this.markdownRenderer.getElement();
            container.innerHTML = fileContent.html;
            
            // 코드 블록 하이라이팅
            container.querySelectorAll('pre code').forEach((block) => {
              if (block instanceof HTMLElement) {
                block.classList.add('hljs');
              }
            });
          }
        }

        // 마지막 문서 경로 저장
        localStorage.setItem('last_file_path', path);
      } else {
        Toast.error('파일을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      Toast.error('파일을 불러오는 중 오류가 발생했습니다.');
    } finally {
      this.loading.hide();
    }
  }

  private async handleDecryption(fileContent: FileContent): Promise<void> {
    // localStorage에서 저장된 비밀번호 확인
    const savedPassword = localStorage.getItem(`encryption_password_${fileContent.path}`);
    
    if (savedPassword) {
      // 자동 복호화 시도
      try {
        const decryptedContent = await fileEncryption.decrypt(
          {
            encrypted: fileContent.encryptedData!,
            iv: fileContent.iv!,
            tag: fileContent.tag!,
          },
          savedPassword
        );
        
        // 복호화 성공 - 콘텐츠 업데이트
        fileContent.content = decryptedContent;
        fileContent.encrypted = false; // 복호화된 상태로 표시
        
        // 렌더링
        if (!this.isEditMode) {
          this.markdownRenderer.render(decryptedContent);
        }
        
        // 마지막 문서 경로 저장
        localStorage.setItem('last_file_path', fileContent.path);
        return;
      } catch (error) {
        // 자동 복호화 실패 - 다이얼로그 표시
        console.log('Auto decryption failed, showing dialog');
      }
    }
    
    // 복호화 다이얼로그 표시
    const decryptionDialog = new DecryptionDialog({
      fileName: fileContent.name,
      onConfirm: async (password) => {
        try {
          this.loading.show();
          const decryptedContent = await fileEncryption.decrypt(
            {
              encrypted: fileContent.encryptedData!,
              iv: fileContent.iv!,
              tag: fileContent.tag!,
            },
            password
          );
          
          // 복호화 성공
          fileContent.content = decryptedContent;
          fileContent.encrypted = false;
          
          // 렌더링
          if (!this.isEditMode) {
            this.markdownRenderer.render(decryptedContent);
          }
          
          // 마지막 문서 경로 저장
          localStorage.setItem('last_file_path', fileContent.path);
          
          decryptionDialog.destroy();
          this.loading.hide();
        } catch (error) {
          console.error('Decryption error:', error);
          Toast.error('비밀번호가 올바르지 않습니다.');
          this.loading.hide();
        }
      },
      onCancel: () => {
        decryptionDialog.destroy();
        this.loading.hide();
        // 파일 읽기 취소
        this.currentFile = null;
        this.header.updateFileName('');
        this.markdownRenderer.clear();
      },
    });
    
    this.element.appendChild(decryptionDialog.getElement());
  }

  private async loadLastDocument(): Promise<void> {
    // localStorage에서 마지막 문서 경로 확인
    const lastPath = localStorage.getItem('last_file_path');
    if (lastPath) {
      await this.loadFile(lastPath);
      return;
    }

    // 서버에서 마지막 문서 조회
    try {
      const lastDoc = await getLastDocument();
      if (lastDoc) {
        await this.loadFile(lastDoc.path);
      }
    } catch (error) {
      // 마지막 문서가 없는 경우 무시
      console.log('No last document found');
    }
  }

  private toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.sidebar.toggle();
  }

  private enterEditMode(): void {
    if (!this.currentFile) {
      Toast.warning('편집할 파일이 없습니다.');
      return;
    }

    if (this.isEditMode) {
      return; // 이미 편집 모드
    }

    this.isEditMode = true;
    this.header.setEditMode(true);

    // 에디터 생성
    const editorContainer = document.createElement('div');
    editorContainer.className = 'viewer-page__editor';
    this.element.appendChild(editorContainer);

    // 에디터에 콘텐츠 설정
    const content = this.currentFile.content || '';
    
    this.editor = new Editor(editorContainer, {
      onContentChange: (newContent) => {
        // 자동 저장 관리자에 변경사항 전달
        if (this.autoSaveManager) {
          this.autoSaveManager.onContentChange(newContent);
        }
      },
      onSave: () => this.handleSave(),
      onClose: () => this.exitEditMode(),
    });

    this.editor.setContent(content);
    this.editor.setFileName(this.currentFile.name);
    this.editor.focus();

    // 자동 저장 관리자 시작 (로컬 파일 모드가 아닐 때만)
    if (!this.isLocalFileMode) {
      this.autoSaveManager = new AutoSaveManager(
        {
          enabled: true,
          interval: 180, // 3분
          minChanges: 10, // 10번 변경 시 즉시 저장
        },
        {
          onStatusChange: (status) => {
            this.saveStatus = status;
            this.header.updateSaveStatus(status);
            if (this.editor && (status === 'saved' || status === 'saving' || status === 'failed')) {
              this.editor.setSaveStatus(status);
            }
          },
          onSaveSuccess: () => {
            // 자동 저장 성공 (조용히 처리)
          },
          onSaveError: (error) => {
            console.error('Auto save error:', error);
            Toast.error('자동 저장에 실패했습니다.');
          },
        }
      );
      this.autoSaveManager.start(this.currentFile.path, content);
    }

    // 마크다운 렌더러 숨기기
    const rendererContainer = this.markdownRenderer.getElement().parentElement;
    if (rendererContainer) {
      rendererContainer.style.display = 'none';
    }
  }

  private exitEditMode(): void {
    if (!this.isEditMode || !this.editor) {
      return;
    }

    // 자동 저장 중지
    if (this.autoSaveManager) {
      this.autoSaveManager.stop();
      this.autoSaveManager = null;
    }
    
    // 에디터 제거
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }

    // 마크다운 렌더러 다시 표시
    const rendererContainer = this.markdownRenderer.getElement().parentElement;
    if (rendererContainer) {
      rendererContainer.style.display = 'block';
    }

    // 현재 파일 다시 로드하여 최신 내용 표시
    if (this.currentFile) {
      this.loadFile(this.currentFile.path);
    }

    this.isEditMode = false;
    this.header.setEditMode(false);
    this.saveStatus = 'saved';
    this.header.updateSaveStatus('saved');
  }

  private async handleSave(): Promise<void> {
    if (!this.currentFile || !this.editor) {
      return;
    }

    // 로컬 파일 모드인 경우 로컬에 저장
    if (this.isLocalFileMode && this.localFileInfo) {
      await this.handleSaveLocalFile();
      return;
    }

    // 암호화가 활성화되어 있으면 암호화 다이얼로그 표시
    if (this.isEncryptionEnabled) {
      this.showEncryptionDialog();
      return;
    }

    // 일반 저장 (서버)
    await this.performSave(this.editor.getContent(), false);
  }

  private showEncryptionDialog(): void {
    if (!this.currentFile || !this.editor) {
      return;
    }

    const encryptionDialog = new EncryptionDialog({
      fileName: this.currentFile.name,
      onConfirm: async (password: string, rememberPassword: boolean) => {
        try {
          this.loading.show();
          
          // 비밀번호 기억하기 처리
          if (rememberPassword) {
            localStorage.setItem(`encryption_password_${this.currentFile!.path}`, password);
          }
          
          // 파일 내용 암호화
          const content = this.editor!.getContent();
          const encryptedData = await fileEncryption.encrypt(content, { password });
          
          // 암호화된 데이터로 저장
          const success = await saveFile(
            this.currentFile!.path,
            '', // content는 사용하지 않음
            true, // encrypted
            encryptedData
          );

          if (success) {
            this.saveStatus = 'saved';
            this.header.updateSaveStatus('saved');
            if (this.editor) {
              this.editor.setSaveStatus('saved');
            }
            Toast.success('파일이 암호화되어 저장되었습니다.');

            // localStorage에서 임시 저장 제거
            localStorage.removeItem(`file_content_${this.currentFile!.path}`);

            // 파일 목록 새로고침
            await this.loadFileList();
            
            encryptionDialog.destroy();
            this.loading.hide();
          } else {
            throw new Error('Save failed');
          }
        } catch (error) {
          console.error('Encryption save error:', error);
          Toast.error('파일 암호화 저장에 실패했습니다.');
          this.loading.hide();
        }
      },
      onCancel: () => {
        encryptionDialog.destroy();
      },
    });

    this.element.appendChild(encryptionDialog.getElement());
  }

  private async performSave(content: string, encrypted: boolean, encryptedData?: any): Promise<void> {
    if (!this.currentFile) {
      return;
    }

    try {
      this.saveStatus = 'saving';
      this.header.updateSaveStatus('saving');
      if (this.editor) {
        this.editor.setSaveStatus('saving');
      }

      const success = await saveFile(
        this.currentFile.path,
        content,
        encrypted,
        encryptedData
      );

      if (success) {
        this.saveStatus = 'saved';
        this.header.updateSaveStatus('saved');
        if (this.editor) {
          this.editor.setSaveStatus('saved');
        }
        Toast.success('파일이 저장되었습니다.');

        // localStorage에서 임시 저장 제거
        localStorage.removeItem(`file_content_${this.currentFile.path}`);

        // 파일 목록 새로고침
        await this.loadFileList();
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.saveStatus = 'failed';
      this.header.updateSaveStatus('failed');
      if (this.editor) {
        this.editor.setSaveStatus('failed');
      }
      Toast.error('파일 저장에 실패했습니다.');
    }
  }

  private handleSettings(): void {
    const settingsPage = new SettingsPage({
      onClose: () => {
        settingsPage.destroy();
      },
      onSave: (settings) => {
        // 자동 저장 설정 업데이트
        if (this.autoSaveManager) {
          this.autoSaveManager.updateConfig({
            enabled: settings.autoSave.enabled,
            interval: settings.autoSave.interval,
            minChanges: settings.autoSave.minChanges,
          });
        }

        // 편집기 설정 적용 (에디터가 열려있을 때)
        if (this.editor) {
          const editorTextarea = this.editor.getElement().querySelector('.editor__textarea') as HTMLTextAreaElement;
          if (editorTextarea) {
            editorTextarea.style.fontSize = `${settings.editor.fontSize}px`;
            editorTextarea.style.fontFamily = settings.editor.fontFamily;
            editorTextarea.style.lineHeight = settings.editor.lineHeight.toString();
            editorTextarea.style.wordWrap = settings.editor.wordWrap ? 'break-word' : 'normal';
          }
        }

        Toast.success('설정이 저장되었습니다.');
      },
    });

    this.element.appendChild(settingsPage.getElement());
  }

  private handleUserMenu(): void {
    if (!this.currentUser) {
      Toast.error('사용자 정보를 불러올 수 없습니다.');
      return;
    }

    // 사용자 메뉴가 이미 열려있으면 닫기
    if (this.userMenu) {
      this.userMenu.toggle();
      return;
    }

    // 사용자 메뉴 생성 및 표시
    this.userMenu = new UserMenu({
      user: this.currentUser,
      onClose: () => {
        // 메뉴가 닫힐 때는 destroy하지 않고, 다음에 다시 열 수 있도록 유지
      },
    });

    this.element.appendChild(this.userMenu.getElement());
    this.userMenu.open();
  }

  private handleNewFile(): void {
    const dialog = new NewFileDialog({
      onFileCreated: async (file: FileMetadata) => {
        Toast.success(`파일 "${file.name}"이 생성되었습니다.`);
        // 파일 목록 새로고침
        await this.loadFileList();
        // 생성된 파일 열기
        await this.loadFile(file.path);
      },
      onCancel: () => {
        // 취소 시 아무 작업 없음
      },
    });
    this.element.appendChild(dialog.getElement());
  }

  private handleUpload(): void {
    const dialog = new FileUploadDialog({
      onUploadSuccess: async (file: FileMetadata) => {
        Toast.success(`파일 "${file.name}"이 업로드되었습니다.`);
        // 파일 목록 새로고침
        await this.loadFileList();
        // 업로드된 파일 열기
        await this.loadFile(file.path);
      },
      onCancel: () => {
        // 취소 시 아무 작업 없음
      },
    });
    this.element.appendChild(dialog.getElement());
  }

  private async handleDeleteFile(filePath: string, fileName: string): Promise<void> {
    const dialog = new DeleteFileDialog({
      fileName,
      filePath,
      allowSecureDelete: true,
      onDeleteSuccess: async () => {
        Toast.success(`파일 "${fileName}"이 삭제되었습니다.`);
        // 파일 목록 새로고침
        await this.loadFileList();
        // 현재 파일이 삭제된 경우 콘텐츠 초기화
        if (this.currentFile?.path === filePath) {
          this.currentFile = null;
          this.header.updateFileName('');
          this.markdownRenderer.clear();
        }
      },
      onCancel: () => {
        // 취소 시 아무 작업 없음
      },
    });
    this.element.appendChild(dialog.getElement());
  }

  private handleSearch(query: string): void {
    this.searchQuery = query;
    this.applySearchFilter();
  }

  private toggleEncryption(): void {
    this.isEncryptionEnabled = !this.isEncryptionEnabled;
    this.header.updateEncryptionStatus(this.isEncryptionEnabled);
    
    if (this.isEncryptionEnabled) {
      Toast.info('암호화 모드가 활성화되었습니다. 저장 시 암호화 다이얼로그가 표시됩니다.');
    } else {
      Toast.info('암호화 모드가 비활성화되었습니다.');
    }
  }

  /**
   * 로컬 파일 열기
   */
  private async handleOpenLocalFile(): Promise<void> {
    try {
      this.loading.show();
      const fileInfo = await openLocalFile();

      if (!fileInfo) {
        // 사용자가 취소한 경우
        this.loading.hide();
        return;
      }

      // 로컬 파일 모드 활성화
      this.isLocalFileMode = true;
      this.localFileInfo = fileInfo;

      // 현재 파일 정보 업데이트
      this.currentFile = {
        path: fileInfo.name,
        name: fileInfo.name,
        content: fileInfo.content,
        encrypted: false,
        lastModified: new Date(fileInfo.lastModified).toISOString(),
        size: fileInfo.content.length,
      };

      // Header 업데이트
      this.header.updateFileName(fileInfo.name);

      // 마크다운 렌더링
      if (!this.isEditMode) {
        this.markdownRenderer.render(fileInfo.content);
      }

      Toast.success('로컬 파일을 열었습니다.');
    } catch (error) {
      console.error('Failed to open local file:', error);
      Toast.error('로컬 파일을 여는 중 오류가 발생했습니다.');
    } finally {
      this.loading.hide();
    }
  }

  /**
   * 로컬 파일 저장
   */
  private async handleSaveLocalFile(): Promise<void> {
    if (!this.editor || !this.localFileInfo) {
      return;
    }

    try {
      this.saveStatus = 'saving';
      this.header.updateSaveStatus('saving');

      const content = this.editor.getContent();
      const success = await saveLocalFile(
        content,
        this.localFileInfo.name,
        this.localFileInfo.handle
      );

      if (success) {
        this.saveStatus = 'saved';
        this.header.updateSaveStatus('saved');
        if (this.editor) {
          this.editor.setSaveStatus('saved');
        }
        Toast.success('로컬 파일에 저장되었습니다.');
      } else {
        throw new Error('Failed to save local file');
      }
    } catch (error) {
      console.error('Failed to save local file:', error);
      this.saveStatus = 'failed';
      this.header.updateSaveStatus('failed');
      if (this.editor) {
        this.editor.setSaveStatus('failed');
      }
      Toast.error('로컬 파일 저장에 실패했습니다.');
    }
  }

  /**
   * 로컬 파일로 저장 (다른 이름으로 저장)
   */
  private async handleSaveAsLocalFile(): Promise<void> {
    if (!this.editor || !this.currentFile) {
      return;
    }

    try {
      const content = this.editor.getContent();
      const success = await saveAsLocalFile(content, this.currentFile.name);

      if (success) {
        Toast.success('로컬 파일로 저장되었습니다.');
      } else {
        // 사용자가 취소한 경우는 조용히 처리
      }
    } catch (error) {
      console.error('Failed to save as local file:', error);
      Toast.error('로컬 파일 저장에 실패했습니다.');
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    // 자동 저장 중지
    if (this.autoSaveManager) {
      this.autoSaveManager.stop();
      this.autoSaveManager = null;
    }

    // 사용자 메뉴 정리
    if (this.userMenu) {
      this.userMenu.destroy();
      this.userMenu = null;
    }

    // 에디터가 열려있으면 닫기
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }

    this.header.destroy();
    this.sidebar.destroy();
    this.footer.destroy();
    this.loading.destroy();
    // Toast는 static이므로 destroy 불필요
    this.element.remove();
  }
}
