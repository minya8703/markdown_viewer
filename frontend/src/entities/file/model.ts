/**
 * File 엔티티 모델
 */

import type { FileMetadata, FileContent } from '@shared/types';
import { apiClient } from '@shared/api/client';

export class File {
  private metadata: FileMetadata;
  private content: FileContent | null = null;

  constructor(metadata: FileMetadata) {
    this.metadata = metadata;
  }

  /**
   * 파일 목록 조회
   */
  static async list(path?: string): Promise<File[]> {
    const endpoint = path ? `/files?path=${encodeURIComponent(path)}` : '/files';
    const response = await apiClient.get<{ files: FileMetadata[] }>(endpoint);
    
    if (response.success && response.data?.files) {
      return response.data.files.map((meta) => new File(meta));
    }
    throw new Error('Failed to list files');
  }

  /**
   * 파일 읽기
   */
  async read(): Promise<FileContent> {
    const response = await apiClient.get<FileContent>(`/files/${this.metadata.path}`);
    
    if (response.success && response.data) {
      this.content = response.data;
      return response.data;
    }
    throw new Error('Failed to read file');
  }

  /**
   * 파일 저장
   */
  async save(content: string, encrypted: boolean = false): Promise<void> {
    const payload: Record<string, unknown> = {
      content,
      encrypted,
    };

    const response = await apiClient.post(`/files/${this.metadata.path}`, payload);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to save file');
    }
  }

  /**
   * 암호화된 파일 저장
   */
  async saveEncrypted(
    encryptedData: string,
    iv: string,
    tag: string
  ): Promise<void> {
    const payload = {
      encrypted: true,
      encryptedData,
      iv,
      tag,
    };

    const response = await apiClient.post(`/files/${this.metadata.path}`, payload);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to save encrypted file');
    }
  }

  /**
   * 파일 삭제
   */
  async delete(secure: boolean = false): Promise<void> {
    const endpoint = `/files/${this.metadata.path}${secure ? '?secure=true' : ''}`;
    const response = await apiClient.delete(endpoint);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete file');
    }
  }

  /**
   * 파일 변경 감지
   */
  async checkModified(lastModified?: string): Promise<boolean> {
    const headers: HeadersInit = {};
    if (lastModified) {
      headers['If-Modified-Since'] = lastModified;
    }

    const response = await fetch(`/api/files/${this.metadata.path}/check`, {
      method: 'GET',
      headers,
    });

    return response.status === 200;
  }

  /**
   * 메타데이터 가져오기
   */
  getMetadata(): FileMetadata {
    return this.metadata;
  }

  /**
   * 파일 내용 가져오기
   */
  getContent(): FileContent | null {
    return this.content;
  }

  /**
   * 파일명
   */
  getName(): string {
    return this.metadata.name;
  }

  /**
   * 파일 경로
   */
  getPath(): string {
    return this.metadata.path;
  }

  /**
   * 암호화 여부
   */
  isEncrypted(): boolean {
    return this.metadata.encrypted || false;
  }
}
