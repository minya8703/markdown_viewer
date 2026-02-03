/**
 * 인증 관련 기능
 * 사용자 인증, 사용자 정보 관리, 토큰 관리
 * 
 * @see 02_REQUIREMENTS.md - FR-1 (인증 및 사용자 관리)
 * @see 03_API_SPECIFICATION.md - 인증 API 엔드포인트 명세
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (features/lib 레이어)
 */

import { apiClient, TokenManager } from '@shared/api/client';
import type { User } from '@shared/types';

const GOOGLE_LOGIN_URL = '/api/auth/google/login';
const USER_STORAGE_KEY = 'user';

/**
 * 사용자 정보 저장
 */
export function saveUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * 저장된 사용자 정보 조회
 */
export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_STORAGE_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

/**
 * 저장된 사용자 정보 삭제
 */
export function removeStoredUser(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Google 로그인 시작
 */
export function startGoogleLogin(): void {
  window.location.href = GOOGLE_LOGIN_URL;
}

/**
 * 현재 사용자 정보 조회 (서버에서 최신 정보 가져오기)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiClient.get<User>('/auth/me');
    if (response.success && response.data) {
      // 서버에서 받은 사용자 정보를 localStorage에 저장
      saveUser(response.data);
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    // 서버 조회 실패 시 저장된 정보 반환
    return getStoredUser();
  }
}

/**
 * 사용자 정보 새로고침
 */
export async function refreshUser(): Promise<User | null> {
  return getCurrentUser();
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    TokenManager.removeToken();
    removeStoredUser();
    window.location.href = '/login';
  }
}

/**
 * 인증 상태 확인
 */
export function isAuthenticated(): boolean {
  return TokenManager.getToken() !== null;
}

/**
 * 토큰 저장 (OAuth 콜백에서 사용)
 */
export function saveToken(token: string): void {
  TokenManager.setToken(token);
}

/**
 * 토큰과 사용자 정보 저장 (OAuth 콜백에서 사용)
 */
export function saveAuthData(token: string, user?: User): void {
  saveToken(token);
  if (user) {
    saveUser(user);
  }
}
