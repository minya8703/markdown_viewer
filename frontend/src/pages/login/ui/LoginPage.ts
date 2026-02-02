/**
 * Login 페이지
 * Google OAuth 로그인 페이지
 * 
 * @see 02_REQUIREMENTS.md - FR-1 (인증 기능 요구사항)
 * @see 03_API_SPECIFICATION.md - 인증 API 엔드포인트 상세 명세
 * @see 05_UI_UX_DESIGN.md - 로그인 흐름, 로그인 페이지 UI 설계
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (pages 레이어), TypeScript 코딩 규약
 */

import { Button } from '@shared/ui/Button';
import type { AuthResponse } from '@shared/types';
import { saveAuthData } from '@features/auth';
import { apiClient } from '@shared/api/client';
import './LoginPage.css';

export class LoginPage {
  private element: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onLoginSuccess?: () => void;

  constructor(onLoginSuccess?: () => void) {
    console.log('LoginPage constructor called');
    this.onLoginSuccess = onLoginSuccess;
    this.element = document.createElement('div');
    this.element.className = 'login-page';
    console.log('LoginPage element created:', this.element);
    this.render();
  }

  private render(): void {
    console.log('LoginPage.render() called');
    try {
      const container = document.createElement('div');
      container.className = 'login-page__container';

      // 로고/타이틀
      const title = document.createElement('h1');
      title.className = 'login-page__title';
      title.textContent = 'Markdown Viewer V2';
      container.appendChild(title);

      const subtitle = document.createElement('p');
      subtitle.className = 'login-page__subtitle';
      subtitle.textContent = 'Google 계정으로 로그인하여 시작하세요';
      container.appendChild(subtitle);

      // Google 로그인 버튼
      console.log('Creating Button component...');
      try {
        const googleButton = new Button({
          label: 'Google로 로그인',
          icon: 'fab fa-google',
          variant: 'primary',
          size: 'lg',
          onClick: () => this.handleGoogleLogin(),
          ariaLabel: 'Google 계정으로 로그인',
        });
        container.appendChild(googleButton.getElement());
        console.log('Button created successfully');
      } catch (error) {
        console.error('Error creating Button:', error);
        // Button 생성 실패 시 대체 버튼 생성
        const fallbackButton = document.createElement('button');
        fallbackButton.className = 'login-page__button';
        fallbackButton.textContent = 'Google로 로그인';
        fallbackButton.onclick = () => this.handleGoogleLogin();
        container.appendChild(fallbackButton);
      }

      // 정보 텍스트
      const info = document.createElement('p');
      info.className = 'login-page__info';
      info.textContent = '로그인 시 개인정보 처리방침 및 이용약관에 동의한 것으로 간주됩니다.';
      container.appendChild(info);

      this.element.appendChild(container);
      console.log('LoginPage rendered successfully, element:', this.element);
    } catch (error) {
      console.error('Error in LoginPage.render():', error);
      // 오류 발생 시 최소한의 HTML 표시
      this.element.innerHTML = '<div style="padding: 20px;"><h1>Markdown Viewer V2</h1><p>초기화 중 오류가 발생했습니다. 콘솔을 확인하세요.</p></div>';
      throw error;
    }
  }

  private handleGoogleLogin(): void {
    // Spring Security OAuth2의 기본 엔드포인트 사용
    // /oauth2/authorization/{registrationId} 형식
    const backendUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  }


  // OAuth 콜백 처리 (URL에서 호출)
  static async handleCallback(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (!code) {
      throw new Error('Authorization code not found');
    }

    try {
      // 백엔드에 인증 코드 전송하여 토큰 받기
      const response = await apiClient.post<AuthResponse>('/auth/google/callback', {
        code,
        state,
      });

      if (response.success && response.data?.token) {
        // 토큰과 사용자 정보 저장
        saveAuthData(
          response.data.token,
          response.data.user
        );

        // 메인 페이지로 리다이렉트
        window.location.href = '/viewer';
      } else {
        throw new Error('Failed to authenticate');
      }
    } catch (error) {
      console.error('Callback error:', error);
      alert('인증 처리 중 오류가 발생했습니다.');
      window.location.href = '/login';
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.element.remove();
  }
}
