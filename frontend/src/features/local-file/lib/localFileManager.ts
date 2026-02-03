/**
 * 로컬 파일 관리자
 * File System Access API를 사용한 로컬 파일 읽기/저장
 * 
 * @see 02_REQUIREMENTS.md - FR-4.2 (로컬 전용 모드)
 * @see 01_SYSTEM_ARCHITECTURE.md - 로컬 파일 읽기/저장 상세
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (features/lib 레이어)
 */

export interface LocalFileInfo {
  name: string;
  handle: FileSystemFileHandle;
  content: string;
  lastModified: number;
}

/**
 * File System Access API 지원 여부 확인
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

/**
 * 로컬 파일 열기
 * File System Access API 또는 전통적인 File Input 사용
 */
export async function openLocalFile(): Promise<LocalFileInfo | null> {
  if (isFileSystemAccessSupported()) {
    return await openFileWithFileSystemAccess();
  } else {
    return await openFileWithFileInput();
  }
}

/**
 * File System Access API를 사용한 파일 열기
 */
async function openFileWithFileSystemAccess(): Promise<LocalFileInfo | null> {
  if (!window.showOpenFilePicker) return null;
  try {
    const handles = await window.showOpenFilePicker({
      types: [
        {
          description: 'Markdown Files',
          accept: {
            'text/markdown': ['.md', '.markdown'],
            'text/plain': ['.md', '.markdown'],
          },
        },
      ],
      excludeAcceptAllOption: false,
      multiple: false,
    });

    const fileHandle = handles[0];
    if (!fileHandle) return null;

    const file = await fileHandle.getFile();
    const content = await file.text();

    return {
      name: file.name,
      handle: fileHandle,
      content,
      lastModified: file.lastModified,
    };
  } catch (error: unknown) {
    // 사용자가 취소한 경우
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    console.error('Failed to open file:', error);
    throw error;
  }
}

/**
 * 전통적인 File Input을 사용한 파일 열기
 */
function openFileWithFileInput(): Promise<LocalFileInfo | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,text/markdown,text/plain';
    input.style.display = 'none';

    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const content = await file.text();
        resolve({
          name: file.name,
          handle: null as unknown as FileSystemFileHandle, // File Input은 핸들 없음
          content,
          lastModified: file.lastModified,
        });
      } catch (error) {
        console.error('Failed to read file:', error);
        resolve(null);
      } finally {
        document.body.removeChild(input);
      }
    });

    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * 로컬 파일 저장
 * File System Access API 핸들이 있으면 직접 저장, 없으면 다운로드
 */
export async function saveLocalFile(
  content: string,
  fileName: string,
  fileHandle?: FileSystemFileHandle | null
): Promise<boolean> {
  if (fileHandle && isFileSystemAccessSupported()) {
    return await saveFileWithFileSystemAccess(fileHandle, content);
  } else {
    return await saveFileWithDownload(content, fileName);
  }
}

/**
 * File System Access API를 사용한 파일 저장
 */
async function saveFileWithFileSystemAccess(
  fileHandle: FileSystemFileHandle,
  content: string
): Promise<boolean> {
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
}

/**
 * 다운로드를 사용한 파일 저장
 */
function saveFileWithDownload(content: string, fileName: string): boolean {
  try {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to download file:', error);
    return false;
  }
}

/**
 * 새 파일로 로컬 저장 (File System Access API만 지원)
 */
export async function saveAsLocalFile(
  content: string,
  defaultFileName: string = 'document.md'
): Promise<boolean> {
  if (!isFileSystemAccessSupported()) {
    // File System Access API가 없으면 다운로드 사용
    return saveFileWithDownload(content, defaultFileName);
  }

  if (!window.showSaveFilePicker) return saveFileWithDownload(content, defaultFileName);
  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: defaultFileName,
      types: [
        {
          description: 'Markdown Files',
          accept: {
            'text/markdown': ['.md', '.markdown'],
            'text/plain': ['.md', '.markdown'],
          },
        },
      ],
    });

    return await saveFileWithFileSystemAccess(fileHandle, content);
  } catch (error: unknown) {
    // 사용자가 취소한 경우
    if (error instanceof DOMException && error.name === 'AbortError') {
      return false;
    }
    console.error('Failed to save file:', error);
    return false;
  }
}
