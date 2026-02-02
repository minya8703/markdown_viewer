/**
 * API 클라이언트
 * 백엔드 API와 통신하는 공유 모듈
 * 
 * @see 01_SYSTEM_ARCHITECTURE.md - 프론트엔드-백엔드 통신 구조
 * @see 03_API_SPECIFICATION.md - API 엔드포인트 명세, 인증 방식 (JWT)
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (shared 레이어), API 클라이언트 패턴
 */

import type { ApiResponse, FileMetadata } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * JWT 토큰 관리
 */
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

/**
 * HTTP 클라이언트
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = TokenManager.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // 401 Unauthorized 처리: 토큰 만료 또는 인증 실패
      if (response.status === 401) {
        TokenManager.removeToken();
        localStorage.removeItem('user');
        
        // 로그인 페이지로 리다이렉트 (현재 경로가 로그인 페이지가 아닐 때만)
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        const error = await response.json().catch(() => ({
          code: 'UNAUTHORIZED',
          message: '인증이 만료되었습니다. 다시 로그인해주세요.',
        }));
        throw error;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          code: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 파일 업로드용
  async uploadFile(
    file: File,
    path?: string
  ): Promise<ApiResponse<FileMetadata>> {
    const token = TokenManager.getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (path) {
      formData.append('path', path);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const apiClient = new ApiClient();
export { TokenManager };
