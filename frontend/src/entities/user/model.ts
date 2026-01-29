/**
 * User 엔티티 모델
 */

import type { User as UserType } from '@shared/types';
import { apiClient } from '@shared/api/client';

export class User {
  private data: UserType | null = null;

  constructor(data?: UserType) {
    if (data) {
      this.data = data;
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  static async getCurrent(): Promise<User> {
    const response = await apiClient.get<UserType>('/auth/me');
    if (response.success && response.data) {
      return new User(response.data);
    }
    throw new Error('Failed to get current user');
  }

  /**
   * 사용자 정보 가져오기
   */
  getData(): UserType | null {
    return this.data;
  }

  /**
   * 사용자 ID
   */
  getId(): string | null {
    return this.data?.id || null;
  }

  /**
   * 사용자 이메일
   */
  getEmail(): string | null {
    return this.data?.email || null;
  }

  /**
   * 사용자 이름
   */
  getName(): string | null {
    return this.data?.name || null;
  }

  /**
   * 프로필 사진 URL
   */
  getPicture(): string | null {
    return this.data?.picture || null;
  }

  /**
   * 저장 공간 사용률 (0-1)
   */
  getStorageUsage(): number {
    if (!this.data) return 0;
    return this.data.storageUsed / this.data.storageQuota;
  }

  /**
   * 저장 공간 사용률 퍼센트
   */
  getStorageUsagePercent(): number {
    return Math.round(this.getStorageUsage() * 100);
  }
}
