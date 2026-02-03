/**
 * 인증 기능 단위 테스트 (저장/조회/토큰, API 호출 제외)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveUser,
  getStoredUser,
  removeStoredUser,
  isAuthenticated,
  saveToken,
  saveAuthData,
} from './auth';
import { TokenManager } from '@shared/api/client';

describe('auth', () => {
  beforeEach(() => {
    localStorage.clear();
    TokenManager.removeToken();
  });

  describe('saveUser / getStoredUser / removeStoredUser', () => {
    it('saveUser 후 getStoredUser로 조회할 수 있다', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        storageQuota: 1024,
        storageUsed: 0,
        createdAt: '2026-01-01T00:00:00Z',
      };
      saveUser(user);
      expect(getStoredUser()).toEqual(user);
    });

    it('removeStoredUser 후 getStoredUser는 null을 반환한다', () => {
      saveUser({
        id: '1',
        email: 'a@b.com',
        name: 'A',
        storageQuota: 0,
        storageUsed: 0,
        createdAt: '',
      });
      removeStoredUser();
      expect(getStoredUser()).toBeNull();
    });

    it('저장된 값이 JSON이 아니면 getStoredUser는 null을 반환한다', () => {
      localStorage.setItem('user', 'invalid-json');
      expect(getStoredUser()).toBeNull();
    });
  });

  describe('saveToken / isAuthenticated', () => {
    it('토큰이 없으면 isAuthenticated는 false이다', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('saveToken 후 isAuthenticated는 true이다', () => {
      saveToken('jwt-xxx');
      expect(isAuthenticated()).toBe(true);
      expect(TokenManager.getToken()).toBe('jwt-xxx');
    });
  });

  describe('saveAuthData', () => {
    it('토큰만 전달하면 토큰만 저장된다', () => {
      saveAuthData('token-only');
      expect(TokenManager.getToken()).toBe('token-only');
      expect(getStoredUser()).toBeNull();
    });

    it('토큰과 사용자를 전달하면 둘 다 저장된다', () => {
      const user = {
        id: '2',
        email: 'u@u.com',
        name: 'User',
        storageQuota: 100,
        storageUsed: 10,
        createdAt: '2026-02-01T00:00:00Z',
      };
      saveAuthData('jwt-abc', user);
      expect(TokenManager.getToken()).toBe('jwt-abc');
      expect(getStoredUser()).toEqual(user);
    });
  });
});
