/**
 * Page Visibility API 관리
 * 백그라운드 업데이트 방지 기능
 */

export class PageVisibilityManager {
  private isVisible: boolean = !document.hidden;
  private checkInterval: number | null = null;
  private currentFilePath: string | null = null;
  private lastModified: string | null = null;

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

  startChecking(filePath: string): void {
    this.currentFilePath = filePath;
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

    // 정상적인 인터벌 재개
    this.startChecking(this.currentFilePath);
  }

  private async checkFileChange(
    filePath: string,
    silent: boolean = false
  ): Promise<void> {
    const headers: HeadersInit = {};
    if (this.lastModified) {
      headers['If-Modified-Since'] = this.lastModified;
    }

    try {
      const response = await fetch(`/api/files/${filePath}/check`, {
        method: 'GET',
        headers,
      });

      if (response.status === 200) {
        // 파일이 변경됨
        const data = await response.json();
        this.lastModified = data.data?.lastModified || null;

        if (!silent) {
          // 사용자에게 알림 또는 자동 새로고침
          this.onFileChanged(data.data);
        }
      } else if (response.status === 304) {
        // 파일이 변경되지 않음
        // 아무 작업도 하지 않음
      }
    } catch (error) {
      console.error('File change check failed:', error);
    }
  }

  private onFileChanged(data: unknown): void {
    // 파일 변경 이벤트 발생
    // 실제 구현은 이벤트 시스템 또는 콜백으로 처리
    console.log('File changed:', data);
    // TODO: 파일 변경 알림 또는 자동 새로고침 구현
  }
}
