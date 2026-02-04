/**
 * 메인 애플리케이션 클래스
 * 애플리케이션 진입점 및 라우팅 관리
 * 
 * @see 01_SYSTEM_ARCHITECTURE.md - 전체 시스템 아키텍처, 프론트엔드 구조
 * @see 02_REQUIREMENTS.md - FR-1 (인증), FR-5.3 (백그라운드 업데이트 방지)
 * @see 05_UI_UX_DESIGN.md - 사용자 흐름 (로그인 흐름, 파일 열기 흐름)
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처, TypeScript 코딩 규약
 */

import { initTheme } from '@shared/lib/theme';
import { PageVisibilityManager } from '@shared/lib/visibility';
import { Router } from '@shared/lib/router';
import { isAuthenticated } from '@features/auth';
import { LoginPage } from '@pages/login';
import { ViewerPage } from '@pages/viewer';
import { SettingsPage } from '@pages/settings';

type RouteHandler = (container: HTMLElement) => void;
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
      initTheme();
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
    // 로그인 페이지 (이미 로그인된 경우 뷰어로 리다이렉트)
    this.router.register('/login', (container) => {
      if (isAuthenticated()) {
        this.router.navigate('/viewer');
        return;
      }
      const loginPage = new LoginPage(() => {
        this.router.navigate('/viewer');
      });
      container.appendChild(loginPage.getElement());
      this.router.setCurrentPage(loginPage);
    });

    // OAuth 콜백 처리
    this.router.register('/auth/google/callback', async () => {
      try {
        await LoginPage.handleCallback();
        this.router.navigate('/viewer');
      } catch (error) {
        console.error('OAuth callback error:', error);
        this.router.navigate('/login');
      }
    });

    // 뷰어 페이지 (비로그인 접근 허용: 로컬 파일만 사용, FR-1.3)
    this.router.register('/viewer', (container) => {
      const urlParams = new URLSearchParams(window.location.search);
      const filePath = urlParams.get('file');

      const viewerPage = new ViewerPage({
        initialFilePath: filePath || undefined,
        onNavigateToSettings: () => this.router.navigate('/settings'),
        visibilityManager: this.visibilityManager,
      });
      container.appendChild(viewerPage.getElement());
      this.router.setCurrentPage(viewerPage);
    });

    // 설정 페이지 (인증 필요)
    this.router.register('/settings', this.withAuthGuard((container) => {
      const settingsPage = new SettingsPage({
        fullPage: true,
        onClose: () => this.router.navigate('/viewer'),
        onSave: () => this.router.navigate('/viewer'),
      });
      container.appendChild(settingsPage.getElement());
      this.router.setCurrentPage(settingsPage);
    }));

    // 루트 경로는 뷰어로 이동 (비로그인도 접근 가능)
    this.router.register('/', () => {
      this.router.navigate('/viewer');
    });
  }

  /**
   * 인증이 필요한 라우트용 가드.
   * 미인증 시 /login으로 리다이렉트하고 핸들러를 실행하지 않음.
   */
  private withAuthGuard(handler: RouteHandler): RouteHandler {
    return (container: HTMLElement) => {
      if (!isAuthenticated()) {
        this.router.navigate('/login');
        return;
      }
      handler(container);
    };
  }
}
