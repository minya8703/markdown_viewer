/**
 * 간단한 라우터 구현
 * 향후 필요시 라우터 라이브러리로 교체 가능
 */

type RouteHandler = () => void;

export class Router {
  private routes: Map<string, RouteHandler> = new Map();
  private currentPath: string = '';

  init(): void {
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
    this.currentPath = path;
    const handler = this.routes.get(path);

    if (handler) {
      handler();
    } else {
      // 기본 라우트 처리
      console.warn(`Route not found: ${path}`);
    }
  }

  getCurrentPath(): string {
    return this.currentPath;
  }
}
