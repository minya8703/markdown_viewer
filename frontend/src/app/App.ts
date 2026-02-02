/**
 * 메인 애플리케이션 클래스
 * 애플리케이션 진입점 및 라우팅 관리
 * 
 * @see 01_SYSTEM_ARCHITECTURE.md - 전체 시스템 아키텍처, 프론트엔드 구조
 * @see 02_REQUIREMENTS.md - FR-1 (인증), FR-5.3 (백그라운드 업데이트 방지)
 * @see 05_UI_UX_DESIGN.md - 사용자 흐름 (로그인 흐름, 파일 열기 흐름)
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처, TypeScript 코딩 규약
 */

import { PageVisibilityManager } from '@shared/lib/visibility';
import { Router } from '@shared/lib/router';
import { LoginPage } from '@pages/login';
import { ViewerPage } from '@pages/viewer';
import { TokenManager } from '@shared/api/client';

export class App {
  private router: Router;
  private visibilityManager: PageVisibilityManager;

  constructor(rootElement: HTMLElement) {
    this.router = new Router(rootElement);
    this.visibilityManager = new PageVisibilityManager();
  }

  init(): void {
    console.log('App.init() called');
    try {
      // 페이지 가시성 관리 초기화
      this.visibilityManager.init();
      console.log('Visibility manager initialized');

      // 라우트 등록
      this.registerRoutes();
      console.log('Routes registered');

      // 라우터 초기화
      this.router.init();
      console.log('Router initialized');
    } catch (error) {
      console.error('Error in App.init():', error);
      throw error;
    }
  }

  private registerRoutes(): void {
    // 로그인 페이지
    this.router.register('/login', (container) => {
      const loginPage = new LoginPage(() => {
        // 로그인 성공 시 뷰어 페이지로 이동
        this.router.navigate('/viewer');
      });
      container.appendChild(loginPage.getElement());
      this.router.setCurrentPage(loginPage);
    });

    // OAuth 콜백 처리
    this.router.register('/auth/google/callback', async () => {
      try {
        await LoginPage.handleCallback();
        // 성공 시 뷰어 페이지로 이동
        this.router.navigate('/viewer');
      } catch (error) {
        console.error('OAuth callback error:', error);
        this.router.navigate('/login');
      }
    });

    // 뷰어 페이지
    this.router.register('/viewer', (container) => {
      // 인증 확인
      if (!TokenManager.getToken()) {
        this.router.navigate('/login');
        return;
      }

      // URL 파라미터에서 파일 경로 확인
      const urlParams = new URLSearchParams(window.location.search);
      const filePath = urlParams.get('file');

      const viewerPage = new ViewerPage({
        initialFilePath: filePath || undefined,
      });
      container.appendChild(viewerPage.getElement());
      this.router.setCurrentPage(viewerPage);
    });

    // 루트 경로는 인증 상태에 따라 리다이렉트
    this.router.register('/', () => {
      const token = TokenManager.getToken();
      if (token) {
        this.router.navigate('/viewer');
      } else {
        this.router.navigate('/login');
      }
    });
  }
}
