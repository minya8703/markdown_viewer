/**
 * Page Visibility API 관리
 * 백그라운드 업데이트 방지, 탭 복귀 시 파일 변경 감지 및 알림
 *
 * @see docs/10_design/11_REQUIREMENTS.md - FR-5.3 (백그라운드 업데이트 방지)
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (shared/lib 레이어)
 */

import { TokenManager } from '@shared/api/client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface FileChangeData {
  lastModified?: string;
  path?: string;
}

export class PageVisibilityManager {
  private isVisible: boolean = !document.hidden;
  private checkInterval: number | null = null;
  private currentFilePath: string | null = null;
  private lastModified: string | null = null;
  private fileChangedCallback: ((data: FileChangeData) => void) | null = null;

  init(): void {
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // 초기 상태 설정
    this.isVisible = !document.hidden;
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // 탭이 숨겨짐 - 파일 변경 감지 중지
      this.stopChecking();
    } else {
      // 탭이 다시 보임 - 파일 변경 감지 재개
      this.resumeChecking();
    }
  }

  /**
   * 파일 변경 감지 시작.
   * @param filePath - 감지할 파일 경로
   * @param onFileChanged - 변경 감지 시 호출할 콜백 (알림/새로고침 등)
   */
  startChecking(filePath: string, onFileChanged?: (data: FileChangeData) => void): void {
    this.stopChecking();
    this.currentFilePath = filePath;
    this.fileChangedCallback = onFileChanged ?? null;
    if (!this.isVisible) return;

    // 30초마다 파일 변경 체크
    this.checkInterval = window.setInterval(() => {
      this.checkFileChange(filePath);
    }, 30000);
  }

  stopChecking(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  resumeChecking(): void {
    if (!this.currentFilePath) return;

    // 한 번만 체크 (조용한 체크)
    this.checkFileChange(this.currentFilePath, true);

    // 콜백 유지하며 인터벌 재개
    this.startChecking(this.currentFilePath, this.fileChangedCallback ?? undefined);
  }

  private async checkFileChange(
    filePath: string,
    silent: boolean = false
  ): Promise<void> {
    const headers: HeadersInit = {
      ...(TokenManager.getToken() && {
        Authorization: `Bearer ${TokenManager.getToken()}`,
      }),
    };
    if (this.lastModified) {
      headers['If-Modified-Since'] = this.lastModified;
    }

    try {
      const pathSegments = filePath.split('/').map((s) => encodeURIComponent(s)).join('/');
      const response = await fetch(`${API_BASE}/files/${pathSegments}/check`, {
        method: 'GET',
        headers,
      });

      if (response.status === 200) {
        const data = await response.json();
        const payload = (data.data ?? data) as FileChangeData;
        this.lastModified = payload.lastModified ?? null;

        if (!silent && this.fileChangedCallback) {
          this.fileChangedCallback(payload);
        }
      }
      // 304: 변경 없음 — 별도 처리 없음
    } catch (error) {
      console.error('File change check failed:', error);
    }
  }

}
