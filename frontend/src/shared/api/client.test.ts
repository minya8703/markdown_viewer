/**
 * API 클라이언트 및 TokenManager 단위 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenManager, apiClient } from './client';

describe('TokenManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getToken은 저장된 토큰을 반환한다', () => {
    expect(TokenManager.getToken()).toBeNull();
    TokenManager.setToken('jwt-xxx');
    expect(TokenManager.getToken()).toBe('jwt-xxx');
  });

  it('setToken으로 토큰을 저장할 수 있다', () => {
    TokenManager.setToken('my-token');
    expect(localStorage.getItem('auth_token')).toBe('my-token');
  });

  it('removeToken으로 토큰을 제거한다', () => {
    TokenManager.setToken('jwt-xxx');
    TokenManager.removeToken();
    expect(TokenManager.getToken()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});

describe('ApiClient', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => {
    localStorage.clear();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn();
  });
  afterEach(() => {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it('get 요청 시 Authorization 헤더에 토큰이 있으면 Bearer로 보낸다', async () => {
    TokenManager.setToken('secret-jwt');
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: 1 } }),
    });

    await apiClient.get('/auth/me');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/me');
    expect((options?.headers as Record<string, string>)?.Authorization).toBe('Bearer secret-jwt');
    expect(options?.method).toBe('GET');
  });

  it('성공 응답 시 JSON을 파싱하여 반환한다', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { name: 'test' } }),
    });

    const result = await apiClient.get<{ name: string }>('/test');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'test' });
  });

  it('404 응답 시 에러를 던진다', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }),
    });

    await expect(apiClient.get('/missing')).rejects.toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'NOT_FOUND' }),
    });
  });
});
