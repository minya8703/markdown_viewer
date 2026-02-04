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
import { fileEncryption, type EncryptedData } from '@features/encryption';
import { getCurrentUser } from '@features/auth';
import {
  openLocalFile,
  saveLocalFile,
  saveAsLocalFile,
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
import { TokenManager } from '@shared/api/client';
import type { PageVisibilityManager } from '@shared/lib/visibility';
import type { FileContent, FileMetadata, SaveStatus, User } from '@shared/types';
import './ViewerPage.css';

export interface ViewerPageProps {
  initialFilePath?: string;
  /** 설정 버튼 클릭 시 호출 (미제공 시 뷰어 내 오버레이로 설정 표시) */
  onNavigateToSettings?: () => void;
  /** 탭 복귀 시 파일 변경 감지 및 알림 (미제공 시 감지 안 함) */
  visibilityManager?: PageVisibilityManager;
}

export class ViewerPage {
  private element: HTMLElement;
  private header!: Header;
  private sidebar: Sidebar | null = null; /* 사이드바 비사용 시 null */
  private footer!: Footer;
  private markdownRenderer!: MarkdownRenderer;
  private editor: Editor | null = null;
  private autoSaveManager: AutoSaveManager | null = null;
  private contentArea!: HTMLElement;
  private loading!: Loading;
  private currentFile: FileContent | null = null;
  private isEditMode: boolean = false;
  private saveStatus: SaveStatus = 'saved';
  private allFiles: FileMetadata[] = []; // 전체 파일 목록 (검색용)
  private searchQuery: string = ''; // 현재 검색어
  private isEncryptionEnabled: boolean = false; // 현재 파일 암호화 여부
  private userMenu: UserMenu | null = null; // 사용자 메뉴
  private currentUser: User | null = null; // 현재 사용자 정보
  private isLocalFileMode: boolean = false; // 로컬 파일 모드 여부
  private localFileInfo: LocalFileInfo | null = null; // 로컬 파일 정보
  private emptyStateElement!: HTMLElement; // 문서 없을 때 파일 선택 안내
  private rendererWrapper!: HTMLElement; // 렌더러 감싸는 영역 (빈 상태와 토글)
  private splitViewElement: HTMLElement | null = null; // 편집 모드 시 분할 뷰(에디터|미리보기) 컨테이너
  private scrollSyncLock: boolean = false; // 스크롤 동기화 시 상대 패널 리스너 무시
  private scrollSyncUnsubscribe: (() => void) | null = null; // 편집 종료 시 스크롤 리스너 제거
  private visibilityManager: PageVisibilityManager | undefined; // 파일 변경 감지 (탭 복귀 시)

  constructor(props: ViewerPageProps = {}) {
    this.element = document.createElement('div');
    this.element.className = 'viewer-page';
    this.visibilityManager = props.visibilityManager;
    this.render(props);
    this.init(props);
  }

  private render(props: ViewerPageProps = {}): void {
    // Header
    this.header = new Header({
      fileName: '',
      isEditMode: this.isEditMode,
      saveStatus: this.saveStatus,
      isEncryptionEnabled: this.isEncryptionEnabled,
      onMenuClick: () => this.sidebar?.toggle(),
      onEditClick: () => this.enterEditMode(),
      onSaveClick: () => this.handleSave({ encrypt: false }),
      onSavePlainClick: () => this.handleSave({ encrypt: false }),
      onSaveEncryptClick: () => this.handleSave({ encrypt: true }),
      onSaveAsClick: () => this.handleSaveAsLocalFile(),
      onEncryptionToggle: () => this.toggleEncryption(),
      onSettingsClick: props.onNavigateToSettings ?? (() => this.handleSettings()),
      onUserClick: () => this.handleUserMenu(),
    });
    this.element.appendChild(this.header.getElement());

    // Sidebar (메뉴 클릭 시 토글, 고정 위치)
    const isLoggedIn = !!TokenManager.getToken();
    this.sidebar = new Sidebar({
      files: [],
      isOpen: false,
      position: 'left',
      onFileClick: (path) => this.loadFile(path),
      onFileDelete: isLoggedIn ? (path, name) => this.handleDeleteFile(path, name) : undefined,
      onSearch: (query) => this.handleSearch(query),
      onNewFileClick: isLoggedIn ? () => this.handleNewFile() : undefined,
      onUploadClick: isLoggedIn ? () => this.handleUpload() : undefined,
      onLocalFileClick: () => this.handleOpenLocalFile(),
    });
    this.element.appendChild(this.sidebar.getElement());

    // Main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'viewer-page__main';

    // Content area
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'viewer-page__content-wrapper';

    this.contentArea = document.createElement('div');
    this.contentArea.className = 'viewer-page__content';
    contentWrapper.appendChild(this.contentArea);
    this.setupContentDropZone();

    // 빈 상태 (파일 선택 안내) - 문서가 없을 때 표시
    this.emptyStateElement = this.createEmptyState();
    this.contentArea.appendChild(this.emptyStateElement);

    // 렌더러 영역 (파일이 열렸을 때 표시)
    this.rendererWrapper = document.createElement('div');
    this.rendererWrapper.className = 'viewer-page__renderer-wrapper';
    const rendererContainer = document.createElement('div');
    rendererContainer.className = 'viewer-page__renderer';
    this.markdownRenderer = new MarkdownRenderer(rendererContainer);
    this.rendererWrapper.appendChild(rendererContainer);
    this.contentArea.appendChild(this.rendererWrapper);

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

  /** 빈 상태 UI: 문서가 없을 때 파일 선택 안내 (설계: 문서가 없으면 빈 화면 또는 파일 선택 안내 표시) */
  private createEmptyState(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'viewer-page__empty-state';
    wrap.setAttribute('aria-label', '파일 선택 안내');

    const title = document.createElement('h2');
    title.className = 'viewer-page__empty-state-title';
    title.textContent = '문서를 선택하거나 새로 만들어 보세요';
    wrap.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'viewer-page__empty-state-desc';
    desc.textContent = '메뉴(☰)에서 파일 목록을 확인하거나, 아래에서 시작하세요.';
    wrap.appendChild(desc);

    const actions = document.createElement('div');
    actions.className = 'viewer-page__empty-state-actions';

    const localBtn = document.createElement('button');
    localBtn.type = 'button';
    localBtn.className = 'viewer-page__empty-state-btn viewer-page__empty-state-btn--primary';
    localBtn.innerHTML = '<i class="fas fa-folder-open" aria-hidden="true"></i> 로컬 파일 열기';
    localBtn.addEventListener('click', () => this.handleOpenLocalFile());
    actions.appendChild(localBtn);

    const newBtn = document.createElement('button');
    newBtn.type = 'button';
    newBtn.className = 'viewer-page__empty-state-btn viewer-page__empty-state-btn--secondary empty-state-btn--login-only';
    newBtn.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i> 새 파일';
    newBtn.addEventListener('click', () => this.handleNewFile());
    actions.appendChild(newBtn);

    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'viewer-page__empty-state-btn viewer-page__empty-state-btn--secondary empty-state-btn--login-only';
    uploadBtn.innerHTML = '<i class="fas fa-upload" aria-hidden="true"></i> 파일 업로드';
    uploadBtn.addEventListener('click', () => this.handleUpload());
    actions.appendChild(uploadBtn);

    wrap.appendChild(actions);
    return wrap;
  }

  /** 드래그앤드롭으로 파일 열기 (설계: FR-2.2 드래그앤드롭으로 파일 열기) */
  private setupContentDropZone(): void {
    const allow = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.contentArea.classList.add('viewer-page__content--drag-over');
    };
    const leave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.contentArea.classList.remove('viewer-page__content--drag-over');
    };
    const drop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.contentArea.classList.remove('viewer-page__content--drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (!file || (!file.name.endsWith('.md') && !file.name.endsWith('.markdown'))) {
        if (file) Toast.warning('마크다운 파일(.md)만 열 수 있습니다.');
        return;
      }
      try {
        this.loading.show();
        const content = await file.text();
        this.currentFile = {
          path: file.name,
          name: file.name,
          content,
          encrypted: false,
          lastModified: new Date(file.lastModified).toISOString(),
          size: file.size,
        };
        this.isLocalFileMode = false;
        this.localFileInfo = null;
        this.updateEmptyState();
        this.header.updateFileName(file.name);
        this.markdownRenderer.render(content);
        Toast.success(`"${file.name}"을(를) 열었습니다.`);
      } catch (err) {
        console.error('Dropped file read error:', err);
        Toast.error('파일을 읽는 중 오류가 발생했습니다.');
      } finally {
        this.loading.hide();
      }
    };
    this.contentArea.addEventListener('dragover', allow);
    this.contentArea.addEventListener('dragenter', allow);
    this.contentArea.addEventListener('dragleave', leave);
    this.contentArea.addEventListener('drop', drop);
  }

  /** 빈 상태 / 렌더러 표시 토글 (문서 없음 → 안내, 문서 있음 → 렌더러) */
  private updateEmptyState(): void {
    const hasFile = this.currentFile != null;
    this.rendererWrapper.classList.toggle('viewer-page__renderer-wrapper--visible', hasFile);

    const isLoggedIn = !!TokenManager.getToken();
    this.contentArea.querySelectorAll('.empty-state-btn--login-only').forEach((el) => {
      (el as HTMLElement).style.display = isLoggedIn ? '' : 'none';
    });
  }

  private async init(props: ViewerPageProps): Promise<void> {
    const isLoggedIn = !!TokenManager.getToken();

    if (isLoggedIn) {
      await this.loadUserInfo();
      await this.loadFileList();
      if (props.initialFilePath) {
        await this.loadFile(props.initialFilePath);
      } else {
        await this.loadLastDocument();
      }
    } else {
      // 비로그인: 빈 뷰어 (로컬 파일 열기만 가능)
      this.applySearchFilter();
    }
    this.updateEmptyState();
  }

  private async loadUserInfo(): Promise<void> {
    try {
      this.currentUser = await getCurrentUser();
      if (!this.currentUser) {
        Toast.error('사용자 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      // 토큰이 없을 때는 조용히 처리 (비로그인 뷰어 모드)
      if (TokenManager.getToken()) {
        Toast.error('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      }
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
    this.sidebar?.updateFiles(fileItems);
  }

  /** 평면 파일 목록 → 폴더 트리 변환 (설계: FR-2.1 폴더 트리 구조, 폴더별 파일 그룹화) */
  private transformToFileItems(files: FileMetadata[]): FileItem[] {
    const flat: FileItem[] = files.map((file) => ({
      name: file.name,
      path: file.path,
      type: (file.type as 'file' | 'directory') || 'file',
      encrypted: file.encrypted || false,
    }));
    return this.buildFileTree(flat);
  }

  /** 경로 기준으로 디렉토리 노드를 만들고 트리 구조로 변환 */
  private buildFileTree(items: FileItem[]): FileItem[] {
    const pathToChildren = new Map<string, FileItem[]>();

    const ensureParent = (parentPath: string, child: FileItem): void => {
      const list = pathToChildren.get(parentPath) ?? [];
      if (!pathToChildren.has(parentPath)) pathToChildren.set(parentPath, list);
      list.push(child);
    };

    for (const item of items) {
      const path = item.path;
      const segments = path.split('/').filter(Boolean);
      if (segments.length === 0) continue;

      const fileItem: FileItem = { ...item, type: 'file' };

      if (segments.length === 1) {
        ensureParent('', fileItem);
        continue;
      }

      // 경로에 포함된 디렉토리 노드 생성
      for (let i = 1; i < segments.length; i++) {
        const dirPath = segments.slice(0, i).join('/');
        const dirName: string = segments[i - 1] ?? '';
        if (!pathToChildren.has(dirPath)) {
          const dirItem: FileItem = {
            name: dirName,
            path: dirPath,
            type: 'directory',
            children: [],
          };
          const parentPath = i === 1 ? '' : segments.slice(0, i - 1).join('/');
          ensureParent(parentPath, dirItem);
          pathToChildren.set(dirPath, []); // 자식 목록은 아래에서 채움
        }
      }

      const parentPath = segments.slice(0, -1).join('/');
      const parentList = pathToChildren.get(parentPath);
      if (parentList) {
        parentList.push(fileItem);
      } else {
        pathToChildren.set(parentPath, [fileItem]);
      }
    }

    const buildTree = (parentPath: string): FileItem[] => {
      const list = pathToChildren.get(parentPath) ?? [];
      return list
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        })
        .map((item) => {
          if (item.type === 'directory' && item.path) {
            return { ...item, children: buildTree(item.path) };
          }
          return item;
        });
    };

    return buildTree('');
  }

  private async loadFile(path: string): Promise<void> {
    this.visibilityManager?.stopChecking();
    try {
      this.loading.show();
      const fileContent = await readFile(path);
      
      if (fileContent) {
        this.currentFile = fileContent;
        this.updateEmptyState();
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

        // 서버 파일인 경우 탭 복귀 시 변경 감지 (알림 후 새로고침)
        if (!this.isLocalFileMode && this.visibilityManager) {
          this.visibilityManager.startChecking(path, () => {
            Toast.info('파일이 변경되었습니다. 새로고침합니다.');
            this.loadFile(path);
          });
        }
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
      } catch {
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
        this.updateEmptyState();
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
    } catch {
      // 마지막 문서가 없는 경우 무시
      console.log('No last document found');
    }
  }

  /**
   * 편집·미리보기 스크롤 비율 동기화.
   * 한쪽을 스크롤하면 다른 쪽이 같은 비율(0~1) 위치로 맞춰짐.
   */
  private setupScrollSync(
    editorEl: HTMLTextAreaElement,
    previewEl: HTMLElement
  ): () => void {
    const getRatio = (el: HTMLElement & { scrollHeight?: number; clientHeight?: number; scrollTop?: number }): number => {
      const max = (el.scrollHeight ?? 0) - (el.clientHeight ?? 0);
      if (max <= 0) return 0;
      return Math.max(0, Math.min(1, (el.scrollTop ?? 0) / max));
    };
    const setRatio = (el: HTMLElement & { scrollHeight?: number; clientHeight?: number; scrollTop?: number }, ratio: number): void => {
      const max = (el.scrollHeight ?? 0) - (el.clientHeight ?? 0);
      if (max <= 0) return;
      el.scrollTop = ratio * max;
    };

    const onEditorScroll = (): void => {
      if (this.scrollSyncLock) return;
      this.scrollSyncLock = true;
      setRatio(previewEl, getRatio(editorEl));
      requestAnimationFrame(() => {
        this.scrollSyncLock = false;
      });
    };
    const onPreviewScroll = (): void => {
      if (this.scrollSyncLock) return;
      this.scrollSyncLock = true;
      setRatio(editorEl, getRatio(previewEl));
      requestAnimationFrame(() => {
        this.scrollSyncLock = false;
      });
    };

    editorEl.addEventListener('scroll', onEditorScroll, { passive: true });
    previewEl.addEventListener('scroll', onPreviewScroll, { passive: true });

    return () => {
      editorEl.removeEventListener('scroll', onEditorScroll);
      previewEl.removeEventListener('scroll', onPreviewScroll);
    };
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

    const content = this.currentFile.content || '';

    // 분할 뷰: 왼쪽 에디터, 오른쪽 실시간 미리보기
    this.splitViewElement = document.createElement('div');
    this.splitViewElement.className = 'viewer-page__split-view';

    const leftPanel = document.createElement('div');
    leftPanel.className = 'viewer-page__split-editor';

    const rightPanel = document.createElement('div');
    rightPanel.className = 'viewer-page__split-preview';
    const previewLabel = document.createElement('div');
    previewLabel.className = 'viewer-page__split-preview-label';
    previewLabel.setAttribute('aria-hidden', 'true');
    previewLabel.textContent = '미리보기';
    rightPanel.appendChild(previewLabel);
    // 렌더러를 오른쪽 패널로 이동 (편집 중 실시간 미리보기)
    this.contentArea.appendChild(this.splitViewElement);
    this.splitViewElement.appendChild(leftPanel);
    this.splitViewElement.appendChild(rightPanel);
    rightPanel.appendChild(this.rendererWrapper);

    const editorContainer = document.createElement('div');
    editorContainer.className = 'viewer-page__editor viewer-page__editor--split';
    leftPanel.appendChild(editorContainer);

    this.editor = new Editor(editorContainer, {
      onContentChange: (newContent) => {
        if (this.autoSaveManager) {
          this.autoSaveManager.onContentChange(newContent);
        }
        // 오른쪽 패널에 편집 내용 실시간 반영
        this.markdownRenderer.render(newContent);
      },
      onSave: () => this.handleSave({ encrypt: false }),
      onClose: () => this.exitEditMode(),
    });

    this.editor.setContent(content);
    this.editor.setFileName(this.currentFile.name);
    editorContainer.classList.add('editor--split'); // 분할 뷰 시 전체 화면 오버레이 비활성화
    this.editor.focus();

    // 초기 미리보기 표시
    this.markdownRenderer.render(content);

    // 에디터·미리보기 스크롤 비율 동기화
    const editorTextarea = editorContainer.querySelector('.editor__textarea') as HTMLTextAreaElement | null;
    if (editorTextarea) {
      this.scrollSyncUnsubscribe = this.setupScrollSync(editorTextarea, this.rendererWrapper);
    }

    if (!this.isLocalFileMode) {
      this.autoSaveManager = new AutoSaveManager(
        {
          enabled: true,
          interval: 180,
          minChanges: 10,
        },
        {
          onStatusChange: (status) => {
            this.saveStatus = status;
            this.header.updateSaveStatus(status);
            if (this.editor && (status === 'saved' || status === 'saving' || status === 'failed')) {
              this.editor.setSaveStatus(status);
            }
          },
          onSaveSuccess: () => {},
          onSaveError: (error) => {
            console.error('Auto save error:', error);
            Toast.error('자동 저장에 실패했습니다.');
          },
        }
      );
      this.autoSaveManager.start(this.currentFile.path, content);
    }
  }

  private exitEditMode(): void {
    if (!this.isEditMode || !this.editor) {
      return;
    }

    if (this.autoSaveManager) {
      this.autoSaveManager.stop();
      this.autoSaveManager = null;
    }

    if (this.scrollSyncUnsubscribe) {
      this.scrollSyncUnsubscribe();
      this.scrollSyncUnsubscribe = null;
    }

    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }

    // 분할 뷰 제거, 렌더러를 본래 위치(contentArea)로 복원
    if (this.splitViewElement) {
      this.contentArea.appendChild(this.rendererWrapper);
      this.splitViewElement.remove();
      this.splitViewElement = null;
    }

    if (this.currentFile) {
      this.loadFile(this.currentFile.path);
    }

    this.isEditMode = false;
    this.header.setEditMode(false);
    this.saveStatus = 'saved';
    this.header.updateSaveStatus('saved');
  }

  /** @param option.encrypt true면 암호화하여 저장 다이얼로그 표시 (설계: 저장 옵션 드롭다운) */
  private async handleSave(option?: { encrypt?: boolean }): Promise<void> {
    if (!this.currentFile || !this.editor) {
      return;
    }

    // 로컬 파일 모드인 경우 로컬에 저장
    if (this.isLocalFileMode && this.localFileInfo) {
      await this.handleSaveLocalFile();
      return;
    }

    // 암호화하여 저장 선택 시 또는 기존 암호화 토글이 켜져 있으면 암호화 다이얼로그 표시
    if (option?.encrypt ?? this.isEncryptionEnabled) {
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

  private async performSave(content: string, encrypted: boolean, encryptedData?: EncryptedData): Promise<void> {
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
      // 비로그인 시 로그인 페이지로 이동
      window.location.href = '/login';
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
        await this.loadFileList();
        if (this.currentFile?.path === filePath) {
          this.visibilityManager?.stopChecking();
          this.currentFile = null;
          this.header.updateFileName('');
          this.markdownRenderer.clear();
          this.updateEmptyState();
        }
      },
      onCancel: () => {},
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

      this.visibilityManager?.stopChecking();
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
      this.updateEmptyState();

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
    this.visibilityManager?.stopChecking();
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
    this.sidebar?.destroy();
    this.footer.destroy();
    this.loading.destroy();
    // Toast는 static이므로 destroy 불필요
    this.element.remove();
  }
}
