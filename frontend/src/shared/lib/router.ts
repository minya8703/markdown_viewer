/**
 * 간단한 라우터 구현
 * 향후 필요시 라우터 라이브러리로 교체 가능
 * 
 * @see 01_SYSTEM_ARCHITECTURE.md - 프론트엔드 아키텍처, 라우팅 구조
 * @see 12_CODING_CONVENTIONS.md - FSD 아키텍처 (shared/lib 레이어)
 */

type RouteHandler = (container: HTMLElement) => void;

export class Router {
  private routes: Map<string, RouteHandler> = new Map();
  private currentPath: string = '';
  private container: HTMLElement;
  private currentPage: { destroy?: () => void } | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  init(): void {
    console.log('Router.init() called, current path:', window.location.pathname);
    // 브라우저 히스토리 이벤트 리스너
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });

    // 초기 라우트 처리
    this.handleRoute(window.location.pathname);
  }

  register(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }

  navigate(path: string): void {
    window.history.pushState({}, '', path);
    this.handleRoute(path);
  }

  private handleRoute(path: string): void {
    console.log('Router.handleRoute() called with path:', path);
    console.log('Container element:', this.container);
    this.currentPath = path;

    // 이전 페이지 정리
    if (this.currentPage?.destroy) {
      this.currentPage.destroy();
    }
    this.currentPage = null;

    // 컨테이너 초기화
    this.container.innerHTML = '';
    console.log('Container cleared, registered routes:', Array.from(this.routes.keys()));

    // 라우트 핸들러 찾기
    const handler = this.routes.get(path);

    if (handler) {
      console.log('Route handler found, executing...');
      try {
        handler(this.container);
        console.log('Route handler executed successfully');
        console.log('Container content after handler:', this.container.innerHTML.substring(0, 100));
      } catch (error) {
        console.error('Error executing route handler:', error);
        // 오류 발생 시 최소한의 HTML 표시
        this.container.innerHTML = '<div style="padding: 20px;"><h1>오류 발생</h1><p>페이지를 로드하는 중 오류가 발생했습니다. 콘솔을 확인하세요.</p></div>';
        throw error;
      }
    } else {
      // 기본 라우트 처리: 미등록 경로는 뷰어로 리다이렉트 (설계: 비로그인 뷰어 접근 허용)
      console.warn(`Route not found: ${path}`);
      if (path !== '/login') {
        console.log('Redirecting to /viewer');
        this.navigate('/viewer');
      } else {
        // /login도 등록되지 않은 경우 (초기화 문제)
        console.error('CRITICAL: /login route not registered!');
        this.container.innerHTML = '<div style="padding: 20px;"><h1>초기화 오류</h1><p>라우터가 제대로 초기화되지 않았습니다.</p></div>';
      }
    }
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  setCurrentPage(page: { destroy?: () => void }): void {
    this.currentPage = page;
  }
}
