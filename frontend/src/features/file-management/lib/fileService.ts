/**
 * 파일 관리 서비스
 * 파일 CRUD 작업을 위한 API 클라이언트 래퍼
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-2 (파일 관리 기능 요구사항)
 * @see docs/20_backend/20_API_SPECIFICATION.md - 파일 관리 API 엔드포인트 상세 명세
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (features/lib 레이어), API 클라이언트 패턴
 */

import { apiClient } from '@shared/api/client';
import type { FileMetadata, FileContent, ApiResponse } from '@shared/types';
import type { EncryptedData } from '@features/encryption';

/**
 * 파일 목록 조회
 */
export async function getFileList(path?: string): Promise<FileMetadata[]> {
  try {
    const endpoint = path ? `/files?path=${encodeURIComponent(path)}` : '/files';
    const response = await apiClient.get<{ files: FileMetadata[] }>(endpoint);
    
    if (response.success && response.data) {
      return response.data.files;
    }
    return [];
  } catch (error) {
    console.error('Failed to get file list:', error);
    return [];
  }
}

/**
 * 파일 읽기
 * 암호화된 파일의 경우 복호화는 호출하는 쪽에서 처리해야 함
 */
export async function readFile(path: string): Promise<FileContent | null> {
  try {
    const encodedPath = encodeURIComponent(path);
    const response = await apiClient.get<FileContent>(`/files/${encodedPath}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to read file:', error);
    return null;
  }
}

/**
 * 파일 저장
 */
export async function saveFile(
  path: string,
  content: string,
  encrypted: boolean = false,
  encryptedData?: EncryptedData
): Promise<boolean> {
  try {
    const encodedPath = encodeURIComponent(path);
    
    const requestBody: {
      content?: string;
      encrypted: boolean;
      encryptedData?: EncryptedData;
    } = {
      encrypted,
    };

    if (encrypted && encryptedData) {
      // 암호화된 데이터 전송
      requestBody.encryptedData = encryptedData;
    } else {
      // 평문 데이터 전송
      requestBody.content = content;
    }

    const response = await apiClient.post<FileMetadata>(`/files/${encodedPath}`, requestBody);
    
    return response.success || false;
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
}

/**
 * 파일 업로드
 */
export async function uploadFile(
  file: File,
  path?: string
): Promise<FileMetadata | null> {
  try {
    const response = await apiClient.uploadFile(file, path);
    
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to upload file:', error);
    return null;
  }
}

/**
 * 파일 삭제
 */
export async function deleteFile(
  path: string,
  secure: boolean = false
): Promise<boolean> {
  try {
    const encodedPath = encodeURIComponent(path);
    const query = secure ? '?secure=true' : '';
    const response = await apiClient.delete<unknown>(`/files/${encodedPath}${query}`);
    
    return response.success || false;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

/**
 * 마지막 문서 조회
 */
export async function getLastDocument(): Promise<FileMetadata | null> {
  try {
    const response = await apiClient.get<{ path: string; name: string; lastModified: string }>(
      '/users/me/last-document'
    );
    
    if (response.success && response.data) {
      return {
        name: response.data.name,
        path: response.data.path,
        type: 'file',
        lastModified: response.data.lastModified,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get last document:', error);
    return null;
  }
}

/**
 * 파일 변경 감지
 */
export async function checkFileModified(
  path: string,
  lastModified: string
): Promise<FileContent | null> {
  try {
    const encodedPath = encodeURIComponent(path);
    const response = await fetch(`/api/files/${encodedPath}/check`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'If-Modified-Since': lastModified,
      },
    });

    if (response.status === 304) {
      return null; // 변경되지 않음
    }

    const data: ApiResponse<FileContent> = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to check file modification:', error);
    return null;
  }
}
