/**
 * Login 페이지
 * Google OAuth 로그인 페이지
 * 
 * @see docs/10_design/11_REQUIREMENTS.md - FR-1 (인증 기능 요구사항)
 * @see docs/20_backend/20_API_SPECIFICATION.md - 인증 API 엔드포인트 상세 명세
 * @see docs/40_frontend/40_UI_UX_DESIGN.md - 로그인 흐름, 로그인 페이지 UI 설계
 * @see docs/40_frontend/41_CODING_CONVENTIONS.md - FSD 아키텍처 (pages 레이어), TypeScript 코딩 규약
 */

import { Button } from '@shared/ui/Button';
import { getCurrentUser, saveToken } from '@features/auth';
import { TokenManager } from '@shared/api/client';
import './LoginPage.css';

export class LoginPage {
  private element: HTMLElement;
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
      title.textContent = 'Markdown Viewer';
      container.appendChild(title);

      const subtitle = document.createElement('p');
      subtitle.className = 'login-page__subtitle';
      subtitle.textContent = 'Google 계정으로 로그인하여 시작하세요';
      container.appendChild(subtitle);

      // URL에 error가 있으면 안내 메시지 표시
      const urlError = new URLSearchParams(window.location.search).get('error');
      if (urlError) {
        const errorEl = document.createElement('p');
        errorEl.className = 'login-page__error';
        errorEl.setAttribute('role', 'alert');
        const messages: Record<string, string> = {
          authentication_failed: 'Google 로그인에 실패했습니다. 다시 시도해주세요.',
          callback_failed: '인증 처리 중 오류가 발생했습니다. 다시 로그인해주세요.',
        };
        errorEl.textContent = messages[urlError] || `오류: ${urlError}`;
        container.appendChild(errorEl);
      }

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

      // 로그인 없이 뷰어 시작 버튼
      const viewerButton = new Button({
        label: '로그인 없이 뷰어 시작',
        variant: 'secondary',
        size: 'lg',
        onClick: () => this.handleStartWithoutLogin(),
        ariaLabel: '로그인 없이 뷰어 사용',
      });
      container.appendChild(viewerButton.getElement());

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
    // 백엔드 context-path /api → /api/oauth2/authorization/google
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    const origin = apiBase.startsWith('http') ? apiBase.replace(/\/api\/?$/, '') : window.location.origin;
    const path = apiBase.includes('/api') ? '/api' : '';
    window.location.href = `${origin}${path}/oauth2/authorization/google`;
  }

  private handleStartWithoutLogin(): void {
    // 뷰어 페이지로 이동 (SPA 라우팅을 위해 onLoginSuccess와 동일하게 처리하려면 콜백 사용)
    if (this.onLoginSuccess) {
      this.onLoginSuccess();
    } else {
      window.location.href = '/viewer';
    }
  }


  /**
   * OAuth 콜백 처리 (백엔드가 ?token=xxx 로 리다이렉트한 경우)
   * 토큰 저장 → /auth/me 로 사용자 조회 → /viewer 리다이렉트
   */
  static async handleCallback(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      window.location.href = `/login?error=${encodeURIComponent(error)}`;
      return;
    }

    if (!token) {
      throw new Error('토큰이 없습니다. 로그인을 다시 시도해주세요.');
    }

    try {
      saveToken(token);
      await getCurrentUser();
      window.location.href = '/viewer';
    } catch (err) {
      console.error('Callback error:', err);
      TokenManager.removeToken();
      window.location.href = '/login?error=callback_failed';
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.element.remove();
  }
}
