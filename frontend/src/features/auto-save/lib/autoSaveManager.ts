/**
 * 자동 저장 관리자
 * localStorage 즉시 저장 + 서버 주기적 저장
 * 
 * @see 02_REQUIREMENTS.md - FR-5.2 (자동 저장 기능 요구사항)
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (features/lib 레이어), 비즈니스 로직 분리
 */

import { saveFile } from '@features/file-management';
import type { SaveStatus } from '@shared/types';

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // 초 단위 (기본: 180초 = 3분)
  minChanges: number; // 최소 변경 횟수 (기본: 10)
}

export interface AutoSaveCallbacks {
  onStatusChange?: (status: SaveStatus) => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export class AutoSaveManager {
  private config: AutoSaveConfig;
  private callbacks: AutoSaveCallbacks;
  private saveTimer: number | null = null;
  private changeCount: number = 0;
  private lastSaveTime: number = 0;
  private filePath: string | null = null;
  private currentContent: string = '';
  private originalContent: string = '';
  private isSaving: boolean = false;

  constructor(
    config: Partial<AutoSaveConfig> = {},
    callbacks: AutoSaveCallbacks = {}
  ) {
    this.config = {
      enabled: config.enabled ?? true,
      interval: config.interval ?? 180, // 3분
      minChanges: config.minChanges ?? 10,
    };
    this.callbacks = callbacks;
  }

  /**
   * 파일 설정 및 자동 저장 시작
   */
  start(filePath: string, content: string): void {
    this.filePath = filePath;
    this.originalContent = content;
    this.currentContent = content;
    this.changeCount = 0;
    this.lastSaveTime = Date.now();

    // localStorage에 즉시 저장
    this.saveToLocalStorage();

    if (this.config.enabled) {
      this.startTimer();
    }
  }

  /**
   * 내용 변경 감지
   */
  onContentChange(content: string): void {
    this.currentContent = content;
    this.changeCount++;

    // localStorage에 즉시 저장
    this.saveToLocalStorage();

    // 변경사항이 많으면 즉시 서버 저장
    if (this.changeCount >= this.config.minChanges && !this.isSaving) {
      this.saveToServer();
      this.changeCount = 0;
    }
  }

  /**
   * 수동 저장
   */
  async save(): Promise<boolean> {
    if (!this.filePath) {
      return false;
    }

    return await this.saveToServer();
  }

  /**
   * 자동 저장 중지
   */
  stop(): void {
    this.stopTimer();
    this.filePath = null;
    this.currentContent = '';
    this.originalContent = '';
    this.changeCount = 0;
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enabled && this.filePath) {
      this.startTimer();
    } else {
      this.stopTimer();
    }
  }

  /**
   * 저장 상태 확인
   */
  hasUnsavedChanges(): boolean {
    return this.currentContent !== this.originalContent;
  }

  /**
   * 마지막 저장 시간 가져오기
   */
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /**
   * 타이머 시작
   */
  private startTimer(): void {
    this.stopTimer();

    this.saveTimer = window.setInterval(() => {
      if (this.hasUnsavedChanges() && !this.isSaving) {
        this.saveToServer();
      }
    }, this.config.interval * 1000);
  }

  /**
   * 타이머 중지
   */
  private stopTimer(): void {
    if (this.saveTimer !== null) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * localStorage에 저장
   */
  private saveToLocalStorage(): void {
    if (!this.filePath) return;

    try {
      localStorage.setItem(`file_content_${this.filePath}`, this.currentContent);
      localStorage.setItem(`file_modified_${this.filePath}`, Date.now().toString());
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * 서버에 저장
   */
  private async saveToServer(): Promise<boolean> {
    if (!this.filePath || this.isSaving) {
      return false;
    }

    // 변경사항이 없으면 저장하지 않음
    if (!this.hasUnsavedChanges()) {
      return true;
    }

    this.isSaving = true;
    this.callbacks.onStatusChange?.('saving');

    try {
      const success = await saveFile(this.filePath, this.currentContent, false);

      if (success) {
        this.originalContent = this.currentContent;
        this.changeCount = 0;
        this.lastSaveTime = Date.now();
        this.callbacks.onStatusChange?.('saved');
        this.callbacks.onSaveSuccess?.();

        // localStorage에서 임시 저장 제거
        localStorage.removeItem(`file_content_${this.filePath}`);
        localStorage.removeItem(`file_modified_${this.filePath}`);

        return true;
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Auto save error:', error);
      this.callbacks.onStatusChange?.('failed');
      this.callbacks.onSaveError?.(error as Error);
      return false;
    } finally {
      this.isSaving = false;
    }
  }
}
