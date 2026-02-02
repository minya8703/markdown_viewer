/**
 * 공유 타입 정의
 * 애플리케이션 전역에서 사용되는 TypeScript 타입 및 인터페이스
 * 
 * @see 03_API_SPECIFICATION.md - API 응답 구조, 데이터 모델
 * @see 04_DATABASE_DESIGN.md - 데이터베이스 엔티티 구조
 * @see 12_CODING_CONVENTIONS.md - TypeScript 타입 정의 규약
 */

// API 응답 기본 구조
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// 사용자 정보
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  storageQuota: number;
  storageUsed: number;
  createdAt: string;
}

// 파일 메타데이터
export interface FileMetadata {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified: string;
  encrypted?: boolean;
}

// 파일 내용
export interface FileContent {
  path: string;
  name: string;
  content?: string;
  html?: string;
  encrypted: boolean;
  encryptedData?: string;
  iv?: string;
  tag?: string;
  lastModified: string;
  size: number;
}

// 저장 상태
export type SaveStatus = 'saved' | 'saving' | 'failed' | 'unsaved';

// 편집 모드
export type EditMode = 'view' | 'edit';

// 사이드바 상태
export interface SidebarState {
  isOpen: boolean;
  position: 'left' | 'right';
}

// 자동 저장 설정
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // 초 단위
  minChanges?: number; // 즉시 저장 최소 변경 횟수
}

// 암호화 설정
export interface EncryptionConfig {
  enabled: boolean;
  algorithm?: string; // 암호화 알고리즘 (예: 'AES-256-GCM')
  password?: string;
}

// 로컬 파일 모드
export interface LocalFileMode {
  enabled: boolean;
  fileHandle?: FileSystemFileHandle;
}

// 인증 응답
export interface AuthResponse {
  token: string;
  user: User;
  redirectUrl?: string;
}
