/**
 * 파일 관리 서비스 단위 테스트
 * getFileList, readFile, saveFile, deleteFile, getLastDocument, checkFileModified
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFileList,
  readFile,
  saveFile,
  deleteFile,
  getLastDocument,
  checkFileModified,
} from './fileService';
import { TokenManager } from '@shared/api/client';

const originalFetch = globalThis.fetch;

describe('fileService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  describe('getFileList', () => {
    it('성공 시 data.files 배열을 반환한다', async () => {
      const files = [
        { path: 'a.md', name: 'a.md', type: 'file', lastModified: '2026-02-02T12:00:00' },
      ];
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { files } }),
      });

      const result = await getFileList();
      expect(result).toEqual(files);
    });

    it('path 파라미터가 있으면 쿼리에 포함한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { files: [] } }),
      });

      await getFileList('docs');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('path='),
        expect.any(Object)
      );
    });

    it('실패 또는 success false 시 빈 배열을 반환한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      });

      const result = await getFileList();
      expect(result).toEqual([]);
    });

    it('data가 없으면 빈 배열을 반환한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null }),
      });

      const result = await getFileList();
      expect(result).toEqual([]);
    });
  });

  describe('readFile', () => {
    it('성공 시 FileContent를 반환한다', async () => {
      const content = { path: 'read.md', name: 'read.md', content: '# Hello', encrypted: false };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: content }),
      });

      const result = await readFile('read.md');
      expect(result).toEqual(content);
    });

    it('실패 시 null을 반환한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      });

      const result = await readFile('missing.md');
      expect(result).toBeNull();
    });
  });

  describe('saveFile', () => {
    it('성공 시 true를 반환한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { path: 'saved.md' } }),
      });

      const result = await saveFile('saved.md', '# Content', false);
      expect(result).toBe(true);
    });

    it('실패 시 false를 반환한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      });

      const result = await saveFile('x.md', 'content', false);
      expect(result).toBe(false);
    });

    it('암호화 플래그와 encryptedData를 전달하면 요청 body에 포함한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await saveFile('e.md', '', true, {
        encrypted: 'base64...',
        iv: 'iv...',
        tag: 'tag...',
      });
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.encrypted).toBe(true);
      expect(body.encryptedData).toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('기본 호출 시 secure 없이 DELETE 요청한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await deleteFile('del.md');
      expect(result).toBe(true);
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).not.toContain('secure=true');
    });

    it('secure true 시 쿼리에 secure=true를 붙인다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await deleteFile('secure.md', true);
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('secure=true');
    });

    it('실패 시 false를 반환한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      });

      const result = await deleteFile('x.md');
      expect(result).toBe(false);
    });
  });

  describe('getLastDocument', () => {
    it('성공 시 path, name, lastModified를 반환한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { path: 'last.md', name: 'last.md', lastModified: '2026-02-02T12:00:00' },
        }),
      });

      const result = await getLastDocument();
      expect(result).not.toBeNull();
      expect(result?.path).toBe('last.md');
      expect(result?.name).toBe('last.md');
      expect(result?.type).toBe('file');
    });

    it('실패 시 null을 반환한다', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      });

      const result = await getLastDocument();
      expect(result).toBeNull();
    });
  });

  describe('checkFileModified', () => {
    it('304 응답 시 null을 반환한다 (변경 없음)', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 304,
        ok: false,
      });

      const result = await checkFileModified('a.md', '2026-02-02T12:00:00');
      expect(result).toBeNull();
    });

    it('200 응답 시 data를 반환한다', async () => {
      const data = { path: 'a.md', content: 'updated', lastModified: '2026-02-02T14:00:00' };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ success: true, data }),
      });

      TokenManager.setToken('token');
      const result = await checkFileModified('a.md', '2026-02-02T12:00:00');
      expect(result).toEqual(data);
    });
  });
});
